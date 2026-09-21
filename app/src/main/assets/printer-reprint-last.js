/* MFIX printer: reprint the most recent completed sale using the existing supported print path. */
(function(){
  'use strict';
  if(window.__mfixPrinterReprintLastLoaded) return;
  window.__mfixPrinterReprintLastLoaded = true;

  function settings(){
    try{return JSON.parse(localStorage.getItem('mfix_printer_settings_v1')||'{}')||{};}catch(_){return {};}
  }
  function selectedPrinter(){
    const s=settings();
    const id=String((s.device||localStorage.getItem('mfix_default_printer_v1')||'')).trim();
    if(!id || !window.AndroidPrinter || typeof AndroidPrinter.listUsbPrinters!=='function') return null;
    try{
      const list=JSON.parse(AndroidPrinter.listUsbPrinters()||'[]');
      return Array.isArray(list)?list.find(p=>String(p.id)===id||String(p.name)===id)||null:null;
    }catch(_){return null;}
  }
  async function reprint(){
    const state=window.STATE;
    const sales=state&&Array.isArray(state.sales)?state.sales:[];
    if(!sales.length){ if(typeof window.toast==='function') window.toast('אין עדיין מכירה שניתן להדפיס','err'); return; }
    const sale=sales[sales.length-1];
    if(!sale || !sale.id || typeof window.printDoc!=='function'){
      if(typeof window.toast==='function') window.toast('מסלול ההדפסה אינו זמין כרגע','err');
      return;
    }
    const printer=selectedPrinter();
    if(!printer){
      if(typeof window.toast==='function') window.toast('בחר תחילה מדפסת USB ברירת מחדל','err');
      return;
    }
    if(printer.authorized===false){
      if(typeof window.toast==='function') window.toast('למדפסת אין הרשאת USB כרגע','err');
      return;
    }
    try{
      await window.printDoc(sale.id);
      if(typeof window.toast==='function') window.toast('הקבלה האחרונה נשלחה להדפסה','ok');
    }catch(e){
      console.error('[MFIX REPRINT LAST]',e);
      if(typeof window.toast==='function') window.toast('הדפסת הקבלה האחרונה נכשלה','err');
    }
  }
  function mount(){
    const button=document.getElementById('mfixPrinterReprintLastButton');
    if(button) return;
    const manager=document.getElementById('mfixPrinterManagerButton');
    if(!manager) return;
    const b=document.createElement('button');
    b.id='mfixPrinterReprintLastButton';
    b.textContent='🧾';
    b.title='הדפסה חוזרת של הקבלה האחרונה';
    b.style.cssText='position:fixed;left:16px;bottom:72px;z-index:9000;width:48px;height:48px;border:0;border-radius:50%;background:#16a34a;color:#fff;font-size:22px;box-shadow:0 6px 18px rgba(0,0,0,.2);cursor:pointer';
    b.onclick=reprint;
    document.body.appendChild(b);
  }
  const timer=setInterval(mount,500);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
  window.addEventListener('beforeunload',()=>clearInterval(timer));
})();
