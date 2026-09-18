  function startObserver(){
    if(observer)return;
    observer=new MutationObserver(()=>{state.lastAction=Date.now();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
  async function boot(){
    profile(); startObserver();
    // Never force inventory network calls before the site has taught us its authenticated request template.
    const inv=await send({type:'MFIX_INVENTORY_STATUS_14'});
    if(inv?.ok){state.ready=true;}
    else {state.ready=false; send({type:'MFIX_INVENTORY_BOOTSTRAP_14'}).then(r=>{if(r?.ok){state.ready=true;emitHealth(health())}});}
    emitHealth(health()); save();
  }
  addEventListener('online',()=>emitHealth(health())); addEventListener('offline',()=>emitHealth(health()));
  addEventListener('pageshow',()=>{profile(); if(!observer)startObserver();});
  addEventListener('resize',()=>profile(),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)emitHealth(health())});

  // Public non-breaking reliability API for existing/new modules.
  window.MFIX15={version:'15.0.0',enqueue,health,profile,waitFor,Actions,click,smartClick:(labels,t)=>Actions.smartClick(labels,t),recover:boot};
  setTimeout(boot,500);
})();

// ===== MFIX 4.8.7: RawBT 80mm printing for Lemur/Android =====
(()=>{
  if(window.__MFIX_RAWBT_464_CONTENT__) return;
  window.__MFIX_RAWBT_464_CONTENT__=1;


try{ document.getElementById('mfix-rawbt-ready')?.remove(); }catch(_){}

  const nt=v=>String(v||'').replace(/\s+/g,' ').trim();
  const visible=e=>!!(e && (e.offsetParent!==null || getComputedStyle(e).position==='fixed'));
  let waitingForPdf=false;
  let lastIntent='';
  let lastPdfSize=0;

  // Chromebook uses ChromeOS' own PDF/print pipeline.
  // Android/Lemur keeps the proven RawBT flow.
  const isChromeOS=()=>{
    try{
      return /CrOS/i.test(navigator.userAgent||'') ||
             /CrOS/i.test(navigator.userAgentData?.platform||'');
    }catch(_){return false}
  };

  function base64ToBlobUrl464(base64){
    const bin=atob(base64);
    const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
  }

  function toast464(msg,ms=3200){
    let x=document.getElementById('mfix-rawbt-toast');
    if(!x){
      x=document.createElement('div');
      x.id='mfix-rawbt-toast';
      x.style.cssText='position:fixed;left:50%;bottom:62px;transform:translateX(-50%);z-index:2147483647;background:#111;color:#fff;padding:10px 14px;border-radius:9px;font:14px Arial;direction:rtl;max-width:90vw;text-align:center;box-shadow:0 2px 12px #0008';
      document.documentElement.appendChild(x);
    }
    x.textContent=msg; x.style.display='block';
    clearTimeout(x.__t); x.__t=setTimeout(()=>x.style.display='none',ms);
  }

  function clickNativeSafe(el){
    if(!el)return false;
    try{
      el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,view:window}));
      el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true,view:window}));
      el.click();
      return true;
    }catch(_){return false}
  }

  function findPrintDialog(){
    return [...document.querySelectorAll('div.pop1,div.pop2,[role="dialog"],.modal,.popup')]
      .find(d=>{
        if(!visible(d))return false;
        const t=nt(d.innerText||d.textContent||'');
        return t.includes('מה תרצו להדפיס?') && t.includes('מקור') && t.includes('הורדה כבון');
      })||null;
  }

  function bonSwitch(dialog){
    const label=[...dialog.querySelectorAll('label,span,div')]
      .find(e=>visible(e) && nt(e.innerText||e.textContent).includes('הורדה כבון'));
    if(!label)return null;
    let p=label;
    for(let i=0;i<6 && p;i++,p=p.parentElement){
      const inp=p.querySelector?.('input[type="checkbox"]');
      if(inp)return {type:'input',el:inp,label};
      const sw=p.querySelector?.('[role="switch"],.switch,.toggle,.md-switch,.checkbox');
      if(sw)return {type:'custom',el:sw,label};
    }
    return {type:'custom',el:label.closest('label,button,div')||label,label};
  }

  function isOn(target){
    const el=target?.el;
    if(!el)return false;
    if(target.type==='input')return !!el.checked;
    const aria=el.getAttribute?.('aria-checked');
    if(aria==='true')return true;
    const cls=String(el.className||'');
    if(/active|checked|on|selected/i.test(cls))return true;
    // Some YesInvoice switches render a checked checkbox elsewhere in the row.
    const row=target.label?.parentElement;
    const c=row?.querySelector?.('input[type="checkbox"]');
    return !!c?.checked;
  }

  function sourceButton(dialog){
    return [...dialog.querySelectorAll('button,div,a,span')]
      .find(e=>visible(e) && nt(e.innerText||e.textContent)==='מקור')||null;
  }

  // Android / Lemur: explicit RawBT intent. The package + component prevent
  // Android from showing an app chooser when RawBT is installed.
  function makeIntent(base64){
    const data='data:application/pdf;base64,'+base64;
    return 'intent:'+data+
      '#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;component=ru.a402d.rawbtprinter/.activity.PrintRawBtActivity;end;';
  }

  function mfixForceReload477(){
    try{
      if(sessionStorage.getItem('mfixRawbtReload477')!=='1') return;
      sessionStorage.removeItem('mfixRawbtReload477');
      sessionStorage.removeItem('mfixRawbtSent477');
    }catch(_){}
    try{ sessionStorage.setItem('mfixForceSearch479','1'); }catch(_){}
    location.replace('/invoice/main?mfixsearch=1');
  }

  function armRawbtReload477(){
    const sent=Date.now();
    try{
      sessionStorage.setItem('mfixRawbtReload477','1');
      sessionStorage.setItem('mfixRawbtSent477',String(sent));
    }catch(_){}

    // Android/Lemur can suppress visibility/focus callbacks.
    // Timers are paused while RawBT is foregrounded and resume when we return,
    // which makes this a reliable reset trigger.
    setTimeout(()=>{
      try{
        const t=Number(sessionStorage.getItem('mfixRawbtSent477')||0);
        if(sessionStorage.getItem('mfixRawbtReload477')==='1' &&
           Date.now()-t>=2500){
          mfixForceReload477();
        }
      }catch(_){}
    },3200);
  }

  function openRawBT(intentUri, manual=false){
    lastIntent=intentUri;
    if(!intentUri) return false;
    try{sessionStorage.setItem('mfixLastRawbtIntent490',intentUri)}catch(_){}
    try{
      armRawbtReload477();

      const a=document.createElement('a');
      a.href=intentUri;
      a.style.display='none';
      a.rel='noopener';
      document.documentElement.appendChild(a);
      a.click();
      setTimeout(()=>a.remove(),900);
      return true;
    }catch(_){
      try{
        sessionStorage.removeItem('mfixRawbtReload477');
        sessionStorage.removeItem('mfixRawbtSent477');
      }catch(__){}
      toast464('לא הצלחתי לפתוח RawBT',1800);
      return false;
    }
  }

  function showFallback(){
    // v4.7.6: intentionally no popup. RawBT is opened directly.
  }

  async function start80mm(dialog){
    if(waitingForPdf)return;
    const sw=bonSwitch(dialog);
    const src=sourceButton(dialog);
    if(!sw || !src){
      toast464('לא מצאתי בון 80 מ״מ / מקור');
      return;
    }

    waitingForPdf=true;

    // On Chromebook pre-open a tab while we still have the user's click gesture.
    // This prevents ChromeOS popup blocking when the PDF arrives asynchronously.
    if(isChromeOS()){
      toast464('מכין בון 80 מ״מ להדפסה ישירה…',2200);
    }else{
      toast464('מכין בון 80 מ״מ ל‑RawBT…',2500);
    }

    // Generate YesInvoice's own 80mm PDF.
    if(!isOn(sw)){
      clickNativeSafe(sw.el);
      await new Promise(r=>setTimeout(r,300));
    }

    // Trigger "Original"; interceptor catches the returned PDF.
    clickNativeSafe(src);

    setTimeout(()=>{
      if(waitingForPdf){
        waitingForPdf=false;
        toast464('לא נתפס PDF. נסה שוב פעם אחת.',4000);
      }
    },12000);
  }

  function addButton(dialog){
    if(dialog.querySelector('#mfix-rawbt-80'))return;
    const b=document.createElement('button');
    b.id='mfix-rawbt-80';
    b.type='button';
    b.textContent=isChromeOS()?'🖨️  MFIX • הדפס 80 מ״מ — ChromeOS':'🖨️  MFIX • הדפס 80 מ״מ';
    b.style.cssText='width:100%;margin:10px 0 2px;padding:12px 14px;border:0;border-radius:9px;background:#111;color:#fff;font:bold 15px Arial;cursor:pointer;direction:rtl';
    b.addEventListener('click',e=>{
      e.preventDefault(); e.stopPropagation();
      start80mm(dialog).catch(()=>{waitingForPdf=false;toast464('שגיאה בהכנת ההדפסה')});
    },true);
    dialog.appendChild(b);
  }

  window.addEventListener('message',e=>{
    if(e.source!==window || e.data?.source!=='MFIX_RAWBT_464' || e.data?.type!=='PDF')return;
    if(!waitingForPdf)return;
    const p=e.data.payload||{};
    if(!p.base64)return;
    waitingForPdf=false;
    lastPdfSize=Number(p.size||0);
    if(isChromeOS()){
      try{sessionStorage.setItem('mfixLastNativePdf614',p.base64)}catch(_){}
      chrome.runtime.sendMessage({type:'MFIX_PRINT_1535_PDF',base64:p.base64},res=>{
        if(chrome.runtime.lastError){toast464('שגיאת הדפסה: '+chrome.runtime.lastError.message,4000);return}
        if(res?.ok) toast464('נשלח ישירות למדפסת ✓',2200);
        else toast464('הדפסה נכשלה: '+(res?.error||'שגיאה'),4200);
      });
    }else{
      const intent=makeIntent(p.base64);
      lastIntent=intent;
      openRawBT(intent,false);
    }
  },false);


  const maybeReload477=()=>{
    if(isChromeOS())return;
    try{
      if(sessionStorage.getItem('mfixRawbtReload477')!=='1') return;
      const t=Number(sessionStorage.getItem('mfixRawbtSent477')||0);
      if(t && Date.now()-t>=2500) mfixForceReload477();
    }catch(_){}
  };

  window.addEventListener('focus',()=>setTimeout(maybeReload477,180),true);
  window.addEventListener('pageshow',()=>setTimeout(maybeReload477,180),true);
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible') setTimeout(maybeReload477,180);
  },true);

  // Last-resort watchdog. If Lemur misses all lifecycle events, this timer
  // resumes after returning from RawBT and forces the reset.
  setInterval(maybeReload477,700);


  // MFIX v4.7.8 — make General Search the practical home/default page.
  // We only redirect "home-like" pages so we never kick the user out of an active invoice/edit/settings flow.
  const mfixGoSearchDefault478=()=>{
    try{
      const p=location.pathname.toLowerCase();
      const activeWork=
        p.includes('/invoice/invoicedocument') ||
        p.includes('/invoice/items') ||
        p.includes('/items') ||
        p.includes('/settings') ||
        p.includes('/customer') ||
        p.includes('/reports');

      if(activeWork) return;

      const modalVisible=[...document.querySelectorAll('[role="dialog"],.modal,.pop1,.pop2,.popup')]
        .some(el=>{
          const st=getComputedStyle(el);
          return st.display!=='none' && st.visibility!=='hidden' && (el.offsetParent!==null || st.position==='fixed');
        });
      if(modalVisible) return;

      // Root/dashboard/document-list pages should always land on General Search.
      const isHomeLike=
        p==='/' ||
        p==='/invoice' ||
        p==='/invoice/' ||
        p.includes('/invoice/index') ||
        p.includes('/dashboard') ||
        p.includes('/home') ||
        p.includes('/documents') ||
        p.includes('/invoice/documents');

      if(isHomeLike && p!=='/invoice/main'){
        location.replace('/invoice/main');
      }
    }catch(_){}
  };

  window.addEventListener('pageshow',()=>setTimeout(mfixGoSearchDefault478,250),true);
  setTimeout(mfixGoSearchDefault478,700);

  function ensureReprintButton490(){
    let intent='';
    try{intent=sessionStorage.getItem('mfixLastRawbtIntent490')||''}catch(_){}
    let b=document.getElementById('mfix-reprint-last-490');
    if(!intent){ b?.remove(); return; }
    if(b)return;
    b=document.createElement('button');
    b.id='mfix-reprint-last-490';
    b.type='button';
    b.textContent='🖨️ הדפס שוב';
    b.title='F8';
    b.style.cssText='display:none;position:fixed;right:8px;bottom:8px;z-index:2147483645;border:0;border-radius:9px;background:#333;color:#fff;min-width:250px;min-height:54px;box-shadow:0 6px 18px #0005;padding:7px 10px;font:bold 18px Arial;opacity:.78';
    b.onclick=()=>{
      if(isChromeOS()){
        let pdf='';
        try{pdf=sessionStorage.getItem('mfixLastNativePdf614')||''}catch(_){}
        if(!pdf){toast464('אין מסמך אחרון להדפסה חוזרת',1800);return}
        chrome.runtime.sendMessage({type:'MFIX_PRINT_1535_PDF',base64:pdf},res=>{
          if(chrome.runtime.lastError){toast464('שגיאת הדפסה: '+chrome.runtime.lastError.message,4000);return}
          if(res?.ok) toast464('נשלח שוב למדפסת ✓',1800);
          else toast464('הדפסה נכשלה: '+(res?.error||'שגיאה'),4000);
        });
        return;
      }
      let x='';
      try{x=sessionStorage.getItem('mfixLastRawbtIntent490')||''}catch(_){}
      if(!x){toast464('אין מסמך אחרון להדפסה חוזרת',1800);return}
      openRawBT(x,true);
    };
    document.documentElement.appendChild(b);
  }

  function ensureMfixFloatingDock500(){
    let dock=document.getElementById('mfix-floating-dock-500');
    if(dock)return dock;

    dock=document.createElement('div');
    dock.id='mfix-floating-dock-500';
    dock.style.cssText=[
      'position:fixed',
      'left:10px',
      'top:42%',
      'z-index:2147483646',
      'width:46px',
      'height:46px',
      'background:#111827ee',
      'border:1px solid #ffffff22',
      'border-radius:999px',
      'box-shadow:0 8px 24px #0007',
      'backdrop-filter:blur(8px)',
      'padding:0',
      'font-family:Arial,sans-serif',
      'touch-action:none',
      'user-select:none',
      'overflow:visible'
    ].join(';');
    dock.dataset.open='0';

    // Restore last position.
    try{
      const saved=JSON.parse(localStorage.getItem('mfixFloatingDockPos500')||'null');
      if(saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)){
        dock.style.left=Math.max(0,Math.min(window.innerWidth-50,saved.x))+'px';
        dock.style.top=Math.max(0,Math.min(window.innerHeight-50,saved.y))+'px';
      }
    }catch(_){}

    const head=document.createElement('div');
    head.textContent='🖨️';
    head.title='לחץ לפתיחת תפריט הדפסה • גרור כדי להזיז';
    head.style.cssText='cursor:move;width:46px;height:46px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:21px;border-radius:999px;background:#111827ee';

    const menu=document.createElement('div');
    menu.id='mfix-print-menu-633';
    menu.style.cssText='display:none;position:absolute;left:54px;top:0;width:155px;background:#111827f5;border:1px solid #ffffff22;border-radius:14px;padding:7px;box-shadow:0 8px 24px #0007';

    const print80=document.createElement('button');
    print80.type='button';
    print80.textContent=isChromeOS()?'🖨️  הדפס 80 — ChromeOS':'🖨️  הדפס 80 מ״מ';
    print80.style.cssText='display:block;width:100%;border:0;border-radius:10px;padding:11px 8px;margin:4px 0;background:#14b8a6;color:white;font:bold 14px Arial';

    const again=document.createElement('button');
    again.type='button';
    again.textContent='🔁  הדפס שוב';
    again.style.cssText='display:block;width:100%;border:0;border-radius:10px;padding:11px 8px;margin:4px 0;background:#374151;color:white;font:bold 14px Arial';

    print80.onclick=e=>{
      e.stopPropagation();
      setMenuOpen633(false);
      const d=findPrintDialog();
      if(d){
        addButton(d);
        const btn=d.querySelector('#mfix-rawbt-btn-464');
        if(btn){btn.click();return}
      }

      // If the print dialog is not open yet, try the site's native print button.
      const vis=e=>{
        if(!e || !(e instanceof Element))return false;
        const st=getComputedStyle(e),r=e.getBoundingClientRect();
        return st.display!=='none'&&st.visibility!=='hidden'&&r.width>4&&r.height>4;
      };
      const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
      const native=[...document.querySelectorAll('button,a,[role="button"],div,span')].filter(vis)
        .find(x=>['הדפס','הדפסה'].includes(norm(x.innerText||x.textContent)));
      if(native){
        try{native.click()}catch(_){}
        setTimeout(()=>{
          const dd=findPrintDialog();
          if(dd){
            addButton(dd);
            dd.querySelector('#mfix-rawbt-btn-464')?.click();
          }
        },450);
      }else{
        toast464('פתח קודם את חלון ההדפסה',1800);
      }
    };

    again.onclick=e=>{
      e.stopPropagation();
      setMenuOpen633(false);
      if(isChromeOS()){
        let pdf='';
        try{pdf=sessionStorage.getItem('mfixLastNativePdf614')||''}catch(_){}
        if(!pdf){
          toast464('אין עדיין מסמך אחרון להדפסה חוזרת',1800);
          return;
        }
        // MFIX 15.3.7: route through the background chrome.printing path directly
        // (same call used by #mfix-reprint-last-490) instead of the dead
        // openChromeNativePrint464 stub, which never actually submitted the job.
        chrome.runtime.sendMessage({type:'MFIX_PRINT_1535_PDF',base64:pdf},res=>{
          if(chrome.runtime.lastError){toast464('שגיאת הדפסה: '+chrome.runtime.lastError.message,4000);return}
          if(res?.ok) toast464('נשלח שוב למדפסת ✓',1800);
          else toast464('הדפסה נכשלה: '+(res?.error||'שגיאה'),4200);
        });
        return;
      }
      let intent='';
      try{intent=sessionStorage.getItem('mfixLastRawbtIntent490')||''}catch(_){}
      if(!intent){
        toast464('אין עדיין מסמך אחרון להדפסה חוזרת',1800);
        return;
      }
      openRawBT(intent,true);
    };

    menu.append(print80,again);
    dock.append(head,menu);
    document.documentElement.appendChild(dock);

    const setMenuOpen633=open=>{
      dock.dataset.open=open?'1':'0';
      menu.style.display=open?'block':'none';
      head.textContent=open?'✕':'🖨️';
      head.title=open?'סגור תפריט הדפסה • גרור כדי להזיז':'לחץ לפתיחת תפריט הדפסה • גרור כדי להזיז';
    };

    // Drag support for touch + mouse.
    let drag=false,dx=0,dy=0,pid=null,moved633=false,startX633=0,startY633=0;
    const down=e=>{
      if(e.target!==head)return;
      drag=true;
      moved633=false;
      startX633=e.clientX;startY633=e.clientY;
      pid=e.pointerId;
      const r=dock.getBoundingClientRect();
      dx=e.clientX-r.left; dy=e.clientY-r.top;
      try{head.setPointerCapture(pid)}catch(_){}
      e.preventDefault();
    };
    const move=e=>{
      if(!drag)return;
      if(Math.abs(e.clientX-startX633)>5 || Math.abs(e.clientY-startY633)>5)moved633=true;
      if(moved633){
        const x=Math.max(0,Math.min(window.innerWidth-50,e.clientX-dx));
        const y=Math.max(0,Math.min(window.innerHeight-50,e.clientY-dy));
        dock.style.left=x+'px';
        dock.style.top=y+'px';
        dock.style.right='auto';