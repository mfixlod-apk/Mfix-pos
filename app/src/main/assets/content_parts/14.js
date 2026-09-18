       ['אחר',['אחר'],'normal']
     ];

     async function findAndClick(labels){
       const textOf=e=>norm(e?.value||e?.innerText||e?.textContent||e?.getAttribute?.('aria-label')||e?.getAttribute?.('title')||'');
       const collect=()=>[...document.querySelectorAll(
         'button,a,[role="button"],[role="radio"],[role="option"],li,label,input,select option,.button,.btn,.payment-method,.paymentMethod,div,span'
       )].filter(visible);

       const score=(e,label)=>{
         const t=textOf(e);
         if(!t)return 999;
         if(t===label)return 0;
         if(t.replace(/[:\-–—]/g,' ').replace(/\s+/g,' ').trim()===label)return 1;
         if(t.startsWith(label) && t.length<label.length+28)return 2;
         if(t.includes(label) && t.length<label.length+45)return 3;
         return 999;
       };

       const choose=(all)=>{
         let best=null,bestScore=999;
         for(const label of labels){
           for(const e of all){
             const sc=score(e,label);
             if(sc>=bestScore)continue;
             // Prefer actual interactive controls / labels over giant parent divs.
             const tag=(e.tagName||'').toLowerCase(),role=e.getAttribute?.('role')||'';
             const bonus=(tag==='button'||tag==='input'||tag==='label'||tag==='option'||role==='button'||role==='radio'||role==='option')?-0.4:0;
             const final=sc+bonus;
             if(final<bestScore){best=e;bestScore=final}
           }
         }
         return best;
       };

       let hit=choose(collect());
       if(hit)return clickLike(hit);

       // Chromebook desktop sometimes keeps receipt methods behind a native
       // "add payment / receipt row" control. Open it and retry.
       const all=collect();
       const openers=all.filter(e=>{
         const t=textOf(e);
         return /(הוסף\s*(אמצעי\s*)?תשלום|הוספת\s*תקבול|שורת\s*תקבול|תקבולים|איך\s*שילמו)/.test(t) && t.length<120;
       }).sort((a,b)=>textOf(a).length-textOf(b).length);

       if(openers.length){
         clickLike(openers[0]);
         await new Promise(r=>setTimeout(r,500));
         hit=choose(collect());
         if(hit)return clickLike(hit);
       }

       // Last desktop fallback: inspect nearby text around a radio/button.
       const controls=collect().filter(e=>{
         const tag=(e.tagName||'').toLowerCase(),role=e.getAttribute?.('role')||'';
         return tag==='input'||tag==='button'||tag==='label'||role==='radio'||role==='button';
       });
       for(const label of labels){
         const near=controls.find(e=>{
           const t=norm(e.closest?.('label,li,.row,.item,.payment-method,.paymentMethod,div')?.innerText||'');
           return t.includes(label) && t.length<180;
         });
         if(near)return clickLike(near);
       }
       return false;
     }

     document.getElementById('mfixSmartPay469')?.remove();
     const shade=document.createElement('div');
     shade.id='mfixSmartPay469';
     shade.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#0006;display:flex;align-items:flex-end;justify-content:center;padding:12px 18px 18px;direction:rtl;pointer-events:none';
     const box=document.createElement('div');
     box.style.cssText='background:#1d1f24;color:#fff;border-radius:16px;padding:12px;width:min(520px,92vw);box-shadow:0 10px 35px #0009;font-family:Arial,sans-serif;pointer-events:auto;max-height:46vh;overflow:auto';
     const h=document.createElement('div');
     h.textContent='בחר אמצעי תשלום';
     h.style.cssText='font-size:20px;font-weight:700;margin-bottom:12px;text-align:center';
     box.appendChild(h);
     methods.forEach(([title,labels,mode])=>{
       const b=document.createElement('button');
       b.type='button'; b.textContent=title;
       b.style.cssText='display:block;width:100%;margin:7px 0;padding:13px;border:0;border-radius:10px;font-size:17px;font-weight:700;background:#2c3038;color:#fff';
       b.onclick=async(e)=>{
         e.stopPropagation();
         if(mode==='terminal'){
           // Close MFIX chooser and drive the native YesInvoice terminal flow.
           shade.remove();
           const opened=await mfixOpenNativeTerminal491();
           if(opened){
             try{toast('פותח סליקה במסופון Z-Credit…',1800)}catch(_){}
             mfixWaitForTerminalApproval4811();
           }else{
             try{toast('לא מצאתי את "סליקה במסוף" במסך',2500)}catch(_){}
           }
           return;
         }

         const ok=await findAndClick(labels);
         if(ok){
           // "שורת תקבול" is the manual path: open the selected native
           // YesInvoice receipt editor and leave it to the cashier.
           // Quick "מזומן" uses mfixChromeCashFlow616() and saves automatically.
           shade.remove();
         }
         else{
           b.textContent=title+' — לא נמצא במסך';
           setTimeout(()=>b.textContent=title,1800);
         }
       };
       box.appendChild(b);
     });
     const close=document.createElement('button');
     close.type='button'; close.textContent='סגור';
     close.style.cssText='display:block;width:100%;margin-top:10px;padding:11px;border:1px solid #666;border-radius:10px;background:transparent;color:#fff;font-size:16px';
     close.onclick=()=>shade.remove();
     box.appendChild(close);
     shade.appendChild(box);
     shade.onclick=e=>{if(e.target===shade)shade.remove()};
     document.body.appendChild(shade);
   };

   const restoreQuickBar501=()=>{
     let existing=document.getElementById('mfix-quickbar-restore-501');
     if(existing){existing.style.display='none';return existing}
     const hidden=document.createElement('button');
     hidden.id='mfix-quickbar-restore-501';
     hidden.type='button';
     hidden.style.cssText='display:none!important;position:fixed;left:-100000px;top:-100000px';
     document.documentElement.appendChild(hidden);
     return hidden;

     r=document.createElement('button');
     r.id='mfix-quickbar-restore-501';
     r.type='button';
     r.innerHTML='<span style="font-size:18px">⚡</span><span>MFIX תשלום</span>';
     r.title='פתח קופה מהירה';
     r.style.cssText='position:fixed;left:8px;top:46%;transform:translateY(-50%);z-index:2147483646;border:0;border-radius:0 14px 14px 0;padding:12px 14px 12px 10px;background:#111827ee;color:#fff;font:bold 14px Arial;box-shadow:0 4px 16px #0006;display:flex;gap:7px;align-items:center;writing-mode:horizontal-tb';
     r.onclick=()=>{
       wrap.style.display='flex';
       r.style.display='none';
       try{localStorage.setItem('mfixQuickBarHidden501','0')}catch(_){}
     };
     document.documentElement.appendChild(r);
     return r;
   };

   const head=document.createElement('div');
   head.textContent='⚡ MFIX קופה מהירה';
   head.style.cssText='width:100%;text-align:center;font-size:13px;font-weight:800;color:#cbd5e1;letter-spacing:.2px;margin-bottom:1px';
   head.title='גרור כדי להזיז • לחיצה קצרה לצמצום/פתיחה';
   head.style.cursor='move';
   head.style.userSelect='none';

   // v6.3.0: draggable MFIX quick bar, position persists on this device.
   try{
     const saved=JSON.parse(localStorage.getItem('mfixQuickBarPos630')||'null');
     if(saved){
       if(Number.isFinite(saved.left) && Number.isFinite(saved.top)){
         wrap.style.left=Math.max(4,Math.min(window.innerWidth-80,saved.left))+'px';
         wrap.style.top=Math.max(4,Math.min(window.innerHeight-60,saved.top))+'px';
         wrap.style.bottom='auto';
         wrap.style.transform='none';
       }
       if(Number.isFinite(saved.width)){
         wrap.style.width=Math.max(360,Math.min(window.innerWidth-8,saved.width))+'px';
       }
       if(Number.isFinite(saved.height)){
         wrap.style.height=Math.max(90,Math.min(window.innerHeight-8,saved.height))+'px';
       }
       wrap.dataset.layout632='free';
     }
   }catch(_){}
   let drag630=null, moved630=false;
   const startDrag630=(clientX,clientY)=>{
     const r=wrap.getBoundingClientRect();
     drag630={dx:clientX-r.left,dy:clientY-r.top};
     moved630=false;
     wrap.style.bottom='auto';wrap.style.transform='none';
   };
   const moveDrag630=(clientX,clientY)=>{
     if(!drag630)return;
     moved630=true;
     const left=Math.max(4,Math.min(window.innerWidth-wrap.offsetWidth-4,clientX-drag630.dx));
     const top=Math.max(4,Math.min(window.innerHeight-wrap.offsetHeight-4,clientY-drag630.dy));
     wrap.style.left=left+'px';wrap.style.top=top+'px';
   };
   const endDrag630=()=>{
     if(!drag630)return;
     drag630=null;
     try{
       const r=wrap.getBoundingClientRect();
       localStorage.setItem('mfixQuickBarPos630',JSON.stringify({
         left:r.left,top:r.top,width:r.width,height:r.height,layout:'free'
       }));
     }catch(_){}
   };
   head.addEventListener('pointerdown',e=>{
     if(e.button!==undefined && e.button!==0)return;
     startDrag630(e.clientX,e.clientY);
     try{head.setPointerCapture(e.pointerId)}catch(_){}
     e.preventDefault();
   });
   head.addEventListener('pointermove',e=>{if(drag630){moveDrag630(e.clientX,e.clientY);e.preventDefault()}});
   head.addEventListener('pointerup',e=>{endDrag630();try{head.releasePointerCapture(e.pointerId)}catch(_){}});
   head.addEventListener('pointercancel',()=>endDrag630());


   const quickSettings632=document.createElement('button');
   quickSettings632.type='button';
   quickSettings632.textContent='⤢';
   quickSettings632.title='איפוס גודל ומיקום';
   quickSettings632.style.cssText='display:none;position:absolute;top:5px;left:8px;border:0;background:#ffffff12;color:#fff;border-radius:8px;font:bold 16px Arial;padding:3px 7px;cursor:pointer';
   quickSettings632.onclick=e=>{
     e.stopPropagation();
     try{localStorage.removeItem('mfixQuickBarPos630')}catch(_){}
     wrap.style.left='50%';
     wrap.style.top='';
     wrap.style.bottom='16px';
     wrap.style.transform='translateX(-50%)';
     wrap.style.width='640px';
     wrap.style.height='auto';
     wrap.style.flexWrap='wrap';
     toast('גודל ומיקום הקופה אופסו',1600);
   };

   // Direct resize handle: drag it to make the quick bar exactly the size you want.
   const resizeHandle634=document.createElement('div');
   resizeHandle634.id='mfix-quick-resize-634';
   resizeHandle634.textContent='↘';
   resizeHandle634.title='גרור לשינוי גודל';
   resizeHandle634.style.cssText='position:absolute;right:5px;bottom:4px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:18px;cursor:nwse-resize;user-select:none;touch-action:none';

   let resizeState634=null;
   resizeHandle634.addEventListener('pointerdown',e=>{
     const r=wrap.getBoundingClientRect();
     resizeState634={x:e.clientX,y:e.clientY,w:r.width,h:r.height};
     try{resizeHandle634.setPointerCapture(e.pointerId)}catch(_){}
     e.preventDefault();e.stopPropagation();
   });
   resizeHandle634.addEventListener('pointermove',e=>{
     if(!resizeState634)return;
     const maxW=Math.max(380,window.innerWidth-8);
     const w=Math.max(360,Math.min(maxW,resizeState634.w+(e.clientX-resizeState634.x)));
     const h=Math.max(90,Math.min(window.innerHeight-8,resizeState634.h+(e.clientY-resizeState634.y)));
     wrap.style.width=w+'px';
     wrap.style.height=h+'px';
     wrap.style.flexWrap='wrap';
     wrap.style.alignContent='center';
     e.preventDefault();
   });
   const finishResize634=e=>{
     if(!resizeState634)return;
     resizeState634=null;
     try{
       const r=wrap.getBoundingClientRect();
       const old=JSON.parse(localStorage.getItem('mfixQuickBarPos630')||'{}')||{};
       localStorage.setItem('mfixQuickBarPos630',JSON.stringify({
         left:Number.isFinite(old.left)?old.left:r.left,
         top:Number.isFinite(old.top)?old.top:r.top,
         width:r.width,height:r.height,layout:'free'
       }));
     }catch(_){}
     try{resizeHandle634.releasePointerCapture(e.pointerId)}catch(_){}
   };
   resizeHandle634.addEventListener('pointerup',finishResize634);
   resizeHandle634.addEventListener('pointercancel',finishResize634);

   const hideQuick=document.createElement('button');
   hideQuick.type='button';
   hideQuick.textContent='✕';
   hideQuick.title='הסתר קופה מהירה';
   hideQuick.style.cssText='position:absolute;top:6px;right:8px;border:0;background:transparent;color:#cbd5e1;font:bold 16px Arial;padding:2px 5px';
   hideQuick.onclick=e=>{
     e.stopPropagation();
     // X means collapse, not permanent hide.
     wrap.style.display='none';
     const r=restoreQuickBar501();
     r.style.display='flex';
     try{localStorage.setItem('mfixQuickBarHidden501','0')}catch(_){}
   };
   head.onclick=()=>{
     if(moved630){moved630=false;return}
     const compact=wrap.dataset.compact==='1';
     wrap.dataset.compact=compact?'0':'1';
     [...wrap.children].forEach((el,i)=>{
       // keep title, reset control, X and resize handle visible when collapsed
       if(i<=2 || el===resizeHandle634)return;
       el.style.display=compact?'':'none';
     });
     head.textContent=compact?'⚡ MFIX קופה מהירה':'⚡ MFIX — לחץ לפתיחה';
   };
   wrap.append(head,quickSettings632,hideQuick,more,generalProduct,quickCash,quickCard,resizeHandle634);
   try{
     // Recover from older versions that stored a permanent hidden state.
     localStorage.setItem('mfixQuickBarHidden501','0');
     const r=restoreQuickBar501();
     r.style.display='none';
   }catch(_){}
   document.body.appendChild(wrap);
   wrap.style.flexWrap='wrap';

   // MFIX POS owns the visible checkout UI from v10.7 onward.
   // Keep the legacy quick-payment buttons alive but permanently off-screen.
   // This preserves the already learned cash/Z-Credit automation without showing
   // the old "MFIX קופה מהירה" panel to the cashier.
   wrap.style.display='block';
   wrap.style.position='fixed';
   wrap.style.left='-100000px';
   wrap.style.top='-100000px';
   wrap.style.bottom='auto';
   wrap.style.transform='none';
   wrap.style.opacity='0';
   wrap.style.pointerEvents='none';
   wrap.style.width='1px';
   wrap.style.height='1px';
   wrap.style.overflow='hidden';
   document.getElementById('mfix-quickbar-restore-501')?.remove();
   window.__mfixHeadlessQuick1060=false;
 }


 async function trySelectMatchedSerial(product){
   const serial=String(product?.__matchedSerial||'').trim();
   if(!serial)return false;

   // Do not click arbitrary page text. Only act inside a visible popup/dialog
   // that appears to be about serial/IMEI selection.
   for(let n=0;n<35;n++){
     const dialogs=[...document.querySelectorAll('div.pop1,div.pop2,[role="dialog"]')].filter(d=>d.offsetParent!==null);
     for(const d of dialogs){
       const txt=normText(d.innerText||d.textContent||'');
       if(!/serial|imei|סידור|סריאל/i.test(txt))continue;

       const exact=[...d.querySelectorAll('button,div,span,li,label,td')].find(e=>
         e.offsetParent!==null && normText(e.innerText||e.textContent||'')===serial
       );
       if(exact){
         const clickable=exact.closest('button,label,li,tr')||exact;
         clickNative(clickable);
         toast('נבחר Serial / IMEI: '+serial,1800);
         await sleep(250);
         return true;
       }

       const input=[...d.querySelectorAll('input')].find(i=>{
         const ph=normText((i.placeholder||'')+' '+(i.getAttribute('aria-label')||''));
         return /serial|imei|סידור|סריאל/i.test(ph);
       });
       if(input){
         setNativeInput(input,serial);
         input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));
         input.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',code:'Enter',bubbles:true}));
         await sleep(300);
         return true;
       }
     }
     await sleep(100);
   }
   return false;
 }

 async function insertPendingDesktop(product){
   // v4.5.3: choose the default customer in parallel.
   // IMPORTANT: never wait for this before inserting the product.
   setTimeout(()=>{ ensureDesktopWalkInCustomer().catch(()=>{}); },120);

   // Walk-in customer is already the desktop default; do not invoke mobile customer chooser.
   const bar=String(product.Barcode||'').trim();

   if(bar && normText(document.body?.innerText||'').includes(bar) &&
      normText(document.body?.innerText||'').includes('מחיר ליחידה')){
     await chrome.storage.local.remove(PENDING);
     toast('המוצר כבר נמצא בחשבונית ✓');
     try{mfix131FirstItemConfirmed(product)}catch(_){}
     setTimeout(showMfixNextStep,180);
     return true;
   }

   const add=desktopAddProductButton();
   if(!add)return false;
   clickNative(add);

   const pop=await waitDesktopProductModal();
   if(!pop){toast('רשימת הפריטים נפתחה אבל לא זוהתה — MFIX 4.4.1');return true}

   const nativeProduct={...product};
   delete nativeProduct.__matchedSerial;
   delete nativeProduct.__matchedSerialId;
   const picked=await desktopSearchAndChoose(pop,nativeProduct);
   if(!picked){toast('לא הצלחתי לבחור את המוצר ברשימת הפריטים');return true}

   await sleep(250);

   // v6.4.7: home/general product price is applied before native save.
   if(product.__mfixGeneralPrice640){
     const gp=Number(product.__mfixGeneralPrice640);
     const customName=String(product.__mfixGeneralCustomName||product.__mfixGeneralName||'').trim();
     // Custom name is intentionally NOT written in this add-product dialog.
     // It is applied after the row is actually saved, via native "עריכת שורה".
     if(!(gp>0) || !(await mfixSetGeneralProductPrice639(pop,gp))){
       await chrome.storage.local.remove(PENDING);
       toast('המחיר לא נקלט — עצרתי. אפשר ללחוץ שוב על מוצר כללי.',4200);
       return true;
     }
     await sleep(260);
   }

   await trySelectMatchedSerial(product);
   const saved=await desktopSaveChanges();
   if(!saved){toast('המוצר נבחר — לא מצאתי שמירת שינויים');return true}

   const inserted=await desktopWaitInserted(product);

   // General Product must NEVER stay pending, otherwise MutationObserver will try again and again.
   if(product.__mfixGeneralPrice640){
     const customName=String(product.__mfixGeneralCustomName||product.__mfixGeneralName||'').trim();
     let renamed=true;
     if(inserted && customName && customName!=='מוצר כללי') renamed=await mfixRenameSavedGeneralLine700(customName);
     await chrome.storage.local.remove(PENDING);
     if(inserted && renamed)toast('מוצר כללי הוכנס לחשבונית ✓',1800);
     else if(inserted)toast('המוצר הוכנס אבל השם לא עודכן',3000);
     else toast('מוצר כללי נשמר — אם השורה לא הופיעה, לחץ שוב ידנית. לא אנסה שוב אוטומטית.',3600);
     setTimeout(showMfixNextStep,220);
     return inserted && renamed;
   }

   if(inserted){
     await chrome.storage.local.remove(PENDING);
     toast('המוצר הוכנס לחשבונית ✓',1800);
     try{mfix131FirstItemConfirmed(product)}catch(_){}
     if(!(await mfixCartContinueAfterFirst640()))setTimeout(showMfixNextStep,160);
   }else{
     toast('המוצר נבחר; בדוק שהוא מופיע בשורת החשבונית');
     setTimeout(showMfixNextStep,350);
   }
   return true;
 }

 async function insertPendingProduct(){
   if(insertRunning)return;
   insertRunning=true;
   try{
     const st=await chrome.storage.local.get(PENDING);
     const pending=st[PENDING];
     if(!pending?.product||Date.now()-(pending.at||0)>240000)return;
     if(pending.matchedSerial){
       pending.product.__matchedSerial=String(pending.matchedSerial);
       pending.product.__matchedSerialId=pending.matchedSerialId??null;
     }

     // Wait until the invoice page is really loaded.
     for(let n=0;n<120;n++){
       if(location.href.includes('/invoice/InvoiceDocument') &&
          /חשבונית מס\/קבלה/.test(document.body?.innerText||'')) break;
       await sleep(150);
     }
     if(!location.href.includes('/invoice/InvoiceDocument'))return;

     // DESKTOP/TABLET: use the separately learned product-list flow.
     // IMPORTANT: if the learned desktop button exists, we stop here and never enter the mobile path.
     if(isDesktopInvoiceLayout()){
       const handled=await insertPendingDesktop(pending.product);
       // LITE: never retry the same product endlessly because of DOM mutations.
       if(handled)await chrome.storage.local.remove(PENDING);
       return;
     }

     // MOBILE 4.3 CONTINUES BELOW UNCHANGED.
     // Select the learned walk-in customer before inserting the line.
     if(!document.body?.innerText?.includes('##לקוח מזדמן')){
       await chooseWalkInCustomer();
     }else{
       // The option text can be visible even before selection; check the actual customer input.
       const ci=document.querySelector('#nameofCustomer');
       if(ci && !(ci.value||'').includes('לקוח מזדמן')) await chooseWalkInCustomer();
     }

     // If it is already there, don't duplicate it.
     const product=pending.product;
     const bar=String(product.Barcode||'').trim();
     if(bar && (document.body?.innerText||'').includes(bar) && (document.body?.innerText||'').includes('מחיר ליחידה')){
       await chrome.storage.local.remove(PENDING);
       toast('המוצר כבר נמצא בחשבונית ✓');
       setTimeout(showCustomerDialog,250);
       return;
     }

     const add=await findAddButton();
     if(!add){toast('החשבונית נפתחה, אבל לא מצאתי הוספת שירות');return}
     clickNative(add);

     const ta=await findTextarea();
     if(!ta){toast('לא מצאתי את שדה המוצר');return}

     const name=productTitle(product,'');
     const model=(name.match(/\b[A-Z][A-Z0-9-]{1,7}\b/i)||[])[0]||'';
     const queries=[bar, model, name].filter((v,i,a)=>v&&a.indexOf(v)===i);

     const picked=await chooseAutocomplete(product,queries);
     if(!picked){toast('לא הצלחתי לבחור את המוצר מתוך הרשימה');return}