(()=>{
  if(window.__MFIX_YI_PAYLOAD_VALIDATOR_110__) return;
  window.__MFIX_YI_PAYLOAD_VALIDATOR_110__=1;
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  function validate(){
    const cart=Array.isArray(window.STATE&&STATE.cart)?STATE.cart:[];
    const issues=[];
    if(!cart.length) issues.push('העגלה ריקה');
    cart.forEach((p,i)=>{
      const name=String(p&&p.name||'').trim();
      const qty=Number(p&&p.qty!=null?p.qty:p&&p.quantity);
      const price=Number(p&&p.price);
      if(!name) issues.push('פריט '+(i+1)+': חסר שם מוצר');
      if(!Number.isFinite(qty)||qty<=0) issues.push((name||'פריט '+(i+1))+': כמות לא תקינה');
      if(!Number.isFinite(price)||price<0) issues.push((name||'פריט '+(i+1))+': מחיר לא תקין');
    });
    const customerName=String(window.STATE&&STATE.docCustomerName||'').trim();
    const customerPhone=String(window.STATE&&STATE.docCustomerPhone||'').trim();
    return {ok:issues.length===0,issues,count:cart.length,customerName,customerPhone};
  }
  function showIssues(r){
    const text=r.issues&&r.issues.length?r.issues.join('\n'):'נתוני המכירה אינם תקינים';
    try{if(typeof window.toast==='function'){window.toast(text,'err');return;}}catch(_){}
    try{alert('לא ניתן להעביר ליש חשבונית עדיין:\n\n'+text);}catch(_){}
  }
  function isYeshTarget(el){
    if(!el)return false;
    const text=String(el.innerText||el.textContent||el.getAttribute?.('aria-label')||el.title||'').replace(/\s+/g,' ').trim();
    return /יש\s*חשבונית/i.test(text);
  }
  document.addEventListener('click',e=>{
    const target=e.target?.closest?.('button,a,[role="button"]');
    if(!target||!isYeshTarget(target))return;
    const r=validate();
    if(!r.ok){
      e.preventDefault();
      e.stopImmediatePropagation();
      showIssues(r);
    }
  },true);
  function render(){
    const r=validate();
    let box=document.getElementById('mfix-yi-payload-validation');
    if(!box){
      const settings=document.getElementById('mfix-pos-settings-800');
      if(!settings)return;
      box=document.createElement('div');box.id='mfix-yi-payload-validation';
      box.style.cssText='margin-top:10px;padding:11px;border:1px solid #dbe4f0;border-radius:10px;background:#f8fafc;direction:rtl';
      settings.appendChild(box);
    }
    const title='🧾 בדיקת נתוני העברה ליש חשבונית';
    if(r.ok){
      box.innerHTML='<div style="font-weight:900;margin-bottom:7px">'+title+'</div><div style="color:#16a34a;font-size:12px">✓ הנתונים הבסיסיים תקינים · '+r.count+' פריטים'+(r.customerName?' · לקוח: '+esc(r.customerName):'')+'</div><button type="button" id="mfix-yi-payload-check" style="margin-top:8px;width:100%;padding:9px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:900">בדוק שוב</button>';
    }else{
      box.innerHTML='<div style="font-weight:900;margin-bottom:7px">'+title+'</div><div style="color:#dc2626;font-size:12px">✕ '+r.issues.map(esc).join('<br>')+'</div><button type="button" id="mfix-yi-payload-check" style="margin-top:8px;width:100%;padding:9px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:900">בדוק שוב</button>';
    }
    const btn=document.getElementById('mfix-yi-payload-check');
    if(btn)btn.onclick=render;
  }
  function inject(){
    const settings=document.getElementById('mfix-pos-settings-800');
    if(settings&&!document.getElementById('mfix-yi-payload-validation'))render();
  }
  new MutationObserver(inject).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(inject,1200);
})();
