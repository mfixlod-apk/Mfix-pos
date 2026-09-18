           };
           list.appendChild(b);
         });
         ov.querySelector('#mfix-pos-cat-close-1010').onclick=()=>ov.remove();
       };

       results.appendChild(card);
     });
   };

   const renderNav1000=()=>{
     const fb=root.querySelector('#mfix-pos-favs-1000'), cb=root.querySelector('#mfix-pos-cats-1000');
     if(fb){
       fb.innerHTML='';
       const favs=mfixPosFavsGet1000();
       if(!favs.length)fb.innerHTML='<span style="color:#94a3b8;font-size:12px;padding:10px">הוסף מועדפים דרך ⚙️</span>';
       favs.forEach(p=>{const b=document.createElement('button');b.textContent=productTitle(p,'מוצר');b.style.cssText='flex:0 0 auto;height:36px;min-width:92px;max-width:150px;border:1px solid #fed7aa;border-radius:9px;background:#fff7ed;font-weight:900;font-size:12px;padding:0 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';b.onclick=()=>mfixPosAddProduct800(p);fb.appendChild(b)});
     }
     if(cb){
       cb.innerHTML='';
       mfixPosCatsGet1000().forEach(c=>{const b=document.createElement('button');b.textContent=c.name;b.style.cssText='flex:0 0 auto;height:34px;border:0;border-radius:9px;background:#e2e8f0;padding:0 11px;font-weight:900;font-size:12px';b.onclick=()=>render(c.products||[]);cb.appendChild(b)});
     }
   };
   renderNav1000();
   const openBig1220=(kind)=>{
     document.getElementById('mfix-pos-big-1220')?.remove();
     const ov=document.createElement('div');ov.id='mfix-pos-big-1220';ov.dir='rtl';
     ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0009;display:flex;align-items:center;justify-content:center;font-family:Arial';
     ov.innerHTML=`<div style="width:min(900px,92vw);height:min(620px,86vh);background:#fff;border-radius:22px;padding:18px;box-sizing:border-box;display:flex;flex-direction:column"><div style="display:flex;justify-content:space-between;align-items:center"><b id="mfix-big-title-1220" style="font-size:26px"></b><button id="mfix-big-close-1220" style="height:42px;padding:0 18px;border:0;border-radius:10px;background:#111827;color:#fff;font-weight:900">סגור</button></div><div id="mfix-big-body-1220" style="margin-top:14px;flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-content:start;gap:10px"></div></div>`;
     document.documentElement.appendChild(ov);ov.querySelector('#mfix-big-close-1220').onclick=()=>ov.remove();
     const title=ov.querySelector('#mfix-big-title-1220'),body=ov.querySelector('#mfix-big-body-1220');
     const showProducts=(items)=>{
       body.innerHTML='';if(!items.length){body.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:50px;color:#94a3b8">אין עדיין פריטים</div>';return}
       items.forEach(p=>{const b=document.createElement('button');b.style.cssText='min-height:110px;border:1px solid #e5e7eb;border-radius:14px;background:white;text-align:right;padding:11px';b.innerHTML=`<b style="font-size:15px">${esc(productTitle(p,'מוצר'))}</b><div style="font-size:22px;font-weight:1000;color:#0f9f9a;margin-top:8px">₪${Number(p?.Price||0).toLocaleString('he-IL',{maximumFractionDigits:2})}</div>`;b.onclick=async()=>{ov.remove();mfixPosProgress1270('start',p);setTimeout(()=>mfixPosProgress1270('find',p),180);setTimeout(()=>mfixPosProgress1270('invoice',p),650);setTimeout(()=>mfixPosProgress1270('wait',p),1300);const ok=await mfixPosAddProduct800(p);mfixPosAddNotice1260(!!ok,p);setTimeout(()=>search.focus(),150)};body.appendChild(b)})
     };
     if(kind==='fav'){title.textContent='⭐ מועדפים';showProducts(mfixPosFavsGet1000())}
     if(kind==='best'){title.textContent='🔥 נמכרים ביותר';showProducts(mfixPosBestList1220())}
     if(kind==='cat'){title.textContent='📂 קטגוריות';const cats=mfixPosCatsGet1000();if(!cats.length){body.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:50px;color:#94a3b8">אין עדיין קטגוריות · הוסף מוצר לקטגוריה דרך 📂 בכרטיס המוצר</div>'}cats.forEach(c=>{const b=document.createElement('button');b.style.cssText='min-height:100px;border:0;border-radius:14px;background:#eef2ff;font-size:18px;font-weight:1000';b.innerHTML=`📂 ${esc(c.name)}<div style="font-size:12px;color:#64748b;margin-top:8px">${(c.products||[]).length} מוצרים</div>`;b.onclick=()=>{title.textContent='📂 '+c.name;showProducts(c.products||[])};body.appendChild(b)})}
   };
   root.querySelector('#mfix-pos-favs-big-1220').onclick=()=>openBig1220('fav');
   root.querySelector('#mfix-pos-cats-big-1220').onclick=()=>openBig1220('cat');
   root.querySelector('#mfix-pos-best-big-1220').onclick=()=>openBig1220('best');
   root.querySelector('#mfix-pos-fav-help-1000').onclick=()=>toast('חפש מוצר רגיל ואז לחץ ⭐ למועדפים או 📂 לקטגוריה',2800);

   const searchNow=async()=>{
     const q=search.value.trim();
     if(!q){results.innerHTML='';return}
     const mine=++seq;
     results.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:30px;font-size:18px">מחפש…</div>';
     const items=await mfixPosSearch800(q);
     if(mine!==seq)return;
     render(items);
   };

   search.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(searchNow,260)});
   search.addEventListener('keydown',async e=>{
     if(e.key!=='Enter')return;
     clearTimeout(timer);
     const q=search.value.trim();
     const items=await mfixPosSearch800(q);
     const exact=items.find(x=>String(x?.Barcode||'').trim()===q || String(x?.Name||'').trim()===q);
     if(exact){
       search.value='';results.innerHTML='';
       mfix130ShowScanPreview(exact,async(prod)=>await mfixPosAddProduct800(prod));
     }else render(items);
   });

   root.querySelector('#mfix-pos-general-800').onclick=mfixPosGeneral800;
   root.querySelector('#mfix-pos-settings-btn-800').onclick=mfixPosSettings800;
   root.querySelector('#mfix-pos-exit-800').onclick=()=>{
     try{sessionStorage.removeItem(MFIX_POS_MODE_800)}catch(_){}
     root.remove();
   };
   const cust=mfixPosCustomerGet900();
   const nameInput900=root.querySelector('#mfix-pos-customer-name-900');
   const phoneInput900=root.querySelector('#mfix-pos-customer-phone-900');
   if(nameInput900)nameInput900.value=cust.name||'';
   if(phoneInput900)phoneInput900.value=cust.phone||'';
   const noteInput1310=root.querySelector('#mfix-pos-sale-note-1310');if(noteInput1310)noteInput1310.value=mfix131NoteGet();

   const saveCustomerDraft900=()=>{mfixPosCustomerSet900(nameInput900?.value||'',phoneInput900?.value||'');mfix129CustomerBadge();};
   nameInput900?.addEventListener('input',saveCustomerDraft900);
   phoneInput900?.addEventListener('input',saveCustomerDraft900);
   noteInput1310?.addEventListener('input',()=>mfix131NoteSet(noteInput1310.value));

   root.querySelector('#mfix-pos-new-sale-1290').onclick=()=>{
     mfix136ArmNewSaleReturn();
     if(mfixPosCartGet800().length){
       if(confirm('יש מוצרים במכירה. לבטל את המכירה הקיימת ולפתוח חדשה?'))mfixPosCancelSale1020();
       else try{sessionStorage.removeItem(MFIX136_FORCE_POS_AFTER_NEW)}catch(_){}
       return;
     }
     mfixPosResetSale1020();mfix129SaleClear();mfixPosRenderCart800();mfix129HeaderMeta();search.value='';results.innerHTML='';search.focus();toast('מכירה חדשה מוכנה ✓',1400);
     try{sessionStorage.removeItem(MFIX136_FORCE_POS_AFTER_NEW)}catch(_){}
   };
   root.querySelector('#mfix-pos-price-edit-1365').onclick=async()=>{
     toast('זה כפתור הנחה/סה״כ הישן. לשינוי מחיר בלי דאבל־קליק השתמש ב־✏️ שינוי מחיר מוצר',2600);
     await mfixPosChangeFinalPrice1365();
   };
   root.querySelector('#mfix-pos-price-learn-1373').textContent='✏️ מחיר מוצר';
   root.querySelector('#mfix-pos-price-learn-1373').onclick=async()=>{await mfixRealItemPrice1378()};
   root.querySelector('#mfix-pos-continue-900').onclick=async()=>{await mfixPosContinueToNative900()};
   root.querySelector('#mfix-pos-cash-1000').onclick=async()=>{saveCustomerDraft900();if(!mfixPosCartGet800().length){toast('אין מוצרים בסל',1500);return}if(!mfix129PaymentAllowed('cash'))return;mfix129ShowQuickCash(async()=>{mfix129SaleState('בתהליך תשלום','#b45309');mfixFinishTransfer1280();mfix129DailyHit();mfix135RecordLastSold();await mfixPosStartPayment840('cash')})};
   root.querySelector('#mfix-pos-card-1000').onclick=async()=>{saveCustomerDraft900();if(!mfixPosCartGet800().length){toast('אין מוצרים בסל',1500);return}if(!mfix129PaymentAllowed('terminal'))return;mfix129SaleState('בתהליך תשלום','#1d4ed8');mfixFinishTransfer1280();mfix129DailyHit();mfix135RecordLastSold();await mfixPosStartPayment840('terminal')};

   root.addEventListener('keydown',e=>{
     if(e.key==='F2'){e.preventDefault();search.focus();search.select()}
     if(e.key==='F4'){e.preventDefault();root.querySelector('#mfix-pos-cash-1000')?.click()}
     if(e.key==='F6'){e.preventDefault();root.querySelector('#mfix-pos-card-1000')?.click()}
   });
   mfixPosRenderCart800();
   if(mfixPosCartGet800().length)setTimeout(()=>toast('המכירה שוחזרה מהמצב הקודם ✓',1800),250);
   setTimeout(()=>search.focus(),120);
 }

 async function mfixPosCustomerGuard830(){
   if(window.__mfixPosCustomerGuardRunning830)return;
   if(!location.href.includes('/invoice/InvoiceDocument'))return;
   if(sessionStorage.getItem(MFIX_POS_MODE_800)!=='1')return;

   const ci=document.querySelector('#nameofCustomer,input[placeholder*="שם לקוח"]');
   if(!ci || ci.offsetParent===null)return;
   if(normText(ci.value||'').includes('לקוח מזדמן'))return;

   window.__mfixPosCustomerGuardRunning830=true;
   try{
     // Only one controlled attempt per document state; no loop-clicking.
     await mfixPosEnsureWalkIn830();
   }finally{
     setTimeout(()=>window.__mfixPosCustomerGuardRunning830=false,2500);
   }
 }

 const MFIX_POS_RETURN_AFTER_ISSUE_910='mfixPosReturnAfterIssue910';

 function mfixPosArmReturnAfterIssue910(){
   try{
     sessionStorage.setItem(MFIX_POS_RETURN_AFTER_ISSUE_910,JSON.stringify({
       armed:true,
       armedAt:Date.now(),
       scheduled:false
     }));
   }catch(_){}
 }

 function mfixPosScheduleReturn910(){
   // After a completed/issued sale, clear ONLY the current MFIX sale
   // and keep MFIX POS armed for automatic return after printing.
   try{
     sessionStorage.setItem(MFIX_POS_CART_800,'[]');
     sessionStorage.removeItem(MFIX_POS_CUSTOMER_NAME_900);
     sessionStorage.removeItem(MFIX_POS_CUSTOMER_PHONE_900);
     sessionStorage.removeItem(MFIX131_NOTE);
     sessionStorage.removeItem(MFIX135_PHONE_META);
     sessionStorage.removeItem(MFIX135_DISCOUNT);
     sessionStorage.removeItem(MFIX_POS_TOTAL_OVERRIDE_1365);
     mfix129SaleClear();
     sessionStorage.removeItem(MFIX_POS_RETURN_AFTER_ISSUE_910);
     // IMPORTANT: keep POS mode enabled. RawBT return/reload will land on
     // /invoice/main and the existing POS timer will immediately reopen MFIX POS.
     sessionStorage.setItem(MFIX_POS_MODE_800,'1');
     sessionStorage.setItem('mfixPosAutoReturnAfterPrint910','1');
   }catch(_){}
 }

 function mfixPosWatchIssued910(){
   let st=null;
   try{st=JSON.parse(sessionStorage.getItem(MFIX_POS_RETURN_AFTER_ISSUE_910)||'null')}catch(_){}
   if(!st?.armed || st.scheduled)return;

   // Do not interpret anything immediately after arming as issuance.
   if(Date.now()-Number(st.armedAt||0)<1200)return;

   const path=(location.pathname||'').toLowerCase();
   const bodyText=normText(document.body?.innerText||'');

   // Strong signals only: print/original-copy stage or leaving InvoiceDocument
   // after the cashier manually pressed the native issue button.
   const printStage=
     bodyText.includes('מה תרצו להדפיס') ||
     (bodyText.includes('מקור וגם העתק') && bodyText.includes('הורדה כבון'));

   const returnedHome=path.replace(/\/+$/,'')==='/invoice/main';

   if(printStage || returnedHome){
     mfixPosScheduleReturn910();
   }
 }

 if(!window.__mfixPosIssueWatch910){
   window.__mfixPosIssueWatch910=setInterval(()=>{try{mfixPosWatchIssued910()}catch(_){}},700);
 }

 function mfixPosLauncher800(){
   if(document.getElementById('mfix-pos-launch-800'))return;
   const b=document.createElement('button');
   b.id='mfix-pos-launch-800';
   b.textContent='🧾 POS';
   b.title='פתח MFIX POS';
   b.style.cssText='position:fixed;right:16px;bottom:18px;z-index:2147483645;height:52px;padding:0 18px;border:0;border-radius:16px;background:#0f172a;color:white;font:bold 18px Arial;box-shadow:0 8px 24px #0005';
   b.onclick=mfixPosOpen800;
   document.documentElement.appendChild(b);
 }

 if(!window.__mfixPosTimer800){
   window.__mfixPosTimer800=setInterval(()=>{
     try{
       mfixPosLauncher800();
       try{mfixPosCustomerGuard830()}catch(_){}
       if(sessionStorage.getItem(MFIX_POS_MODE_800)==='1' &&
          !document.getElementById('mfix-pos-800') &&
          location.pathname.includes('/invoice/') &&
          Date.now()>Number(window.__mfixPosSuspendUntil820||0)){
         mfixPosOpen800();
       }
     }catch(_){}
   },900);
   setTimeout(()=>{try{mfixPosLauncher800()}catch(_){}},500);
 }

 function showMfixNextStep(){
   removeMfixNextStep();
   const wrap=document.createElement('div');
   wrap.id='mfix-next-step-450';
   wrap.dir='rtl';
   wrap.style.cssText='position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483647;border-radius:18px;padding:11px 14px;display:flex;gap:9px;align-items:center;flex-wrap:wrap;justify-content:center;font-family:Arial,sans-serif;border:1px solid #ffffff22;backdrop-filter:blur(10px);background:#111827f2;box-shadow:0 10px 28px #0007;width:640px;max-width:96vw;min-width:360px;box-sizing:border-box';
   const more=document.createElement('button');
   more.textContent='📦  עוד מוצר';
   more.style.cssText='border:0;border-radius:12px;padding:15px 22px;font-size:18px;font-weight:800;background:#f2f2f2;color:#222;min-width:150px';
   const pay=document.createElement('button');
   pay.textContent='✅  לתשלום';
   pay.style.cssText='border:0;border-radius:12px;padding:13px 25px;font-size:17px;font-weight:700;background:#20a66a;color:white';

   more.onclick=async()=>{
     removeMfixNextStep();
     const beforeCount=desktopInvoiceLineCount();

     // Stay on the SAME invoice. Open YesInvoice's learned desktop item list again.
     const add=findVisibleByExactText('div.button.white,div.button,button,a,span','+ הוספת פריט נוסף') ||
               findVisibleByExactText('div.button.white,div.button,button,a,span','הוספת פריט נוסף') ||
               desktopAddProductButton();
     if(add){
       clickNative(add);
       const pop=await waitDesktopProductModal();
       if(pop){
         watchAdditionalDesktopItem(beforeCount);
         const input=desktopSearchInput(pop);
         if(input){
           input.focus();
           input.select?.();
           toast('מוכן לסריקה / חיפוש של המוצר הבא',2600);
         }
       }
     }else{
       toast('לא מצאתי הוספת פריט נוסף');
     }
   };

   pay.onclick=async()=>{
     removeMfixNextStep();

     // Desktop rule: even when the user skips name/phone,
     // the document customer must be the registered ##לקוח מזדמן.
     const customerInput=document.querySelector('#nameofCustomer');
     const customerNow=normText(customerInput?.value||'');
     const ok=customerNow ? true : await ensureDesktopWalkInCustomer();
     if(!ok)toast('לא הצלחתי לבחור ##לקוח מזדמן — בדוק לפני התשלום',3200);

     // Customer name/phone first; immediately continue to YesInvoice native payment methods.
     armDesktopPaymentAmount();
     mfixAfterCustomerDialog=()=>openDesktopPaymentMenu();
     showCustomerDialog();
   };

   const receipt=document.createElement('button');
   receipt.textContent='🧾  שורת תקבול';
   receipt.style.cssText='border:0;border-radius:12px;padding:15px 20px;font-size:18px;font-weight:800;background:#222;color:white';

   const generalProduct=document.createElement('button');
   generalProduct.id='mfix-general-product-btn-639';
   generalProduct.textContent='🛒  מוצר כללי';
   generalProduct.title='הזן מחיר והכנס מוצר כללי';
   generalProduct.style.cssText='border:0;border-radius:12px;padding:15px 22px;font-size:18px;font-weight:900;background:#7c3aed;color:white;min-width:165px';
   generalProduct.onclick=async()=>{
     const price=await mfixAskGeneralProductPrice639();
     if(!(price>0))return;
     await mfixAddGeneralProduct639AtLite700(price);
   };

   const quickCash=document.createElement('button');
   quickCash.id='mfix-quick-cash-490';
   quickCash.textContent='💵  מזומן';
   quickCash.title='F4';
   quickCash.style.cssText='border:0;border-radius:12px;padding:15px 22px;font-size:18px;font-weight:800;background:#087f5b;color:white;min-width:150px';

   const quickCard=document.createElement('button');
   quickCard.id='mfix-quick-card-490';
   quickCard.textContent='💳  אשראי במסוף';
   quickCard.title='F6';
   quickCard.style.cssText='border:0;border-radius:12px;padding:15px 22px;font-size:18px;font-weight:800;background:#1769aa;color:white;min-width:180px';

   const learnReceiptSave=document.createElement('button');
   learnReceiptSave.id='mfix-learn-receipt-save-615';
   learnReceiptSave.textContent='🎯 למד שמירת תקבול';
   learnReceiptSave.style.cssText='border:0;border-radius:10px;padding:9px 12px;font-size:13px;font-weight:800;background:#7c2d12;color:white';
   learnReceiptSave.onclick=e=>{
      try{localStorage.removeItem('mfixCashSavePaymentSelector630')}catch(_){}
     e.preventDefault();e.stopPropagation();
     mfixStartReceiptSaveLearning615();
   };

   

   function mfixReceiptSaveSelector615(el){
     if(!el || !(el instanceof Element))return '';
     if(el.id)return '#'+CSS.escape(el.id);
     const parts=[];
     let cur=el;
     for(let depth=0;cur&&cur.nodeType===1&&depth<7;depth++,cur=cur.parentElement){
       let part=(cur.tagName||'').toLowerCase();
       const classes=[...cur.classList].filter(c=>c&&!/\d{5,}/.test(c)).slice(0,2);
       if(classes.length)part+='.'+classes.map(c=>CSS.escape(c)).join('.');
       const parent=cur.parentElement;
       if(parent){
         const same=[...parent.children].filter(x=>x.tagName===cur.tagName);
         if(same.length>1)part+=`:nth-of-type(${same.indexOf(cur)+1})`;
       }
       parts.unshift(part);
       const test=parts.join(' > ');
       try{if(document.querySelectorAll(test).length===1)return test}catch(_){}
     }
     return parts.join(' > ');
   }

   function mfixStartReceiptSaveLearning615(){
     if(window.__mfixReceiptSaveLearning615)return;
     window.__mfixReceiptSaveLearning615=true;

     const note=document.createElement('div');
     note.id='mfix-receipt-save-learn-615';
     note.textContent='MFIX: לחץ עכשיו פעם אחת על הכפתור המקורי של שמירת התקבול';
     note.style.cssText='position:fixed;left:16px;right:16px;top:16px;z-index:2147483647;background:#7c2d12;color:#fff;padding:14px;border-radius:12px;font:bold 17px Arial;text-align:center;direction:rtl;box-shadow:0 4px 18px #0007;pointer-events:none';
     document.documentElement.appendChild(note);

     const capture=ev=>{
       const t=ev.target instanceof Element?ev.target:null;
       if(!t)return;
       let chosen=t;
       for(let i=0,p=t;i<7&&p;i++,p=p.parentElement){
         const tag=(p.tagName||'').toLowerCase(),role=p.getAttribute?.('role')||'';
         if(tag==='button'||tag==='input'||tag==='a'||role==='button'){chosen=p;break}
       }
       const txt=String(chosen.value||chosen.innerText||chosen.textContent||chosen.getAttribute?.('aria-label')||'').replace(/\s+/g,' ').trim();
       if(!txt && !chosen.id)return;

       try{
         localStorage.setItem('mfixReceiptSaveSelector615',mfixReceiptSaveSelector615(chosen));
         localStorage.setItem('mfixReceiptSaveText615',txt);
       }catch(_){}

       document.removeEventListener('click',capture,true);
       note.textContent='✓ כפתור שמירת התקבול נלמד';
       note.style.background='#047857';
       setTimeout(()=>note.remove(),1800);
       window.__mfixReceiptSaveLearning615=false;
       try{toast('נשמר. מעכשיו MFIX ישתמש בכפתור הזה פעם אחת בלבד.',2600)}catch(_){}
       // Important: do NOT preventDefault/stopPropagation. The user's click continues natively.
     };
     document.addEventListener('click',capture,true);
   }

   async function mfixSavePaymentRow471(){
     const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
     const vis=e=>{
       if(!e || !(e instanceof Element)) return false;
       const st=getComputedStyle(e),r=e.getBoundingClientRect();
       return st.display!=='none'&&st.visibility!=='hidden'&&r.width>4&&r.height>4;
     };

     // CRITICAL: one native activation only.
     // Previous build fired pointer + mouse + click() + Enter, which could
     // submit the same receipt row twice.
     const singleClick=el=>{
       if(!el)return false;
       try{
         let p=el;
         for(let i=0;i<7 && p;i++,p=p.parentElement){
           const tag=(p.tagName||'').toLowerCase();
           const role=p.getAttribute?.('role')||'';
           if(tag==='button'||tag==='a'||tag==='input'||role==='button'){
             el=p; break;
           }
         }
         el.scrollIntoView({block:'center',inline:'nearest'});
         try{el.focus({preventScroll:true})}catch(_){}
         el.click();
         return true;
       }catch(_){
         try{
           el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,composed:true,view:window}));
           return true;
         }catch(__){return false}
       }
     };

     for(let i=0;i<4;i++){
       try{await fillPaymentAmountIfOpen()}catch(_){}
       await new Promise(r=>setTimeout(r,220));
     }

     const wanted=['שמירת שורה','שמור שורה','שמירת תשלום','שמור תשלום','שמירה','שמור','אישור','הוספה'];

     let target=null;

     // Chromebook: first try the exact native save control learned once by the user.
     try{
       const learnedSel=localStorage.getItem('mfixReceiptSaveSelector615')||'';
       if(learnedSel){
         const learned=document.querySelector(learnedSel);
         if(learned && vis(learned))target=learned;
       }
     }catch(_){}

     const pools=[
       [...document.querySelectorAll('button,input[type="button"],input[type="submit"],a,[role="button"],[aria-label],[title]')],
       [...document.querySelectorAll('div,span,label')]
     ];

     if(!target){
       for(const pool of pools){
         target=pool.filter(vis).find(e=>{
           const t=norm(e.value||e.innerText||e.textContent||e.getAttribute?.('aria-label')||e.getAttribute?.('title'));
           if(wanted.includes(t))return true;
           // Allow a short control containing save wording on desktop.
           return t.length>0 && t.length<45 && /שמ(ור|ירה)|אישור\s*תקבול|הוספת\s*תקבול/.test(t);
         });
         if(target)break;
       }
     }

     if(!target){
       try{toast('לא מצאתי את שמירת התקבול — נלמד אותה פעם אחת',2600)}catch(_){}
       mfixStartReceiptSaveLearning615();
       return false;
     }

     // One and only one submission attempt.
     singleClick(target);

     // Never retry the click automatically. Wait for YesInvoice to process it.
     await new Promise(r=>setTimeout(r,1400));

     try{toast('נשלחה שמירת תקבול ✓',1400)}catch(_){}
     try{mfixShowPaymentSuccess600(window.__mfixPayKind600||'תשלום')}catch(_){}
     return true;
   }


   function mfixUniqueSelector495(el){
     if(!el || !(el instanceof Element)) return '';
     if(el.id) return '#'+CSS.escape(el.id);

     const parts=[];
     let cur=el;
     for(let depth=0; cur && cur.nodeType===1 && depth<7; depth++,cur=cur.parentElement){
       let part=(cur.tagName||'').toLowerCase();
       if(!part)break;

       const classes=[...cur.classList].filter(c=>c && !/\d{5,}/.test(c)).slice(0,2);
       if(classes.length) part+='.'+classes.map(c=>CSS.escape(c)).join('.');

       const parent=cur.parentElement;
       if(parent){
         const same=[...parent.children].filter(x=>x.tagName===cur.tagName);
         if(same.length>1){
           const i=same.indexOf(cur)+1;
           part+=`:nth-of-type(${i})`;
         }
       }
       parts.unshift(part);
       const test=parts.join(' > ');
       try{
         if(document.querySelectorAll(test).length===1) return test;
       }catch(_){}
     }
     return parts.join(' > ');
   }

   function mfixTerminalLearner495(){
     if(document.getElementById('mfix-terminal-learn-495'))return;

     const b=document.createElement('button');
     b.id='mfix-terminal-learn-495';
     b.type='button';
     b.textContent='🎯 למד כפתור סליקה';
     b.style.cssText='position:fixed;left:10px;bottom:10px;z-index:2147483647;border:0;border-radius:14px;padding:10px 12px;background:#7b2cbf;color:#fff;font:bold 13px Arial;box-shadow:0 2px 8px #0006';

     b.onclick=e=>{
       e.preventDefault();
       e.stopPropagation();