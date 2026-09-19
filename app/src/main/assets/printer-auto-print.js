(function(){
  'use strict';
  if(window.__mfixAutoPrintHookLoaded) return;
  window.__mfixAutoPrintHookLoaded=true;
  function settings(){
    try{return window.STATE&&window.STATE.settings?window.STATE.settings:{};}catch(_){return {};}
  }
  function wait(ms){return new Promise(r=>setTimeout(r,ms));}
  async function hook(){
    if(typeof window.finalizeSale!=='function' || window.__mfixAutoPrintWrapped) return false;
    window.__mfixAutoPrintWrapped=true;
    const original=window.finalizeSale;
    window.finalizeSale=async function(){
      const before=window.STATE&&Array.isArray(window.STATE.sales)?window.STATE.sales.length:-1;
      const result=await original.apply(this,arguments);
      try{
        const s=settings();
        if(s.printerAutoPrint===false) return result;
        const sales=window.STATE&&Array.isArray(window.STATE.sales)?window.STATE.sales:[];
        if(sales.length<=before) return result;
        const sale=sales[sales.length-1];
        if(!sale || typeof window.printDoc!=='function') return result;
        await wait(60);
        await window.printDoc(sale.id);
      }catch(e){
        console.error('[MFIX AUTO PRINT]',e);
        try{window.toast('המכירה נשמרה, אך ההדפסה האוטומטית נכשלה','err');}catch(_){}
      }
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
