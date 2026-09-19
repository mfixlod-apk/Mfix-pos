/* MFIX inventory history export enhancement. Injected into the Android/web runtime by CI. */
(function(){
  'use strict';
  const KEY='mfix_inventory_history_export_v1';
  function esc(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}
  function downloadCsv(){
    const state=window.STATE;
    if(!state || !Array.isArray(state.inventoryHistory)){
      if(typeof window.toast==='function') window.toast('היסטוריית מלאי אינה זמינה','err');
      return;
    }
    const products=Array.isArray(state.products)?state.products:[];
    const byId=new Map(products.map(p=>[String(p.id),p]));
    const rows=[['תאריך','מוצר','סוג פעולה','כמות','לפני','אחרי','סיבה']];
    state.inventoryHistory.forEach(h=>{
      const p=byId.get(String(h.productId));
      rows.push([new Date(h.at||Date.now()).toLocaleString('he-IL'),p?.name||h.productId||'',h.type||'',h.qty??'',h.before??'',h.after??'',h.reason||'']);
    });
    const csv='\ufeff'+rows.map(r=>r.map(esc).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='mfix-inventory-history-'+new Date().toISOString().slice(0,10)+'.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    if(typeof window.toast==='function') window.toast('היסטוריית המלאי יוצאה ל-CSV','ok');
  }
  function install(){
    if(document.getElementById(KEY)) return;
    const active=document.querySelector('.view.active');
    if(!active || !/מלאי|מוצרים/.test(active.innerText||'')) return;
    const buttons=[...active.querySelectorAll('button')];
    if(buttons.some(b=>b.dataset.mfixInventoryExport==='1')) return;
    const btn=document.createElement('button');
    btn.id=KEY; btn.dataset.mfixInventoryExport='1';
    btn.className='btn btn-outline';
    btn.textContent='⬇️ ייצוא היסטוריית מלאי';
    btn.onclick=downloadCsv;
    const anchor=buttons.find(b=>/מלאי|ייבוא|ייצוא|היסטוריה/.test(b.textContent||''));
    if(anchor && anchor.parentElement) anchor.parentElement.appendChild(btn);
    else active.insertBefore(btn,active.firstChild);
  }
  setInterval(install,700);
  window.mfixExportInventoryHistory=downloadCsv;
})();
