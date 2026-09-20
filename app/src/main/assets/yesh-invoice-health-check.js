(()=>{
  if(window.__MFIX_YI_HEALTH_CHECK_170__) return;
  window.__MFIX_YI_HEALTH_CHECK_170__=1;

  const send=(m)=>new Promise(resolve=>{
    try{
      chrome.runtime.sendMessage(m,res=>resolve(chrome.runtime.lastError?{ok:false,error:chrome.runtime.lastError.message}:res));
    }catch(e){ resolve({ok:false,error:String(e)}) }
  });

  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  async function health(){
    const status=document.getElementById('mfix-yi-health-status-170');
    if(status) status.textContent='בודק חיבור ליש חשבונית…';

    const r=await send({type:'MFIX_SEARCH',q:''});
    if(!r?.ok){
      const msg=r?.setup?'פתח את יש חשבונית והתחבר כדי ללמד את החיבור':(r?.error||('HTTP '+(r?.status||'unknown')));
      if(status) status.innerHTML='<span style="color:#dc2626">✕ '+esc(msg)+'</span>';
      return;
    }

    let count=null;
    try{
      const root=typeof r.text==='string'?JSON.parse(r.text):r.text;
      const walk=v=>{
        if(!v||typeof v!=='object')return;
        if(Array.isArray(v)){ if(v.length && v.some(x=>x&&typeof x==='object'&&('ID' in x||'Name' in x||'Barcode' in x))) {count=Math.max(count||0,v.length)}; v.forEach(walk); }
        else Object.values(v).forEach(walk);
      };
      walk(root);
    }catch(_){}

    if(status) status.innerHTML='<span style="color:#16a34a">✓ החיבור פעיל'+(count!=null?' · התקבלה תשובת מלאי ('+count+' פריטים)':' · התקבלה תשובה מהשרת')+'</span>';
  }

  function inject(){
    const settings=document.getElementById('mfix-pos-settings-800');
    if(!settings || settings.querySelector('#mfix-yi-health-170')) return;

    const box=document.createElement('div');
    box.id='mfix-yi-health-170';
    box.style.cssText='margin-top:10px;padding:11px;border:1px solid #dbe4f0;border-radius:10px;background:#f8fafc;direction:rtl';
    box.innerHTML='<div style="font-weight:900;margin-bottom:7px">🧾 יש חשבונית — בדיקת חיבור</div><button id="mfix-yi-health-btn-170" type="button" style="width:100%;padding:10px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:900">בדוק עכשיו</button><div id="mfix-yi-health-status-170" style="margin-top:8px;font-size:12px;color:#64748b;min-height:18px">לא בוצעה בדיקה</div>';
    settings.appendChild(box);
    box.querySelector('#mfix-yi-health-btn-170').onclick=()=>health().catch(e=>{
      const s=document.getElementById('mfix-yi-health-status-170');
      if(s) s.innerHTML='<span style="color:#dc2626">✕ '+esc(e)+'</span>';
    });
  }

  new MutationObserver(inject).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(inject,1200);
})();
