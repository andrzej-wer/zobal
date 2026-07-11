const cfg = window.APP_CONFIG || {};
const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('WSTAW_') && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes('WSTAW_');
const sb = configured ? supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

const FRONT_PROFILES=['RZ-1','RZ-4','RZ-5A','RZ-5B','RZ-6','RZ-8','RZ-9','RZ-10','RZ-11','RZ-12','RZ-13','RZ-14','RZ-15','RZ-16','RZ-17','RZ-18','RZ-19','RZ-20PP','RZ-20S','RZ-20W','RZ-21 (4xZ21)','RZ-21PP','RZ-21S','RZ-21W','RZ-22','RZ-23A','RZ-23B','RZ-24','RZ-25A','RZ-25B'];
const FRONT_FINISHES=['C-0 (aluminium)','C-23 (złoty)','C-23S (złoty szczotkowany)','C-24 (miedziany)','C-30S (INOX)','C-31 (stal szlachetna)','C-32 (szampański)','C-33 (jasny brązowy)','C-34 (ciemny brązowy)','C-35 (czarny)','C-35S (czarny szczotkowany)','LAKIER RAL 9002 MAT','LAKIER RAL 7016 (szary)','LAKIER RAL 7021 (szary)','LAKIER RAL 9003 (biały)','LAKIER RAL 9005 (czarny)','LAKIER RAL 9010 (biały)','LAKIER RAL 9016 (biały)'];
const FRONT_FILLS=['*SIATKA CZARNA MESH','ALUMINIUM 9007','ANTISOL BRĄZ','ANTISOL BRĄZ HART','ANTISOL CZARNY','ANTISOL CZARNY HART','ANTISOL GRAFIT','ANTISOL GRAFIT HART','BANANOWY 1M13 COLORIMO','BAZALTOWY 7M21 MAT COLORIMO','BEZ SZKŁA','BEZBARWNE BEZPIECZNE','BEZBARWNE DIAMAND (OPTIWHITE)','BEZBARWNE DIAMAND HART. (OPTIWHITE)','BEZBARWNE OKIENNE','BEZBARWNE OKIENNE HART','BEŻ 1015','BIAŁY 1013 PERŁOWY','BIAŁY 9003','BIAŁY 9010','BRĄZ 1236','CZARNY 0337','CZARNY 9005','CZERWONY 1586','CZERWONY 3004','ESTRIADO','FLUTES BEZB HARTOWANE','FLUTES BEZBARWNE','FLUTES MAT HART','FLUTES MATOWE','LACOMAT','LISTRAL D','LUST S (OPTIWHITE)','LUSTRO BIAŁY PODLEW','LUSTRO BRĄZ','LUSTRO GRAFIT','LUSTRO SZARY PODLEW','LUSTRO WENECKIE','MASTERCERRE KWADRATY','MASTERCERRE KWADRATY HART','MASTERLIGNE-LINIE','MASTERLIGNE-LINIE HART','MASTERPOINT','MASTERPOINT HARTOWANY','MATELAC BIAŁY 9003','MATELAC BIAŁY 9010','MATELAC CZARNY 9005','MATELAC NIEBIESKI 1435','MATELAC SREBRNY LUST','MATELUX (SATINATO)','MATELUX HARTOWANY','MATOWE','MATOWE BEZPIECZNE','MIODOWY 1M04 COLORIMO','NIEBIESKI 1435','ORZECHOWY 7M30 MAT COLORIMO','PARSOL ULTRA GREY VENUS','PARSOL ULTRA GREY VENUS HARTOWANY','POPIELATY 7M45 COLORIMO','STALOWY 7015 COLORIMO','STOPSOL BRĄZ','SZAMPAŃSKI 7M44 MAT COLORIMO','SZARY 2232','SZARY 7035','SZARY 9006','VISIOSUN CLASSIC','VISIOSUN HART 4MM','WĘGLOWY 7021 COLORIMO'];


