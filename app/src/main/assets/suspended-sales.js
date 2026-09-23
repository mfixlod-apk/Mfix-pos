/* MFIX POS suspended sales: hold/resume a cart without changing checkout completion logic. */
(function(){
  'use strict';
  if(window.__mfixSuspendedSalesV1)return;
  window.__mfixSuspendedSalesV1=true;
  const KEY='mfix_held_sales_v1';
  const load=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(_){return[]}};
  const save=v=>{try{localStorage.setItem(KEY,JSON.stringify(v));return true}catch(_){return false}};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>'₪'+Number(v||0).toFixed(2);
  function total(cart){return (cart||[]).reduce((s,p)=>s+Number(p?.lineTotal??p?.total??((Number(p?.price??p?.unitPrice)||0)*(Number(p?.qty)||1))),0);}
  function persistState(){try{if(typeof window.saveState==='function')window.saveState();else localStorage.setItem('mfix_state',JSON.stringify(window.STATE));}catch(_){} if(typeof window.render==='function')window.render();}
  function hold(){
    const cart=Array.isArray(window.STATE?.cart)?window.STATE.cart:[];
    if(!cart.length){window.toast?.('הסל ריק — אין מה להשהות','err');return;}
    const name=window.prompt('שם למכירה המושהית (אופציונלי):','');
    const rows=load();
    rows.unshift({id:'H'+Date.now(),name:String(name||'').trim(),at:new Date().toISOString(),cart:JSON.parse(JSON.stringify(cart)),customer:window.STATE.customer||null,payment:window.STATE.currentPayment||null});
    if(!save(rows)){window.toast?.('לא ניתן לשמור את המכירה המושהית','err');return;}
    window.STATE.cart=[];window.STATE.customer=null;window.STATE.currentPayment=null;
    try{localStorage.removeItem('mfix_current_payment_v1')}catch(_){}
    persistState();window.toast?.('המכירה הושהתה','ok');
  }
  function resume(){
    const rows=load();
    if(!rows.length){window.toast?.('אין מכירות מושהות','err');return;}
    const body=rows.map((s,i)=>`<div class="card" style="margin-bottom:8px"><b>${esc(s.name||('מכירה '+s.id))}</b><div class="muted" style="font-size:12px">${(s.cart||[]).length} פריטים · ${money(total(s.cart))} · ${esc(s.at?new Date(s.at).toLocaleString('he-IL'):'')}</div><div style="margin-top:7px"><button type="button" class="btn btn-primary" data-mfix-resume="${i}">▶ המשך</button> <button type="button" class="btn btn-ghost" data-mfix-delete="${i}">🗑 מחק</button></div></div>`).join('');
    if(typeof window.openModal!=='function'){alert(rows.map((s,i)=>`${i+1}. ${s.name||('מכירה '+s.id)} — ${money(total(s.cart))}`).join('\n'));return;}
    window.openModal(`<div class="modal wide"><div class="modal-head"><h3>מכירות מושהות</h3><button class="modal-close" onclick="closeModal()">×</button></div><div class="modal-body">${body}</div></div>`);
    document.querySelectorAll('[data-mfix-resume]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.mfixResume),a=load(),s=a[i];if(!s)return;window.STATE.cart=Array.isArray(s.cart)?s.cart:[];window.STATE.customer=s.customer||null;window.STATE.currentPayment=s.payment||null;a.splice(i,1);save(a);window.closeModal?.();persistState();window.toast?.('המכירה חזרה לקופה','ok');});
    document.querySelectorAll('[data-mfix-delete]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.mfixDelete),a=load();a.splice(i,1);save(a);window.closeModal?.();resume();});
  }
  function install(){
    const v=document.getElementById('view-pos');
    if(!v||v.querySelector('[data-mfix-suspended-sales]'))return;
    const host=v.querySelector('#cartTotals')||v.querySelector('.mfix-checkout-controls')||v;
    const wrap=document.createElement('div');wrap.dataset.mfixSuspendedSales='1';wrap.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px 0';
    const h=document.createElement('button');h.type='button';h.className='btn btn-outline';h.textContent='⏸ השהה מכירה';h.onclick=hold;
    const r=document.createElement('button');r.type='button';r.className='btn btn-ghost';r.textContent='▶ מכירות מושהות';r.onclick=resume;
    wrap.append(h,r);host.insertBefore(wrap,host.firstChild);
  }
  let tries=0;const loop=()=>{install();if(tries++<120)setTimeout(loop,500)};loop();
  window.mfixSuspendedSales={hold,resume,load};
})();
