(()=>{
  if(window.__MFIX_PAYMENT_STATUS_1__)return;
  window.__MFIX_PAYMENT_STATUS_1__=1;
  const ID='mfix-payment-status-card';
  const safety=()=>window.MFIXPaymentSafety||null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>Number(v||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});
  const label=d=>({started:'בתהליך',stale:'דורש בדיקה',"native-success-signal-observed":'אישור זוהה',"native-failure-signal-observed":'כשל/ביטול זוהה'}[d?.status]||String(d?.status||''));
  const tone=d=>d?.status==='started'?'#fff7ed':(d?.status==='stale'?'#fdeaea':'#f1f5ff');
  function pos(){const root=document.getElementById('mfix-pos-800');if(!root)return null;const s=getComputedStyle(root);return s.display==='none'||s.visibility==='hidden'?null:root;}
  function render(){
    const root=pos(), api=safety();
    if(!root||!api)return;
    let d=null;try{d=api.getAttempt()}catch(_){}
    let card=document.getElementById(ID);
    if(!d||!d.status){if(card)card.remove();return;}
    if(!card){card=document.createElement('div');card.id=ID;card.style.cssText='margin:0 0 8px;padding:9px 11px;border:1px solid #e2e7ef;border-radius:10px;font-size:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;direction:rtl';const host=root.querySelector('#mfix-pos-total-800')?.parentElement||root;host.prepend(card)}
    card.style.background=tone(d);
    const canClear=d.status!=='started';
    card.innerHTML='<div><b>סטטוס תשלום: '+esc(label(d))+'</b><div style="color:#6b7686;margin-top:3px">'+esc(d.method||'')+(d.amount?' · '+money(d.amount)+' ₪':'')+(d.updatedAt?' · עודכן '+new Date(d.updatedAt).toLocaleTimeString('he-IL'):'')+'</div></div>'+(canClear?'<button type="button" data-mfix-payment-clear class="btn btn-ghost" style="padding:6px 9px;font-size:11px">נקה סטטוס</button>':'<span style="font-weight:700;color:#946200">יש להמתין לאישור</span>');
    card.querySelector('[data-mfix-payment-clear]')?.addEventListener('click',()=>{try{api.clear();render()}catch(_){}});
  }
  function tick(){try{render()}catch(_){}
  }
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-tab="pos"]'))setTimeout(render,60)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setInterval(tick,1000));else setInterval(tick,1000);
})();
