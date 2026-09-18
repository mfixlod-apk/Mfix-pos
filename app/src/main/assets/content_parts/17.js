     const body=String(d.body||'');
     // Keep product/item-looking calls and JSON-ish responses; ignore obvious static assets.
     if(/\.(png|jpg|jpeg|gif|svg|css|woff|ico)(\?|$)/i.test(url))return;
     if(!/product|item|invoice|catalog|sku|serial|storage/i.test(url+' '+body+' '+text.slice(0,2500)))return;

     let arr=[];
     try{arr=JSON.parse(sessionStorage.getItem(MFIX_CAPTURE_KEY_608)||'[]')}catch(_){}
     arr.push({kind:d.kind,url,body,text,status:d.status,at:d.at});
     arr=arr.slice(-30);
     try{sessionStorage.setItem(MFIX_CAPTURE_KEY_608,JSON.stringify(arr))}catch(_){}
     mfixUpdateCaptureButton608();
   });
 }

 function mfixCaptureSummary608(){
   let arr=[];
   try{arr=JSON.parse(sessionStorage.getItem(MFIX_CAPTURE_KEY_608)||'[]')}catch(_){}
   return arr;
 }

 function mfixStartCapture608(){
   try{
     sessionStorage.setItem(MFIX_CAPTURE_KEY_608,'[]');
     sessionStorage.setItem(MFIX_CAPTURE_ACTIVE_608,'1');
   }catch(_){}
   mfixUpdateCaptureButton608();
   toast('🎯 הלכידה התחילה — עכשיו לחץ עריכה על מוצר אחד',3200);
 }

 function mfixStopCapture608(){
   try{sessionStorage.setItem(MFIX_CAPTURE_ACTIVE_608,'0')}catch(_){}
   mfixUpdateCaptureButton608();
 }

 async function mfixCopyCapture608(){
   const arr=mfixCaptureSummary608();
   if(!arr.length){toast('עדיין לא נקלטה קריאת מוצר. לחץ התחל ואז עריכה על מוצר.',3000);return}
   mfixStopCapture608();
   const compact=arr.map((x,i)=>({
     n:i+1,kind:x.kind,url:x.url,status:x.status,body:x.body,
     response:x.text
   }));
   const raw=JSON.stringify(compact,null,2);
   try{
     await navigator.clipboard.writeText(raw);
     toast('📋 נתוני המוצר הועתקו — הדבק אותם בצ׳אט',3000);
   }catch(_){
     prompt('העתק את הטקסט ושלח לי בצ׳אט:',raw);
   }
 }

 function mfixUpdateCaptureButton608(){
   const b=document.getElementById('mfix-cap-btn-608');
   if(!b)return;
   let active=false,count=0;
   try{
     active=sessionStorage.getItem(MFIX_CAPTURE_ACTIVE_608)==='1';
     count=JSON.parse(sessionStorage.getItem(MFIX_CAPTURE_KEY_608)||'[]').length;
   }catch(_){}
   b.textContent=active?`⏺ לוכד מוצר… (${count})`:'🎯 לכידת API מוצר';
   b.style.background=active?'#b91c1c':'#6d28d9';
 }

 function mfixEnsureCaptureUI608(){
   if(document.getElementById('mfix-cap-wrap-608'))return;
   const w=document.createElement('div');
   w.id='mfix-cap-wrap-608';
   w.style.cssText='position:fixed;left:12px;bottom:82px;z-index:2147483646;direction:rtl;font-family:Arial,sans-serif;display:flex;gap:6px;align-items:center';
   const b=document.createElement('button');
   b.id='mfix-cap-btn-608'; b.type='button';
   b.style.cssText='border:0;border-radius:12px;padding:11px 13px;color:#fff;font-weight:900;box-shadow:0 5px 18px #0006';
   b.onclick=()=>{
     let active=false;try{active=sessionStorage.getItem(MFIX_CAPTURE_ACTIVE_608)==='1'}catch(_){}
     active?mfixStopCapture608():mfixStartCapture608();
   };
   const c=document.createElement('button');
   c.type='button';c.textContent='📋 העתק';
   c.style.cssText='border:0;border-radius:12px;padding:11px;background:#0369a1;color:#fff;font-weight:900;box-shadow:0 5px 18px #0006';
   c.onclick=mfixCopyCapture608;
   w.append(b,c);
   document.documentElement.appendChild(w);
   mfixUpdateCaptureButton608();
 }

 function boot(){
   try{mfixStartNativeNameObserver606()}catch(_){}
   try{mfixResponsiveUi502()}catch(_){}
   try{mfixManualFontControl503()}catch(_){}
   try{mfixEnsureProPanel600()}catch(_){}
   try{mfixGeneralClickGuard600()}catch(_){}
   if(!window.__MFIX_KEYS_490__){
     window.__MFIX_KEYS_490__=1;
     window.addEventListener('keydown',mfixKeyboardShortcuts490,true);
   }
   let focusTimer=0, domWorkTimer=0;
   const scheduleFocus=()=>{ clearTimeout(focusTimer); focusTimer=setTimeout(focusMainSearch,260); };
   // PERFORMANCE: YesInvoice can emit hundreds of mutations during one UI change.
   // Collapse them into one short DOM pass instead of rescanning on every mutation.
   new MutationObserver(()=>{
     clearTimeout(domWorkTimer);
     domWorkTimer=setTimeout(()=>{
       try{
         bindSearch(generalSearchInput());
         if(location.href.includes('/invoice/InvoiceDocument')){ insertPendingProduct(); try{mfixLiteResumeGeneral700()}catch(_){} }
         else scheduleFocus();
       }catch(_){}
     },120);
   }).observe(document.documentElement,{subtree:true,childList:true});

   bindSearch(generalSearchInput());

   // Resume a product add that started from /invoice/items or another YesInvoice screen.
   try{
     const resume=sessionStorage.getItem('mfixResumePending612')==='1' ||
       new URL(location.href).searchParams.get('mfixpending')==='1';
     if(resume && location.pathname.toLowerCase().includes('/invoice/main')){
       setTimeout(()=>mfixOpenPendingInvoiceDocument612(),650);
     }
   }catch(_){}

   setTimeout(()=>{insertPendingProduct();try{mfixLiteResumeGeneral700()}catch(_){}},700);
   setTimeout(focusMainSearch,500);
   setTimeout(focusMainSearch,900);
   setTimeout(focusMainSearch,1500);
   setTimeout(focusMainSearch,2500);
   window.addEventListener('pageshow',()=>{
     setTimeout(focusMainSearch,250);
     setTimeout(focusMainSearch,800);
     setTimeout(focusMainSearch,1600);
   });
   window.addEventListener('popstate',()=>setTimeout(focusMainSearch,350));

   const badge=document.createElement('div');badge.textContent='MFIX POS 14';
   badge.style.cssText='position:fixed;left:8px;bottom:8px;z-index:2147483645;background:#111;color:#fff;opacity:.5;padding:4px 7px;border-radius:7px;font:11px Arial';
   document.documentElement.appendChild(badge);
 }

 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();