function el(id){return document.getElementById(id)}
function money(v){return new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(Number(v||0))}
function fmtDate(v){return v?new Date(v).toLocaleDateString('pl-PL'):'—'}
function statusLabel(s){return ({new:'Nowe',pricing:'W trakcie wyceny',ready:'Gotowe',sent:'Wysłane',revision:'Do poprawy',accepted:'Zaakceptowane',rejected:'Odrzucone',ordered:'Zamówione',completed:'Zrealizowane'})[s]||s}
function showMsg(text,type='notice'){const x=el('msg');if(!x)return;x.className=type;x.textContent=text;x.style.display='block'}
async function requireAuth(){if(!configured){showMsg('Uzupełnij plik supabase-config.js danymi projektu Supabase.','notice');return null}const {data:{session}}=await sb.auth.getSession();if(!session){location.href='index.html';return null}return session}
async function signOut(){if(sb)await sb.auth.signOut();location.href='index.html'}

async function login(){
  if(!configured){showMsg('Najpierw uzupełnij supabase-config.js.','error');return}
  const email=el('email').value.trim(),password=el('password').value;
  const {error}=await sb.auth.signInWithPassword({email,password});
  if(error){showMsg(error.message,'error');return}
  location.href='panel.html';
}

async function loadDashboard(){
  const session=await requireAuth(); if(!session||!configured)return;
  el('user-email').textContent=session.user.email;
  const {data,error}=await sb.from('quote_requests_view').select('*').order('created_at',{ascending:false});
  if(error){showMsg(error.message,'error');return}
  window.allQuotes=data||[]; renderQuotes(window.allQuotes); renderKpis(window.allQuotes);
}
function renderKpis(rows){
  el('kpi-new').textContent=rows.filter(x=>x.status==='new').length;
  el('kpi-pricing').textContent=rows.filter(x=>x.status==='pricing').length;
  el('kpi-sent').textContent=rows.filter(x=>x.status==='sent').length;
}
function renderQuotes(rows){
  el('quotes-body').innerHTML=rows.map(r=>`<tr><td><a href="quote.html?id=${r.id}"><strong>${r.request_number||'—'}</strong></a></td><td>${r.customer_name||'—'}<br><span class="muted">${r.company_name||''}</span></td><td>${r.zobal_numbers||'—'}</td><td>${fmtDate(r.created_at)}</td><td>${r.gross_total?money(r.gross_total):'—'}</td><td><span class="badge ${r.status}">${statusLabel(r.status)}</span></td></tr>`).join('')||'<tr><td colspan="6" class="muted">Brak wycen.</td></tr>';
}
function filterQuotes(){const q=el('search').value.toLowerCase();const s=el('status-filter').value;renderQuotes((window.allQuotes||[]).filter(r=>(!s||r.status===s)&&JSON.stringify(r).toLowerCase().includes(q)))}

