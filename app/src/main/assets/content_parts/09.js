   // Local inventory cache first: instant when available.
   const local=await mfixLocalPosSearch16916(q);
   let exact=mfixExactScannedMatch16916(local,q);
   if(exact)return exact;

   // Network remains the reliable fallback when cache is not ready/stale.
   const remote=await mfixPosSearch800(q);
   exact=mfixExactScannedMatch16916(remote,q);
   return exact;
 }

 function mfixRemoveScannedSuffix16916(target,q){
   try{
     if(!target || !(target.matches?.('input,textarea')))return;
     const value=String(target.value||'');
     if(!value.endsWith(q))return;
     const next=value.slice(0,-q.length);
     const proto=target.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
     const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
     setter?setter.call(target,next):target.value=next;
     target.dispatchEvent(new Event('input',{bubbles:true}));
     target.dispatchEvent(new Event('change',{bubbles:true}));
   }catch(_){}
 }

 async function mfixHandleGlobalScan16916(q){
   if(document.getElementById('mfix-scan-preview-1300')){
     toast('סיים קודם את בדיקת המוצר שעל המסך',1200);
     return;
   }
   if(mfixGlobalScanBusy16916 || window.__mfixPosAdding800){
     toast('⏳ הסריקה הקודמת עדיין בטיפול',900);
     return;
   }
   mfixGlobalScanBusy16916=true;
   try{
     mfixScannerState1280('🔎 מזהה ברקוד…',true);
     const product=await mfixFindScannedProduct16916(q);
     if(!product){
       mfixScannerState1280('● לא נמצא מוצר',true);
       mfixBeep1280(false);
       toast('לא נמצא מוצר לברקוד: '+q,1800);
       setTimeout(()=>mfixScannerState1280('● מוכן לסריקה',false),1200);
       return;
     }

     // IMPORTANT: every scanned product is shown first in the large preview.
     // Nothing is added automatically. The cashier explicitly chooses "הוסף לסל".
     const search=document.getElementById('mfix-pos-search-800');
     const results=document.getElementById('mfix-pos-results-800');
     if(search){search.value='';}
     if(results){results.innerHTML='';}
     mfixScannerState1280('● נמצא מוצר — בדוק והחלט',false);
     mfix130ShowScanPreview(product,async(prod)=>await mfixPosAddProduct800(prod));
   }catch(_){
     mfixScannerState1280('● שגיאה בסריקה',true);
     mfixBeep1280(false);
     toast('אירעה שגיאה בטיפול בסריקה',1600);
   }finally{
     // mfixPosAddProduct800 keeps its own short duplicate lock; release scanner after it.
     setTimeout(()=>{mfixGlobalScanBusy16916=false},700);
   }
 }

 if(!window.__MFIX_GLOBAL_BARCODE_16916__){
   window.__MFIX_GLOBAL_BARCODE_16916__=1;
   document.addEventListener('keydown',e=>{
     if(!mfixPosVisibleForGlobalScan16916()){
       mfixGlobalScanKeys16916=[];
       return;
     }
     if(e.ctrlKey||e.metaKey||e.altKey)return;

     if(e.key==='Enter'){
       const keys=mfixGlobalScanKeys16916;
       mfixGlobalScanKeys16916=[];
       if(!keys.length)return;
       const q=keys.map(x=>x.k).join('').trim();
       const times=keys.map(x=>x.t);
       const gaps=[];
       for(let i=1;i<times.length;i++)gaps.push(times[i]-times[i-1]);
       const avg=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:999;
       const max=gaps.length?Math.max(...gaps):999;
       const scannerLike=q.length>=5 && gaps.length>=4 && avg<=95 && max<=260;
       if(!scannerLike)return;

       // Stop the normal Enter handlers so POS does not also run its focused search handler.
       e.preventDefault();
       e.stopImmediatePropagation();
       mfixRemoveScannedSuffix16916(document.activeElement,q);
       mfixHandleGlobalScan16916(q);
       return;
     }

     if(e.key.length===1){
       const now=Date.now();
       mfixGlobalScanKeys16916.push({k:e.key,t:now});
       // Keep only one recent scanner-sized sequence. Slow manual typing naturally fails the timing test.
       mfixGlobalScanKeys16916=mfixGlobalScanKeys16916.filter(x=>now-x.t<2200).slice(-40);
     }
   },true);
 }

 function mfixPosRenderCart800(){
   const box=document.getElementById('mfix-pos-cart-800');
   const total=document.getElementById('mfix-pos-total-800');
   if(!box||!total)return;
   const a=mfixPosCartGet800();
   box.innerHTML='';
   a.forEach((x,i)=>{
     const row=document.createElement('div');
     row.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;align-items:center;padding:4px 4px;border-bottom:1px solid #e5e7eb';
     row.innerHTML=`<div style="min-width:0"><b style="display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.name||'מוצר')}</b><div style="font-size:10px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.barcode||'')}</div></div>
       <div style="font-weight:900;font-size:13px">₪${(Number(x.price||0)*Number(x.qty||1)).toLocaleString('he-IL',{maximumFractionDigits:2})}</div>
       <div style="display:flex;gap:3px;align-items:center"><button data-a="minus">−</button><b style="min-width:16px;text-align:center">${x.qty||1}</b><button data-a="plus">+</button></div>`;
     row.querySelectorAll('button').forEach(b=>{
       b.style.cssText='width:28px;height:28px;border:0;border-radius:7px;background:#e2e8f0;font-weight:900';
       b.onclick=()=>{
         const arr=mfixPosCartGet800();
         if(!arr[i])return;
         if(b.dataset.a==='plus')arr[i].qty=(arr[i].qty||1)+1;
         else{arr[i].qty=(arr[i].qty||1)-1;if(arr[i].qty<=0)arr.splice(i,1)}
         mfixPosCartSet800(arr);
       };
     });
     box.appendChild(row);
   });
   const countEl=document.getElementById('mfix-pos-items-count-1080');
   if(countEl){
     // The MFIX cart is the source of truth here. Native YesInvoice DOM rows can
     // contain layout/helper rows and previously caused the badge to show 2 for 1 item.
     const units=a.reduce((n,x)=>n+Number(x.qty||1),0);
     const unitLabel=units===1?'פריט':'פריטים';
     countEl.textContent=units+' '+unitLabel;
     const hc=document.getElementById('mfix-pos-head-count-1280');if(hc)hc.textContent='🛒 '+units;
     const sc=document.getElementById('mfix-pos-smartcart-1350');if(sc)sc.textContent=units+' '+unitLabel;
   }
   if(!a.length){
     box.innerHTML='<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px;font-weight:800">מוכן למכירה חדשה · סרוק מוצר</div>';
   }
   const sum=mfixPosTotal800();
   total.textContent='₪'+sum.toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});
   const top=document.getElementById('mfix-pos-top-total-1000');
   if(top)top.textContent='₪'+sum.toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});mfix129HeaderMeta();
 }

 async function mfixPosGeneral800(){
   const price=await mfixAskGeneralProductPrice639();
   if(!(price>0))return;
   // Keep the typed name separate from the fixed YesInvoice product identity.
   // Blank name means the native/default name remains exactly "מוצר כללי".
   const customName=String(window.__mfixGeneralCustomName639||'').trim();
   const displayName=customName||'מוצר כללי';
   const gp={Body:displayName,Name:displayName,Price:price,__mfixGeneralPrice640:price,__mfixGeneralCustomName:customName};
   mfixPosProgress1270('start',gp,'מוצר כללי · ₪'+price.toLocaleString('he-IL',{maximumFractionDigits:2}));
   setTimeout(()=>{if(document.getElementById('mfix-pos-progress-1270'))mfixPosProgress1270('invoice',gp,'מוסיף מוצר כללי לחשבונית…')},350);
   setTimeout(()=>{if(document.getElementById('mfix-pos-progress-1270'))mfixPosProgress1270('wait',gp,'ממתין לאישור מיש חשבונית…')},1000);
   document.getElementById('mfix-pos-800')?.remove();
   try{sessionStorage.setItem(MFIX_POS_MODE_800,'1')}catch(_){}
   let ok=false;
   // IMPORTANT: pass the custom name through the POS path. Previously this call
   // dropped the name and therefore the invoice always stayed "מוצר כללי".
   try{ok=await mfixAddGeneralProduct639AtLite700(price,customName)}catch(_){ok=false}
   if(ok){
     mfixPosCartAdd800(gp,price);
     mfixPosAddNotice1260(true,gp);
   }else{
     mfixPosAddNotice1260(false,gp);
   }
   setTimeout(()=>{try{mfixPosOpen800()}catch(_){}},700);
 }



 const MFIX136_FORCE_POS_AFTER_NEW='mfix136ForcePosAfterNew';
 function mfix136ArmNewSaleReturn(){try{sessionStorage.setItem(MFIX136_FORCE_POS_AFTER_NEW,'1')}catch(_){}}
 function mfix136TryReturnToPos(){
   try{
     if(sessionStorage.getItem(MFIX136_FORCE_POS_AFTER_NEW)!=='1')return false;
     const home=(location.pathname||'').toLowerCase().replace(/\/+$/,'')==='/invoice/main';
     if(!home)return false;
     sessionStorage.removeItem(MFIX136_FORCE_POS_AFTER_NEW);
     sessionStorage.setItem(MFIX_POS_MODE_800,'1');
     document.getElementById('mfix-pos-800')?.remove();
     setTimeout(()=>{try{mfixHideLegacyQuickBar1010();mfixPosOpen800();mfixPosCartSet800([]);mfixPosRenderCart800();toast('מכירה חדשה מוכנה ✓',1500)}catch(_){}},220);
     return true;
   }catch(_){return false}
 }
 if(!window.__mfix136NewSaleWatch){
   window.__mfix136NewSaleWatch=setInterval(()=>{try{mfix136TryReturnToPos()}catch(_){}},600);
 }
 const MFIX_POS_CANCEL_1020='mfixPosCancel1020';
 const MFIX_POS_CANCEL_PERSIST_1070='mfixPosCancelPending1070';
 const MFIX_POS_FORCE_RESET_1090='mfixPosForceReset1090';

 function mfixPosResetSale1020(){
   try{
     sessionStorage.setItem(MFIX_POS_CART_800,'[]');
     sessionStorage.removeItem('mfixCart640');
     sessionStorage.removeItem('mfixPendingProduct');
     sessionStorage.removeItem('mfixPendingProducts');
     sessionStorage.removeItem('mfixLiteGeneralResume700');
     sessionStorage.removeItem('mfixLiteGeneralPrice700');
     sessionStorage.removeItem(MFIX_POS_CUSTOMER_NAME_900);
     sessionStorage.removeItem(MFIX_POS_CUSTOMER_PHONE_900);
     sessionStorage.removeItem(MFIX131_NOTE);
     sessionStorage.removeItem(MFIX135_PHONE_META);
     sessionStorage.removeItem(MFIX135_DISCOUNT);
     sessionStorage.removeItem(MFIX_POS_TOTAL_OVERRIDE_1365);
     sessionStorage.removeItem(MFIX_POS_RETURN_AFTER_ISSUE_910);
     sessionStorage.removeItem(MFIX_POS_CANCEL_1020);
     localStorage.removeItem(MFIX_POS_CANCEL_PERSIST_1070);
     localStorage.removeItem(MFIX_POS_FORCE_RESET_1090);
     sessionStorage.setItem(MFIX_POS_MODE_800,'1');mfix129SaleClear();
   }catch(_){}
 }

 function mfixPosFindNativeHome1020(){
   const links=[...document.querySelectorAll('a[href],button,[role="button"]')].filter(el=>{
     if(el.closest('#mfix-pos-800,#mfix-pos-settings-800'))return false;
     if(el.offsetParent===null)return false;
     const href=String(el.getAttribute?.('href')||'');
     const txt=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
     return /\/invoice\/main(?:[?#/]|$)/i.test(href) || /דף\s*הבית|ראשי/.test(txt);
   });
   return links[0]||null;
 }

 function mfixPosConfirmReturnDialog1020(){
   const dialogs=[...document.querySelectorAll('div.pop1,div.pop2,[role="dialog"],.modal,.popup,body>div')].filter(d=>{
     if(d.offsetParent===null)return false;
     if(d.closest('#mfix-pos-800,#mfix-pos-settings-800'))return false;
     const t=(d.innerText||'').replace(/\s+/g,' ').trim();
     return t.length<800 && /(לחזור|חזרה|לצאת|לעזוב|שינויים.*לא.*יישמרו|האם.*לחזור)/.test(t);
   });
   for(const d of dialogs){
     const controls=[...d.querySelectorAll('button,a,input[type="button"],input[type="submit"],[role="button"]')].filter(x=>x.offsetParent!==null);
     const yes=controls.find(x=>{
       const t=((x.innerText||x.value||x.textContent||'')+'').replace(/\s+/g,' ').trim();
       return /^(כן|אישור|אשר|חזור|חזרה|אישור חזרה|צא|יציאה)$/.test(t);
     });
     if(yes){ yes.click(); return true; }
   }
   return false;
 }

 async function mfixPosCancelSale1020(){
   if(window.__mfixCancelSale1020)return;
   if(!confirm('לבטל את המכירה ולמחוק את כל הפריטים?'))return;
   window.__mfixCancelSale1020=true;

   // Mark only for reopening a fresh POS after YesInvoice finishes its native return.
   try{
     localStorage.setItem(MFIX_POS_FORCE_RESET_1090,'1');
     localStorage.setItem(MFIX_POS_CANCEL_PERSIST_1070,JSON.stringify({armed:true,at:Date.now()}));
     sessionStorage.setItem(MFIX_POS_CANCEL_1020,JSON.stringify({armed:true,at:Date.now()}));
     sessionStorage.removeItem(MFIX_POS_MODE_800);
   }catch(_){}

   document.getElementById('mfix-pos-settings-800')?.remove();
   document.getElementById('mfix-pos-800')?.remove();

   // FIRST: ask YesInvoice to cancel/leave the document.
   const home=mfixPosFindNativeHome1020();
   if(home){
     try{home.click()}catch(_){}
   }else{
     try{location.href='/invoice/main?mfixcancel=1'}catch(_){}
   }

   // SECOND: clear MFIX sale data immediately, exactly as requested.
   // This no longer depends on route/query/timing.
   try{
     sessionStorage.setItem(MFIX_POS_CART_800,'[]');
     sessionStorage.removeItem('mfixCart640');
     sessionStorage.removeItem('mfixPendingProduct');
     sessionStorage.removeItem('mfixPendingProducts');
     sessionStorage.removeItem('mfixLiteGeneralResume700');
     sessionStorage.removeItem('mfixLiteGeneralPrice700');
     sessionStorage.removeItem(MFIX_POS_CUSTOMER_NAME_900);
     sessionStorage.removeItem(MFIX_POS_CUSTOMER_PHONE_900);
     sessionStorage.removeItem(MFIX_POS_RETURN_AFTER_ISSUE_910);
   }catch(_){}

   toast('המסמך מתבטל וה-POS נוקה',1800);

   // Confirm YesInvoice's native return dialog if it appears.
   let tries=0;
   const timer=setInterval(()=>{
     tries++;
     const path=(location.pathname||'').toLowerCase().replace(/\/+$/,'');
     if(path==='/invoice/main'){
       clearInterval(timer);
       try{
         sessionStorage.setItem(MFIX_POS_CART_800,'[]');
         sessionStorage.removeItem(MFIX_POS_CUSTOMER_NAME_900);
         sessionStorage.removeItem(MFIX_POS_CUSTOMER_PHONE_900);
         sessionStorage.setItem(MFIX_POS_MODE_800,'1');
         localStorage.removeItem(MFIX_POS_FORCE_RESET_1090);
         localStorage.removeItem(MFIX_POS_CANCEL_PERSIST_1070);
         sessionStorage.removeItem(MFIX_POS_CANCEL_1020);
       }catch(_){}
       window.__mfixCancelSale1020=false;
       document.getElementById('mfix-pos-800')?.remove();
       setTimeout(()=>{
         try{
           mfixPosOpen800();
           mfixPosCartSet800([]);
           mfixPosRenderCart800();
         }catch(_){}
       },300);
       return;
     }
     mfixPosConfirmReturnDialog1020();
     if(tries>=50){
       clearInterval(timer);
       window.__mfixCancelSale1020=false;
     }
   },200);
 }

 function mfixCancelLanding1060(){
   try{
     const home=(location.pathname||'').toLowerCase().replace(/\/+$/,'')==='/invoice/main';
     const u=new URL(location.href);
     if(!home || u.searchParams.get('mfixcancel')!=='1')return false;
     mfixPosCartSet800([]);
     sessionStorage.removeItem(MFIX_POS_CUSTOMER_NAME_900);
     sessionStorage.removeItem(MFIX_POS_CUSTOMER_PHONE_900);
     sessionStorage.removeItem(MFIX_POS_RETURN_AFTER_ISSUE_910);
     sessionStorage.removeItem(MFIX_POS_CANCEL_1020);
     sessionStorage.setItem(MFIX_POS_MODE_800,'1');
     document.getElementById('mfix-pos-800')?.remove();
     document.getElementById('mfix-next-step-450')?.remove();
     document.getElementById('mfix-quickbar-restore-501')?.remove();
     u.searchParams.delete('mfixcancel');
     history.replaceState(history.state,'',u.pathname+(u.search||'')+(u.hash||''));
     setTimeout(()=>{try{if(!mfix136TryReturnToPos()){mfixHideLegacyQuickBar1010();mfixPosOpen800();mfixPosRenderCart800()}}catch(_){}},350);
     return true;
   }catch(_){return false}
 }


 function mfixPosCancelLandingWatch1070(){
   try{
     let pending=null;
     try{pending=JSON.parse(localStorage.getItem(MFIX_POS_CANCEL_PERSIST_1070)||'null')}catch(_){}
     if(!pending?.armed)return false;

     const path=(location.pathname||'').toLowerCase().replace(/\/+$/,'');
     if(path!=='/invoice/main')return false;

     // Landing on YesInvoice home proves that the native document was abandoned.
     // Only now clear MFIX, then reopen a clean POS.
     mfixPosResetSale1020();

     try{
       const u=new URL(location.href);
       u.searchParams.delete('mfixcancel');
       u.searchParams.delete('mfixpos');
       history.replaceState(history.state,'',u.pathname+(u.search||'')+(u.hash||''));
     }catch(_){}

     document.getElementById('mfix-pos-settings-800')?.remove();
     document.getElementById('mfix-pos-800')?.remove();
     mfixHideLegacyQuickBar1010();

     setTimeout(()=>{
       try{
         mfixPosOpen800();
         mfixPosRenderCart800();
         const total=document.getElementById('mfix-pos-total-800');
         const top=document.getElementById('mfix-pos-top-total-1000');
         if(total)total.textContent='₪0.00';
         if(top)top.textContent='₪0.00';
         toast('המכירה בוטלה — POS אופס ✓',1800);
       }catch(_){}
     },250);
     return true;
   }catch(_){return false}
 }


 function mfixPosForceResetLanding1090(){
   try{
     const home=(location.pathname||'').toLowerCase().replace(/\/+$/,'')==='/invoice/main';
     if(!home)return false;

     const forced=localStorage.getItem(MFIX_POS_FORCE_RESET_1090)==='1';
     let pending=null;
     try{pending=JSON.parse(localStorage.getItem(MFIX_POS_CANCEL_PERSIST_1070)||'null')}catch(_){}
     if(!forced && !pending?.armed)return false;

     // Native YesInvoice cancellation already succeeded because we are back on /invoice/main.
     // Now wipe only current-sale data. Favorites/categories/settings stay untouched.
     mfixPosResetSale1020();

     document.getElementById('mfix-pos-settings-800')?.remove();
     document.getElementById('mfix-pos-800')?.remove();
     document.getElementById('mfix-next-step-450')?.remove();
     document.getElementById('mfix-quickbar-restore-501')?.remove();

     try{
       const u=new URL(location.href);
       u.searchParams.delete('mfixcancel');
       u.searchParams.delete('mfixpos');
       u.searchParams.delete('mfixresetpos');
       history.replaceState(history.state,'',u.pathname+(u.search||'')+(u.hash||''));
     }catch(_){}

     setTimeout(()=>{
       try{
         mfixHideLegacyQuickBar1010();
         mfixPosOpen800();
         mfixPosCartSet800([]);
         const n=document.getElementById('mfix-pos-customer-name-900');
         const ph=document.getElementById('mfix-pos-customer-phone-900');
         if(n)n.value='';
         if(ph)ph.value='';
         mfixPosRenderCart800();
         toast('המכירה בוטלה וה-POS נוקה ✓',1800);
       }catch(_){}
     },350);
     return true;
   }catch(_){return false}
 }

 function mfixPosResumeCancel1020(){
   let st=null;
   try{st=JSON.parse(sessionStorage.getItem(MFIX_POS_CANCEL_1020)||'null')}catch(_){}
   const path=(location.pathname||'').toLowerCase();
   let q=false;
   try{q=new URLSearchParams(location.search).get('mfixcancel')==='1'}catch(_){}
   if(path!=='/invoice/main' && path!=='/invoice/main/')return;
   if(!st?.armed && !q)return;

   // We are definitely back on YesInvoice home: now it is safe to reset MFIX.
   mfixPosResetSale1020();

   // Remove the cancellation marker from the URL without another navigation.
   try{
     const u=new URL(location.href);
     u.searchParams.delete('mfixcancel');
     history.replaceState(history.state,'',u.pathname+(u.search||'')+(u.hash||''));
   }catch(_){}

   // Make sure stale DOM from the previous POS is not reused.
   document.getElementById('mfix-pos-800')?.remove();
   setTimeout(()=>{try{mfixPosOpen800()}catch(_){}},250);
 }

 function mfixPosSettings800(){
   const old=document.getElementById('mfix-pos-settings-800');
   if(old){old.remove();return}
   const p=document.createElement('div');
   p.id='mfix-pos-settings-800';p.dir='rtl';
   p.style.cssText='position:fixed;top:74px;left:24px;z-index:2147483648;width:290px;max-height:calc(100vh - 95px);overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;background:#111827;color:white;border-radius:16px;padding:14px;box-shadow:0 12px 36px #0008;font-family:Arial;overscroll-behavior:contain';
   p.innerHTML=`<div style="font-size:18px;font-weight:900;margin-bottom:10px">⚙️ הגדרות MFIX POS</div>
     <label style="display:block;font-size:13px;margin-bottom:5px">גודל תוצאות</label>
     <input id="mfix-pos-font-800" type="range" min="16" max="30" value="20" style="width:100%">
     <button id="mfix-pos-print-800" style="width:100%;margin-top:10px;padding:10px;border:0;border-radius:10px;background:#0f766e;color:white;font-weight:900">🖨️ הדפס 80 מ״מ</button>
     <button id="mfix-pos-printer-settings-165" style="width:100%;margin-top:8px;padding:11px;border:0;border-radius:10px;background:#f59e0b;color:#111827;font-weight:1000">🖨️ הגדרות מדפסת</button>
     <button id="mfix-pos-addcat-1000" style="width:100%;margin-top:8px;padding:10px;border:0;border-radius:10px;background:#334155;color:white;font-weight:900">📂 קטגוריה חדשה</button>
     <button id="mfix-pos-managecats-1010" style="width:100%;margin-top:8px;padding:10px;border:0;border-radius:10px;background:#475569;color:white;font-weight:900">🗂️ מחיקת קטגוריה</button>
     <button id="mfix-pos-related-1340" style="width:100%;margin-top:8px;padding:10px;border:0;border-radius:10px;background:#4f46e5;color:white;font-weight:900">🔗 ניהול המלצות לטלפונים</button>
     <button id="mfix-pos-cancel-sale-1020" style="width:100%;margin-top:8px;padding:11px;border:0;border-radius:10px;background:#991b1b;color:white;font-weight:1000">🗑️ ביטול מכירה</button>`;
   document.documentElement.appendChild(p);
   const st129=mfix129SettingsGet(),adv=document.createElement('div');adv.innerHTML=`<div style="border-top:1px solid #ffffff22;margin-top:10px;padding-top:10px"><label style="display:flex;justify-content:space-between;margin:7px 0"><span>🔊 צלילים</span><input id="mfix129-sound" type="checkbox" ${st129.sound?'checked':''}></label><label style="display:flex;justify-content:space-between;margin:7px 0"><span>🌙 מצב לילה אוטומטי</span><input id="mfix129-dark" type="checkbox" ${st129.darkAuto?'checked':''}></label><label style="display:flex;justify-content:space-between;margin:7px 0"><span>🚫 אזהרת אין מלאי</span><input id="mfix129-stock" type="checkbox" ${st129.blockZeroStock?'checked':''}></label><label style="display:block;margin-top:8px">אישור מוצר יקר מ־₪ <input id="mfix129-expat" type="number" value="${st129.expensiveAt}" style="width:90px"></label><label style="display:block;margin-top:8px">אישור תשלום מ־₪ <input id="mfix129-payat" type="number" value="${st129.paymentAt}" style="width:90px"></label></div>`;p.appendChild(adv);const save129=()=>{const x=mfix129SettingsGet();x.sound=adv.querySelector('#mfix129-sound').checked;x.darkAuto=adv.querySelector('#mfix129-dark').checked;x.blockZeroStock=adv.querySelector('#mfix129-stock').checked;x.expensiveAt=Number(adv.querySelector('#mfix129-expat').value||1500);x.paymentAt=Number(adv.querySelector('#mfix129-payat').value||2500);mfix129SettingsSet(x);mfix129ApplyTheme();const sb=document.getElementById('mfix-pos-sound-1290');if(sb)sb.textContent=x.sound?'🔊':'🔇'};adv.querySelectorAll('input').forEach(i=>i.addEventListener('change',save129));
   p.querySelector('#mfix-pos-addcat-1000').onclick=()=>{
     const name=prompt('שם קטגוריה');if(!name?.trim())return;
     const a=mfixPosCatsGet1000();a.push({id:'c'+Date.now(),name:name.trim(),products:[]});mfixPosCatsSet1000(a);
     toast('הקטגוריה נוספה ✓',1400);p.remove();
     const pos=document.getElementById('mfix-pos-800'); if(pos){pos.remove();setTimeout(()=>mfixPosOpen800(),80)}
   };
   p.querySelector('#mfix-pos-managecats-1010').onclick=()=>{
     const a=mfixPosCatsGet1000();
     if(!a.length){toast('אין קטגוריות',1300);return}
     const name=prompt('כתוב בדיוק את שם הקטגוריה למחיקה:\n'+a.map(x=>x.name).join(' | '));
     if(!name)return;
     const next=a.filter(x=>x.name!==name.trim());
     if(next.length===a.length){toast('לא נמצאה קטגוריה',1500);return}
     mfixPosCatsSet1000(next);toast('הקטגוריה נמחקה',1300);p.remove();
     const pos=document.getElementById('mfix-pos-800'); if(pos){pos.remove();setTimeout(()=>mfixPosOpen800(),80)}
   };

   p.querySelector('#mfix-pos-related-1340').onclick=()=>mfix134ManageAllRelations();
   p.querySelector('#mfix-pos-cancel-sale-1020').onclick=()=>mfixPosCancelSale1020();
   p.querySelector('#mfix-pos-font-800').oninput=e=>{
     document.documentElement.style.setProperty('--mfix-pos-card-font',e.target.value+'px');
   };
   p.querySelector('#mfix-pos-print-800').onclick=()=>{
     const oldBtn=[...document.querySelectorAll('button')].find(b=>!b.closest('#mfix-pos-settings-800')&&/80/.test(b.innerText||'')&&/הדפס/.test(b.innerText||''));
     if(oldBtn)oldBtn.click();else toast('הדפסה זמינה לאחר הפקת המסמך',1800);
   };
   p.querySelector('#mfix-pos-printer-settings-165').onclick=()=>mfixOpenPrinterSettings165();
 }

 function mfixOpenPrinterSettings165(){
   document.getElementById('mfix-printer-settings-165')?.remove();
   const box=document.createElement('div'); box.id='mfix-printer-settings-165'; box.dir='rtl';