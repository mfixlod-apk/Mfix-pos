/* MFIX reports local-date CSV export.
 * Keeps the export usable in the device's local calendar instead of UTC.
 * It exports the currently visible report tables and adds the report title
 * when one is available. It does not alter report calculations.
 */
(function(){
  'use strict';
  const ID='mfix-reports-local-csv-export-v1';

  function pad(n){return String(n).padStart(2,'0');}
  function localDate(){
    const d=new Date();
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  }
  function esc(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}

  function exportVisibleReport(){
    const active=document.querySelector('.view.active');
    if(!active){ if(typeof window.toast==='function') window.toast('דוח פעיל אינו זמין','err'); return; }
    const tables=[...active.querySelectorAll('table')];
    if(!tables.length){ if(typeof window.toast==='function') window.toast('לא נמצאה טבלת נתונים בדוח הנוכחי','err'); return; }

    const rows=[];
    const heading=(active.querySelector('h1,h2,h3,h4,.section-title,.view-title')?.innerText||'דוח MFIX').trim();
    rows.push([heading]);
    rows.push(['תאריך ייצוא',localDate()]);
    rows.push([]);

    tables.forEach((table,index)=>{
      const caption=table.querySelector('caption')?.innerText?.trim();
      if(caption) rows.push([caption]);
      [...table.rows].forEach(tr=>rows.push([...tr.cells].map(c=>(c.innerText||'').trim())));
      if(index<tables.length-1) rows.push([]);
    });

    const csv='\ufeff'+rows.map(r=>r.map(esc).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='mfix-report-'+localDate()+'.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    if(typeof window.toast==='function') window.toast('הדוח יוצא ל-CSV עם תאריך מקומי ✓','ok');
  }

  function install(){
    const active=document.querySelector('.view.active');
    if(!active || !/דוחות|דוח|reports/i.test(active.innerText||'')) return;
    if(document.getElementById(ID)) return;
    const btn=document.createElement('button');
    btn.id=ID;
    btn.className='btn btn-outline';
    btn.textContent='⬇️ CSV — תאריך מקומי';
    btn.title='ייצוא הטבלאות המוצגות בדוח עם תאריך מקומי';
    btn.onclick=exportVisibleReport;
    const existing=active.querySelector('#mfix_reports_csv_export_v1');
    if(existing && existing.parentElement){
      existing.parentElement.appendChild(btn);
      return;
    }
    const anchor=active.querySelector('button');
    const table=active.querySelector('table');
    if(anchor?.parentElement) anchor.parentElement.appendChild(btn);
    else if(table?.parentElement) table.parentElement.insertBefore(btn,table);
    else active.insertBefore(btn,active.firstChild);
  }

  setInterval(install,700);
  window.mfixExportCurrentReportCsvLocal=exportVisibleReport;
})();