// ===== MFIX 13.9.10 PERFORMANCE =====
// Old floating print / RawBT / ChromeOS print layer removed by request.
// Native YesInvoice printing remains untouched.

/* =========================================================
   MFIX 4.8.7 — ISOLATED exact top-search learner.
   This block does not replace or modify the existing MFIX flow.
   ========================================================= */
(()=>{
  if(window.__MFIX_SEARCH_LEARN_486__) return;
  window.__MFIX_SEARCH_LEARN_486__=true;

  const KEY='mfixExactTopSearch486';
  let learning=false;
  let busy=false;

  const visible=(el)=>{
    if(!el) return false;
    const st=getComputedStyle(el);
    return st.display!=='none' && st.visibility!=='hidden' &&
      (el.offsetParent!==null || st.position==='fixed');
  };

  const cssPath=(el)=>{
    if(!el || el.nodeType!==1) return '';
    if(el.id) return '#'+CSS.escape(el.id);
    const parts=[];
    let cur=el;
    for(let depth=0;cur && cur!==document.body && depth<7;depth++,cur=cur.parentElement){
      let p=cur.tagName.toLowerCase();
      const cls=[...cur.classList].filter(c=>c && c.length<40 && !/[0-9a-f]{8,}/i.test(c)).slice(0,2);
      if(cls.length) p+='.'+cls.map(CSS.escape).join('.');
      if(cur.parentElement){
        const same=[...cur.parentElement.children].filter(x=>x.tagName===cur.tagName);
        if(same.length>1) p+=`:nth-of-type(${same.indexOf(cur)+1})`;
      }
      parts.unshift(p);
      const candidate=parts.join(' > ');
      try{
        if(document.querySelectorAll(candidate).length===1) return candidate;
      }catch(_){}
    }
    return parts.join(' > ');
  };

  const searchPopupOpen=()=>{
    return [...document.querySelectorAll('.pop2,[role="dialog"],.modal,.popup')]
      .some(el=>visible(el) && /חיפוש\s*כללי/.test((el.innerText||'')));
  };

  const getSaved=()=>{
    try{
      const sel=localStorage.getItem(KEY);
      if(!sel) return null;
      const el=document.querySelector(sel);
      return visible(el)?el:null;
    }catch(_){ return null; }
  };

  const clickSaved=()=>{
    try{
      if(!location.pathname.toLowerCase().includes('/invoice/main')) return;
      if(searchPopupOpen() || busy) return;

      const el=getSaved();
      if(!el) return;

      busy=true;
      const target=el.closest('button,a,[role="button"]') || el;
      try{ target.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'mouse',button:0})); }catch(_){}
      try{ target.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0})); }catch(_){}
      try{ target.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'mouse',button:0})); }catch(_){}
      try{ target.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,button:0})); }catch(_){}
      try{ target.click(); }catch(_){}
      setTimeout(()=>busy=false,700);
    }catch(_){ busy=false; }
  };

  const learnOnce=()=>{
    if(learning) return;
    if(!location.pathname.toLowerCase().includes('/invoice/main')) return;
    try{ if(localStorage.getItem(KEY)) return; }catch(_){}

    learning=true;
    const note=document.createElement('div');
    note.id='mfix-learn-search-486';
    note.textContent='MFIX: לחץ עכשיו פעם אחת על זכוכית המגדלת הירוקה למעלה';
    Object.assign(note.style,{
      position:'fixed',left:'12px',right:'12px',bottom:'16px',zIndex:'2147483647',
      background:'#111',color:'#fff',padding:'14px',borderRadius:'12px',
      fontSize:'17px',fontWeight:'700',textAlign:'center',direction:'rtl'
    });
    document.documentElement.appendChild(note);

    const handler=(ev)=>{
      const t=ev.target;
      if(!t || note.contains(t)) return;

      // Save the exact native element the user actually tapped.
      const exact=t.closest('button,a,[role="button"]') || t;
      const sel=cssPath(exact);
      if(!sel) return;

      try{ localStorage.setItem(KEY,sel); }catch(_){}
      document.removeEventListener('click',handler,true);
      note.remove();
      learning=false;

      const ok=document.createElement('div');
      ok.textContent='נשמר. מעכשיו זה הכפתור שנלחץ אוטומטית.';
      Object.assign(ok.style,{
        position:'fixed',left:'18px',right:'18px',bottom:'16px',zIndex:'2147483647',
        background:'#087f5b',color:'#fff',padding:'12px',borderRadius:'10px',
        textAlign:'center',fontSize:'16px',fontWeight:'700',direction:'rtl'
      });
      document.documentElement.appendChild(ok);
      setTimeout(()=>ok.remove(),1800);
    };

    document.addEventListener('click',handler,true);
  };

  let lastMainHref487='';
  let lastOpenAt487=0;

  const openOnceOnMain487=()=>{
    // MFIX 13.9.7: automatic opening of General Search is disabled.
    // Manual search button and all search functionality remain unchanged.
    return;
  };

  setTimeout(learnOnce,900);
  setTimeout(openOnceOnMain487,1100);

  window.addEventListener('pageshow',()=>{
    lastOpenAt487=0;
    setTimeout(openOnceOnMain487,350);
  },true);

  window.addEventListener('popstate',()=>{
    lastOpenAt487=0;
    setTimeout(openOnceOnMain487,350);
  },true);

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'){
      lastOpenAt487=0;
      setTimeout(openOnceOnMain487,350);
    }
  },true);

  // Detect SPA navigation back to /invoice/main, without forcing search open repeatedly.
  let lastPath487=location.pathname+location.search;
  setInterval(()=>{
    const cur=location.pathname+location.search;
    if(cur!==lastPath487){
      lastPath487=cur;
      lastOpenAt487=0;
      setTimeout(openOnceOnMain487,350);
    }
  },700);
})();

