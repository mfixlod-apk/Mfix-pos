(()=>{
  if(window.__MFIX_YI_HEALTH_CHECK_171__) return;
  window.__MFIX_YI_HEALTH_CHECK_171__=1;

  const send=(m)=>new Promise(resolve=>{
    try{chrome.runtime.sendMessage(m,res=>resolve(chrome.runtime.lastError?{ok:false,error:chrome.runtime.lastError.message}:res));}
    catch(e){resolve({ok:false,error:String(e)})}
  });
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const statusText=s=>s===401||s===403?'השרת החזיר הרשאת גישה — צריך להתחבר מחדש ליש חשבונית':s===404?'הנתיב שנלמד לא נמצא בשרת':s>=500?'יש חשבונית החזיר שגיאת שרת ('+s+')':'HTTP '+s;
  function countProducts(value){
    let best=null;
    const walk=v=>{
      if(!v||typeof v!=='object')return;
      if(Array.isArray(v)){
        const n=v.filter(x=>x&&typeof x==='object'&&('ID' in x||'Id' in x||'id' in x||'Name' in x||'name' in x||'Barcode' in x||'barcode' in x||'CatalogNumber' in x||'catalogNumber' in x)).length;
        if(n)best=Math.max(best||0,n);
        v.forEach(walk);
      }else Object.values(v).forEach(walk);
    };
    try{walk(typeof value==='string'?JSON.parse(value):value)}catch(_){return null}
    return best;
  }
  async function health(){
    const status=document.getElementById('mfix-yi-health-status-171');
    const detail=document.getElementById('mfix-yi-health-detail-171');
    const btn=document.getElementById('mfix-yi-health-btn-171');
    if(status)status.innerHTML='<span style="color:#d97706">⏳ בודק את חיבור יש חשבונית…</span>';
    if(detail)detail.textContent='שולח בקשת בדיקה דרך המנגנון הקיים של MFIX';
    if(btn)btn.disabled=true;
    try{
      const started=Date.now();
      const r=await send({type:'MFIX_SEARCH',q:''});
      const elapsed=Date.now()-started;
      if(!r?.ok){
        const code=Number(r?.status||0);
        const msg=r?.setup?'אין עדיין תבנית בקשה מאומתת. פתח את יש חשבונית והתחבר כדי ללמד את החיבור.':(code?statusText(code):(r?.error||'לא התקבלה תשובה מהמנגנון'));
        if(status)status.innerHTML='<span style="color:#dc2626">✕ '+esc(msg)+'</span>';
        if(detail)detail.textContent=code?'קוד HTTP: '+code+' · '+elapsed+'ms':'החיבור לא אושר';
        return;
      }
      const raw=typeof r.text==='string'?r.text:r.text;
      const count=countProducts(raw);
      const empty=raw==null||(typeof raw==='string'&&!raw.trim());
      if(empty){
        if(status)status.innerHTML='<span style="color:#d97706">⚠ השרת נגיש, אבל לא התקבל גוף תשובה.</span>';
        if(detail)detail.textContent='HTTP '+Number(r.status||200)+' · '+elapsed+'ms';
        return;
      }
      if(status)status.innerHTML='<span style="color:#16a34a">✓ התקבלה תשובה אמיתית מיש חשבונית</span>';
      if(detail){
        const p=['HTTP '+Number(r.status||200),elapsed+'ms'];
        if(count!=null)p.push(count+' רשומות מוצר/מלאי זוהו');
        detail.textContent=p.join(' · ');
      }
    }catch(e){
      if(status)status.innerHTML='<span style="color:#dc2626">✕ '+esc(e)+'</span>';
      if(detail)detail.textContent='הבדיקה הסתיימה בשגיאה';
    }finally{if(btn)btn.disabled=false}
  }
  function inject(){
    const settings=document.getElementById('mfix-pos-settings-800');
    if(!settings||settings.querySelector('#mfix-yi-health-171'))return;
    const box=document.createElement('div');
    box.id='mfix-yi-health-171';
    box.style.cssText='margin-top:10px;padding:11px;border:1px solid #dbe4f0;border-radius:10px;background:#f8fafc;direction:rtl';
    box.innerHTML='<div style="font-weight:900;margin-bottom:7px">🧾 יש חשבונית — בדיקת חיבור</div><button id="mfix-yi-health-btn-171" type="button" style="width:100%;padding:10px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:900">בדוק עכשיו</button><div id="mfix-yi-health-status-171" style="margin-top:8px;font-size:12px;min-height:18px">לא בוצעה בדיקה</div><div id="mfix-yi-health-detail-171" style="margin-top:4px;font-size:11px;color:#64748b;line-height:1.4">הבדיקה אינה מדמה הצלחה ואינה מפיקה מסמך.</div>';
    settings.appendChild(box);
    box.querySelector('#mfix-yi-health-btn-171').onclick=()=>health();
  }
  new MutationObserver(inject).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(inject,1200);
})();
