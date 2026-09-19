/* MFIX inventory serial/IMEI viewer. Read-only view of serialized inventory. */
(function(){
  'use strict';
  const ID='mfix-serial-imei-viewer-v1';
  function esc(v){return String(v==null?'':v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
  function show(){
    const state=window.STATE;
    if(!state || !Array.isArray(state.products)){
      if(typeof window.toast==='function') window.toast('המלאי אינו זמין','err');
      return;
    }
    const rows=[];
    state.products.forEach(p=>{
      if(!p || !p.trackSerial) return;
      const items=Array.isArray(p.imeis)?p.imeis:[];
      items.forEach(item=>{
        const value=typeof item==='string'?item:(item?.value||item?.imei||item?.serial||'');
        if(!value) return;
        rows.push({name:p.name||'',sku:p.sku||'',type:String(p.serialType||'IMEI/Serial'),value,status:typeof item==='string'?'available':(item?.status||'available')});
      });
    });
    const old=document.getElementById(ID); if(old) old.remove();
    const wrap=document.createElement('div'); wrap.id=ID; wrap.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
    const box=document.createElement('div'); box.style.cssText='background:#fff;color:#111;width:min(900px,96vw);max-height:90vh;overflow:auto;border-radius:12px;padding:18px;';
    box.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h3 style="margin:0">📱 IMEI / Serial</h3><button id="mfix-serial-close" type="button">✕</button></div>';
    const body=document.createElement('div'); body.style.marginTop='14px';
    if(!rows.length){body.innerHTML='<div style="padding:24px;text-align:center">לא נמצאו רשומות IMEI/Serial.</div>';}
    else {body.innerHTML='<table style="width:100%;border-collapse:collapse"><thead><tr><th>מוצר</th><th>מק״ט</th><th>סוג</th><th>IMEI/Serial</th><th>סטטוס</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(r.name)+'</td><td>'+esc(r.sku)+'</td><td>'+esc(r.type)+'</td><td>'+esc(r.value)+'</td><td>'+esc(r.status)+'</td></tr>').join('')+'</tbody></table>'+'<div style="margin-top:10px;font-size:13px">סה״כ רשומות: '+rows.length+'</div>';}
    box.appendChild(body); wrap.appendChild(box); document.body.appendChild(wrap);
    box.querySelector('#mfix-serial-close').onclick=()=>wrap.remove();
    wrap.addEventListener('click',e=>{if(e.target===wrap) wrap.remove();});
  }
  function install(){
    if(document.getElementById(ID)) return;
    const active=document.querySelector('.view.active');
    if(!active || !/מלאי|מוצרים/.test(active.innerText||'')) return;
    const btn=document.createElement('button'); btn.id=ID;btn.className='btn btn-outline';btn.type='button';btn.textContent='📱 IMEI / Serial';btn.onclick=show;
    const buttons=[...active.querySelectorAll('button')];
    const anchor=buttons.find(b=>/ייצוא IMEI|היסטוריה|ייצוא|ייבוא/.test(b.textContent||''));
    if(anchor&&anchor.parentElement) anchor.parentElement.appendChild(btn); else active.insertBefore(btn,active.firstChild);
  }
  setInterval(install,800); window.mfixViewSerialImei=show;
})();
