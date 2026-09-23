(function(){
  'use strict';
  if(window.__mfixPrinterRetryQueueLoadedV1) return;
  window.__mfixPrinterRetryQueueLoadedV1=true;

  const KEY='mfix_printer_retry_queue_v1';
  const MAX=50;
  function read(){ try{ const v=JSON.parse(localStorage.getItem(KEY)||'[]'); return Array.isArray(v)?v:[]; }catch(_){ return []; } }
  function write(v){ try{ localStorage.setItem(KEY,JSON.stringify(v.slice(-MAX))); }catch(_){} }
  function add(saleId,reason){
    saleId=String(saleId||'').trim(); if(!saleId)return;
    const q=read().filter(x=>String(x.saleId)!==saleId);
    q.push({saleId,reason:String(reason||'הדפסה נכשלה'),createdAt:new Date().toISOString(),attempts:0});
    write(q);
  }
  function remove(saleId){ write(read().filter(x=>String(x.saleId)!==String(saleId))); }
  async function retryOne(item){
    if(!item||!item.saleId||typeof window.printDoc!=='function') return false;
    item.attempts=Number(item.attempts||0)+1;
    try{
      await window.printDoc(item.saleId);
      remove(item.saleId);
      return true;
    }catch(e){
      const q=read(); const current=q.find(x=>String(x.saleId)===String(item.saleId));
      if(current){ current.attempts=item.attempts; current.lastError=String(e&&e.message||e||'שגיאה'); current.lastAttemptAt=new Date().toISOString(); write(q); }
      return false;
    }
  }
  async function retryAll(){
    const q=read().slice(); let ok=0;
    for(const item of q){ if(await retryOne(item)) ok++; }
    return {ok,total:q.length,remaining:read().length};
  }
  window.mfixPrinterRetryQueue={list:read,add,remove,retryOne,retryAll};

  function hook(){
    if(typeof window.printDoc!=='function' || window.__mfixPrinterRetryPrintHooked) return false;
    window.__mfixPrinterRetryPrintHooked=true;
    const original=window.printDoc;
    window.printDoc=async function(saleId){
      try{ return await original.apply(this,arguments); }
      catch(e){ add(saleId,e&&e.message||'הדפסה נכשלה'); throw e; }
    };
    return true;
  }

  function installButton(){
    if(!document.body || document.getElementById('mfixPrinterRetryButton')) return;
    const b=document.createElement('button'); b.id='mfixPrinterRetryButton';
    b.textContent='🧾'; b.title='הדפסות שנכשלו';
    b.style.cssText='position:fixed;left:70px;bottom:16px;z-index:9000;width:48px;height:48px;border:0;border-radius:50%;background:#b45309;color:#fff;font-size:21px;box-shadow:0 6px 18px rgba(0,0,0,.2);cursor:pointer';
    b.onclick=async function(){
      const q=read();
      if(!q.length){ alert('אין הדפסות ממתינות לניסיון חוזר.'); return; }
      const r=await retryAll();
      alert('ניסיונות חוזרים: '+r.ok+' מתוך '+r.total+'\nנותרו בתור: '+r.remaining);
    };
    document.body.appendChild(b);
  }

  function start(){
    hook();
    installButton();
    let tries=0; const timer=setInterval(function(){
      tries++;
      const hooked=hook(); if(document.body)installButton();
      if(hooked || tries>=40)clearInterval(timer);
    },250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start); else start();
})();