async function loadQuote(){
  const session=await requireAuth(); if(!session||!configured)return;
  el('user-email').textContent=session.user.email;
  const id=new URLSearchParams(location.search).get('id');
  if(!id){showMsg('Brak identyfikatora wyceny.','error');return}
  const [{data:req,error:reqErr},{data:items,error:itemErr},{data:zobals,error:zErr},{data:clientQuotes,error:cErr},{data:attachments,error:aErr}]=await Promise.all([
    sb.from('quote_requests').select('*, customers(*)').eq('id',id).single(),
    sb.from('quote_items').select('*').eq('request_id',id).order('position'),
    sb.from('zobal_calculations').select('*').eq('request_id',id).order('created_at',{ascending:false}),
    sb.from('client_quotes').select('*').eq('request_id',id).order('version',{ascending:false}),
    sb.from('request_attachments').select('*').eq('request_id',id).order('item_position').order('created_at')
  ]);
  if(reqErr||itemErr||zErr||cErr||aErr){showMsg((reqErr||itemErr||zErr||cErr||aErr).message,'error');return}
  window.requestId=id; window.quoteRequest=req; window.quoteItems=items||[]; window.zobals=zobals||[]; window.clientQuotes=clientQuotes||[]; window.requestAttachments=attachments||[];
  renderQuote();
}
function escHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function detailLine(label,value){return value?`<div style="margin-top:5px"><strong>${label}:</strong> ${escHtml(value)}</div>`:''}
function formatPositions(data){
  if(!data)return '—';
  const mode=data.mode==='wlasne'?'własne od dolnej krawędzi':'standard / symetryczne';
  const positions=Array.isArray(data.positions)?data.positions:[];
  const vals=positions.map(p=>`${p.number} = ${p.mm_from_bottom} mm`).join(', ');
  return vals?`${mode}: ${vals}`:mode;
}
function renderItemDetails(i){
  const hinges=i.hinges_type||'Brak';
  const hingeInfo=hinges==='Brak'
    ? 'Brak'
    : [
        hinges,
        i.hinge_side?`strona: ${i.hinge_side}`:null,
        i.hinge_brand?`marka: ${i.hinge_brand}`:null,
        i.hinge_quantity?`ilość: ${i.hinge_quantity}`:null,
        `położenie: ${formatPositions(i.hinge_positions)}`
      ].filter(Boolean).join(' · ');
  const stiffener=i.stiffener_type||'Brak';
  const stiffenerInfo=stiffener==='Brak'
    ? 'Brak'
    : [
        stiffener,
        i.stiffener_quantity?`ilość: ${i.stiffener_quantity}`:null,
        `położenie: ${formatPositions(i.stiffener_positions)}`
      ].filter(Boolean).join(' · ');
  const files=(window.requestAttachments||[]).filter(a=>Number(a.item_position)===Number(i.position));
  const filesHtml=files.length
    ? `<div style="margin-top:8px"><strong>Załączniki klienta:</strong> ${files.map(a=>`<button type="button" class="btn btn-light" style="padding:4px 8px;margin:3px 4px 0 0" onclick="openPrivateFile('request-attachments','${escHtml(a.storage_path)}')">📎 ${escHtml(a.original_name)}</button>`).join('')}</div>`
    : '';
  return `
    <div><strong>${escHtml(i.item_name||`Front ${i.position}`)}</strong></div>
    <div class="muted" style="margin-top:4px">${escHtml(i.profile_code||'—')} / ${escHtml(i.finish||'—')} / ${escHtml(i.filling||'—')}</div>
    <div style="margin-top:8px;font-size:13px;line-height:1.5">
      ${detailLine('Zawiasy / otwory',hingeInfo)}
      ${detailLine('Szpros / usztywnienie',stiffenerInfo)}
      ${detailLine('Uwagi klienta',i.customer_notes)}
      ${filesHtml}
    </div>`;
}
function renderQuote(){
  const r=window.quoteRequest,c=r.customers||{};
  el('title').textContent=r.request_number||'Zapytanie'; el('status').value=r.status;
  el('customer').innerHTML=`<strong>${escHtml(c.name||'—')}</strong>${c.company_name?'<br>'+escHtml(c.company_name):''}<br>${escHtml(c.email||'—')}<br>${escHtml(c.phone||'—')}<br>${escHtml([c.address,c.zip,c.city].filter(Boolean).join(', '))}`;
  el('notes').value=r.internal_notes||'';
  el('items-body').innerHTML=window.quoteItems.map(i=>`<tr><td>${i.position}</td><td class="item-description">${renderItemDetails(i)}</td><td>${i.height_mm||'—'} × ${i.width_mm||'—'}</td><td>${i.quantity}</td><td class="price-cell"><input type="number" step="0.01" min="0" value="${i.sale_unit_net||''}" data-item="${i.id}" class="price-input"></td><td class="line-value">${money((i.sale_unit_net||0)*(i.quantity||0))}</td><td class="item-actions"><button class="btn btn-light btn-small" onclick="openItemEditor('${i.id}')">Edytuj</button><button class="btn btn-danger btn-small" onclick="deleteQuoteItem('${i.id}')">Usuń</button></td></tr>`).join('');
  el('zobal-list').innerHTML=window.zobals.map(z=>`<div class="doc-row internal"><div><strong>${escHtml(z.zobal_number)}</strong><br><span class="muted">${fmtDate(z.calculation_date||z.created_at)} · ${z.purchase_net?money(z.purchase_net)+' netto':'bez kwoty'}</span></div><div>${z.document_path?`<button class="btn btn-light" onclick="openPrivateFile('zobal-internal','${z.document_path}')">Otwórz PDF</button>`:''}</div></div>`).join('')||'<p class="muted">Brak kalkulacji Zobal.</p>';
  el('client-docs').innerHTML=window.clientQuotes.map(q=>`<div class="doc-row client"><div><strong>${escHtml(q.quote_number)}/V${q.version}</strong><br><span class="muted">${money(q.gross_total)} brutto · ${escHtml(q.status)}</span></div><div>${q.client_pdf_path?`<button class="btn btn-light" onclick="openPrivateFile('client-documents','${q.client_pdf_path}')">Otwórz PDF</button>`:''}</div></div>`).join('')||'<p class="muted">Brak dokumentów dla klienta.</p>';
  initClientQuoteFields();
  updateQuoteSummary();
  document.querySelectorAll('.price-input').forEach(x=>x.addEventListener('input',()=>{const item=window.quoteItems.find(i=>i.id===x.dataset.item);const cell=x.closest('tr')?.querySelector('.line-value');if(cell)cell.textContent=money(Number(x.value||0)*Number(item?.quantity||0));updateQuoteSummary()}));
  ['client-delivery-net','client-discount-net'].forEach(id=>el(id)?.addEventListener('input',updateQuoteSummary));
}
async function saveQuote(){
  const prices=[...document.querySelectorAll('.price-input')];
  const updates=prices.map(x=>sb.from('quote_items').update({sale_unit_net:Number(x.value||0)}).eq('id',x.dataset.item));
  updates.push(sb.from('quote_requests').update({status:el('status').value,internal_notes:el('notes').value,updated_at:new Date().toISOString()}).eq('id',window.requestId));
  const results=await Promise.all(updates); const err=results.find(x=>x.error)?.error;
  if(err){showMsg(err.message,'error');return}showMsg('Zapisano zmiany.','success');await loadQuote();
}

