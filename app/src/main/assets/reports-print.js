/* MFIX reports print enhancement.
 * Prints only the currently active report view and does not alter report data.
 */
(function(){
  'use strict';
  const KEY='mfix_reports_print_v1';
  function install(){
    const active=document.querySelector('.view.active');
    if(!active || !/דוחות|דוח|reports/i.test(active.innerText||'')) return;
    if(document.getElementById(KEY)) return;
    const btn=document.createElement('button');
    btn.id=KEY;
    btn.type='button';
    btn.className='btn btn-outline';
    btn.textContent='🖨️ הדפסת דוח';
    btn.onclick=function(){
      const current=document.querySelector('.view.active');
      if(!current){ if(typeof window.toast==='function') window.toast('דוח פעיל אינו זמין','err'); return; }
      const title='MFIX — דוח';
      const popup=window.open('','_blank','noopener,noreferrer,width=900,height=700');
      if(!popup){ if(typeof window.toast==='function') window.toast('הדפסת הדוח נחסמה על ידי הדפדפן','err'); return; }
      const styles=[...document.querySelectorAll('style')].map(s=>s.outerHTML).join('');
      popup.document.open();
      popup.document.write('<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>'+title+'</title>'+styles+'<style>@media print{button{display:none!important}}body{padding:20px;background:#fff}.view{display:block!important}</style></head><body>'+current.outerHTML+'</body></html>');
      popup.document.close();
      popup.focus();
      setTimeout(function(){try{popup.print();}catch(_){}},250);
      if(typeof window.toast==='function') window.toast('חלון הדפסה נפתח','ok');
    };
    const anchor=active.querySelector('button');
    if(anchor && anchor.parentElement) anchor.parentElement.appendChild(btn);
    else active.insertBefore(btn,active.firstChild);
  }
  setInterval(install,700);
  window.mfixPrintCurrentReport=function(){document.getElementById(KEY)?.click()};
})();
