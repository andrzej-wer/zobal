const cfg = window.APP_CONFIG || {};
const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('WSTAW_') && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes('WSTAW_');
const sb = configured ? supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

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
  el('items-body').innerHTML=window.quoteItems.map(i=>`<tr><td>${i.position}</td><td style="min-width:420px">${renderItemDetails(i)}</td><td>${i.height_mm||'—'} × ${i.width_mm||'—'}</td><td>${i.quantity}</td><td><input type="number" step="0.01" value="${i.sale_unit_net||''}" data-item="${i.id}" class="price-input"></td><td>${money((i.sale_unit_net||0)*(i.quantity||0))}</td></tr>`).join('');
  el('zobal-list').innerHTML=window.zobals.map(z=>`<div class="doc-row internal"><div><strong>${escHtml(z.zobal_number)}</strong><br><span class="muted">${fmtDate(z.calculation_date||z.created_at)} · ${z.purchase_net?money(z.purchase_net)+' netto':'bez kwoty'}</span></div><div>${z.document_path?`<button class="btn btn-light" onclick="openPrivateFile('zobal-internal','${z.document_path}')">Otwórz PDF</button>`:''}</div></div>`).join('')||'<p class="muted">Brak kalkulacji Zobal.</p>';
  el('client-docs').innerHTML=window.clientQuotes.map(q=>`<div class="doc-row client"><div><strong>${escHtml(q.quote_number)}/V${q.version}</strong><br><span class="muted">${money(q.gross_total)} brutto · ${escHtml(q.status)}</span></div><div>${q.client_pdf_path?`<button class="btn btn-light" onclick="openPrivateFile('client-documents','${q.client_pdf_path}')">Otwórz PDF</button>`:''}</div></div>`).join('')||'<p class="muted">Brak dokumentów dla klienta.</p>';
}
async function saveQuote(){
  const prices=[...document.querySelectorAll('.price-input')];
  const updates=prices.map(x=>sb.from('quote_items').update({sale_unit_net:Number(x.value||0)}).eq('id',x.dataset.item));
  updates.push(sb.from('quote_requests').update({status:el('status').value,internal_notes:el('notes').value,updated_at:new Date().toISOString()}).eq('id',window.requestId));
  const results=await Promise.all(updates); const err=results.find(x=>x.error)?.error;
  if(err){showMsg(err.message,'error');return}showMsg('Zapisano zmiany.','success');await loadQuote();
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