function setSelectOptions(id,values,current){
  const node=el(id);if(!node)return;
  node.innerHTML=values.map(v=>`<option value="${escHtml(v)}">${escHtml(v)}</option>`).join('');
  if(current&&values.includes(current))node.value=current;
}
function positionsToInput(data){
  const positions=Array.isArray(data?.positions)?data.positions:[];
  return positions.map(p=>p.mm_from_bottom).filter(v=>v!==null&&v!==undefined&&v!=='').join(', ');
}
function inputToPositions(value,mode){
  const vals=String(value||'').split(/[;,\s]+/).map(v=>Number(v)).filter(v=>Number.isFinite(v)&&v>=0);
  return {mode:mode||'symetryczne',positions:vals.map((mm,index)=>({number:index+1,mm_from_bottom:mm}))};
}
function openItemEditor(itemId=null){
  const item=itemId?(window.quoteItems||[]).find(x=>x.id===itemId):null;
  setSelectOptions('edit-item-profile',FRONT_PROFILES,item?.profile_code||FRONT_PROFILES[0]);
  setSelectOptions('edit-item-finish',FRONT_FINISHES,item?.finish||FRONT_FINISHES[0]);
  setSelectOptions('edit-item-fill',FRONT_FILLS,item?.filling||'BEZ SZKŁA');
  el('edit-item-id').value=item?.id||'';
  el('item-editor-title').textContent=item?'Edytuj front':'Dodaj front';
  el('edit-item-name').value=item?.item_name||'';
  el('edit-item-qty').value=item?.quantity||1;
  el('edit-item-position').value=item?.position||Math.max(0,...(window.quoteItems||[]).map(x=>Number(x.position||0)))+1;
  el('edit-item-height').value=item?.height_mm||'';
  el('edit-item-width').value=item?.width_mm||'';
  el('edit-hinges-type').value=item?.hinges_type||'Brak';
  el('edit-hinge-side').value=item?.hinge_side||'Lewa';
  el('edit-hinge-brand').value=item?.hinge_brand||'Blum';
  el('edit-hinge-qty').value=item?.hinge_quantity||2;
  el('edit-hinge-mode').value=item?.hinge_positions?.mode||'symetryczne';
  el('edit-hinge-positions').value=positionsToInput(item?.hinge_positions);
  el('edit-stiffener-type').value=item?.stiffener_type||'Brak';
  el('edit-stiffener-qty').value=item?.stiffener_quantity||1;
  el('edit-stiffener-mode').value=item?.stiffener_positions?.mode||'symetryczne';
  el('edit-stiffener-positions').value=positionsToInput(item?.stiffener_positions);
  el('edit-item-notes').value=item?.customer_notes||'';
  refreshItemEditorVisibility();
  el('item-editor-modal').classList.add('open');
  el('item-editor-modal').setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
}
function closeItemEditor(){
  el('item-editor-modal')?.classList.remove('open');
  el('item-editor-modal')?.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
}
function refreshItemEditorVisibility(){
  const hasHinges=el('edit-hinges-type')?.value!=='Brak';
  document.querySelectorAll('.hinge-field').forEach(x=>x.style.display=hasHinges?'':'none');
  const ownHinges=hasHinges&&el('edit-hinge-mode')?.value==='wlasne';
  document.querySelectorAll('.hinge-positions').forEach(x=>x.style.display=ownHinges?'':'none');
  const hasStiffener=el('edit-stiffener-type')?.value!=='Brak';
  document.querySelectorAll('.stiffener-field').forEach(x=>x.style.display=hasStiffener?'':'none');
  const ownStiffener=hasStiffener&&el('edit-stiffener-mode')?.value==='wlasne';
  document.querySelectorAll('.stiffener-positions').forEach(x=>x.style.display=ownStiffener?'':'none');
}
async function saveItemEditor(btn){
  const itemId=el('edit-item-id').value;
  const height=Number(el('edit-item-height').value),width=Number(el('edit-item-width').value),qty=Number(el('edit-item-qty').value),position=Number(el('edit-item-position').value);
  if(!height||!width||!qty||!position){showMsg('Uzupełnij pozycję, ilość, wysokość i szerokość frontu.','error');return}
  const hingesType=el('edit-hinges-type').value,stiffenerType=el('edit-stiffener-type').value;
  const data={
    request_id:window.requestId,position,item_name:el('edit-item-name').value.trim()||null,quantity:qty,height_mm:height,width_mm:width,
    profile_code:el('edit-item-profile').value,finish:el('edit-item-finish').value,filling:el('edit-item-fill').value,
    hinges_type:hingesType,hinge_side:hingesType==='Brak'?null:el('edit-hinge-side').value,hinge_brand:hingesType==='Otwory + zawiasy'?el('edit-hinge-brand').value:null,
    hinge_quantity:hingesType==='Brak'?null:Number(el('edit-hinge-qty').value||0)||null,hinge_positions:hingesType==='Brak'?null:inputToPositions(el('edit-hinge-positions').value,el('edit-hinge-mode').value),
    stiffener_type:stiffenerType,stiffener_quantity:stiffenerType==='Brak'?null:Number(el('edit-stiffener-qty').value||0)||null,
    stiffener_positions:stiffenerType==='Brak'?null:inputToPositions(el('edit-stiffener-positions').value,el('edit-stiffener-mode').value),customer_notes:el('edit-item-notes').value.trim()||null
  };
  if(btn){btn.disabled=true;btn.textContent='Zapisywanie...'}
  try{
    const result=itemId?await sb.from('quote_items').update(data).eq('id',itemId):await sb.from('quote_items').insert(data);
    if(result.error)throw result.error;
    closeItemEditor();showMsg(itemId?'Zmieniono dane frontu.':'Dodano nowy front.','success');await loadQuote();
  }catch(e){showMsg(e.message||String(e),'error')}finally{if(btn){btn.disabled=false;btn.textContent='Zapisz front'}}
}
async function deleteQuoteItem(itemId){
  const item=(window.quoteItems||[]).find(x=>x.id===itemId);if(!item)return;
  if(!confirm(`Usunąć ${item.item_name||`front ${item.position}`} z wyceny?`))return;
  const {error}=await sb.from('quote_items').delete().eq('id',itemId);
  if(error){showMsg(error.message,'error');return}
  showMsg('Usunięto front.','success');await loadQuote();
}

