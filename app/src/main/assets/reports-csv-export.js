/* MFIX reports CSV export enhancement.
 * Exports the currently visible report tables without changing report calculations.
 */
(function(){
  'use strict';
  const KEY='mfix_reports_csv_export_v1';

  function esc(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; }
  function downloadCsv(){
    const active=document.querySelector('.view.active');
    if(!active){ if(typeof window.toast==='function') window.toast('דוח פעיל אינו זמין','err'); return; }
    const tables=[...active.querySelectorAll('table')];
    if(!tables.length){ if(typeof window.toast==='function') window.toast('לא נמצאה טבלת נתונים בדוח הנוכחי','err'); return; }
    const rows=[];
    tables.forEach(table=>{
      [...table.rows].forEach(tr=>rows.push([...tr.cells].map(c=>(c.innerText||'').trim())));
      rows.push([]);
    });
    while(rows.length && rows[rows.length-1].length===0) rows.pop();
    const csv='\ufeff'+rows.map(r=>r.map(esc).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='mfix-report-'+new Date().toISOString().slice(0,10)+'.csv';
    document.body.appendChild(a); a.click(); a.remove();
    const url=a.href;
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    if(typeof window.toast==='function') window.toast('הדוח יוצא ל-CSV','ok');
  }

  function install(){
    const active=document.querySelector('.view.active');
    if(!active || !/דוחות|דוח|reports/i.test(active.innerText||'')) return;
    if(document.getElementById(KEY)) return;
    const btn=document.createElement('button');
    btn.id=KEY;
    btn.className='btn btn-outline';
    btn.textContent='⬇️ ייצוא דוח ל-CSV';
    btn.onclick=downloadCsv;
    const tables=active.querySelectorAll('table');
    const anchor=active.querySelector('button');
    if(anchor && anchor.parentElement) anchor.parentElement.appendChild(btn);
    else if(tables[0] && tables[0].parentElement) tables[0].parentElement.insertBefore(btn,tables[0]);
    else active.insertBefore(btn,active.firstChild);
  }

  setInterval(install,700);
  window.mfixExportCurrentReportCsv=downloadCsv;
})();
