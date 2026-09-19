/* MFIX inventory serial/IMEI export. Read-only export of serialized inventory. */
(function(){
  'use strict';
  const ID='mfix-serial-imei-export-v1';
  function esc(v){return '"'+String(v==null?'':'').replace(/"/g,'""')+'"';}
  function download(){
    const state=window.STATE;
    if(!state || !Array.isArray(state.products)){
      if(typeof window.toast==='function') window.toast('המלאי אינו זמין','err');
      return;
    }
    const rows=[['מוצר','מק״ט','סוג','IMEI/Serial','סטטוס']];
    state.products.forEach(p=>{
      if(!p || !p.trackSerial) return;
      const items=Array.isArray(p.imeis)?p.imeis:[];
      if(!items.length) rows.push([p.name||'',p.sku||'','IMEI/Serial','','אין רשומות']);
      items.forEach(item=>{
        const value=typeof item==='string'?item:(item?.value||item?.imei||item?.serial||'');
        const status=typeof item==='string'?'available':(item?.status||'available');
        rows.push([p.name||'',p.sku||'',String(p.serialType||'IMEI/Serial'),value,status]);
      });
    });
    if(rows.length===1){
      if(typeof window.toast==='function') window.toast('לא נמצאו מוצרים סריאליים/IMEI','err');
      return;
    }
    const csv='\ufeff'+rows.map(r=>r.map(esc).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='mfix-serial-imei-'+new Date().toISOString().slice(0,10)+'.csv';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    if(typeof window.toast==='function') window.toast('רשימת IMEI/Serial יוצאה ל-CSV','ok');
  }
  function install(){
    if(document.getElementById(ID)) return;
    const active=document.querySelector('.view.active');
    if(!active || !/מלאי|מוצרים/.test(active.innerText||'')) return;
    const btn=document.createElement('button');
    btn.id=ID;btn.className='btn btn-outline';btn.type='button';
    btn.textContent='📱 ייצוא IMEI / Serial';btn.onclick=download;
    const buttons=[...active.querySelectorAll('button')];
    const anchor=buttons.find(b=>/היסטוריה|ייצוא|ייבוא/.test(b.textContent||''));
    if(anchor&&anchor.parentElement) anchor.parentElement.appendChild(btn); else active.insertBefore(btn,active.firstChild);
  }
  setInterval(install,800);
  window.mfixExportSerialImei=download;
})();
