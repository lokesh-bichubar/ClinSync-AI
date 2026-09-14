import os
os.environ['COOKIE_SECURE'] = 'false'
import json
import httpx
import pytest
from fastapi.testclient import TestClient
import app as backend


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(backend, 'API_KEY', 'test-key-not-real')
    monkeypatch.setattr(backend, 'PASSWORD', 'test-workspace-password')
    backend.login_attempts.clear()
    backend.analysis_attempts.clear()
    with TestClient(backend.app) as client:
        yield client


def auth(client):
    response = client.post('/api/session', json={'password':'test-workspace-password'})
    assert response.status_code == 200
    return {'X-CSRF-Token':response.json()['csrf']}


def body(text='Patient reports stopping metformin.'):
    return {'sources':[{'id':'S1','name':'Synthetic consultation','text':text}], 'synthetic_or_deidentified':True}


def finding(quote='Patient reports stopping metformin.'):
    return {'category':'medication','statement':'Patient reports stopping metformin.', 'concern':'ambiguous',
            'review_reason':'Confirm status.', 'evidence':[{'source_id':'S1','quote':quote}]}


def mock_provider(monkeypatch, status=200, payload=None, error=None):
    async def post(self, url, **kwargs):
        assert url == 'https://api.openai.com/v1/chat/completions'
        assert kwargs['json']['store'] is False
        assert kwargs['json']['response_format']['json_schema']['strict'] is True
        if error:
            raise error
        default = {'choices':[{'finish_reason':'stop','message':{'content':json.dumps({'findings':[finding()]})}}]}
        return httpx.Response(status, json=payload if payload is not None else default)
    monkeypatch.setattr(httpx.AsyncClient, 'post', post)


def test_health_and_site(client):
    assert client.get('/api/health').json()['configured'] is True
    response = client.get('/')
    assert response.status_code == 200
    assert 'workspaceTitle' in response.text
    assert 'no-store' in response.headers['cache-control']
    assert "script-src 'self'" in response.headers['content-security-policy']
    assert client.get('/static/workspace.js').status_code == 200
    assert client.get('/.env').status_code == 404


def test_setup_required(client,monkeypatch):
    monkeypatch.setattr(backend,'API_KEY','')
    assert client.get('/api/health').json()['configured'] is False
    assert client.post('/api/session',json={'password':'x'}).status_code == 503


def test_authentication_and_csrf(client):
    assert client.post('/api/analyze',json=body()).status_code == 401
    assert client.post('/api/session',json={'password':'wrong'}).status_code == 401
    headers=auth(client)
    assert client.post('/api/analyze',json=body()).status_code == 403
    assert client.delete('/api/session',headers=headers).status_code == 200
    assert client.post('/api/analyze',json=body(),headers=headers).status_code == 401


def test_input_validation_redacts_records(client):
    headers=auth(client)
    cases=[body(' '),body('x'*50001), {**body(),'synthetic_or_deidentified':False},
           {**body(),'sources':body()['sources']*2}, {**body(),'sources':[]}]
    for case in cases:
        response=client.post('/api/analyze',json=case,headers=headers)
        assert response.status_code == 422
        assert 'input' not in response.json()
        assert 'Patient reports' not in response.text


def test_combined_limit(client):
    data=body(); data['sources']=[{'id':f'S{i+1}','name':'Test','text':'a'*40000} for i in range(3)]
    assert client.post('/api/analyze',json=data,headers=auth(client)).status_code == 422


def test_content_type_and_body_limit(client):
    assert client.post('/api/session',content='bad',headers={'content-type':'text/plain'}).status_code == 415
    assert client.post('/api/analyze',content='x'*650001,headers={'content-type':'application/json'}).status_code == 413


def test_generation_and_exact_quotes(client,monkeypatch):
    mock_provider(monkeypatch)
    response=client.post('/api/analyze',json=body(),headers=auth(client))
    assert response.status_code == 200
    data=response.json()
    assert data['status'] == 'draft_requires_human_review'
    assert data['findings'][0]['provenance_status'] == 'quotes_matched'
    assert data['findings'][0]['requires_review'] is True
    assert data['validation']['invalid_citations'] == 0


def test_hallucinated_citation_not_verified(client,monkeypatch):
    payload={'choices':[{'finish_reason':'stop','message':{'content':json.dumps({'findings':[finding('Invented quote')]})}}]}
    mock_provider(monkeypatch,payload=payload)
    data=client.post('/api/analyze',json=body(),headers=auth(client)).json()
    assert data['findings'][0]['provenance_status'] == 'unverified'
    assert data['validation']['invalid_citations'] == 1


def test_empty_quote_and_unknown_source():
    f=finding(' '); f['evidence'].append({'source_id':'S6','quote':'Patient reports stopping metformin.'})
    result=backend.validate_draft(backend.Draft(findings=[f]),[backend.Source(**body()['sources'][0])])
    assert result['validation']['invalid_citations'] == 2
    assert result['findings'][0]['provenance_status'] == 'unverified'


def test_missing_evidence_requires_review():
    f=finding();f['evidence']=[];f['concern']='missing'
    result=backend.validate_draft(backend.Draft(findings=[f]),[backend.Source(**body()['sources'][0])])
    assert result['findings'][0]['provenance_status'] == 'unverified'
    assert result['validation']['flagged_findings'] == 1


@pytest.mark.parametrize('status,expected',[(401,502),(403,502),(429,429),(500,502),(400,502)])
def test_provider_errors(client,monkeypatch,status,expected):
    mock_provider(monkeypatch,status=status)
    assert client.post('/api/analyze',json=body(),headers=auth(client)).status_code == expected


def test_timeout(client,monkeypatch):
    mock_provider(monkeypatch,error=httpx.ReadTimeout('private data never echoed'))
    response=client.post('/api/analyze',json=body(),headers=auth(client))
    assert response.status_code == 504
    assert 'private data' not in response.text


@pytest.mark.parametrize('payload',[
    {'choices':[{'finish_reason':'length','message':{'content':'{}'}}]},
    {'choices':[{'finish_reason':'stop','message':{'content':'not json'}}]},
    {'choices':[{'finish_reason':'stop','message':{'content':'{"findings":[]}'}}]},
    {'unexpected':'response'}
])
def test_bad_output_not_accepted(client,monkeypatch,payload):
    mock_provider(monkeypatch,payload=payload)
    assert client.post('/api/analyze',json=body(),headers=auth(client)).status_code == 502


def test_refusal(client,monkeypatch):
    mock_provider(monkeypatch,payload={'choices':[{'finish_reason':'stop','message':{'refusal':'Not supported.'}}]})
    assert client.post('/api/analyze',json=body(),headers=auth(client)).status_code == 422


def test_login_rate_limit(client):
    for _ in range(10):
        assert client.post('/api/session',json={'password':'wrong'}).status_code == 401
    assert client.post('/api/session',json={'password':'wrong'}).status_code == 429
