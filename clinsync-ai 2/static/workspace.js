'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let csrf = '', configured = false, busy = false, result = null, sample = false;
  let reviewed = new Set();
  const examples = [
    {name:'Consultation · 14 Sep 2026 (synthetic)', text:'Synthetic follow-up consultation, 14 September 2026. Patient reports stopping metformin about three weeks ago because of GI upset. Reports a new rash on the arm; onset is unclear. Patient reports no known drug allergies. No treatment decision is documented.'},
    {name:'Prior chart · 10 Aug 2026 (synthetic)', text:'Synthetic chart, 10 August 2026: Metformin 500 mg listed as active; dosing frequency not documented. No known drug allergies. A June 2026 note states "medication adjusted" without details. Last available HbA1c report is dated 14 February 2026; value not included in this excerpt. No subsequent lab result is supplied.'}
  ];
  function element(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function message(text = '', error = false) { $('message').textContent = text; $('message').className = error ? 'error' : ''; }
  function sources() {
    return [...$('sources').children].map((card, i) => ({id:`S${i+1}`, name:card.querySelector('.source-name').value.trim(), text:card.querySelector('textarea').value}));
  }
  function updateControls() {
    const cards = [...$('sources').children];
    cards.forEach((card, i) => {card.querySelector('.source-id').textContent = `SOURCE S${i+1}`; card.querySelector('.remove-source').disabled = busy || cards.length === 1;});
    $('characterCount').textContent = `${sources().reduce((n,s)=>n+s.text.length,0).toLocaleString()} / 100,000 characters`;
    $('addSource').disabled = busy || cards.length >= 6;
    $('analyze').disabled = busy || !csrf || !configured;
    $('analyze').textContent = busy ? 'Generating draft…' : 'Generate draft';
  }
  function resetResult() {
    result = null; sample = false; reviewed = new Set();
    $('findings').replaceChildren(); $('resultSummary').textContent = '';
    $('reviewNotes').value = ''; $('draftActions').hidden = true;
    $('sampleLabel').hidden = true; $('emptyState').hidden = false;
    message();
  }
  function invalidate() { if (result) { resetResult(); message('Sources changed. Generate a new draft to reflect the current input.'); } updateControls(); }
  let sourceSequence = 0;
  function addSource(data = {name:'',text:''}) {
    if ($('sources').children.length >= 6) return;
    const unique = ++sourceSequence;
    const card = element('div', undefined, 'source-card');
    const row = element('div', undefined, 'row spread');
    row.append(element('span', '', 'source-id'));
    const remove = element('button','Remove','remove-source'); remove.type = 'button';
    remove.addEventListener('click', () => { card.remove(); invalidate(); }); row.append(remove); card.append(row);
    const nameLabel = element('label','Source name / date'); nameLabel.htmlFor = `source-name-${unique}`;
    const name = element('input'); name.id = nameLabel.htmlFor; name.className = 'source-name'; name.value = data.name; name.maxLength = 100; name.required = true; name.placeholder = 'e.g. Consultation · 14 Sep 2026';
    const textLabel = element('label','Source text'); textLabel.htmlFor = `source-text-${unique}`;
    const text = element('textarea'); text.id = textLabel.htmlFor; text.value = data.text; text.required = true; text.maxLength = 50000; text.rows = 6;
    const fileLabel = element('label','Or import a UTF-8 .txt file'); fileLabel.htmlFor = `source-file-${unique}`;
    const file = element('input'); file.id = fileLabel.htmlFor; file.type = 'file'; file.accept = '.txt,text/plain';
    file.addEventListener('change', async () => {
      const selected = file.files[0]; if (!selected) return;
      if (!selected.name.toLowerCase().endsWith('.txt') || selected.size > 200000) {
        message('Choose a UTF-8 .txt file no larger than 200 KB.', true); file.value = ''; return;
      }
      // Block submission until the asynchronous file read finishes.
      setBusy(true);
      try {
        const contents = new TextDecoder('utf-8', {fatal:true}).decode(await selected.arrayBuffer());
        if (contents.includes('\0') || !contents.trim() || contents.length > 50000) throw new Error('File must contain 1–50,000 characters of plain UTF-8 text.');
        text.value = contents; if (!name.value) name.value = selected.name.slice(0,100);
        invalidate(); message('File imported locally. It will only be sent to OpenAI when you generate a draft.');
      } catch (e) { message(e instanceof TypeError ? 'This file is not valid UTF-8 text.' : e.message, true); }
      finally { file.value = ''; setBusy(false); }
    });
    name.addEventListener('input', invalidate); text.addEventListener('input', invalidate);
    card.append(nameLabel,name,textLabel,text,fileLabel,file); $('sources').append(card); updateControls();
  }
  function setBusy(value) {
    busy = value;
    $('analysisForm').querySelectorAll('input,textarea,button').forEach(el => el.disabled = value);
    ['loadSample','samplePreview','unlock','lock'].forEach(id => $(id).disabled = value);
    $('analysisForm').setAttribute('aria-busy',String(value));
    updateControls();
  }
  async function api(path, options={}) {
    const response = await fetch(path, {credentials:'same-origin', ...options,
      headers:{'Content-Type':'application/json', ...(csrf ? {'X-CSRF-Token':csrf} : {}), ...options.headers}});
    const data = await response.json().catch(()=>({detail:'Unexpected server response. Run the included backend instead of opening the HTML directly.'}));
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) { csrf=''; $('lock').hidden=true; $('accessState').textContent='Unlock the workspace to continue.'; updateControls(); }
      throw new Error(typeof data.detail === 'string' ? data.detail : 'The server could not process this request.');
    }
    return data;
  }
  async function health() {
    try {
      const data = await api('/api/health'); configured = data.configured;
      $('connection').textContent = configured ? `OpenAI backend ready · ${data.model}` : 'Setup required · OpenAI key and workspace password';
      $('connection').classList.toggle('ready', configured);
    } catch { $('connection').textContent = 'Backend offline · start the included Python server'; }
    updateControls();
  }
  $('accessForm').addEventListener('submit', async e => {
    e.preventDefault(); $('unlock').disabled=true;
    try { const data = await api('/api/session',{method:'POST',body:JSON.stringify({password:$('password').value})});
      csrf=data.csrf; configured=true; $('password').value=''; $('lock').hidden=false;
      $('accessState').textContent='Unlocked for this test session.'; message('Ready. Confirm the test-data declaration and generate your draft.');
    } catch(e) { message(e.message,true); }
    finally { $('unlock').disabled=false; updateControls(); }
  });
  $('lock').addEventListener('click', async () => {
    try { await api('/api/session',{method:'DELETE'}); csrf=''; $('lock').hidden=true; $('accessState').textContent='Workspace locked.'; message('Workspace locked. Use Clear workspace to remove input and output.'); }
    catch(e) { message(e.message,true); }
    updateControls();
  });
  $('addSource').addEventListener('click', () => { addSource(); invalidate(); });
  function loadExample() {
    resetResult(); $('sources').replaceChildren(); examples.forEach(addSource); $('consent').checked=false;
    message('Synthetic example loaded locally. Generate an AI draft or preview the illustrative sample.');
  }
  $('loadSample').addEventListener('click',loadExample);
  $('clear').addEventListener('click', () => { resetResult(); $('sources').replaceChildren(); addSource(); $('consent').checked=false; });
  $('analysisForm').addEventListener('submit', async e => {
    e.preventDefault(); if (busy) return;
    const records = sources();
    if (!csrf) return message('Unlock AI processing first.',true);
    if (!$('consent').checked) return message('Confirm the test-data declaration first.',true);
    if (records.some(s=>!s.text.trim() || !s.name) || records.reduce((n,s)=>n+s.text.length,0)>100000) return message('Provide nonempty named sources with at most 100,000 characters combined.',true);
    resetResult(); setBusy(true); message('Sending test sources to OpenAI and checking returned quote references. This may take up to 90 seconds…');
    try {
      const output = await api('/api/analyze',{method:'POST',body:JSON.stringify({sources:records,synthetic_or_deidentified:true}),signal:AbortSignal.timeout(105000)});
      result=output; sample=false; render(); message('Draft generated. Review every claim against its source before using it.');
    } catch(e) { message(e.name === 'TimeoutError' ? 'Request timed out. The provider may still complete processing. Your sources remain available; retry later.' : e.message,true); }
    finally { setBusy(false); }
  });
  function updateReviewed() { $('reviewCount').textContent = `${reviewed.size} / ${result?.findings.length || 0} findings reviewed · still a draft`; }
  function render() {
    $('emptyState').hidden=true; $('draftActions').hidden=false; $('sampleLabel').hidden=!sample;
    $('resultSummary').textContent=`${result.findings.length} findings · ${result.validation.flagged_findings} flagged · ${result.validation.invalid_citations} unmatched citations. ${result.validation.check}`;
    $('findings').replaceChildren();
    result.findings.forEach((f,i) => {
      const card=element('article',undefined,'finding'); card.append(element('h4',`${String(i+1).padStart(2,'0')} / ${f.category.replaceAll('_',' ')}`));
      const row=element('div',undefined,'row');
      row.append(element('span',f.provenance_status==='quotes_matched'?'Source quotes matched':'Source support unverified',f.provenance_status==='quotes_matched'?'badge badge-updated':'badge badge-review'));
      if(f.concern!=='none') row.append(element('span',f.concern,'badge badge-review'));
      card.append(row,element('p',f.statement,'statement'));
      if(f.review_reason) card.append(element('p',f.review_reason,'reason'));
      const details=element('details'); details.append(element('summary',`Inspect source evidence (${f.evidence.length})`));
      if(!f.evidence.length) details.append(element('p','No supporting quote supplied. This item is not source-verified.'));
      f.evidence.forEach(c => { const quote=element('blockquote',c.quote); quote.append(element('cite',`${c.source_id} · ${c.source_name} · ${c.matched?'Exact text found':'WARNING: quote not found in source'}`)); details.append(quote); });
      card.append(details);
      const label=element('label',undefined,'review-check'); const check=element('input'); check.type='checkbox';
      check.addEventListener('change',()=>{check.checked?reviewed.add(i):reviewed.delete(i);updateReviewed();});
      label.append(check,element('span','I inspected this finding and its source evidence (not clinical sign-off).')); card.append(label); $('findings').append(card);
    });
    updateReviewed();
  }
  $('samplePreview').addEventListener('click', () => {
    loadExample(); const records=sources();
    const cite=(id,quote)=>({source_id:id,source_name:records.find(s=>s.id===id).name,quote,matched:true});
    const make=(category,statement,concern,review_reason,evidence)=>({category,statement,concern,review_reason,evidence,provenance_status:evidence.length?'quotes_matched':'unverified',requires_review:true});
    result={status:'draft_requires_human_review',model:'illustrative-sample-not-AI',generated_at:new Date().toISOString(),findings:[
      make('medication','Patient reports stopping metformin about three weeks before the consultation because of GI upset. The prior chart lists metformin 500 mg as active.','conflict','A reviewer must reconcile the reported and charted status; do not change therapy based on this draft.',[cite('S1','Patient reports stopping metformin about three weeks ago because of GI upset.'),cite('S2','Metformin 500 mg listed as active; dosing frequency not documented.')]),
      make('allergy','No known drug allergies are reported in the consultation and recorded in the prior chart.','none','',[cite('S1','Patient reports no known drug allergies.'),cite('S2','No known drug allergies.')]),
      make('laboratory','The chart excerpt refers to an HbA1c report dated 14 February 2026. Its value and any subsequent results are not supplied.','missing','Confirm whether newer results are available; no testing recommendation is inferred.',[cite('S2','Last available HbA1c report is dated 14 February 2026; value not included in this excerpt. No subsequent lab result is supplied.')]),
      make('open_question','A new rash on the arm is reported; onset is unclear.','ambiguous','Onset and cause remain unestablished. No diagnosis is inferred.',[cite('S1','Reports a new rash on the arm; onset is unclear.')])
    ],validation:{flagged_findings:3,invalid_citations:0,check:'Literal source quotes only; not clinical or semantic verification.'}};
    sample=true; render(); message('Illustrative sample loaded. No text was sent to OpenAI.');
  });
  function exportData(format) {
    if(!result) return;
    const data={...result,illustrative_sample:sample,reviewed_finding_numbers:[...reviewed].map(i=>i+1),review_notes:$('reviewNotes').value,
      disclaimer:'DRAFT — mandatory human review. Quote matching is not clinical verification. Not for diagnosis, treatment, or prescribing.',
      source_manifest:sources().map(({id,name})=>({id,name}))};
    let content=JSON.stringify(data,null,2);
    if(format==='txt') content=[ 'CLINSYNC — DRAFT / HUMAN REVIEW REQUIRED',sample?'ILLUSTRATIVE SAMPLE — NOT AI-GENERATED':'AI-generated draft',data.disclaimer,`Generated: ${data.generated_at}`,`Model: ${data.model}`,'',
      ...data.findings.map((f,i)=>`${i+1}. ${f.category.toUpperCase()} — ${f.concern}\n${f.statement}\nReview: ${f.review_reason || 'Check source support.'}\nQuote status: ${f.provenance_status}\n${f.evidence.map(c=>`  ${c.source_id} (${c.source_name}): "${c.quote}" [${c.matched?'exact quote matched':'UNMATCHED'}]`).join('\n')}\nReviewer inspected: ${reviewed.has(i)?'yes':'no'}\n`),
      `Reviewer notes:\n${data.review_notes || '(none)'}`].join('\n');
    const url=URL.createObjectURL(new Blob([content],{type:format==='txt'?'text/plain;charset=utf-8':'application/json'}));
    const a=element('a'); a.href=url;a.download=`clinsync-${sample?'sample-':''}draft.${format}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    message('Draft exported. Keep the downloaded file secure; it is not a finalized clinical record.');
  }
  $('downloadText').addEventListener('click',()=>exportData('txt'));
  $('downloadJson').addEventListener('click',()=>exportData('json'));
  addSource({name:'Consultation',text:''}); health();
})();
