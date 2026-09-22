/* MFIX inventory serial/IMEI viewer. Read-only view of serialized inventory. */
(function(){
  'use strict';
  const ID='mfix-serial-imei-viewer-v2';
  const BTN_ID=ID+'-button';
  function esc(v){return String(v==null?'':v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
  function collect(){
    const state=window.STATE;
    if(!state || !Array.isArray(state.products)) return null;
    const rows=[];
    state.products.forEach(p=>{
      if(!p || !p.trackSerial) return;
      const items=[];
      if(Array.isArray(p.imeis)) items.push(...p.imeis);
      if(Array.isArray(p.serials)) items.push(...p.serials);
      items.forEach(item=>{
        const value=typeof item==='string'?item:(item?.value||item?.imei||item?.serial||'');
        if(!value) return;
        rows.push({name:p.name||'',sku:p.sku||'',type:String(p.serialType||'IMEI/Serial'),value,status:typeof item==='string'?'available':(item?.status||'available')});
      });
    });
    return rows;
  }
  function show(){
    const rows=collect();
    if(rows===null){
      if(typeof window.toast==='function') window.toast('המלאי אינו זמין','err');
      return;
    }
    document.getElementById(ID)?.remove();
    const wrap=document.createElement('div'); wrap.id=ID; wrap.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
    const box=document.createElement('div'); box.style.cssText='background:#fff;color:#111;width:min(900px,96vw);max-height:90vh;overflow:auto;border-radius:12px;padding:18px;';
    box.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h3 style="margin:0">📱 IMEI / Serial</h3><button id="mfix-serial-close" type="button">✕</button></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><input id="mfix-serial-search" type="search" placeholder="חיפוש מוצר / מק״ט / IMEI / Serial" style="flex:1;min-width:240px;padding:9px;border:1px solid #ccc;border-radius:8px"><select id="mfix-serial-status" style="padding:9px;border:1px solid #ccc;border-radius:8px"><option value="">כל הסטטוסים</option></select></div>';
    const body=document.createElement('div'); body.style.marginTop='14px'; box.appendChild(body); wrap.appendChild(box); document.body.appendChild(wrap);
    const statuses=[...new Set(rows.map(r=>r.status).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    const statusSelect=box.querySelector('#mfix-serial-status'); statuses.forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;statusSelect.appendChild(o);});
    function render(){
      const q=String(box.querySelector('#mfix-serial-search').value||'').trim().toLowerCase();
      const status=statusSelect.value;
      const filtered=rows.filter(r=>{const hay=[r.name,r.sku,r.type,r.value,r.status].join(' ').toLowerCase();return(!q||hay.includes(q))&&(!status||r.status===status);});
      if(!filtered.length){body.innerHTML='<div style="padding:24px;text-align:center">לא נמצאו רשומות תואמות.</div>';return;}
      body.innerHTML='<table style="width:100%;border-collapse:collapse"><thead><tr><th>מוצר</th><th>מק״ט</th><th>סוג</th><th>IMEI/Serial</th><th>סטטוס</th></tr></thead><tbody>'+filtered.map(r=>'<tr><td>'+esc(r.name)+'</td><td>'+esc(r.sku)+'</td><td>'+esc(r.type)+'</td><td>'+esc(r.value)+'</td><td>'+esc(r.status)+'</td></tr>').join('')+'</tbody></table><div style="margin-top:10px;font-size:13px">מציג '+filtered.length+' מתוך '+rows.length+' רשומות</div>';
    }
    box.querySelector('#mfix-serial-search').addEventListener('input',render); statusSelect.addEventListener('change',render); render();
    box.querySelector('#mfix-serial-close').onclick=()=>wrap.remove(); wrap.addEventListener('click',e=>{if(e.target===wrap) wrap.remove();});
  }
  function install(){
    const active=document.querySelector('.view.active');
    if(!active || !/מלאי|מוצרים/.test(active.innerText||'')) return;
    if(active.querySelector('#'+BTN_ID)) return;
    const btn=document.createElement('button'); btn.id=BTN_ID;btn.className='btn btn-outline';btn.type='button';btn.textContent='📱 IMEI / Serial';btn.onclick=show;
    const buttons=[...active.querySelectorAll('button')];
    const anchor=buttons.find(b=>/ייצוא IMEI|היסטוריה|ייצוא|ייבוא/.test(b.textContent||''));
    if(anchor&&anchor.parentElement) anchor.parentElement.appendChild(btn); else active.insertBefore(btn,active.firstChild);
  }
  setInterval(install,800); window.mfixViewSerialImei=show;
})();
