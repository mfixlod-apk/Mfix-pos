(()=>{
  if(window.__MFIX_PAYMENT_SAFETY_1701__)return;
  window.__MFIX_PAYMENT_SAFETY_1701__=1;

  const KEY='mfixPaymentAttempt1701';
  const LOCK_MS=3500;
  let lastKey='',lastAt=0;

  const norm=v=>String(v??'').replace(/\s+/g,' ').trim();
  const money=v=>{
    const n=Number(String(v??'').replace(/[₪,\s]/g,''));
    return Number.isFinite(n)?Math.round(n*100)/100:0;
  };
  const toast=(msg,ms=1800)=>{
    try{ if(typeof window.toast==='function'){window.toast(msg,ms);return} }catch(_){}
    try{
      let el=document.getElementById('mfix-payment-safety-toast');
      if(!el){el=document.createElement('div');el.id='mfix-payment-safety-toast';el.style.cssText='position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483647;background:#111827;color:#fff;border-radius:10px;padding:10px 14px;font:700 14px Arial;direction:rtl;box-shadow:0 8px 24px #0007';document.documentElement.appendChild(el)}
      el.textContent=msg;el.style.display='block';clearTimeout(el.__t);el.__t=setTimeout(()=>el.style.display='none',ms);
    }catch(_){}
  };

  function posVisible(){
    const root=document.getElementById('mfix-pos-800');
    if(!root)return false;
    const s=getComputedStyle(root),r=root.getBoundingClientRect();
    return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
  }

  function total(){
    const el=document.getElementById('mfix-pos-total-800');
    if(!el)return 0;
    return money(el.textContent||'');
  }

  function begin(kind){
    const amount=total();
    if(!(amount>0)){
      toast('אין סכום לתשלום — לא הופעל אמצעי תשלום',2200);
      return false;
    }
    const now=Date.now();
    const key=kind+':'+amount.toFixed(2);
    if(key===lastKey && now-lastAt<LOCK_MS){
      toast('התשלום כבר בתהליך — לחיצה כפולה נחסמה',1800);
      return false;
    }
    lastKey=key;lastAt=now;
    try{
      sessionStorage.setItem(KEY,JSON.stringify({
        version:'17.0.1',method:kind,amount,startedAt:new Date().toISOString(),status:'started'
      }));
    }catch(_){}
    return true;
  }

  function mark(status,extra={}){
    try{
      const raw=sessionStorage.getItem(KEY);if(!raw)return;
      const d=JSON.parse(raw);Object.assign(d,extra,{status,updatedAt:new Date().toISOString()});
      sessionStorage.setItem(KEY,JSON.stringify(d));
    }catch(_){}
  }

  document.addEventListener('click',e=>{
    if(!posVisible())return;
    const b=e.target?.closest?.('#mfix-pos-cash-1000,#mfix-pos-card-1000');
    if(!b)return;
    const kind=b.id==='mfix-pos-card-1000'?'terminal':'cash';
    if(!begin(kind)){
      e.preventDefault();e.stopImmediatePropagation();
    }
  },true);

  // If the native YesInvoice flow reports an explicit success phrase, record that
  // observation. This does not fabricate a success response from the gateway.
  const successRe=/(עסקה\s*אושרה|העסקה\s*בוצעה\s*בהצלחה|התשלום\s*בוצע\s*בהצלחה|סליקה\s*בוצעה\s*בהצלחה|אושר\s*בהצלחה)/i;
  let scanTimer=0;
  const scan=()=>{
    clearTimeout(scanTimer);
    scanTimer=setTimeout(()=>{
      try{
        const raw=sessionStorage.getItem(KEY);if(!raw)return;
        const d=JSON.parse(raw);if(d.status!=='started')return;
        const text=norm(document.body?.innerText||'');
        if(successRe.test(text))mark('native-success-signal-observed');
      }catch(_){}
    },180);
  };
  new MutationObserver(scan).observe(document.documentElement,{subtree:true,childList:true,characterData:true});

  window.MFIXPaymentSafety={version:'17.0.1',getAttempt:()=>{try{return JSON.parse(sessionStorage.getItem(KEY)||'null')}catch(_){return null}},mark};
})();
