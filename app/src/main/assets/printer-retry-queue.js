(function(){
  'use strict';
  if(window.__mfixPrinterRetryQueueLoadedV2) return;
  window.__mfixPrinterRetryQueueLoadedV2=true;

  const KEY='mfix_printer_retry_queue_v1';
  const MAX=50;
  const FAILURE_STATUSES=new Set(['ERROR','FAILED','FAIL','CANCELLED','REJECTED','OFFLINE']);
  function read(){ try{ const v=JSON.parse(localStorage.getItem(KEY)||'[]'); return Array.isArray(v)?v:[]; }catch(_){ return []; } }
  function write(v){ try{ localStorage.setItem(KEY,JSON.stringify(v.slice(-MAX))); }catch(_){} updateBadge(); }
  function resultFailed(result){
    if(result===false) return true;
    if(!result || typeof result!=='object') return false;
    if(result.ok===false || result.success===false || result.accepted===false) return true;
    const status=String(result.status||result.state||'').trim().toUpperCase();
    return FAILURE_STATUSES.has(status);
  }
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
      const result=await window.printDoc(item.saleId);
      if(resultFailed(result)) throw new Error(String(result&&((result.error&&result.error.message)||result.error||result.message)||'המדפסת דיווחה על כשל'));
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
  window.mfixPrinterRetryQueue={list:read,add,remove,retryOne,retryAll,pendingCount:function(){return read().length;}};

  function hook(){
    if(typeof window.printDoc!=='function' || window.__mfixPrinterRetryPrintHooked) return false;
    window.__mfixPrinterRetryPrintHooked=true;
    const original=window.printDoc;
    window.printDoc=async function(saleId){
      try{
        const result=await original.apply(this,arguments);
        if(resultFailed(result)){
          add(saleId,result&&((result.error&&result.error.message)||result.error||result.message)||'המדפסת דיווחה על כשל');
        }
        return result;
      }catch(e){
        add(saleId,e&&e.message||'הדפסה נכשלה');
        throw e;
      }
    };
    return true;
  }

  function updateBadge(){
    const b=document.getElementById('mfixPrinterRetryButton'); if(!b)return;
    const n=read().length;
    b.textContent=n?'🧾 '+n:'🧾';
    b.title=n?('הדפסות ממתינות לניסיון חוזר: '+n):'אין הדפסות ממתינות לניסיון חוזר';
  }
  function installButton(){
    if(!document.body || document.getElementById('mfixPrinterRetryButton')) return;
    const b=document.createElement('button'); b.id='mfixPrinterRetryButton';
    b.textContent='🧾'; b.title='אין הדפסות ממתינות לניסיון חוזר';
    b.style.cssText='position:fixed;left:70px;bottom:16px;z-index:9000;min-width:48px;height:48px;padding:0 9px;border:0;border-radius:24px;background:#b45309;color:#fff;font-size:18px;box-shadow:0 6px 18px rgba(0,0,0,.2);cursor:pointer';
    b.onclick=async function(){
      const q=read();
      if(!q.length){ alert('אין הדפסות ממתינות לניסיון חוזר.'); return; }
      const r=await retryAll();
      alert('ניסיונות חוזרים: '+r.ok+' מתוך '+r.total+'\nנותרו בתור: '+r.remaining);
      updateBadge();
    };
    document.body.appendChild(b); updateBadge();
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
