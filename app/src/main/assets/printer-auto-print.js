(function(){
  'use strict';
  if(window.__mfixAutoPrintHookLoadedV4) return;
  window.__mfixAutoPrintHookLoadedV4=true;
  function settings(){
    try{return JSON.parse(localStorage.getItem('mfix_printer_settings_v1')||'{}');}catch(_){return {};}
  }
  function printers(){
    try{return window.AndroidPrinter&&typeof AndroidPrinter.listUsbPrinters==='function'?JSON.parse(AndroidPrinter.listUsbPrinters()||'[]'):[];}catch(_){return [];} 
  }
  function selectedPrinter(s){
    const id=String((s&&s.device)||localStorage.getItem('mfix_default_printer_v1')||'').trim();
    if(!id)return null;
    return printers().find(p=>String(p.id)===id||String(p.name)===id)||null;
  }
  function wait(ms){return new Promise(r=>setTimeout(r,ms));}
  function copyCount(s){
    const n=Number(s&&s.copies);
    return Number.isFinite(n)?Math.max(1,Math.min(5,Math.floor(n))):1;
  }
  async function printLatestSale(before){
    const s=settings();
    if(s.autoPrint===false || s.printerAutoPrint===false) return;
    const sales=window.STATE&&Array.isArray(window.STATE.sales)?window.STATE.sales:[];
    if(sales.length<=before)return;
    const sale=sales[sales.length-1];
    if(!sale || !sale.id || typeof window.printDoc!=='function')return;

    // Do not invoke the supported print path blindly. A configured default
    // printer must still be physically discoverable and USB-authorized at the
    // moment the sale is finalized.
    const printer=selectedPrinter(s);
    if(!printer){
      try{window.toast('המכירה נשמרה, אך לא נמצאה מדפסת ברירת מחדל מחוברת','err');}catch(_){}
      return;
    }
    if(printer.authorized===false){
      try{window.toast('המכירה נשמרה, אך למדפסת אין הרשאת USB','err');}catch(_){}
      return;
    }

    const id=String(sale.id);
    if(String(localStorage.getItem('mfix_last_auto_printed_sale_v1')||'')===id)return;
    if(window.__mfixAutoPrintInFlight)return;
    window.__mfixAutoPrintInFlight=true;
    try{
      const copies=copyCount(s);
      await wait(60);
      for(let i=0;i<copies;i++){
        await window.printDoc(sale.id);
        if(i<copies-1) await wait(80);
      }
      localStorage.setItem('mfix_last_auto_printed_sale_v1',id);
    }catch(e){
      console.error('[MFIX AUTO PRINT] supported USB receipt print failed',e);
      try{window.toast('המכירה נשמרה, אך ההדפסה האוטומטית נכשלה','err');}catch(_){}
    }finally{
      window.__mfixAutoPrintInFlight=false;
    }
  }
  async function hook(){
    if(typeof window.finalizeSale!=='function' || window.__mfixAutoPrintWrappedV4) return false;
    window.__mfixAutoPrintWrappedV4=true;
    const original=window.finalizeSale;
    window.finalizeSale=async function(){
      const before=window.STATE&&Array.isArray(window.STATE.sales)?window.STATE.sales.length:-1;
      const result=await original.apply(this,arguments);
      try{await printLatestSale(before);}catch(e){console.error('[MFIX AUTO PRINT]',e);}
      return result;
    };
    return true;
  }
  function start(){
    if(hook()) return;
    let tries=0;
    const timer=setInterval(async()=>{
      tries++;
      if(await hook() || tries>=40) clearInterval(timer);
    },250);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
