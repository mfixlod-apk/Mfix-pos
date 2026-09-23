(()=>{
  if(window.__MFIX_YI_PAYLOAD_VALIDATOR_121__) return;
  window.__MFIX_YI_PAYLOAD_VALIDATOR_121__=1;
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const money=n=>Number.isFinite(n)?n.toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
  const first=(o,keys,def='')=>{for(const k of keys){const v=o?.[k];if(v!=null&&String(v).trim()!=='')return v}return def};
  function validate(){
    const cart=Array.isArray(window.STATE&&STATE.cart)?STATE.cart:[];
    const issues=[];const items=[];let total=0;
    if(!cart.length) issues.push('העגלה ריקה');
    cart.forEach((p,i)=>{
      const name=String(first(p,['name','Name','title'],'')).trim();
      const qty=Number(first(p,['qty','quantity','Qty'],''));
      const price=Number(first(p,['price','unitPrice','unit_price','Price'],''));
      const sku=String(first(p,['sku','SKU','barcode','Barcode','catalogNumber','CatalogNumber'],'')).trim();
      if(!name) issues.push('פריט '+(i+1)+': חסר שם מוצר');
      if(!Number.isFinite(qty)||qty<=0) issues.push((name||'פריט '+(i+1))+': כמות לא תקינה');
      if(!Number.isFinite(price)||price<0) issues.push((name||'פריט '+(i+1))+': מחיר לא תקין');
      if(Number.isFinite(qty)&&qty>0&&Number.isFinite(price)&&price>=0){
        const line=qty*price;
        if(!Number.isFinite(line)||line<0) issues.push((name||'פריט '+(i+1))+': סכום שורה לא תקין');
        else{total+=line;items.push({name,quantity:qty,unitPrice:price,lineTotal:line,...(sku?{sku}: {})});}
      }
    });
    if(!Number.isFinite(total)||total<0) issues.push('סה״כ העסקה אינו תקין');
    const customerName=String(window.STATE&&STATE.docCustomerName||'').trim();
    const customerPhone=String(window.STATE&&STATE.docCustomerPhone||'').trim();
    const payload={items,total,currency:'ILS',customer:customerName||customerPhone?{name:customerName,phone:customerPhone}:null,source:'MFIX POS'};
    return {ok:issues.length===0,issues,count:cart.length,customerName,customerPhone,total,items,payload};
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
  function publish(){
    const r=validate();
    if(r.ok){window.mfixYeshInvoicePayload=r.payload;window.dispatchEvent(new CustomEvent('mfix:yesh-invoice-payload',{detail:r.payload}));}
    else delete window.mfixYeshInvoicePayload;
    return r;
  }
  document.addEventListener('click',e=>{
    const target=e.target?.closest?.('button,a,[role="button"]');
    if(!target||!isYeshTarget(target))return;
    const r=publish();
    if(!r.ok){e.preventDefault();e.stopImmediatePropagation();showIssues(r);}
  },true);
  function render(){
    const r=publish();
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
      box.innerHTML='<div style="font-weight:900;margin-bottom:7px">'+title+'</div><div style="color:#16a34a;font-size:12px">✓ הנתונים הבסיסיים תקינים · '+r.count+' פריטים · סה״כ '+money(r.total)+' ₪'+(r.customerName?' · לקוח: '+esc(r.customerName):'')+'</div><div style="margin-top:5px;color:#64748b;font-size:11px">נבנה payload מקומי עבור החיבור הקיים. שליחה ליש חשבונית מתבצעת רק אם מחבר חיצוני מאושר צורך אותו.</div><button type="button" id="mfix-yi-payload-check" style="margin-top:8px;width:100%;padding:9px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:900">בדוק שוב</button>';
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
