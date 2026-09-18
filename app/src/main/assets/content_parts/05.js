       const stillOpen=[...document.querySelectorAll('div.pop2,.pop2,[role="dialog"]')].some(d=>visible(d)&&/עדכון שורה|פירוט/.test(txt(d)));
       if(!stillOpen)break;
     }
     const ok=await waitFor(()=>{
       const rows=[...document.querySelectorAll('div.servicesdesk div.lines div.grid-receipt div.item,div.grid-receipt div.item')].filter(visible);
       return rows.some(r=>txt(r).includes(customName));
     },30,100);
     return !!ok;
   }catch(err){
     console.warn('MFIX general-name edit failed:',err);
     toast('המוצר נוסף, אבל לא הצלחתי לעדכן את שם המוצר',2600);
     return false;
   }
 }

 async function mfixAddGeneralProduct639AtLite700(price,customName=''){
   price=Math.round((Number(price)+Number.EPSILON)*100)/100;
   if(!(price>0))return false;
   customName=String(customName||window.__mfixGeneralCustomName639||'').trim();
   if(window.__mfixGeneralInsert1396)return false;
   window.__mfixGeneralInsert1396=true;
   setTimeout(()=>{window.__mfixGeneralInsert1396=false},7000);

   if(!location.href.includes('/invoice/InvoiceDocument')){
     try{
       sessionStorage.setItem('mfixLiteGeneralPrice700',String(price));
       sessionStorage.setItem('mfixLiteGeneralCustomName700',String(customName||''));
       sessionStorage.setItem('mfixLiteGeneralResume700','1');
     }catch(_){}
     if(location.pathname!=='/invoice/main'&&location.pathname!=='/invoice/main/'){
       location.href='/invoice/main?mfixlitegeneral=1';
       return true;
     }
     await sleep(250);
     try{await closeGeneralSearchExact()}catch(_){}
     let docBtn=null;
     for(let n=0;n<35&&!docBtn;n++){
       docBtn=[...document.querySelectorAll('div.btn1,button,a,[role="button"]')]
         .find(e=>e.offsetParent&&normText(e.innerText||e.textContent||'')==='הפקת מסמך');
       if(!docBtn)await sleep(90);
     }
     if(!docBtn){toast('לא מצאתי הפקת מסמך',2400);return false}
     clickNative(docBtn);
     let inv=null;
     for(let n=0;n<40&&!inv;n++){
       inv=[...document.querySelectorAll('a,button,div,[role="menuitem"]')]
         .find(e=>e.offsetParent&&normText(e.innerText||e.textContent||'')==='חשבונית מס/קבלה');
       if(!inv)await sleep(80);
     }
     if(!inv){toast('לא מצאתי חשבונית מס/קבלה',2400);return false}
     clickNative(inv);
     return true;
   }

   removeMfixNextStep();
   const add=desktopAddProductButton()||
     findVisibleByExactText('div.button.white,div.button,button,a,span','הוספת פריט נוסף')||
     findVisibleByExactText('div.button.white,div.button,button,a,span','+ הוספת פריט נוסף');
   if(!add){toast('לא מצאתי הוספת פריט',2400);return false}
   clickNative(add);

   const pop=await waitDesktopProductModal();
   if(!pop){toast('רשימת הפריטים לא נפתחה',2400);return false}

   // Exact YesInvoice code shown on the General Product line.
   const generic={Body:'מוצר כללי',Name:'14606113',CatalogNumber:'14606113',Price:price};
   if(!await desktopSearchAndChoose(pop,generic)){
     toast('לא מצאתי מוצר כללי לפי קוד 14606113',2600);
     return false;
   }

   // Keep the native product as "מוצר כללי" while adding it.
   // A custom name is applied only AFTER the line is saved, using the native
   // sequence: three dots -> "עריכת שורה" -> פירוט -> "עדכון שורה".

   // Setter itself waits for the live price field, so no fixed delay here.
   if(!(await mfixSetGeneralProductPrice639(pop,price))){
     toast('המחיר לא התייצב — עצרתי לפני שמירה כדי לא ליצור 0 ₪',3200);
     return false;
   }

   // Last zero guard immediately before native Save.
   const live=mfixFindGeneralPriceInput649(pop);
   if(!live||Math.abs(parseMoney(live.value)-price)>0.001){
     toast('המחיר השתנה לפני שמירה — לא שמרתי',3000);
     return false;
   }

   if(!await desktopSaveChanges()){
     toast('לא מצאתי שמירת שינויים',2400);
     return false;
   }

   // Faster confirmation: look for the exact code in the native invoice row.
   let confirmed=false;
   for(let n=0;n<35;n++){
     await sleep(90);
     const rows=[...document.querySelectorAll(
       'div.servicesdesk div.lines div.grid-receipt div.item,div.grid-receipt div.item'
     )].filter(e=>e.offsetParent!==null);
     if(rows.some(r=>normText(r.innerText||r.textContent||'').includes('14606113'))){
       confirmed=true;
       break;
     }
   }

   if(!confirmed){
     toast('השמירה נשלחה — לא ביצעתי ניסיון נוסף כדי למנוע כפילות',2600);
     return false;
   }

   if(customName){
     const renamed=await mfixRenameSavedGeneralLine700(customName);
     if(!renamed)return false;
   }

   toast('מוצר כללי ₪'+price.toLocaleString('he-IL',{maximumFractionDigits:2})+' נוסף',1200);
   setTimeout(showMfixNextStep,100);
   return true;
 }

 async function mfixLiteResumeGeneral700(){
   if(window.__mfixLiteGeneralRunning700 || window.__mfixGeneralInsert1396)return;
   if(!location.href.includes('/invoice/InvoiceDocument'))return;
   let flag='',raw='',customName='';
   try{
     flag=sessionStorage.getItem('mfixLiteGeneralResume700')||'';
     raw=sessionStorage.getItem('mfixLiteGeneralPrice700')||'';
     customName=sessionStorage.getItem('mfixLiteGeneralCustomName700')||'';
   }catch(_){}
   if(flag!=='1')return;
   const price=Number(raw);
   if(!(price>0))return;
   window.__mfixLiteGeneralRunning700=true;
   try{
     // Clear first: never retry automatically if insertion fails.
     sessionStorage.removeItem('mfixLiteGeneralResume700');
     sessionStorage.removeItem('mfixLiteGeneralPrice700');
     sessionStorage.removeItem('mfixLiteGeneralCustomName700');
     for(let n=0;n<70;n++){
       if(desktopAddProductButton())break;
       await sleep(120);
     }
     await mfixAddGeneralProduct639AtLite700(price,customName);
   }finally{
     setTimeout(()=>window.__mfixLiteGeneralRunning700=false,800);
   }
 }
 // PERFORMANCE: no perpetual 700ms polling. Resume is triggered by boot/navigation DOM events.

 async function mfixAddGeneralProduct639(){
   const price=await mfixAskGeneralProductPrice639();
   if(!(price>0))return;
   removeMfixNextStep();
   toast('מוסיף מוצר כללי ₪'+price.toLocaleString('he-IL',{maximumFractionDigits:2})+'…',2500);
   // Use one single insertion engine for general products. It verifies the exact
   // native code, price and saved invoice row before reporting success.
   const ok=await mfixAddGeneralProduct639AtLite700(price,window.__mfixGeneralCustomName639||'');
   if(!ok){
     toast('המוצר הכללי לא אושר בחשבונית — לא נוספה הצלחה מזויפת',3200);
     return;
   }
   // mfixAddGeneralProduct639AtLite700 only returns true after native row confirmation.
 }


 function mfixEnsureHomeGeneral647(){
   document.getElementById('mfix-home-general-647')?.remove();
   return;
   const old=document.getElementById('mfix-home-general-647');
   const isHome=location.pathname==='/invoice/main' || location.pathname==='/invoice/main/';
   if(!isHome){old?.remove();return}
   if(old)return;

   const b=document.createElement('button');
   b.id='mfix-home-general-647';
   b.type='button';
   b.textContent='🛒';
   b.title='מוצר כללי';
   b.style.cssText='position:fixed;right:18px;bottom:82px;z-index:2147483644;width:54px;height:54px;border:0;border-radius:999px;background:#7c3aed;color:#fff;font-size:24px;box-shadow:0 8px 25px #0005;cursor:pointer';

   b.onclick=async()=>{
     const price=await mfixAskGeneralProductPrice639();
     if(!(price>0))return;
     const product={Body:window.__mfixGeneralName639||'מוצר כללי',Name:window.__mfixGeneralName639||'מוצר כללי',Price:price,__mfixGeneralPrice640:price,__mfixGeneralCustomName:window.__mfixGeneralCustomName639||''};
     toast('פותח חשבונית עם מוצר כללי ₪'+price.toLocaleString('he-IL',{maximumFractionDigits:2}),2000);
     await openInvoiceForProduct(product);
   };
   document.documentElement.appendChild(b);
 }

 if(!window.__mfixHomeGeneralTimer647){
   window.__mfixHomeGeneralTimer647=setInterval(()=>{try{mfixEnsureHomeGeneral647()}catch(_){}},1000);
   setTimeout(()=>{try{mfixEnsureHomeGeneral647()}catch(_){}},300);
 }

 function mfixLiteControl700(){
   return; // 13.9.10 PERFORMANCE: settings gear removed
   if(document.getElementById('mfix-lite-control-700'))return;

   // Hide old scattered controls; functionality stays callable.
   const hideOld=()=>{
     ['mfix-font-float-503','mfix-pro-button-600','mfix-print-float-500','mfix-print-widget-500'].forEach(id=>{
       const e=document.getElementById(id); if(e)e.style.display='none';
     });
     document.querySelectorAll('[id*="mfix-pro"][id*="button"],[id*="mfix-print"][style*="position:fixed"]').forEach(e=>{
       if(!e.closest('#mfix-lite-control-700'))e.style.display='none';
     });
   };

   const root=document.createElement('div');
   root.id='mfix-lite-control-700';
   root.dir='rtl';
   root.style.cssText='position:fixed;right:14px;top:28%;z-index:2147483646;font-family:Arial';

   const btn=document.createElement('button');
   btn.textContent='⚙️';
   btn.title='MFIX הגדרות';
   btn.style.cssText='width:48px;height:48px;border:0;border-radius:999px;background:#111827;color:white;font-size:22px;box-shadow:0 6px 20px #0005';

   const panel=document.createElement('div');
   panel.style.cssText='display:none;position:absolute;right:56px;top:0;width:270px;background:#111827f8;color:white;border-radius:16px;padding:14px;box-shadow:0 10px 32px #0007;border:1px solid #ffffff20';
   panel.innerHTML=`<div style="font-size:18px;font-weight:900;margin-bottom:12px">MFIX — כלים</div>
     <div style="font-size:13px;color:#cbd5e1;margin-bottom:5px">גודל תוצאות חיפוש</div>
     <input id="mfix-lite-font-700" type="range" min="16" max="34" step="1" style="width:100%">
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:13px">
       <button id="mfix-lite-print-700" style="border:0;border-radius:10px;padding:11px;background:#0f766e;color:white;font-weight:800">🖨️ הדפס 80</button>
       <button id="mfix-lite-reprint-700" style="border:0;border-radius:10px;padding:11px;background:#334155;color:white;font-weight:800">🔁 הדפס שוב</button>
     </div>
     <button id="mfix-lite-resetbar-700" style="width:100%;margin-top:8px;border:0;border-radius:10px;padding:10px;background:#475569;color:white;font-weight:800">אפס מיקום קופה מהירה</button>`;

   btn.onclick=e=>{e.stopPropagation();panel.style.display=panel.style.display==='none'?'block':'none'};
   root.append(btn,panel);
   document.documentElement.appendChild(root);
   // Low-height Chromebook/tablet view: preserve tappable actions instead of oversized cards.
   try{
     if(window.innerHeight<520){
       root.style.setProperty('--mfix-pos-card-font','16px');
       const rs=root.querySelector('#mfix-pos-results-800');
       if(rs)rs.style.gridTemplateColumns='repeat(3,minmax(145px,1fr))';
       const cart=root.querySelector('#mfix-pos-cart-800');
       if(cart){cart.style.height='64px';cart.style.minHeight='64px';cart.style.maxHeight='64px'}
     }
   }catch(_){}

   // Some YesInvoice/Android layouts lock body scrolling. POS owns its own scroll areas.
   const resultsScroll800=root.querySelector('#mfix-pos-results-800');
   const cartScroll800=root.querySelector('#mfix-pos-cart-800');
   for(const area of [resultsScroll800,cartScroll800]){
     if(!area)continue;
     area.addEventListener('touchmove',e=>{ e.stopPropagation(); },{passive:true});
     area.addEventListener('wheel',e=>{ e.stopPropagation(); },{passive:true});
   }

   const slider=panel.querySelector('#mfix-lite-font-700');
   let saved=20;try{saved=Number(localStorage.getItem('mfixManualSearchFont503')||20)}catch(_){}
   slider.value=String(saved);
   const apply=n=>{
     document.documentElement.style.setProperty('--mfix-result-title',n+'px');
     document.documentElement.style.setProperty('--mfix-result-meta',Math.max(13,n-5)+'px');
     try{localStorage.setItem('mfixManualSearchFont503',String(n))}catch(_){}
   };
   slider.oninput=()=>apply(Number(slider.value));

   panel.querySelector('#mfix-lite-print-700').onclick=()=>{
     const old=[...document.querySelectorAll('button')].find(b=>/80/.test(b.innerText||'') && /הדפס/.test(b.innerText||'') && !b.closest('#mfix-lite-control-700'));
     if(old)old.click();else toast('כפתור ההדפסה זמין אחרי הפקת מסמך',1800);
   };
   panel.querySelector('#mfix-lite-reprint-700').onclick=()=>{
     const old=[...document.querySelectorAll('button')].find(b=>/הדפס שוב/.test(b.innerText||'') && !b.closest('#mfix-lite-control-700'));
     if(old)old.click();else toast('אין הדפסה קודמת זמינה',1600);
   };
   panel.querySelector('#mfix-lite-resetbar-700').onclick=()=>{
     try{
       localStorage.removeItem('mfixQuickBarPos630');
       localStorage.removeItem('mfixQuickBarSize634');
     }catch(_){}
     document.getElementById('mfix-next-step-450')?.remove();
     setTimeout(showMfixNextStep,100);
   };

   setInterval(hideOld,1200);
   hideOld();
 }

 if(!window.__mfixLiteControlTimer700){
   setTimeout(()=>{try{mfixLiteControl700()}catch(_){}},800);
 }


 // ===== MFIX POS 8.0 =====
 const MFIX_POS_MODE_800='mfixPosMode800';
 const MFIX_POS_FAVS_1000='mfixPosFavs1000';
 const MFIX_POS_CATS_1000='mfixPosCats1000';
 const MFIX_POS_BEST_1220='mfixPosBest1220';
 function mfixPosBestGet1220(){try{return JSON.parse(localStorage.getItem(MFIX_POS_BEST_1220)||'{}')||{}}catch(_){return{}}}
 function mfixPosBestHit1220(p){
   try{
     const k=mfixPosProdKey1000(p);if(!k)return;
     const all=mfixPosBestGet1220(), old=all[k]||{count:0,product:mfixPosSlim1000(p)};
     old.count=Number(old.count||0)+1;old.product=mfixPosSlim1000(p);all[k]=old;
     localStorage.setItem(MFIX_POS_BEST_1220,JSON.stringify(all));
   }catch(_){}
 }
 function mfixPosBestList1220(){return Object.values(mfixPosBestGet1220()).sort((a,b)=>Number(b.count||0)-Number(a.count||0)).slice(0,20).map(x=>x.product)}

 function mfixPosFavsGet1000(){try{const x=JSON.parse(localStorage.getItem(MFIX_POS_FAVS_1000)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}}
 function mfixPosFavsSet1000(a){try{localStorage.setItem(MFIX_POS_FAVS_1000,JSON.stringify(a||[]))}catch(_){}}
 function mfixPosCatsGet1000(){try{const x=JSON.parse(localStorage.getItem(MFIX_POS_CATS_1000)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}}
 function mfixPosCatsSet1000(a){try{localStorage.setItem(MFIX_POS_CATS_1000,JSON.stringify(a||[]))}catch(_){}}
 function mfixPosProdKey1000(p){return String(p?.ID||p?.Barcode||p?.Name||p?.CatalogNumber||productTitle(p,'')).trim()}
 function mfixPosSlim1000(p){return {ID:p?.ID,Body:p?.Body,Name:p?.Name,Barcode:p?.Barcode,CatalogNumber:p?.CatalogNumber,Price:Number(p?.Price||0),Quantity:p?.Quantity,allQuantity:p?.allQuantity}}
 const MFIX_POS_CUSTOMER_NAME_900='mfixPosCustomerName900';
 const MFIX_POS_CUSTOMER_PHONE_900='mfixPosCustomerPhone900';

 function mfixPosCustomerGet900(){
   try{
     return {
       name:sessionStorage.getItem(MFIX_POS_CUSTOMER_NAME_900)||'',
       phone:sessionStorage.getItem(MFIX_POS_CUSTOMER_PHONE_900)||''
     };
   }catch(_){return {name:'',phone:''}}
 }
 function mfixPosCustomerSet900(name,phone){
   try{
     sessionStorage.setItem(MFIX_POS_CUSTOMER_NAME_900,String(name||'').trim());
     sessionStorage.setItem(MFIX_POS_CUSTOMER_PHONE_900,String(phone||'').trim());
   }catch(_){}
 }
 async function mfixPosApplyCustomer900(){
   const data=mfixPosCustomerGet900();

   // Base customer is always the registered walk-in customer.
   const ok=await mfixPosEnsureWalkIn830();
   if(!ok){
     toast('לא הצלחתי לבחור ##לקוח מזדמן',3000);
     return false;
   }

   // If no custom name/phone were entered, walk-in is enough.
   if(!data.name && !data.phone)return true;

   const ext=await openExtendedCustomer();
   if(!ext){
     toast('לא הצלחתי לפתוח פרטי לקוח מורחב',3000);
     return false;
   }

   // Empty name intentionally keeps the native base customer as ##לקוח מזדמן.
   if(data.name){
     const nameOk=await mfixSetYesInvoiceField('שם על המסמך',data.name);
     if(!nameOk){toast('שם הלקוח לא נשמר ביש חשבונית — עצרתי כדי למנוע טעות',3500);return false}
   }
   if(data.phone){
     const phoneOk=await mfixSetYesInvoiceField('טלפון נייד',data.phone);
     if(!phoneOk){toast('מספר הטלפון לא נשמר ביש חשבונית — עצרתי כדי למנוע טעות',3500);return false}
   }
   return true;
 }

 async function mfixPosContinueToNative900(){
   if(window.__mfixPosContinue900)return;
   window.__mfixPosContinue900=true;
   try{
     const cart=mfixPosCartGet800();
     if(!cart.length){
       toast('אין מוצרים בסל',1800);
       return false;
     }

     const root=document.getElementById('mfix-pos-800');
     const name=root?.querySelector('#mfix-pos-customer-name-900')?.value||'';
     const phone=root?.querySelector('#mfix-pos-customer-phone-900')?.value||'';
     mfixPosCustomerSet900(name,phone);

     // Stop auto-reopening POS. From here the cashier works manually in YesInvoice.
     try{sessionStorage.removeItem(MFIX_POS_MODE_800)}catch(_){}
     // Arm a one-time return: only after the native document is actually issued.
     mfixPosArmReturnAfterIssue910();
     window.__mfixPosSuspendUntil820=Date.now()+60000;
     root?.remove();

     const ok=await mfixPosApplyCustomer900();
     if(ok){
       toast('החשבונית מוכנה — המשך ידנית לתשלום',2400);
     }else{
       try{sessionStorage.removeItem(MFIX_POS_RETURN_AFTER_ISSUE_910)}catch(_){}
     }
     return ok;
   }finally{
     setTimeout(()=>window.__mfixPosContinue900=false,800);
   }
 }

 const MFIX_POS_CART_800='mfixPosCart800';

 function mfixPosCartGet800(){
   try{const x=JSON.parse(sessionStorage.getItem(MFIX_POS_CART_800)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}
 }
 const MFIX_POS_TOTAL_OVERRIDE_1365='mfixPosTotalOverride1365';
 function mfixPosCartSet800(a){
   try{
     sessionStorage.setItem(MFIX_POS_CART_800,JSON.stringify(a||[]));
     // Any cart edit invalidates a previous manual final-total override.
     sessionStorage.removeItem(MFIX_POS_TOTAL_OVERRIDE_1365);
   }catch(_){}
   mfixPosRenderCart800();
 }

 const MFIX129_SETTINGS='mfix129Settings', MFIX129_RECENTS='mfix129Recents', MFIX129_SEARCHES='mfix129Searches', MFIX129_SALESEQ='mfix129SaleSeq', MFIX129_SALESTART='mfix129SaleStart', MFIX129_SALENO='mfix129SaleNo', MFIX129_DAILY='mfix129Daily';
 function mfix129SettingsGet(){try{return Object.assign({sound:true,expensive:true,expensiveAt:1500,paymentConfirm:true,paymentAt:2500,darkAuto:true,blockZeroStock:true},JSON.parse(localStorage.getItem(MFIX129_SETTINGS)||'{}')||{})}catch(_){return {sound:true,expensive:true,expensiveAt:1500,paymentConfirm:true,paymentAt:2500,darkAuto:true,blockZeroStock:true}}}
 function mfix129SettingsSet(x){try{localStorage.setItem(MFIX129_SETTINGS,JSON.stringify(x))}catch(_){}}
 function mfix129SaleEnsure(){try{if(!sessionStorage.getItem(MFIX129_SALENO)){const n=Number(localStorage.getItem(MFIX129_SALESEQ)||0)+1;localStorage.setItem(MFIX129_SALESEQ,String(n));sessionStorage.setItem(MFIX129_SALENO,String(n));sessionStorage.setItem(MFIX129_SALESTART,String(Date.now()))}}catch(_){}}
 function mfix129SaleClear(){try{sessionStorage.removeItem(MFIX129_SALENO);sessionStorage.removeItem(MFIX129_SALESTART)}catch(_){}}
 function mfix129SaleState(t,c='#334155'){const e=document.getElementById('mfix-pos-sale-state-1290');if(e){e.textContent=t;e.style.background=c}}
 function mfix129HeaderMeta(){const a=mfixPosCartGet800();const st=document.getElementById('mfix-pos-sale-state-1290');if(st)mfix129SaleState(a.length?'מכירה פעילה':'מכירה חדשה',a.length?'#0f766e':'#334155');const no=document.getElementById('mfix-pos-sale-no-1290');if(no)no.textContent='מכירה #'+(sessionStorage.getItem(MFIX129_SALENO)||'—');const tm=document.getElementById('mfix-pos-sale-timer-1290');if(tm){const x=Number(sessionStorage.getItem(MFIX129_SALESTART)||0);tm.textContent=x?'⏱ '+new Date(Date.now()-x).toISOString().slice(14,19):'⏱ 00:00'}}
 function mfix129RememberProduct(p){try{let a=JSON.parse(localStorage.getItem(MFIX129_RECENTS)||'[]');a=a.filter(x=>mfixPosProdKey1000(x)!==mfixPosProdKey1000(p));a.unshift(mfixPosSlim1000(p));localStorage.setItem(MFIX129_RECENTS,JSON.stringify(a.slice(0,10)))}catch(_){}}
 function mfix129RememberSearch(q){q=String(q||'').trim();if(q.length<2)return;try{let a=JSON.parse(localStorage.getItem(MFIX129_SEARCHES)||'[]');a=[q,...a.filter(x=>x!==q)].slice(0,5);localStorage.setItem(MFIX129_SEARCHES,JSON.stringify(a));mfix129RenderSearchHistory()}catch(_){}}
 function mfix129RenderSearchHistory(){const e=document.getElementById('mfix-pos-search-history-1290');if(!e)return;let a=[];try{a=JSON.parse(localStorage.getItem(MFIX129_SEARCHES)||'[]')}catch(_){}e.innerHTML=a.map(x=>`<button data-q="${esc(x)}" style="border:0;border-radius:999px;padding:4px 9px;background:#e2e8f0;font-size:11px">${esc(x)}</button>`).join('');e.querySelectorAll('button').forEach(b=>b.onclick=()=>{const i=document.getElementById('mfix-pos-search-800');if(i){i.value=b.dataset.q;i.dispatchEvent(new Event('input',{bubbles:true}));i.focus()}})}


 const MFIX131_RELATED='mfix131Related';
 const MFIX131_NOTE='mfix131SaleNote';


 const MFIX135_LASTPRICE='mfix135LastSoldPrice';
 const MFIX135_PHONE_META='mfix135PhoneMeta';
 const MFIX135_PRICECHECK='mfix135PriceCheckOnly';
 const MFIX135_DISCOUNT='mfix135DiscountDraft';

 function mfix135PhoneMetaGet(){try{return JSON.parse(sessionStorage.getItem(MFIX135_PHONE_META)||'{}')||{}}catch(_){return{}}}
 function mfix135PhoneMetaSet(x){try{sessionStorage.setItem(MFIX135_PHONE_META,JSON.stringify(x||{}))}catch(_){}}
 function mfix135LastPriceGet(){try{return JSON.parse(localStorage.getItem(MFIX135_LASTPRICE)||'{}')||{}}catch(_){return{}}}
 function mfix135RecordLastSold(){try{const map=mfix135LastPriceGet();mfixPosCartGet800().forEach(x=>{if(x?.key)map[x.key]={price:Number(x.price||0),at:Date.now(),name:x.name||''}});localStorage.setItem(MFIX135_LASTPRICE,JSON.stringify(map))}catch(_){}}
 function mfix135LastSoldFor(product){try{return mfix135LastPriceGet()[String(product?.Barcode||product?.Name||product?.CatalogNumber||productTitle(product,''))]||null}catch(_){return null}}
 function mfix135CartProfit(){const a=mfixPosCartGet800();let sales=0,cost=0,known=0;a.forEach(x=>{const q=Number(x.qty||1),p=Number(x.price||0),c=Number(x.cost);sales+=p*q;if(Number.isFinite(c)){cost+=c*q;known+=q}});return {sales,cost,profit:sales-cost,known,totalUnits:a.reduce((n,x)=>n+Number(x.qty||1),0)}}
 function mfix135ProfitPanel(){document.getElementById('mfix-profit-1350')?.remove();const x=mfix135CartProfit(),ov=document.createElement('div');ov.id='mfix-profit-1350';ov.dir='rtl';ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0008;display:flex;align-items:center;justify-content:center;font-family:Arial';const box=document.createElement('div');box.style.cssText='width:min(520px,92vw);background:white;border-radius:20px;padding:20px';box.innerHTML=`<div style="font-size:24px;font-weight:1000">💰 רווח משוער</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:14px"><div style="background:#f8fafc;padding:12px;border-radius:12px;text-align:center"><small>מכירה</small><div style="font-size:24px;font-weight:1000">₪${x.sales.toLocaleString('he-IL',{maximumFractionDigits:2})}</div></div><div style="background:#f8fafc;padding:12px;border-radius:12px;text-align:center"><small>עלות ידועה</small><div style="font-size:24px;font-weight:1000">₪${x.cost.toLocaleString('he-IL',{maximumFractionDigits:2})}</div></div><div style="background:#ecfdf5;padding:12px;border-radius:12px;text-align:center"><small>רווח גולמי משוער</small><div style="font-size:24px;font-weight:1000;color:#15803d">₪${x.profit.toLocaleString('he-IL',{maximumFractionDigits:2})}</div></div></div><div style="margin-top:10px;color:#64748b;font-size:12px">מבוסס על מוצרים שבהם נמצא מחיר עלות. לא דוח חשבונאי.</div><button id="mfix135-profit-close" style="width:100%;height:45px;margin-top:14px;border:0;border-radius:11px;background:#0f172a;color:white;font-weight:1000">סגור</button>`;ov.appendChild(box);document.documentElement.appendChild(ov);box.querySelector('#mfix135-profit-close').onclick=()=>ov.remove()}
 function mfix135BelowCost(product){const c=mfix131Cost(product),p=Number(product?.Price||0);if(c!==null&&Number.isFinite(c)&&p<c)return confirm(`⚠️ מחיר המכירה ₪${p.toLocaleString('he-IL')} נמוך מהעלות ₪${c.toLocaleString('he-IL')}\nלהוסיף בכל זאת?`);return true}
 function mfix135LowStock(){const items=mfix134AllKnownProducts().filter(x=>{const st=Number(stock(x));return Number.isFinite(st)&&st<=2}).sort((a,b)=>Number(stock(a))-Number(stock(b)));mfix129ShowShelf('⚠️ מלאי נמוך',items)}
 function mfix135PhoneChecklist(product){
   if(!mfix134LooksLikePhone(product))return;
   document.getElementById('mfix-phone-check-1350')?.remove();
   const key=mfix131ProductKey(product),meta=mfix135PhoneMetaGet(),saved=meta[key]||{},ov=document.createElement('div');ov.id='mfix-phone-check-1350';ov.dir='rtl';ov.style.cssText='position:fixed;z-index:2147483647;left:18px;bottom:18px;width:min(430px,92vw);background:#0f172a;color:white;border-radius:18px;padding:14px;box-shadow:0 14px 38px #0008;font-family:Arial';
   ov.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><div><b style="font-size:19px">📱 מכירת טלפון</b><div style="font-size:11px;color:#cbd5e1">${esc(productTitle(product,'טלפון'))}</div></div><button id="mfix135-ph-close" style="border:0;background:transparent;color:white;font-size:18px">✕</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px">${['כיסוי','מגן מסך','מטען','העברת נתונים'].map(x=>`<label style="background:#ffffff10;border-radius:10px;padding:9px"><input type="checkbox" data-item="${x}" ${saved[x]?'checked':''}> ${x}</label>`).join('')}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px"><select id="mfix135-warranty" style="height:38px;border-radius:9px"><option value="">אחריות</option><option ${saved.warranty==='12 חודשים'?'selected':''}>12 חודשים</option><option ${saved.warranty==='6 חודשים'?'selected':''}>6 חודשים</option><option ${saved.warranty==='3 חודשים'?'selected':''}>3 חודשים</option><option ${saved.warranty==='ללא אחריות'?'selected':''}>ללא אחריות</option></select><select id="mfix135-condition" style="height:38px;border-radius:9px"><option value="">מצב</option><option ${saved.condition==='חדש'?'selected':''}>חדש</option><option ${saved.condition==='מחודש'?'selected':''}>מחודש</option><option ${saved.condition==='יד שנייה'?'selected':''}>יד שנייה</option></select></div><div style="margin-top:9px;background:#7c2d12;border-radius:10px;padding:8px;font-weight:900">📲 תזכורת: בדוק / בחר IMEI לפני סיום</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px"><button id="mfix135-bundle" style="height:40px;border:0;border-radius:10px;background:#16a34a;color:white;font-weight:1000">🎁 חבילת מכירה</button><button id="mfix135-ph-save" style="height:40px;border:0;border-radius:10px;background:#2563eb;color:white;font-weight:1000">שמור</button></div>`;
   document.documentElement.appendChild(ov);
   const save=()=>{const x={};ov.querySelectorAll('input[data-item]').forEach(i=>x[i.dataset.item]=i.checked);x.warranty=ov.querySelector('#mfix135-warranty').value;x.condition=ov.querySelector('#mfix135-condition').value;const all=mfix135PhoneMetaGet();all[key]=x;mfix135PhoneMetaSet(all);toast('פרטי הטלפון נשמרו ✓',1200)};
   ov.querySelector('#mfix135-ph-save').onclick=save;ov.querySelector('#mfix135-ph-close').onclick=()=>ov.remove();ov.querySelector('#mfix135-bundle').onclick=()=>mfix131ShowRecommendations(product);
 }
 function mfix135DiscountBox(){const total=mfixPosTotal800();if(!(total>0)){toast('אין סכום בסל',1200);return}document.getElementById('mfix-discount-1350')?.remove();const ov=document.createElement('div');ov.id='mfix-discount-1350';ov.dir='rtl';ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0008;display:flex;align-items:center;justify-content:center;font-family:Arial';const box=document.createElement('div');box.style.cssText='width:min(470px,92vw);background:white;border-radius:20px;padding:18px';box.innerHTML=`<div style="font-size:23px;font-weight:1000">🏷️ הנחה מהירה</div><div style="font-size:13px;color:#64748b;margin-top:4px">מחשבון יעד בטוח — לא משנה מחיר ביש חשבונית</div><div id="mfix135-disc-res" style="font-size:38px;font-weight:1000;text-align:center;margin:15px 0">₪${total.toLocaleString('he-IL',{maximumFractionDigits:2})}</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"><button data-p="5">5%</button><button data-p="10">10%</button><button data-a="50">₪50</button></div><button id="mfix135-disc-close" style="width:100%;height:42px;margin-top:10px;border:0;border-radius:10px;background:#0f172a;color:white;font-weight:900">סגור</button>`;ov.appendChild(box);document.documentElement.appendChild(ov);box.querySelectorAll('[data-p],[data-a]').forEach(b=>{b.style.cssText='height:48px;border:0;border-radius:10px;background:#e2e8f0;font-weight:1000';b.onclick=()=>{const v=b.dataset.p?total*(1-Number(b.dataset.p)/100):Math.max(0,total-Number(b.dataset.a));box.querySelector('#mfix135-disc-res').textContent='יעד ₪'+v.toLocaleString('he-IL',{maximumFractionDigits:2});sessionStorage.setItem(MFIX135_DISCOUNT,String(v))}});box.querySelector('#mfix135-disc-close').onclick=()=>ov.remove()}
 function mfix135SmartCartText(){const a=mfixPosCartGet800();let phones=0,acc=0;for(const x of a){const p={Body:x.name,Name:x.barcode,Barcode:x.barcode,Price:x.price};if(mfix134LooksLikePhone(p))phones+=Number(x.qty||1);else acc+=Number(x.qty||1)}return `${a.reduce((n,x)=>n+Number(x.qty||1),0)} פריטים · ${phones} טלפונים · ${acc} אביזרים`}
 function mfix131Cost(product){
   const vals=[
     product?.PriceProvider,product?.priceProvider,product?.CostPrice,product?.costPrice,
     product?.PurchasePrice,product?.purchasePrice,product?.ProviderPrice,product?.providerPrice
   ].map(Number).filter(Number.isFinite);
   return vals.length?vals[0]:null;
 }
 function mfix131RelatedGet(){
   try{return JSON.parse(localStorage.getItem(MFIX131_RELATED)||'{}')||{}}catch(_){return{}}
 }
 function mfix131RelatedSet(x){try{localStorage.setItem(MFIX131_RELATED,JSON.stringify(x||{}))}catch(_){}}
 function mfix131ProductKey(p){return String(p?.__mfixManualKey||p?.ID||p?.Barcode||p?.Name||p?.CatalogNumber||productTitle(p,'')).trim()}
 function mfix131GetRelated(product){
   const m=mfix131RelatedGet(),a=m[mfix131ProductKey(product)]||[];
   return Array.isArray(a)?a:[];
 }
 // Distinguish between "no manual setup yet" and "explicitly saved as empty".
 // This lets the user select nothing / ריק and have that choice persist.
 function mfix131HasExplicitRelated(product){
   const m=mfix131RelatedGet(),k=mfix131ProductKey(product);
   return Object.prototype.hasOwnProperty.call(m,k) && Array.isArray(m[k]);
 }
 function mfix131Candidates(product){
   let all=[];
   try{all.push(...mfixPosFavsGet1000())}catch(_){}
   try{all.push(...mfixPosBestList1220())}catch(_){}
   try{all.push(...JSON.parse(localStorage.getItem(MFIX129_RECENTS)||'[]'))}catch(_){}
   const self=mfix131ProductKey(product),seen=new Set();
   return all.filter(x=>{const k=mfix131ProductKey(x);if(!k||k===self||seen.has(k))return false;seen.add(k);return true}).slice(0,30);
 }
 
 const MFIX134_PHONES='mfix134PhoneProducts';

 function mfix134PhoneSetGet(){try{return new Set(JSON.parse(localStorage.getItem(MFIX134_PHONES)||'[]'))}catch(_){return new Set()}}
 function mfix134PhoneSetSave(set){try{localStorage.setItem(MFIX134_PHONES,JSON.stringify([...set]))}catch(_){}}
 function mfix134LooksLikePhone(product){
   const key=mfix131ProductKey(product),manual=mfix134PhoneSetGet();
   if(manual.has(key))return true;
   const t=productTitle(product,'').toLowerCase();
   // Conservative automatic detection: phone model words, not generic accessories.
   return /(^|\s)(iphone|galaxy\s?[aszmf]\d|samsung\s?[aszmf]\d|redmi\s|poco\s|xiaomi\s\d|pixel\s\d|oppo\s|realme\s|honor\s|oneplus\s|טלפון|סלולרי)(\s|$)/i.test(t);
 }
 function mfix134AllKnownProducts(){
   const out=[],seen=new Set(),push=x=>{if(!x)return;const k=mfix131ProductKey(x);if(!k||seen.has(k))return;seen.add(k);out.push(x)};
   try{mfixPosFavsGet1000().forEach(push)}catch(_){}
   try{mfixPosBestList1220().forEach(push)}catch(_){}
   try{JSON.parse(localStorage.getItem(MFIX129_RECENTS)||'[]').forEach(push)}catch(_){}
   try{Object.values(mfix131RelatedGet()).flat().forEach(push)}catch(_){}
   return out;
 }