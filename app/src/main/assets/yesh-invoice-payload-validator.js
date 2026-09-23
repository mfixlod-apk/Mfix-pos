(()=>{
  if(window.__MFIX_YI_PAYLOAD_VALIDATOR_122__) return;
  window.__MFIX_YI_PAYLOAD_VALIDATOR_122__=1;
  const OUTBOX_KEY='mfix_yesh_invoice_outbox_v1';
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const money=n=>Number.isFinite(n)?n.toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
  const first=(o,keys,def='')=>{for(const k of keys){const v=o?.[k];if(v!=null&&String(v).trim()!=='')return v}return def};
  function readOutbox(){
    try{const v=JSON.parse(localStorage.getItem(OUTBOX_KEY)||'[]');return Array.isArray(v)?v:[];}catch(_){return [];}
  }
  function writeOutbox(list){
    const safe=Array.isArray(list)?list.slice(-100):[];
    try{localStorage.setItem(OUTBOX_KEY,JSON.stringify(safe));}catch(_){throw new Error('לא ניתן לשמור תור יש חשבונית במכשיר');}
    return safe;
  }
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
  function enqueue(payload){
    if(!payload||!Array.isArray(payload.items)||!Number.isFinite(Number(payload.total))) throw new Error('payload לא תקין');
    const entry={id:'yi_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),createdAt:new Date().toISOString(),status:'pending',attempts:0,lastError:'',payload:JSON.parse(JSON.stringify(payload))};
    const list=writeOutbox(readOutbox().concat(entry));
    window.dispatchEvent(new CustomEvent('mfix:yesh-invoice-outbox',{detail:{type:'queued',entry}}));
    return entry;
  }
  function remove(id){
    const list=writeOutbox(readOutbox().filter(x=>x&&x.id!==id));
    window.dispatchEvent(new CustomEvent('mfix:yesh-invoice-outbox',{detail:{type:'removed',id}}));
    return list;
  }
  function markAttempt(id,error){
    const list=readOutbox();const item=list.find(x=>x&&x.id===id);
    if(!item)return null;
    item.attempts=Number(item.attempts||0)+1;item.lastAttemptAt=new Date().toISOString();item.lastError=String(error||'');
    writeOutbox(list);window.dispatchEvent(new CustomEvent('mfix:yesh-invoice-outbox',{detail:{type:'attempt',entry:item}}));return item;
  }
  window.mfixYeshInvoiceOutbox={list:readOutbox,enqueue,remove,markAttempt,count:()=>readOutbox().length};
  document.addEventListener('click',e=>{
    const target=e.target?.closest?.('button,a,[role="button"]');
    if(!target||!isYeshTarget(target))return;
    const r=publish();
    if(!r.ok){e.preventDefault();e.stopImmediatePropagation();showIssues(r);return;}
    try{
      const entry=enqueue(r.payload);
      target.dataset.mfixYeshOutboxId=entry.id;
      try{if(typeof window.toast==='function')window.toast('הנתונים נשמרו בתור יש חשבונית להעברה','ok');}catch(_){}
    }catch(err){e.preventDefault();e.stopImmediatePropagation();showIssues({issues:[err.message||'לא ניתן לשמור את נתוני העסקה']});}
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
    const pending=readOutbox();
    const title='🧾 בדיקת נתוני העברה ליש חשבונית';
    const queueHtml='<div style="margin-top:6px;color:#64748b;font-size:11px">בתור להעברה: '+pending.length+'</div>';
    if(r.ok){
      box.innerHTML='<div style="font-weight:900;margin-bottom:7px">'+title+'</div><div style="color:#16a34a;font-size:12px">✓ הנתונים הבסיסיים תקינים · '+r.count+' פריטים · סה״כ '+money(r.total)+' ₪'+(r.customerName?' · לקוח: '+esc(r.customerName):'')+'</div><div style="margin-top:5px;color:#64748b;font-size:11px">המערכת שומרת payload מאומת בתור מקומי. אין כאן טענה שהמסמך נשלח ליש חשבונית.</div>'+queueHtml+'<button type="button" id="mfix-yi-payload-check" style="margin-top:8px;width:100%;padding:9px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:900">בדוק שוב</button>';
    }else{
      box.innerHTML='<div style="font-weight:900;margin-bottom:7px">'+title+'</div><div style="color:#dc2626;font-size:12px">✕ '+r.issues.map(esc).join('<br>')+'</div>'+queueHtml+'<button type="button" id="mfix-yi-payload-check" style="margin-top:8px;width:100%;padding:9px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:900">בדוק שוב</button>';
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
