/* MFIX payment failure recovery.
 * Complements payment-safety-guard.js by recording explicit native failure/cancel
 * signals so a declined/cancelled payment is not left looking like an active one.
 * This does not claim or implement terminal hardware support; it only observes
 * visible UI text produced by the existing payment flow.
 */
(()=>{
  'use strict';
  if(window.__MFIX_PAYMENT_FAILURE_SIGNAL_1703__)return;
  window.__MFIX_PAYMENT_FAILURE_SIGNAL_1703__=1;

  const failureRe=/(העסקה\s*(נכשלה|נדחתה|בוטלה)|עסקה\s*(נכשלה|נדחתה|בוטלה)|התשלום\s*(נכשל|נדחה|בוטל)|סליקה\s*(נכשלה|נדחתה|בוטלה)|לא\s*אושרה|שגיאה\s*בסליקה|ביטול\s*עסקה)/i;
  const normalize=v=>String(v??'').replace(/\s+/g,' ').trim();
  let timer=0;
  let recentMutationText='';
  const scan=()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>{
      try{
        const api=window.MFIXPaymentSafety;
        const attempt=api?.getAttempt?.();
        if(!attempt||attempt.status!=='started')return;
        const text=normalize(recentMutationText);
        recentMutationText='';
        if(!text||!failureRe.test(text))return;
        api.mark('native-failure-signal-observed',{failureObservedAt:new Date().toISOString()});
      }catch(_){}
    },200);
  };
  new MutationObserver(mutations=>{
    let text='';
    for(const m of mutations){
      if(m.type==='characterData') text+=' '+(m.target?.nodeValue||'');
      for(const node of Array.from(m.addedNodes||[])){
        if(node.nodeType===3) text+=' '+(node.nodeValue||'');
        else if(node.nodeType===1) text+=' '+(node.innerText||node.textContent||'');
      }
    }
    recentMutationText=normalize(text).slice(-4000);
    if(recentMutationText)scan();
  }).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  window.MFIXPaymentFailureSignal={version:'17.0.3',scan};
})();
