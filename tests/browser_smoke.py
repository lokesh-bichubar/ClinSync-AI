"""Run against a separately started unconfigured backend. Uses synthetic data only."""
import json
import os
from playwright.sync_api import sync_playwright

BASE = os.getenv('TEST_BASE_URL', 'http://127.0.0.1:8000')
with sync_playwright() as p:
    browser = p.chromium.launch(args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE)
    page.wait_for_function("document.querySelector('#connection').textContent.includes('Setup required')")
    assert page.locator('#analyze').is_disabled()
    assert page.locator('.hero h1').evaluate('(e)=>getComputedStyle(e).color') == 'rgb(244, 248, 250)'
    page.locator('.hero-ctas a').first.click()
    page.wait_for_url('**/#workspace')
    page.locator('#samplePreview').click()
    assert page.locator('.finding').count() == 4
    assert page.locator('#sampleLabel').is_visible()
    page.locator('.finding details').first.click()
    assert page.locator('blockquote').first.is_visible()
    page.locator('.review-check input').first.check()
    assert page.locator('#reviewCount').inner_text().startswith('1 / 4')
    page.locator('#reviewNotes').fill('Synthetic review note.')
    with page.expect_download() as download:
        page.locator('#downloadJson').click()
    data=json.loads(open(download.value.path()).read())
    assert data['illustrative_sample'] is True
    assert data['reviewed_finding_numbers'] == [0+1]
    assert data['review_notes']=='Synthetic review note.'
    page.locator('textarea').first.fill('Changed source')
    assert page.locator('.finding').count()==0
    page.locator('#clear').click()
    assert page.locator('.source-card').count()==1
    page.locator('input[type=file]').first.set_input_files({'name':'test.txt','mimeType':'text/plain','buffer':b'Synthetic input from a file.'})
    page.wait_for_function("document.querySelector('.source-card textarea').value === 'Synthetic input from a file.'")
    assert page.locator('.source-name').input_value()=='test.txt'
    page.locator('#addSource').click()
    assert page.locator('.source-card').count()==2
    page.locator('.remove-source').last.click()
    assert page.locator('.source-card').count()==1
    # Exercise UI wiring with mocked server responses; this is not a live OpenAI call.
    page.route('**/api/health',lambda r:r.fulfill(json={'configured':True,'model':'test-model'}))
    page.route('**/api/session',lambda r:r.fulfill(json={'csrf':'test-csrf'}))
    malicious='<img src=x onerror=window.xss=true>'
    mocked={'status':'draft_requires_human_review','generated_at':'2026-09-14T00:00:00Z','model':'test-model',
        'validation':{'flagged_findings':1,'invalid_citations':0,'check':'Test quote check'},
        'findings':[{'category':'visit','statement':malicious,'concern':'ambiguous','review_reason':'Test review',
        'evidence':[{'source_id':'S1','source_name':'Synthetic source','quote':malicious,'matched':True}],
        'provenance_status':'quotes_matched','requires_review':True}]}
    def analyze_route(route):
        request=route.request
        assert request.headers['x-csrf-token']=='test-csrf'
        assert request.post_data_json['synthetic_or_deidentified'] is True
        route.fulfill(json=mocked)
    page.route('**/api/analyze',analyze_route)
    page.reload()
    page.locator('#password').fill('test')
    page.locator('#unlock').click()
    page.wait_for_function("!document.querySelector('#analyze').disabled")
    page.locator('.source-card textarea').fill(malicious)
    page.locator('#consent').check()
    page.locator('#analyze').click()
    page.wait_for_selector('.finding')
    assert page.locator('.statement').inner_text()==malicious
    assert page.locator('.finding img').count()==0
    assert page.evaluate('window.xss') is None
    assert not page.locator('#sampleLabel').is_visible()
    # Mobile layout, keyboard focus trap, Escape and navigation links.
    for width in (390,320):
        page.set_viewport_size({'width':width,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.locator('#navToggle').click()
        assert page.locator('#navToggle').get_attribute('aria-expanded')=='true'
        page.keyboard.press('Shift+Tab')
        assert page.evaluate("document.activeElement === document.querySelector('#navMobile a:last-child')")
        page.keyboard.press('Escape')
        assert page.locator('#navToggle').get_attribute('aria-expanded')=='false'
        page.locator('#navToggle').click()
        page.locator('#navMobile a[href="#evidence"]').click()
        assert page.locator('#navToggle').get_attribute('aria-expanded')=='false'
    assert not errors,errors
    # Progressive enhancement: original informational content remains visible without JS.
    nojs=browser.new_context(java_script_enabled=False)
    fallback=nojs.new_page()
    fallback.goto(BASE)
    assert fallback.locator('#problem .reveal').first.evaluate('(e)=>getComputedStyle(e).opacity')=='1'
    browser.close()
print('Browser smoke tests passed: sample, review, export, TXT import, input invalidation, mocked AI wiring, XSS rendering, mobile navigation, no-JS fallback.')
