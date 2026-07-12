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
function normalizeSource(s){return ({web_form:'www',website:'www',www:'www',email:'email',manual:'manual'})[s]||'manual'}
function sourceLabel(s){return ({www:'Strona WWW',email:'E-mail',manual:'Ręcznie'})[normalizeSource(s)]}
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
  el('quotes-body').innerHTML=rows.map(r=>`<tr><td><a href="quote.html?id=${r.id}"><strong>${r.request_number||'—'}</strong></a></td><td>${r.customer_name||'—'}<br><span class="muted">${r.company_name||''}</span></td><td><span class="source-badge source-${normalizeSource(r.source)}">${sourceLabel(r.source)}</span></td><td>${r.zobal_numbers||'—'}</td><td>${fmtDate(r.created_at)}</td><td>${r.gross_total?money(r.gross_total):'—'}</td><td><span class="badge ${r.status}">${statusLabel(r.status)}</span></td></tr>`).join('')||'<tr><td colspan="7" class="muted">Brak wycen.</td></tr>';
}
function filterQuotes(){const q=el('search').value.toLowerCase(),s=el('status-filter').value,src=el('source-filter')?.value||'';renderQuotes((window.allQuotes||[]).filter(r=>(!s||r.status===s)&&(!src||normalizeSource(r.source)===src)&&JSON.stringify(r).toLowerCase().includes(q)))}

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
function normalizeDeliveryTime(value){
  const raw=String(value||'').trim();
  if(!raw)return '—';
  if(/tyg/i.test(raw))return raw;
  if(/^\d+(?:\s*[-–]\s*\d+)?$/.test(raw))return `${raw.replace('-', '–')} tygodni`;
  return raw;
}
function renderItemDetails(i){
  const hinges=i.hinges_type||'Brak';
  const hingeParts=[];
  if(hinges!=='Brak'){
    hingeParts.push(hinges);
    if(i.hinge_side)hingeParts.push(`strona: ${i.hinge_side}`);
    if(i.hinge_brand)hingeParts.push(`marka: ${i.hinge_brand}`);
    if(i.hinge_quantity)hingeParts.push(`ilość: ${i.hinge_quantity}`);
    hingeParts.push(`położenie: ${formatPositions(i.hinge_positions)}`);
  }
  const stiffener=i.stiffener_type||'Brak';
  const stiffenerParts=[];
  if(stiffener!=='Brak'){
    stiffenerParts.push(stiffener);
    if(i.stiffener_quantity)stiffenerParts.push(`ilość: ${i.stiffener_quantity}`);
    stiffenerParts.push(`położenie: ${formatPositions(i.stiffener_positions)}`);
  }
  const files=(window.requestAttachments||[]).filter(a=>Number(a.item_position)===Number(i.position));
  const filesHtml=files.length?`<li><span>Załączniki</span><div class="item-files">${files.map(a=>`<button type="button" class="btn btn-light btn-file" onclick="openPrivateFile('request-attachments','${escHtml(a.storage_path)}')">📎 ${escHtml(a.original_name)}</button>`).join('')}</div></li>`:'';
  const title=[i.item_name||`Front ${i.position}`,i.profile_code,i.finish,i.filling].filter(Boolean).join(' · ');
  const generalDelivery=el('client-delivery-time')?.value||'';
  const delivery=i.delivery_time||generalDelivery;
  return `<div class="item-title item-title-nowrap" title="${escHtml(title)}">${escHtml(title)}</div>
    <ul class="item-specs">
      <li><span>Wymiary</span><strong>${escHtml(i.height_mm||'—')} × ${escHtml(i.width_mm||'—')} mm</strong></li>
      <li><span>Zawiasy / otwory</span><strong>${escHtml(hinges==='Brak'?'Brak':hingeParts.join(' · '))}</strong></li>
      <li><span>Szpros / usztywnienie</span><strong>${escHtml(stiffener==='Brak'?'Brak':stiffenerParts.join(' · '))}</strong></li>
      <li class="delivery-spec"><span>Termin realizacji</span><div class="delivery-inline-wrap"><input type="text" value="${escHtml(delivery)}" data-item="${i.id}" data-custom="${i.delivery_time?'1':'0'}" class="item-delivery-input item-delivery-inline" placeholder="4–8"><small>tygodnie</small></div></li>
      ${i.customer_notes?`<li><span>Uwagi</span><strong>${escHtml(i.customer_notes)}</strong></li>`:''}
      ${filesHtml}
    </ul>`;
}
function renderCustomerEditor(c,r){
  return `<div style="margin-bottom:12px"><span class="source-badge source-${normalizeSource(r.source)}">${sourceLabel(r.source)}</span></div>
  <div class="customer-edit-grid">
    <div><label>Imię i nazwisko</label><input id="cust-name" value="${escHtml(c.name||'')}"></div>
    <div><label>Firma</label><input id="cust-company" value="${escHtml(c.company_name||'')}"></div>
    <div><label>E-mail</label><input id="cust-email" type="email" value="${escHtml(c.email||'')}"></div>
    <div><label>Telefon</label><input id="cust-phone" value="${escHtml(c.phone||'')}"></div>
    <div><label>NIP</label><input id="cust-nip" value="${escHtml(c.nip||'')}"></div>
    <div><label>Adres</label><input id="cust-address" value="${escHtml(c.address||'')}"></div>
    <div><label>Kod pocztowy</label><input id="cust-zip" value="${escHtml(c.zip||'')}"></div>
    <div><label>Miejscowość</label><input id="cust-city" value="${escHtml(c.city||'')}"></div>
  </div>
  <button class="btn btn-primary" style="margin-top:12px;width:100%" onclick="saveCustomer()">Zapisz dane klienta</button>`;
}
async function saveCustomer(){
  const c=window.quoteRequest?.customers;if(!c?.id){showMsg('Brak identyfikatora klienta.','error');return}
  const data={name:el('cust-name').value.trim(),company_name:el('cust-company').value.trim()||null,email:el('cust-email').value.trim()||null,phone:el('cust-phone').value.trim()||null,nip:el('cust-nip').value.trim()||null,address:el('cust-address').value.trim()||null,zip:el('cust-zip').value.trim()||null,city:el('cust-city').value.trim()||null,updated_at:new Date().toISOString()};
  if(!data.name){showMsg('Podaj imię i nazwisko klienta.','error');return}
  const {error}=await sb.from('customers').update(data).eq('id',c.id);
  if(error){showMsg(error.message,'error');return}
  showMsg('Zapisano dane klienta.','success');await loadQuote();
}
function renderQuote(){
  const r=window.quoteRequest,c=r.customers||{};
  el('title').textContent=r.request_number||'Zapytanie'; el('status').value=r.status; if(el('source'))el('source').value=normalizeSource(r.source);
  el('customer').innerHTML=renderCustomerEditor(c,r);
  el('notes').value=r.internal_notes||'';
  const generalDelivery=el('client-delivery-time')?.value||'';
  el('items-body').innerHTML=window.quoteItems.map(i=>{
    const purchase=Number(i.purchase_unit_net||0),margin=(i.margin_percent===null||i.margin_percent===undefined||Number(i.margin_percent)===0)?40:Number(i.margin_percent),sale=purchase*(1+margin/100),gross=sale*1.23,lineGross=gross*Number(i.quantity||0);
    const delivery=i.delivery_time||generalDelivery;
    return `<tr data-item-row="${i.id}"><td><span class="position-chip">${i.position}</span></td><td class="item-description">${renderItemDetails(i)}</td><td class="compact-cell qty-cell">${i.quantity}</td><td class="purchase-cell"><input type="number" step="0.01" min="0" value="${purchase||''}" data-item="${i.id}" class="purchase-input"></td><td class="margin-cell"><div class="input-suffix"><input type="number" step="0.01" min="0" value="${margin}" data-item="${i.id}" class="margin-input"><span>%</span></div></td><td class="client-net-value">${money(sale)}</td><td class="client-gross-value">${money(gross)}</td><td class="line-gross-value">${money(lineGross)}</td><td class="item-actions"><button class="btn btn-light btn-small" onclick="openItemEditor('${i.id}')">Edytuj</button><button class="btn btn-danger btn-small" onclick="deleteQuoteItem('${i.id}')">Usuń</button></td></tr>`;
  }).join('');
  el('zobal-list').innerHTML=window.zobals.map(z=>`<div class="doc-row internal"><div><strong>${escHtml(z.zobal_number)}</strong><br><span class="muted">${fmtDate(z.calculation_date||z.created_at)} · ${z.purchase_net?money(z.purchase_net)+' netto':'bez kwoty'}</span></div><div>${z.document_path?`<button class="btn btn-light" onclick="openPrivateFile('zobal-internal','${z.document_path}')">Otwórz PDF</button>`:''}</div></div>`).join('')||'<p class="muted">Brak kalkulacji Zobal.</p>';
  el('client-docs').innerHTML=window.clientQuotes.map(q=>`<div class="doc-row client"><div><strong>${escHtml(q.quote_number)}/V${q.version}</strong><br><span class="muted">${money(q.gross_total)} brutto · ${escHtml(q.status)}</span></div><div>${q.client_pdf_path?`<button class="btn btn-light" onclick="openPrivateFile('client-documents','${q.client_pdf_path}')">Otwórz PDF</button>`:''}</div></div>`).join('')||'<p class="muted">Brak dokumentów dla klienta.</p>';
  initClientQuoteFields();
  updateQuoteSummary();
  document.querySelectorAll('.purchase-input,.margin-input').forEach(x=>x.addEventListener('input',()=>{recalculateItemRow(x.dataset.item);updateQuoteSummary()}));
  document.querySelectorAll('.item-delivery-input').forEach(x=>x.addEventListener('input',()=>{x.dataset.custom='1'}));
  el('client-delivery-net')?.addEventListener('input',updateQuoteSummary);
  el('client-delivery-time')?.addEventListener('input',()=>{document.querySelectorAll('.item-delivery-input[data-custom="0"]').forEach(x=>x.value=el('client-delivery-time').value)});
}
function itemPricingFromRow(itemId){
  const row=document.querySelector(`tr[data-item-row="${itemId}"]`);
  const purchase=Number(row?.querySelector('.purchase-input')?.value||0),margin=Number(row?.querySelector('.margin-input')?.value||40);
  const net=purchase*(1+margin/100),gross=net*1.23;
  return {purchase,margin,net,gross};
}
function recalculateItemRow(itemId){
  const row=document.querySelector(`tr[data-item-row="${itemId}"]`),item=(window.quoteItems||[]).find(i=>i.id===itemId);if(!row||!item)return;
  const p=itemPricingFromRow(itemId);
  row.querySelector('.client-net-value').textContent=money(p.net);
  row.querySelector('.client-gross-value').textContent=money(p.gross);
  row.querySelector('.line-gross-value').textContent=money(p.gross*Number(item.quantity||0));
}
async function saveQuote(){
  const updates=(window.quoteItems||[]).map(i=>{
    const p=itemPricingFromRow(i.id),delivery=document.querySelector(`.item-delivery-input[data-item="${i.id}"]`)?.value.trim()||null;
    return sb.from('quote_items').update({purchase_unit_net:p.purchase,margin_percent:p.margin,sale_unit_net:p.net,delivery_time:delivery}).eq('id',i.id);
  });
  updates.push(sb.from('quote_requests').update({source:el('source')?.value||'manual',status:el('status').value,internal_notes:el('notes').value,updated_at:new Date().toISOString()}).eq('id',window.requestId));
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
  items.forEach(i=>{itemsNet+=itemPricingFromRow(i.id).net*Number(i.quantity||0)});
  const delivery=Number(el('client-delivery-net')?.value||0),vatRate=23;
  const net=Math.max(0,itemsNet+delivery),vat=Math.round(net*vatRate)/100,gross=net+vat;
  return {itemsNet,delivery,vatRate,net,vat,gross};
}
function updateQuoteSummary(){
  const t=currentQuoteTotals(),box=el('quote-summary');if(!box)return;
  box.innerHTML=`<div><span>Pozycje netto</span><strong>${money(t.itemsNet)}</strong></div><div><span>Dostawa netto</span><strong>${money(t.delivery)}</strong></div><div><span>VAT ${t.vatRate}%</span><strong>${money(t.vat)}</strong></div><div class="total"><span>Razem brutto</span><strong>${money(t.gross)}</strong></div>`;
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
  const navy='#12375d',soft='#f4f7fb',line='#dbe3ec',muted='#66778a';
  const itemBlocks=(window.quoteItems||[]).map(i=>{
    const p=itemPricingFromRow(i.id),qty=Number(i.quantity||0),lineGross=p.gross*qty;
    const delivery=document.querySelector(`.item-delivery-input[data-item="${i.id}"]`)?.value.trim()||deliveryTime||'—';
    const heading=[i.item_name||`Front ${i.position}`,i.profile_code,i.finish,i.filling].filter(Boolean).join(' · ');
    const tech=[];
    tech.push({text:[{text:'Wymiary: ',bold:true,color:muted},`${i.height_mm||'—'} × ${i.width_mm||'—'} mm`],margin:[0,2,0,0]});
    tech.push({text:[{text:'Termin realizacji: ',bold:true,color:muted},normalizeDeliveryTime(delivery)],margin:[0,2,0,0]});
    if(i.hinges_type&&i.hinges_type!=='Brak')tech.push({text:[{text:'Zawiasy / otwory: ',bold:true,color:muted},pdfText(itemTechText({...i,stiffener_type:'Brak',customer_notes:null}).replace('Zawiasy/otwory: ',''))],margin:[0,2,0,0]});
    if(i.stiffener_type&&i.stiffener_type!=='Brak'){
      let st=i.stiffener_type;if(i.stiffener_quantity)st+=`, ilość: ${i.stiffener_quantity}`;const sp=formatPositions(i.stiffener_positions);if(sp&&sp!=='—')st+=`, położenie: ${sp}`;
      tech.push({text:[{text:'Szpros / usztywnienie: ',bold:true,color:muted},pdfText(st)],margin:[0,2,0,0]});
    }
    if(i.customer_notes)tech.push({text:[{text:'Uwagi: ',bold:true,color:muted},pdfText(i.customer_notes)],margin:[0,2,0,0]});
    return {table:{widths:[28,'*',38,76,76,84],body:[[
      {text:String(i.position),bold:true,alignment:'center',margin:[0,8,0,0]},
      {stack:[{text:pdfText(heading),bold:true,fontSize:10,color:navy,margin:[0,0,0,5]},...tech]},
      {text:String(qty),alignment:'center',margin:[0,8,0,0]},
      {text:money(p.net),bold:true,alignment:'right',margin:[0,8,0,0]},
      {text:money(p.gross),bold:true,alignment:'right',margin:[0,8,0,0]},
      {text:money(lineGross),bold:true,alignment:'right',color:navy,margin:[0,8,0,0]}
    ]]},layout:{fillColor:()=>soft,hLineColor:()=>line,vLineColor:()=>line,paddingLeft:()=>8,paddingRight:()=>8,paddingTop:()=>8,paddingBottom:()=>8},margin:[0,0,0,9]};
  });
  const validText=validUntil?new Date(validUntil+'T12:00:00').toLocaleDateString('pl-PL'):'—';
  return {pageSize:'A4',pageOrientation:'landscape',pageMargins:[30,30,30,40],defaultStyle:{font:'Roboto',fontSize:8.5,color:'#18212b'},
    footer:(current,pageCount)=>({columns:[{text:`idea-nova.pl · ${quoteNo}`,alignment:'left'},{text:`strona ${current} z ${pageCount}`,alignment:'right'}],fontSize:7,color:muted,margin:[30,12,30,0]}),
    content:[
      {columns:[{stack:[{text:'idea-nova.pl',fontSize:22,bold:true,color:navy},{text:'Fronty aluminiowe · oferta handlowa',fontSize:9,color:muted,margin:[0,2,0,0]}]},{stack:[{text:quoteNo,fontSize:15,bold:true,alignment:'right',color:navy},{text:`Data wyceny: ${new Date().toLocaleDateString('pl-PL')}`,alignment:'right',color:muted,margin:[0,3,0,0]}]}]},
      {canvas:[{type:'line',x1:0,y1:10,x2:780,y2:10,lineWidth:1.5,lineColor:navy}],margin:[0,0,0,18]},
      {columns:[{width:'52%',table:{widths:['*'],body:[[{stack:[{text:'DANE KLIENTA',fontSize:8,bold:true,color:muted,margin:[0,0,0,6]},{text:pdfText(c.name||'—'),fontSize:11,bold:true,color:navy},{text:pdfText(c.company_name||'')},{text:pdfText(c.email||'')},{text:pdfText(c.phone||'')},{text:pdfText([c.address,c.zip,c.city].filter(Boolean).join(', '))}]}]]},layout:{fillColor:()=>soft,hLineColor:()=>line,vLineColor:()=>line,paddingLeft:()=>12,paddingRight:()=>12,paddingTop:()=>10,paddingBottom:()=>10}},{width:'4%',text:''},{width:'44%',table:{widths:['*','*'],body:[[{stack:[{text:'NUMER ZAPYTANIA',fontSize:8,bold:true,color:muted},{text:pdfText(r.request_number||'—'),bold:true,color:navy,margin:[0,5,0,0]}]},{stack:[{text:'OFERTA WAŻNA DO',fontSize:8,bold:true,color:muted},{text:validText,bold:true,color:navy,margin:[0,5,0,0]}]}],[{stack:[{text:'FORMA PŁATNOŚCI',fontSize:8,bold:true,color:muted},{text:paymentTerms||'—',margin:[0,5,0,0]}]},{stack:[{text:'TERMIN OGÓLNY',fontSize:8,bold:true,color:muted},{text:normalizeDeliveryTime(deliveryTime),margin:[0,5,0,0]}]}]]},layout:{fillColor:()=>soft,hLineColor:()=>line,vLineColor:()=>line,paddingLeft:()=>10,paddingRight:()=>10,paddingTop:()=>10,paddingBottom:()=>10}}],margin:[0,0,0,16]},
      {table:{widths:[28,'*',38,76,76,84],body:[[{text:'POZ.',style:'pdfTh'},{text:'PRODUKT I KONFIGURACJA',style:'pdfTh'},{text:'ILOŚĆ',style:'pdfTh'},{text:'CENA NETTO/SZT.',style:'pdfTh'},{text:'CENA BRUTTO/SZT.',style:'pdfTh'},{text:'WARTOŚĆ BRUTTO',style:'pdfTh'}]]},layout:{fillColor:()=>navy,hLineColor:()=>navy,vLineColor:()=>navy,paddingLeft:()=>7,paddingRight:()=>7,paddingTop:()=>7,paddingBottom:()=>7},margin:[0,0,0,7]},
      ...itemBlocks,
      {columns:[{width:'55%',stack:[{text:'WARUNKI OFERTY',fontSize:8,bold:true,color:muted,margin:[0,6,0,7]},{text:`Forma płatności: ${paymentTerms||'—'}`,margin:[0,2,0,0]},{text:'PKO Bank Polski · 62 1020 1185 0000 4702 0310 8537',margin:[0,2,0,0]},{text:`Oferta ważna do: ${validText}`,margin:[0,2,0,0]}]},{width:'45%',table:{widths:['*',105],body:[['Pozycje netto',money(t.itemsNet)],['Dostawa netto',money(t.delivery)],[`VAT ${t.vatRate}%`,money(t.vat)],[{text:'RAZEM BRUTTO',bold:true,fontSize:11,color:navy},{text:money(t.gross),bold:true,fontSize:13,color:navy}]]},layout:{fillColor:(row)=>row===3?soft:null,hLineColor:()=>line,vLineColor:()=>line,paddingLeft:()=>10,paddingRight:()=>10,paddingTop:()=>7,paddingBottom:()=>7}}],margin:[0,12,0,0]},
      {text:'Dziękujemy za zapytanie. W przypadku zmian parametrów przygotujemy kolejną wersję oferty.',margin:[0,20,0,0],fontSize:8,color:muted}
    ],styles:{pdfTh:{color:'#fff',bold:true,fontSize:7.5,alignment:'center'}}};
}
function validateClientPdf(){
  if(!el('client-quote-number').value.trim()){showMsg('Podaj numer oferty.','error');return false}
  if(!(window.quoteItems||[]).length){showMsg('Brak pozycji do wyceny.','error');return false}
  if((window.quoteItems||[]).some(i=>itemPricingFromRow(i.id).purchase<=0)){showMsg('Uzupełnij cenę zakupu wszystkich pozycji.','error');return false}
  return true;
}
function previewClientPdf(){
  if(!validateClientPdf())return;
  try{
    if(typeof pdfMake==='undefined')throw new Error('Generator PDF nie został załadowany. Odśwież stronę i spróbuj ponownie.');
    pdfMake.createPdf(buildClientPdfDefinition()).open();
  }catch(e){
    console.error('Błąd podglądu PDF:',e);
    showMsg(e.message||String(e),'error');
  }
}
async function generateAndSaveClientPdf(btn){
  if(!validateClientPdf())return;
  if(btn){btn.disabled=true;btn.textContent='Generowanie...'}
  try{
    const priceUpdates=(window.quoteItems||[]).map(i=>{const p=itemPricingFromRow(i.id),delivery=document.querySelector(`.item-delivery-input[data-item="${i.id}"]`)?.value.trim()||null;return sb.from('quote_items').update({purchase_unit_net:p.purchase,margin_percent:p.margin,sale_unit_net:p.net,delivery_time:delivery}).eq('id',i.id)});
    const priceResults=await Promise.all(priceUpdates);const priceErr=priceResults.find(x=>x.error)?.error;if(priceErr)throw priceErr;
    const blob=await new Promise(resolve=>pdfMake.createPdf(buildClientPdfDefinition()).getBlob(resolve));
    const quoteNo=el('client-quote-number').value.trim(),nextVersion=Math.max(0,...(window.clientQuotes||[]).filter(q=>q.quote_number===quoteNo).map(q=>Number(q.version||0)))+1;
    const safe=quoteNo.replace(/[^a-zA-Z0-9_-]/g,'_'),path=`${window.requestId}/${safe}-V${nextVersion}-${Date.now()}.pdf`;
    const up=await sb.storage.from('client-documents').upload(path,blob,{contentType:'application/pdf',upsert:false});if(up.error)throw up.error;
    const t=currentQuoteTotals(),user=(await sb.auth.getUser()).data.user;
    const ins=await sb.from('client_quotes').insert({request_id:window.requestId,quote_number:quoteNo,version:nextVersion,status:'draft',valid_until:el('client-valid-until').value||null,delivery_time:el('client-delivery-time').value.trim()||null,payment_terms:el('client-payment-terms').value.trim()||null,delivery_net:t.delivery,discount_net:0,vat_rate:t.vatRate,net_total:t.net,vat_total:t.vat,gross_total:t.gross,client_pdf_path:path,created_by:user.id});if(ins.error)throw ins.error;
    showMsg(`PDF zapisany jako ${quoteNo}/V${nextVersion}.`,'success');await loadQuote();
  }catch(e){showMsg(e.message||String(e),'error')}finally{if(btn){btn.disabled=false;btn.textContent='Generuj i zapisz PDF'}}
}