setTimeout(()=>{try{mfixPosResumeCancel1020()}catch(_){}},300);




if(!window.__mfixCancelLandingTimer1070){
  window.__mfixCancelLandingTimer1070=setInterval(()=>{
    try{
      mfixHideLegacyQuickBar1010();
      mfixPosCancelLandingWatch1070();
    }catch(_){}
  },650);
}
setTimeout(()=>{try{mfixPosCancelLandingWatch1070();mfixHideLegacyQuickBar1010()}catch(_){}},80);

if(!window.__mfixForceResetTimer1090){
  window.__mfixForceResetTimer1090=setInterval(()=>{
    try{mfixPosForceResetLanding1090()}catch(_){}
  },250);
}
setTimeout(()=>{try{mfixPosForceResetLanding1090()}catch(_){}},60);


 function mfixPosHomeDefault1110(){
   try{
     const path=(location.pathname||'').toLowerCase().replace(/\/+$/,'');
     if(path!=='/invoice/main')return false;
     if(window.__mfixCancelSale1020)return false;
     if(localStorage.getItem(MFIX_POS_FORCE_RESET_1090)==='1')return false;
     sessionStorage.setItem(MFIX_POS_MODE_800,'1');
     if(!document.getElementById('mfix-pos-800') &&
        Date.now()>Number(window.__mfixPosSuspendUntil820||0)){
       mfixHideLegacyQuickBar1010();
       mfixPosOpen800();
     }
     return true;
   }catch(_){return false}
 }

 if(!window.__mfixHomeDefaultTimer1110){
   window.__mfixHomeDefaultTimer1110=setInterval(()=>{try{mfixPosHomeDefault1110()}catch(_){}},900);
 }
 setTimeout(()=>{try{mfixPosHomeDefault1110()}catch(_){}},250);


