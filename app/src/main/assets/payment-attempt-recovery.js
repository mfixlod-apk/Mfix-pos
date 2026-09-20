(()=>{
  if(window.__MFIX_PAYMENT_RECOVERY_1701__)return;
  window.__MFIX_PAYMENT_RECOVERY_1701__=1;

  const KEY='mfixPaymentAttempt1701';
  const STALE_MS=60000;
  const norm=v=>String(v??'').replace(/\s+/g,' ').trim();

  function read(){
    try{return JSON.parse(sessionStorage.getItem(KEY)||'null')}catch(_){return null}
  }
  function write(d){try{sessionStorage.setItem(KEY,JSON.stringify(d))}catch(_){}
  }
  function toast(msg,ms=2600){
    try{if(typeof window.toast==='function'){window.toast(msg,ms);return}}catch(_){}
    try{
      let el=document.getElementById('mfix-payment-recovery-toast');
      if(!el){el=document.createElement('div');el.id='mfix-payment-recovery-toast';el.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483647;background:#7f1d1d;color:#fff;border-radius:10px;padding:11px 15px;font:700 14px Arial;direction:rtl;box-shadow:0 8px 24px #0007';document.documentElement.appendChild(el)}
      el.textContent=msg;el.style.display='block';clearTimeout(el.__t);el.__t=setTimeout(()=>el.style.display='none',ms);
    }catch(_){}
  }
  function posVisible(){
    const root=document.getElementById('mfix-pos-800');
    if(!root)return false;
    const s=getComputedStyle(root),r=root.getBoundingClientRect();
    return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
  }
  function clearAttempt(){try{sessionStorage.removeItem(KEY)}catch(_){}
  }
  function recover(){
    const d=read();
    if(!d||d.status!=='started'||!d.startedAt)return;
    const started=Date.parse(d.startedAt);
    if(!Number.isFinite(started)||Date.now()-started<STALE_MS)return;
    d.status='stale';
    d.updatedAt=new Date().toISOString();
    d.recoveryReason='payment attempt exceeded 60 seconds without explicit completion signal';
    write(d);
    if(posVisible())toast('התשלום הקודם לא קיבל אישור בתוך 60 שניות. בדוק את אמצעי התשלום לפני ניסיון נוסף.',4200);
  }
  function installClearOnSuccess(){
    const original=window.MFIXPaymentSafety;
    if(!original||typeof original.mark!=='function')return false;
    if(original.__mfixRecoveryWrapped)return true;
    const mark=original.mark;
    original.mark=function(status,extra={}){
      mark(status,extra);
      if(status==='native-success-signal-observed'){
        const d=read();
        if(d){d.updatedAt=new Date().toISOString();d.recovery='explicit-success-observed';write(d)}
      }
    };
    original.__mfixRecoveryWrapped=true;
    return true;
  }
  recover();
  if(!installClearOnSuccess()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(installClearOnSuccess()||tries>=100)clearInterval(timer)},50);
  }
  setInterval(recover,10000);

  window.MFIXPaymentRecovery={
    version:'17.0.1',
    getAttempt:read,
    clear:clearAttempt,
    recover
  };
})();