// Ręczne tworzenie wyceny
window.manualDraftItems=[];
async function loadManualQuotePage(){
  const session=await requireAuth();if(!session||!configured)return;
  el('user-email').textContent=session.user.email;renderManualDraftItems();
}
function manualItemTitle(i){return [i.item_name||`Front ${i.position}`,i.profile_code,i.finish,i.filling].filter(Boolean).join(' · ')}
function renderManualDraftItems(){
  const box=el('manual-items');if(!box)return;
  const rows=window.manualDraftItems||[];
  box.innerHTML=rows.length?rows.map((i,idx)=>`<div class="manual-item-card"><div><div class="item-title">${escHtml(manualItemTitle(i))}</div><div class="manual-item-meta">${i.height_mm} × ${i.width_mm} mm · ilość: ${i.quantity}</div><div class="manual-item-meta">Zawiasy / otwory: ${escHtml(i.hinges_type||'Brak')}</div><div class="manual-item-meta">Szpros / usztywnienie: ${escHtml(i.stiffener_type||'Brak')}</div></div><div class="toolbar"><button class="btn btn-light btn-small" onclick="openManualItemEditor(${idx})">Edytuj</button><button class="btn btn-danger btn-small" onclick="deleteManualDraftItem(${idx})">Usuń</button></div></div>`).join(''):'<div class="manual-empty">Nie dodano jeszcze żadnego frontu.</div>';
}
function openManualItemEditor(index=null){
  const item=index===null?null:(window.manualDraftItems||[])[index];
  setSelectOptions('manual-item-profile',FRONT_PROFILES,item?.profile_code||FRONT_PROFILES[0]);setSelectOptions('manual-item-finish',FRONT_FINISHES,item?.finish||FRONT_FINISHES[0]);setSelectOptions('manual-item-fill',FRONT_FILLS,item?.filling||'BEZ SZKŁA');
  el('manual-item-index').value=index===null?'':String(index);el('manual-item-title').textContent=item?'Edytuj front':'Dodaj front';el('manual-item-name').value=item?.item_name||'';el('manual-item-qty').value=item?.quantity||1;el('manual-item-position').value=item?.position||((window.manualDraftItems||[]).length+1);el('manual-item-height').value=item?.height_mm||'';el('manual-item-width').value=item?.width_mm||'';
  el('manual-hinges-type').value=item?.hinges_type||'Brak';el('manual-hinge-side').value=item?.hinge_side||'Lewa';el('manual-hinge-brand').value=item?.hinge_brand||'Blum';el('manual-hinge-qty').value=item?.hinge_quantity||2;el('manual-hinge-mode').value=item?.hinge_positions?.mode||'symetryczne';el('manual-hinge-positions').value=positionsToInput(item?.hinge_positions);
  el('manual-stiffener-type').value=item?.stiffener_type||'Brak';el('manual-stiffener-qty').value=item?.stiffener_quantity||1;el('manual-stiffener-mode').value=item?.stiffener_positions?.mode||'symetryczne';el('manual-stiffener-positions').value=positionsToInput(item?.stiffener_positions);el('manual-item-notes').value=item?.customer_notes||'';
  refreshManualEditorVisibility();el('manual-item-modal').classList.add('open');document.body.classList.add('modal-open');
}
function closeManualItemEditor(){el('manual-item-modal')?.classList.remove('open');document.body.classList.remove('modal-open')}
function refreshManualEditorVisibility(){
  const h=el('manual-hinges-type')?.value!=='Brak';document.querySelectorAll('.manual-hinge-field').forEach(x=>x.style.display=h?'':'none');document.querySelectorAll('.manual-hinge-positions').forEach(x=>x.style.display=h&&el('manual-hinge-mode').value==='wlasne'?'':'none');
  const st=el('manual-stiffener-type')?.value!=='Brak';document.querySelectorAll('.manual-stiffener-field').forEach(x=>x.style.display=st?'':'none');document.querySelectorAll('.manual-stiffener-positions').forEach(x=>x.style.display=st&&el('manual-stiffener-mode').value==='wlasne'?'':'none');
}
function saveManualDraftItem(){
  const index=el('manual-item-index').value;const q=Number(el('manual-item-qty').value),h=Number(el('manual-item-height').value),w=Number(el('manual-item-width').value),pos=Number(el('manual-item-position').value);if(!q||!h||!w||!pos){showMsg('Uzupełnij pozycję, ilość i wymiary frontu.','error');return}
  const ht=el('manual-hinges-type').value,st=el('manual-stiffener-type').value;
  const item={position:pos,item_name:el('manual-item-name').value.trim()||null,quantity:q,height_mm:h,width_mm:w,profile_code:el('manual-item-profile').value,finish:el('manual-item-finish').value,filling:el('manual-item-fill').value,hinges_type:ht,hinge_side:ht==='Brak'?null:el('manual-hinge-side').value,hinge_brand:ht==='Otwory + zawiasy'?el('manual-hinge-brand').value:null,hinge_quantity:ht==='Brak'?null:Number(el('manual-hinge-qty').value||0)||null,hinge_positions:ht==='Brak'?null:inputToPositions(el('manual-hinge-positions').value,el('manual-hinge-mode').value),stiffener_type:st,stiffener_quantity:st==='Brak'?null:Number(el('manual-stiffener-qty').value||0)||null,stiffener_positions:st==='Brak'?null:inputToPositions(el('manual-stiffener-positions').value,el('manual-stiffener-mode').value),customer_notes:el('manual-item-notes').value.trim()||null,margin_percent:40};
  if(index==='')window.manualDraftItems.push(item);else window.manualDraftItems[Number(index)]=item;closeManualItemEditor();renderManualDraftItems();
}
function deleteManualDraftItem(index){window.manualDraftItems.splice(index,1);window.manualDraftItems.forEach((x,i)=>x.position=i+1);renderManualDraftItems()}
async function createManualQuote(btn){
  const name=el('manual-name').value.trim();if(!name){showMsg('Podaj imię i nazwisko klienta.','error');return}if(!(window.manualDraftItems||[]).length){showMsg('Dodaj co najmniej jeden front.','error');return}
  if(btn){btn.disabled=true;btn.textContent='Tworzenie...'}
  try{
    const customer={name,company_name:el('manual-company').value.trim()||null,email:el('manual-email').value.trim()||null,phone:el('manual-phone').value.trim()||null,nip:el('manual-nip').value.trim()||null,address:el('manual-address').value.trim()||null,zip:el('manual-zip').value.trim()||null,city:el('manual-city').value.trim()||null};
    const {data,error}=await sb.rpc('create_manual_quote_request',{p_customer:customer,p_items:window.manualDraftItems,p_notes:el('manual-notes').value.trim()||null,p_source:el('manual-source').value,p_status:el('manual-status').value});if(error)throw error;
    const result=Array.isArray(data)?data[0]:data;location.href=`quote.html?id=${result.request_id}`;
  }catch(e){showMsg(e.message||String(e),'error')}finally{if(btn){btn.disabled=false;btn.textContent='Utwórz wycenę'}}
}