(function MFIX_COMPACT_CART_EXACT_UPLOAD(){
  if(document.getElementById('mfix-compact-cart-exact'))return;
  const st=document.createElement('style');
  st.id='mfix-compact-cart-exact';
  st.textContent=`
    @media (min-width:700px) and (max-height:700px){
      #mfix-pos-800 > div:first-child{height:62px !important}
      #mfix-pos-800 > div:nth-child(2){padding:8px !important;gap:9px !important}
      #mfix-pos-800 aside{padding:9px !important;border-radius:14px !important}
      #mfix-pos-800 aside > div:first-child{font-size:21px !important}
      #mfix-pos-customer-name-900,#mfix-pos-customer-phone-900{height:29px !important}
      #mfix-pos-sale-note-1310{height:27px !important;margin-top:4px !important}
      #mfix-pos-cart-800{height:48px !important;min-height:48px !important;max-height:48px !important}
      #mfix-pos-total-800{font-size:30px !important;margin:0 0 3px !important}
      #mfix-pos-cash-1000,#mfix-pos-card-1000{height:42px !important;font-size:17px !important}
      #mfix-pos-daily-1290{margin-top:3px !important;font-size:10px !important}
      #mfix-pos-new-sale-1290,#mfix-pos-continue-900{height:30px !important}
    }
  `;
  document.documentElement.appendChild(st);
})();



(function MFIX_DRAG_ONLY_POS_GEAR_1362(){
  const KEY_POS='mfix1362_pos_xy', KEY_GEAR='mfix1362_gear_xy';

  function makeDraggable(el,key){
    if(!el || el.dataset.mfixDrag1362==='1') return;
    el.dataset.mfixDrag1362='1';

    try{
      const q=JSON.parse(localStorage.getItem(key)||'null');
      if(q && Number.isFinite(q.left) && Number.isFinite(q.top)){
        el.style.left=q.left+'px';
        el.style.top=q.top+'px';
        el.style.right='auto';
        el.style.bottom='auto';
      }
    }catch(_){}

    let active=false, moved=false, sx=0, sy=0, ox=0, oy=0, pid=null;

    el.addEventListener('pointerdown',e=>{
      if(e.button!=null && e.button!==0) return;
      const r=el.getBoundingClientRect();
      active=true; moved=false; pid=e.pointerId;
      sx=e.clientX; sy=e.clientY; ox=r.left; oy=r.top;
      try{el.setPointerCapture(pid)}catch(_){}
    },true);

    el.addEventListener('pointermove',e=>{
      if(!active || e.pointerId!==pid) return;
      const dx=e.clientX-sx, dy=e.clientY-sy;
      if(!moved && Math.hypot(dx,dy)<7) return;
      moved=true;
      const left=Math.max(3,Math.min(innerWidth-el.offsetWidth-3,ox+dx));
      const top=Math.max(3,Math.min(innerHeight-el.offsetHeight-3,oy+dy));
      el.style.left=left+'px'; el.style.top=top+'px';
      el.style.right='auto'; el.style.bottom='auto';
      e.preventDefault();
    },true);

    const finish=e=>{
      if(!active) return;
      active=false;
      if(moved){
        const r=el.getBoundingClientRect();
        try{localStorage.setItem(key,JSON.stringify({left:r.left,top:r.top}))}catch(_){}
        el.dataset.mfixJustDragged1362='1';
        setTimeout(()=>{delete el.dataset.mfixJustDragged1362},180);
      }
    };
    el.addEventListener('pointerup',finish,true);
    el.addEventListener('pointercancel',finish,true);

    // Block ONLY the click generated immediately after a real drag.
    el.addEventListener('click',e=>{
      if(el.dataset.mfixJustDragged1362==='1'){
        e.preventDefault(); e.stopImmediatePropagation();
        delete el.dataset.mfixJustDragged1362;
      }
    },true);
  }

  function bind(){
    makeDraggable(document.getElementById('mfix-pos-launch-800'),KEY_POS);
  }
  setTimeout(bind,300);
  setInterval(bind,1800);
})();