async function addZobal(){
  const number=el('zobal-number').value.trim();const purchase=Number(el('zobal-purchase').value||0);const file=el('zobal-file').files[0];
  if(!number){showMsg('Podaj numer Zobal.','error');return}
  let path=null;
  if(file){path=`${window.requestId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;const {error}=await sb.storage.from('zobal-internal').upload(path,file,{upsert:false});if(error){showMsg(error.message,'error');return}}
  const {error}=await sb.from('zobal_calculations').insert({request_id:window.requestId,zobal_number:number,document_path:path,purchase_net:purchase||null,calculation_date:new Date().toISOString().slice(0,10),created_by:(await sb.auth.getUser()).data.user.id});
  if(error){showMsg(error.message,'error');return}el('zobal-number').value='';el('zobal-purchase').value='';el('zobal-file').value='';showMsg('Dodano kalkulację Zobal.','success');await loadQuote();
}
async function openPrivateFile(bucket,path){const {data,error}=await sb.storage.from(bucket).createSignedUrl(path,120);if(error){showMsg(error.message,'error');return}window.open(data.signedUrl,'_blank')}


function initClientQuoteFields(){
  const year=new Date().getFullYear();
  const suffix=(window.quoteRequest?.request_number||'').replace(/\D/g,'').slice(-6)||String(Date.now()).slice(-6);
  if(el('client-quote-number')&&!el('client-quote-number').value)el('client-quote-number').value=`OF/${year}/${suffix}`;
  if(el('client-valid-until')&&!el('client-valid-until').value){const d=new Date();d.setDate(d.getDate()+14);el('client-valid-until').value=d.toISOString().slice(0,10)}
  if(el('client-payment-terms')&&!el('client-payment-terms').value)el('client-payment-terms').value='Przedpłata 100%';
}
function currentQuoteTotals(){
  const items=window.quoteItems||[];
  let itemsNet=0;
  document.querySelectorAll('.price-input').forEach(x=>{const item=items.find(i=>i.id===x.dataset.item);itemsNet+=Number(x.value||0)*Number(item?.quantity||0)});
  const delivery=Number(el('client-delivery-net')?.value||0),discount=Number(el('client-discount-net')?.value||0),vatRate=23;
  const net=Math.max(0,itemsNet+delivery-discount),vat=Math.round(net*vatRate)/100,gross=net+vat;
  return {itemsNet,delivery,discount,vatRate,net,vat,gross};
}
function updateQuoteSummary(){
  const t=currentQuoteTotals(),box=el('quote-summary');if(!box)return;
  box.innerHTML=`<div><span>Pozycje netto</span><strong>${money(t.itemsNet)}</strong></div><div><span>Dostawa netto</span><strong>${money(t.delivery)}</strong></div><div><span>Rabat netto</span><strong>-${money(t.discount)}</strong></div><div><span>VAT ${t.vatRate}%</span><strong>${money(t.vat)}</strong></div><div class="total"><span>Razem brutto</span><strong>${money(t.gross)}</strong></div>`;
}
function pdfText(v){return String(v??'').replace(/\s+/g,' ').trim()}
function itemTechText(i){
  const out=[];
  if(i.hinges_type&&i.hinges_type!=='Brak'){
    let h=i.hinges_type;
    if(i.hinge_side)h+=`, strona: ${i.hinge_side}`;
    if(i.hinge_brand)h+=`, marka: ${i.hinge_brand}`;
    if(i.hinge_quantity)h+=`, ilość: ${i.hinge_quantity}`;
    const hp=formatPositions(i.hinge_positions);if(hp&&hp!=='—')h+=`, położenie: ${hp}`;
    out.push(`Zawiasy/otwory: ${h}`);
  }
  if(i.stiffener_type&&i.stiffener_type!=='Brak'){
    let st=i.stiffener_type;
    if(i.stiffener_quantity)st+=`, ilość: ${i.stiffener_quantity}`;
    const sp=formatPositions(i.stiffener_positions);if(sp&&sp!=='—')st+=`, położenie: ${sp}`;
    out.push(`Szpros/usztywnienie: ${st}`);
  }
  if(i.customer_notes)out.push(`Uwagi: ${i.customer_notes}`);
  return out.join('\n');
}
function buildClientPdfDefinition(){
  const r=window.quoteRequest||{},c=r.customers||{},t=currentQuoteTotals();
  const quoteNo=el('client-quote-number').value.trim(),validUntil=el('client-valid-until').value,deliveryTime=el('client-delivery-time').value.trim(),paymentTerms=el('client-payment-terms').value.trim();
  const priceInputs=[...document.querySelectorAll('.price-input')];
  const body=[[{text:'Poz.',style:'th'},{text:'Opis',style:'th'},{text:'Wymiar',style:'th'},{text:'Ilość',style:'th'},{text:'Cena netto/szt.',style:'th'},{text:'Wartość netto',style:'th'}]];
  (window.quoteItems||[]).forEach(i=>{
    const inp=priceInputs.find(x=>x.dataset.item===i.id),unit=Number(inp?.value||0),line=unit*Number(i.quantity||0);
    const main=[i.item_name||`Front ${i.position}`,i.profile_code,i.finish,i.filling].filter(Boolean).join(' / ');
    const tech=itemTechText(i);
    body.push([String(i.position),{text:pdfText(main)+(tech?`\n${pdfText(tech)}`:''),fontSize:8.5},`${i.height_mm||'—'} x ${i.width_mm||'—'} mm`,String(i.quantity||0),money(unit),money(line)]);
  });
  const terms=[];if(deliveryTime)terms.push(`Termin realizacji: ${deliveryTime}`);if(paymentTerms)terms.push(`Forma płatności: ${paymentTerms}`);terms.push('Konto bankowe: 62 1020 1185 0000 4702 0310 8537');terms.push('Bank: PKO Bank Polski');if(validUntil)terms.push(`Oferta ważna do: ${new Date(validUntil+'T12:00:00').toLocaleDateString('pl-PL')}`);
  return {
    pageSize:'A4',pageMargins:[34,40,34,45],defaultStyle:{font:'Roboto',fontSize:9,color:'#18212b'},
    footer:(current,pageCount)=>({text:`idea-nova.pl - oferta ${quoteNo} | strona ${current} z ${pageCount}`,alignment:'center',fontSize:7,color:'#687789',margin:[0,15,0,0]}),
    content:[
      {columns:[{stack:[{text:'idea-nova.pl',fontSize:20,bold:true,color:'#173b63'},{text:'Fronty aluminiowe - oferta handlowa',fontSize:9,color:'#687789'}]},{stack:[{text:quoteNo,alignment:'right',fontSize:13,bold:true},{text:`Data: ${new Date().toLocaleDateString('pl-PL')}`,alignment:'right',fontSize:8,color:'#687789'}]}]},
      {canvas:[{type:'line',x1:0,y1:8,x2:527,y2:8,lineWidth:1,lineColor:'#173b63'}],margin:[0,0,0,18]},
      {columns:[{width:'50%',stack:[{text:'Dane klienta',style:'label'},{text:pdfText(c.name||'—'),bold:true},{text:pdfText(c.company_name||'')},{text:pdfText(c.email||'')},{text:pdfText(c.phone||'')},{text:pdfText([c.address,c.zip,c.city].filter(Boolean).join(', '))}]},{width:'50%',stack:[{text:'Zapytanie',style:'label'},{text:pdfText(r.request_number||'—'),bold:true},{text:validUntil?`Ważna do: ${new Date(validUntil+'T12:00:00').toLocaleDateString('pl-PL')}`:'',margin:[0,3,0,0]}]}],margin:[0,0,0,18]},
      {table:{headerRows:1,widths:[24,'*',62,30,68,72],body},layout:{fillColor:(row)=>row===0?'#173b63':(row%2===0?'#f4f7fb':null),hLineColor:'#dbe3ec',vLineColor:'#dbe3ec',paddingLeft:()=>5,paddingRight:()=>5,paddingTop:()=>6,paddingBottom:()=>6}},
      {columns:[{width:'*',text:''},{width:230,table:{widths:['*',85],body:[['Pozycje netto',money(t.itemsNet)],['Dostawa netto',money(t.delivery)],['Rabat netto',`-${money(t.discount)}`],[`VAT ${t.vatRate}%`,money(t.vat)],[{text:'RAZEM BRUTTO',bold:true},{text:money(t.gross),bold:true,color:'#173b63'}]]},layout:'lightHorizontalLines'}],margin:[0,16,0,0]},
      terms.length?{stack:[{text:'Warunki oferty',style:'label',margin:[0,20,0,6]},...terms.map(x=>({text:`- ${x}`,margin:[0,2,0,0]}))]}:{},
      {text:'Dziękujemy za zapytanie. W przypadku zmian parametrów przygotujemy kolejną wersję oferty.',margin:[0,22,0,0],fontSize:8,color:'#687789'}
    ],styles:{th:{color:'#ffffff',bold:true,fontSize:7.5},label:{fontSize:8,bold:true,color:'#687789',margin:[0,0,0,5]}}
  };
}
function validateClientPdf(){
  if(!el('client-quote-number').value.trim()){showMsg('Podaj numer oferty.','error');return false}
  if(!(window.quoteItems||[]).length){showMsg('Brak pozycji do wyceny.','error');return false}
  if([...document.querySelectorAll('.price-input')].some(x=>Number(x.value||0)<=0)){showMsg('Uzupełnij ceny netto wszystkich pozycji.','error');return false}
  return true;
}
function previewClientPdf(){if(!validateClientPdf())return;pdfMake.createPdf(buildClientPdfDefinition()).open()}
async function generateAndSaveClientPdf(btn){
  if(!validateClientPdf())return;
  if(btn){btn.disabled=true;btn.textContent='Generowanie...'}
  try{
    const priceUpdates=[...document.querySelectorAll('.price-input')].map(x=>sb.from('quote_items').update({sale_unit_net:Number(x.value||0)}).eq('id',x.dataset.item));
    const priceResults=await Promise.all(priceUpdates);const priceErr=priceResults.find(x=>x.error)?.error;if(priceErr)throw priceErr;
    const blob=await new Promise(resolve=>pdfMake.createPdf(buildClientPdfDefinition()).getBlob(resolve));
    const quoteNo=el('client-quote-number').value.trim(),nextVersion=Math.max(0,...(window.clientQuotes||[]).filter(q=>q.quote_number===quoteNo).map(q=>Number(q.version||0)))+1;
    const safe=quoteNo.replace(/[^a-zA-Z0-9_-]/g,'_'),path=`${window.requestId}/${safe}-V${nextVersion}-${Date.now()}.pdf`;
    const up=await sb.storage.from('client-documents').upload(path,blob,{contentType:'application/pdf',upsert:false});if(up.error)throw up.error;
    const t=currentQuoteTotals(),user=(await sb.auth.getUser()).data.user;
    const ins=await sb.from('client_quotes').insert({request_id:window.requestId,quote_number:quoteNo,version:nextVersion,status:'draft',valid_until:el('client-valid-until').value||null,delivery_time:el('client-delivery-time').value.trim()||null,payment_terms:el('client-payment-terms').value.trim()||null,delivery_net:t.delivery,discount_net:t.discount,vat_rate:t.vatRate,net_total:t.net,vat_total:t.vat,gross_total:t.gross,client_pdf_path:path,created_by:user.id});if(ins.error)throw ins.error;
    showMsg(`PDF zapisany jako ${quoteNo}/V${nextVersion}.`,'success');await loadQuote();
  }catch(e){showMsg(e.message||String(e),'error')}finally{if(btn){btn.disabled=false;btn.textContent='Generuj i zapisz PDF'}}
}
