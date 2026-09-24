(function(){
  'use strict';
  if(window.__mfixAutoPrintHookLoadedV7) return;
  window.__mfixAutoPrintHookLoadedV7=true;

  function activeSettings(){
    try{
      return window.STATE && window.STATE.settings && typeof window.STATE.settings==='object'
        ? window.STATE.settings : {};
    }catch(_){ return {}; }
  }

  function selectedPrinter(s){
    const id=String(s.defaultPrinterId||'').trim();
    if(!id || !Array.isArray(s.printers)) return null;
    return s.printers.find(p=>String(p&&p.id||'')===id) || null;
  }

  function copyCount(s){
    const n=Number(s.printerCopies);
    return Number.isFinite(n)?Math.max(1,Math.min(5,Math.floor(n))):1;
  }

  async function printLatestSale(before){
    const s=activeSettings();
    if(s.printerAutoPrint===false) return;

    const sales=window.STATE&&Array.isArray(window.STATE.sales)?window.STATE.sales:[];
    if(sales.length<=before) return;

    const sale=sales[sales.length-1];
    if(!sale || !sale.id || typeof window.printDoc!=='function') return;

    const printer=selectedPrinter(s);
    if(!printer){
      try{window.toast('המכירה נשמרה, אך לא הוגדרה מדפסת ברירת מחדל','err');}catch(_){}
      return;
    }

    if(String(printer.type||'USB')!=='USB'){
      try{window.toast('המכירה נשמרה; הדפסה אוטומטית נתמכת כרגע רק למדפסת USB','err');}catch(_){}
      return;
    }

    if(String(printer.authorized)==='false'){
      try{window.toast('המכירה נשמרה, אך למדפסת אין הרשאת USB','err');}catch(_){}
      return;
    }

    if(!String(printer.address||'').trim()){
      try{window.toast('המכירה נשמרה, אך למדפסת ברירת המחדל אין מזהה USB','err');}catch(_){}
      return;
    }

    const id=String(sale.id);
    if(String(localStorage.getItem('mfix_last_auto_printed_sale_v2')||'')===id) return;
    if(window.__mfixAutoPrintInFlight) return;

    window.__mfixAutoPrintInFlight=true;
    try{
      const copies=copyCount(s);
      for(let i=0;i<copies;i++){
        const result=await window.printDoc(sale.id);
        if(result===false) throw new Error('printDoc reported failure');
        if(i<copies-1) await new Promise(r=>setTimeout(r,80));
      }
      localStorage.setItem('mfix_last_auto_printed_sale_v2',id);
    }catch(e){
      console.error('[MFIX AUTO PRINT] supported USB receipt print failed',e);
      try{window.toast('המכירה נשמרה, אך ההדפסה האוטומטית נכשלה','err');}catch(_){}
    }finally{
      window.__mfixAutoPrintInFlight=false;
    }
  }

  async function hook(){
    if(typeof window.finalizeSale!=='function' || window.__mfixAutoPrintWrappedV7) return false;
    window.__mfixAutoPrintWrappedV7=true;
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