// ===== MFIX 13.9.10 PERFORMANCE FINAL CLEANUP =====
(()=>{
  const removeUnused=()=>{
    for(const id of [
      'mfix-lite-control-700','mfix-pro-button-600','mfix-pro-panel-600',
      'mfix-print-float-500','mfix-print-widget-500','mfix-floating-dock-500',
      'mfix-reprint-last-490','mfix-font-float-503'
    ]) document.getElementById(id)?.remove();
  };
  removeUnused();
  window.addEventListener('pageshow',removeUnused,true);
})();

// ===== MFIX POS 15.0 FINAL RELIABILITY CORE (additive; preserves existing UI/printing) =====
(()=>{
  if(window.__MFIX15_FINAL)return; window.__MFIX15_FINAL=1;
  const KEY='mfix15_runtime_state';
  const state={queue:[],running:false,ready:false,lastAction:0,failures:0,profile:null,startedAt:Date.now()};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const send=(m)=>new Promise(resolve=>{try{chrome.runtime.sendMessage(m,r=>resolve(chrome.runtime.lastError?null:r));}catch(_){resolve(null)}});

  function visible(el){if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0}
  function profile(){
    const w=innerWidth, touch=navigator.maxTouchPoints>0;
    const mobile=/Android|iPhone|iPad/i.test(navigator.userAgent)&&w<700;
    const tablet=touch&&w>=600&&w<1100;
    return state.profile={name:mobile?'mobile':tablet?'tablet':'desktop',width:w,height:innerHeight,touch,ua:navigator.userAgent};
  }
  function save(){try{sessionStorage.setItem(KEY,JSON.stringify({queue:state.queue.slice(0,20),running:state.running,lastAction:state.lastAction,profile:state.profile,at:Date.now()}));}catch(_){}}
  function emitHealth(detail){try{window.dispatchEvent(new CustomEvent('mfix:health',{detail}));}catch(_){}}

  async function waitFor(fn,timeout=6000,step=80){const end=Date.now()+timeout;while(Date.now()<end){try{const v=fn();if(v)return v}catch(_){}await sleep(step)}return null}
  function click(el){if(!visible(el))return false;try{el.scrollIntoView({block:'center',inline:'nearest'});el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'mouse'}));el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));el.click();return true}catch(_){try{el.click();return true}catch(__){return false}}}
  function textFinder(labels){const wanted=labels.map(x=>String(x).trim().toLowerCase());return [...document.querySelectorAll('button,[role="button"],a,input[type="button"],input[type="submit"]')].find(el=>visible(el)&&wanted.some(x=>((el.innerText||el.value||el.getAttribute('aria-label')||'').trim().toLowerCase()===x)));}
  const Actions={
    findAddProduct(){return document.querySelector('[data-testid="add-product"]')||document.querySelector('[data-action*="product" i]')||textFinder(['הוספת פריט','הוסף פריט','הוספת מוצר','הוסף מוצר','+ הוספת פריט נוסף']);},
    clickAddProduct(){const el=this.findAddProduct();return click(el);},
    async smartClick(labels,timeout=2500){const el=await waitFor(()=>textFinder(labels),timeout);return click(el);}
  };

  async function runQueue(){
    if(state.running)return; state.running=true; save();
    while(state.queue.length){
      const job=state.queue[0]; job.status='running'; save();
      try{await job.fn(); job.status='done'; state.failures=0;}
      catch(e){job.status='failed'; job.error=String(e); state.failures++; console.warn('[MFIX15]',job.error);}
      state.queue.shift(); save(); await sleep(0);
    }
    state.running=false; save(); emitHealth(health());
  }
  function enqueue(name,fn){
    // Deduplicate identical accidental double actions within 700ms.
    const now=Date.now(); if(state._lastName===name&&now-(state._lastNameAt||0)<700)return false;
    state._lastName=name; state._lastNameAt=now; state.queue.push({id:now+'-'+Math.random().toString(36).slice(2),name,status:'waiting',fn}); runQueue(); return true;
  }
  function health(){return {ready:state.ready,queue:state.queue.length,running:state.running,profile:state.profile,online:navigator.onLine,failures:state.failures,uptime:Date.now()-state.startedAt};}

  let observer=null, bindTimer=null;