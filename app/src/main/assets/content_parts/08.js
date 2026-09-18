         clickNative(el);
         await sleep(220);
       }else if(a.type==='dblclick'){
         try{
           el.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true,view:window,detail:2}));
         }catch(_){}
         await sleep(250);
       }else if(a.type==='input'){
         const val=a.numeric?wanted:a.value;
         mfixPriceSetEditor1370(el,val);
         await sleep(120);
       }else if(a.type==='enter'){
         mfixPricePressEnter1370(el);
         await sleep(300);
       }
     }

     // Verify native total if possible, then sync POS and return.
     let actual=0;
     for(let i=0;i<35;i++){
       await sleep(120);
       actual=Number(mfixExactInvoiceTotal643?.()||0);
       if(actual>0 && Math.abs(actual-wanted)<0.011)break;
     }
     if(!(actual>0 && Math.abs(actual-wanted)<0.011))actual=wanted;

     try{
       sessionStorage.setItem(MFIX_POS_TOTAL_OVERRIDE_1365,String(actual));
       sessionStorage.setItem(MFIX_POS_MODE_800,'1');
     }catch(_){}
     document.getElementById('mfix-price-note-1370')?.remove();
     window.__mfixPosSuspendUntil820=0;
     setTimeout(()=>{
       try{
         document.getElementById('mfix-pos-800')?.remove();
         mfixPosOpen800();
         mfixPosRenderCart800();
         mfix129HeaderMeta();
       }catch(_){}
     },350);
     return true;
   }catch(_){
     document.getElementById('mfix-price-note-1370')?.remove();
     window.__mfixPosSuspendUntil820=0;
     toast('לא הצלחתי להשלים את הרצף שנלמד',2300);
     setTimeout(()=>{try{mfixPosOpen800()}catch(_){}},500);
     return false;
   }
 }

 async function mfixPosChangeFinalPrice1365(){
   const current=Number(mfixPosTotal800()||0);
   if(!(current>0)){toast('אין סכום במכירה',1700);return false}

   const raw=prompt('מחיר חדש לכל המכירה',current.toFixed(2));
   if(raw===null)return false;
   const wanted=Number(String(raw).replace(',','.'));
   if(!(wanted>0)){toast('מחיר לא תקין',1800);return false}

   document.getElementById('mfix-pos-800')?.remove();
   window.__mfixPosSuspendUntil820=Date.now()+60000;

   let target=null;
   for(let n=0;n<40&&!target;n++){
     target=mfixPriceTarget1370();
     if(!target)await sleep(100);
   }

   if(!target){
     const n=mfixPriceNote1370('לא מצאתי את אזור סה״כ לתשלום','#b91c1c');
     setTimeout(()=>n.remove(),2200);
     setTimeout(()=>{try{mfixPosOpen800()}catch(_){}},700);
     return false;
   }

   try{
     target.scope.scrollIntoView({behavior:'instant',block:'center'});
     target.amount.style.outline='4px solid #f59e0b';
     target.amount.style.outlineOffset='4px';
     target.amount.style.borderRadius='8px';
   }catch(_){}

   mfixPriceNote1370('🎯 דאבל־קליק רק על הסכום המסומן. אחרי שנפתח שדה המחיר אני אכניס ₪'+wanted+' ואעשה Enter');

   return await new Promise(resolve=>{
     let done=false;

     const cleanup=()=>{
       document.removeEventListener('dblclick',onDbl,true);
       clearTimeout(timeout);
       try{
         target.amount.style.outline='';
         target.amount.style.outlineOffset='';
       }catch(_){}
     };

     const finish=(ok,actual=0,msg='')=>{
       if(done)return;
       done=true;
       cleanup();
       const n=document.getElementById('mfix-price-note-1370');
       if(ok){
         const finalTotal=Number(actual||wanted);
         try{sessionStorage.setItem(MFIX_POS_TOTAL_OVERRIDE_1365,String(finalTotal))}catch(_){}
         if(n){
           n.style.background='#047857';
           n.textContent='✓ המחיר שונה ל־₪'+finalTotal.toLocaleString('he-IL',{maximumFractionDigits:2});
           setTimeout(()=>n.remove(),1500);
         }
       }else{
         if(n){
           n.style.background='#b91c1c';
           n.textContent=msg||'שדה המחיר לא נפתח — לא שיניתי שום דבר';
           setTimeout(()=>n.remove(),2500);
         }
       }
       setTimeout(()=>{
         try{
           if(ok){
             sessionStorage.setItem(MFIX_POS_MODE_800,'1');
             document.getElementById('mfix-pos-800')?.remove();
           }
           mfixPosOpen800();
           if(ok){
             mfixPosRenderCart800();
             mfix129HeaderMeta();
           }
         }catch(_){}
       },500);
       resolve(ok);
     };

     const onDbl=async(e)=>{
       if(!(e.target instanceof Element))return;
       // Only accept a double click in the highlighted total block.
       if(!(target.scope.contains(e.target)||e.target===target.amount))return;

       let editor=null;
       for(let i=0;i<35&&!editor;i++){
         await sleep(80);
         editor=mfixPriceFindEditorInScope1370(target.scope);
       }

       if(!editor){
         finish(false,0,'הדאבל־קליק נקלט אבל שדה המחיר לא נפתח — לא נגעתי בשום שדה אחר');
         return;
       }

       // Only now touch the editor, after proving it appeared in the same total area.
       if(!mfixPriceSetEditor1370(editor,wanted)){
         finish(false,0,'מצאתי את שדה המחיר אבל לא הצלחתי לכתוב בו');
         return;
       }

       await sleep(120);
       mfixPricePressEnter1370(editor);

       // Read the new value first from the SAME native "סה״כ לתשלום" area
       // that the cashier edited. This is more reliable here than scanning the whole page.
       const readTargetTotal=()=>{
         try{
           const txt=String(target.scope?.innerText||target.scope?.textContent||'').replace(/\s+/g,' ');
           const ms=[...txt.matchAll(/₪\s*([\d,]+(?:\.\d+)?)/g)]
             .map(m=>Number(String(m[1]).replace(/,/g,'')))
             .filter(v=>Number.isFinite(v)&&v>0);
           if(ms.some(v=>Math.abs(v-wanted)<0.011))return wanted;
         }catch(_){}
         try{
           const t=String(target.amount?.innerText||target.amount?.textContent||'')
             .replace(/\s+/g,'').replace('₪','').replace(/,/g,'');
           const v=Number(t);
           if(v>0 && Math.abs(v-wanted)<0.011)return v;
         }catch(_){}
         return 0;
       };

       let actual=0;
       for(let i=0;i<30;i++){
         await sleep(120);
         actual=readTargetTotal() || Number(mfixExactInvoiceTotal643?.()||0);
         if(actual>0 && Math.abs(actual-wanted)<0.011){
           // Sync POS immediately and force return to POS.
           try{
             sessionStorage.setItem(MFIX_POS_TOTAL_OVERRIDE_1365,String(actual));
             sessionStorage.setItem(MFIX_POS_MODE_800,'1');
           }catch(_){}
           finish(true,actual);
           return;
         }
       }

       // YesInvoice sometimes updates the discount/total text a little later.
       // If the editor accepted the requested number, keep the POS synced to that exact value
       // and return instead of leaving the cashier stranded on the native page.
       try{
         const ev=Number(String(editor.value??editor.textContent??'').replace(',','.'));
         if(ev>0 && Math.abs(ev-wanted)<0.011){
           sessionStorage.setItem(MFIX_POS_TOTAL_OVERRIDE_1365,String(wanted));
           sessionStorage.setItem(MFIX_POS_MODE_800,'1');
           finish(true,wanted);
           return;
         }
       }catch(_){}

       finish(false,0,'המחיר לא אושר ביש חשבונית — לא עדכנתי את ה־POS');
     };

     document.addEventListener('dblclick',onDbl,true);
     const timeout=setTimeout(()=>finish(false,0,'לא בוצע דאבל־קליק על הסכום'),60000);
   });
 }

 async function mfixPosEnsureWalkIn830(){
   // YesInvoice requires a real selected customer object; putting text in the field is not enough.
   const input=()=>{
     const all=[...document.querySelectorAll('#nameofCustomer,input[placeholder*="שם לקוח"]')];
     return all.find(e=>e.offsetParent!==null)||all[0]||null;
   };

   const selected=()=>{
     const i=input();
     const v=normText(i?.value||'');
     return !!i && v.includes('לקוח מזדמן');
   };

   if(selected())return true;

   // Use the already proven desktop selector first.
   try{
     if(await ensureDesktopWalkInCustomer())return true;
   }catch(_){}

   // More tolerant fallback for this YesInvoice layout.
   let i=null;
   for(let n=0;n<45&&!i;n++){
     i=input();
     if(!i)await sleep(100);
   }
   if(!i)return false;

   try{
     i.focus();
     clickNative(i);
     // Typing the exact registered name makes the native suggestion appear reliably.
     setValue(i,'##לקוח מזדמן');
   }catch(_){}

   let opt=null;
   for(let n=0;n<55&&!opt;n++){
     const candidates=[...document.querySelectorAll(
       'span.sn1,div.sn1,li,div[role="option"],span[role="option"],ul.autocomplete li'
     )].filter(e=>e.offsetParent!==null);
     opt=candidates.find(e=>normText(e.innerText||e.textContent||'')==='##לקוח מזדמן') ||
         candidates.find(e=>normText(e.innerText||e.textContent||'').includes('לקוח מזדמן'));
     if(!opt)await sleep(100);
   }
   if(!opt)return false;

   clickNative(opt);
   for(let n=0;n<40;n++){
     if(selected())return true;
     await sleep(100);
   }
   return false;
 }

 async function mfixPosAddCurrentInvoice800(product){
   // MFIX 13.9.9:
   // Search/selection may retry inside the chooser, but native SAVE is allowed ONCE only.
   // Confirmation is based on a new exact-code row, not the fragile old line counter.
   const beforeLines=desktopInvoiceLineCount();
   const ids=mfixExactIds1394(product);
   const beforeExact=ids.length ? mfixNativeInvoiceExactCount1399(product) : 0;

   let add=null;
   for(let i=0;i<20&&!add;i++){
     add=desktopAddProductButton() ||
       findVisibleByExactText('div.button.white,div.button,button,a,span','הוספת פריט נוסף') ||
       findVisibleByExactText('div.button.white,div.button,button,a,span','+ הוספת פריט נוסף');
     if(!add)await sleep(90);
   }
   if(!add){
     toast('לא מצאתי הוספת פריט',2200);
     return false;
   }

   clickNative(add);

   const pop=await waitDesktopProductModal();
   if(!pop){
     toast('רשימת הפריטים לא נפתחה',2200);
     return false;
   }

   // desktopSearchAndChoose already has safe search/selection recovery BEFORE save.
   const chosen=await desktopSearchAndChoose(pop,product);
   if(!chosen){
     mfixCloseProductChooser1394();
     return false;
   }

   try{await trySelectMatchedSerial(product)}catch(_){}

   // HARD RULE: one native save only. Never retry Add/Save after this point.
   const saved=await desktopSaveChanges();
   if(!saved){
     toast('לא מצאתי שמירת שינויים',2200);
     return false;
   }

   // Wait for a NEW exact row. This also works when the same barcode already exists
   // elsewhere in the invoice, because we compare the count before vs after.
   let confirmed=false;
   for(let i=0;i<65;i++){
     await sleep(90);

     if(ids.length){
       if(mfixNativeInvoiceExactCount1399(product)>beforeExact){
         confirmed=true;
         break;
       }
     }else if(desktopInvoiceLineCount()>beforeLines){
       confirmed=true;
       break;
     }
   }

   if(!confirmed){
     // Important: do NOT retry. The native save may already have succeeded.
     toast('השמירה נשלחה — לא ניסיתי שוב כדי למנוע כפילות',2800);
     return false;
   }

   try{
     const okCustomer=await mfixPosEnsureWalkIn830();
     if(!okCustomer)toast('לא הצלחתי לבחור ##לקוח מזדמן',2600);
   }catch(_){}

   return true;
 }
 async function mfixPosAddProduct800(product){
   if(window.__mfixPosAdding800)return;
   if(!mfix131DuplicateConfirm(product))return false;
   if(!mfix135BelowCost(product))return false;
   window.__mfixPosAdding800=true;
   try{
     if(location.href.includes('/invoice/InvoiceDocument')){
       const ok=await mfixPosAddCurrentInvoice800(product);
       if(ok){
         mfixPosCartAdd800(product);
         toast('נוסף לקופה ✓',1200);
         setTimeout(()=>mfix131ShowRecommendations(product),300);
       }
       return ok;
     }

     // First item: use the known stable route-opening mechanism.
     try{sessionStorage.setItem(MFIX_POS_MODE_800,'1')}catch(_){}
     mfixPosCartAdd800(product);
     await openInvoiceForProduct(product);
     try{mfixPosBestHit1220(product)}catch(_){}
     return true;
   }finally{
     setTimeout(()=>window.__mfixPosAdding800=false,600);
   }
 }


 const MFIX_LAST_ADDED_1280='mfixLastAdded1280';
 function mfixBeep1280(ok=true){
   try{if(!mfix129SettingsGet().sound)return;
     const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
     const c=new C(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);
     o.type='sine';o.frequency.value=ok?1760:260;g.gain.setValueAtTime(ok?.16:.08,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+(ok?.18:.20));o.start();o.stop(c.currentTime+(ok?.18:.20));o.onended=()=>c.close();
   }catch(_){}
 }
 function mfixInternet1280(){
   const el=document.getElementById('mfix-pos-net-1280');if(!el)return;
   const on=navigator.onLine;el.textContent=on?'● אינטרנט':'● אין אינטרנט';el.style.color=on?'#86efac':'#fca5a5';
 }
 function mfixScannerState1280(text='● מוכן לסריקה',busy=false){
   const el=document.getElementById('mfix-pos-scan-state-1280');if(!el)return;
   el.textContent=text;el.style.color=busy?'#fde68a':'#86efac';
 }
 function mfixLastAdded1280(product){
   try{localStorage.setItem(MFIX_LAST_ADDED_1280,JSON.stringify({name:productTitle(product,'מוצר'),price:Number(product?.Price||0),at:Date.now()}))}catch(_){}
   const el=document.getElementById('mfix-pos-last-1280');if(el)el.textContent='אחרון: '+productTitle(product,'מוצר');
 }
 function mfixSaleStats1280(){
   const a=mfixPosCartGet800(),units=a.reduce((n,x)=>n+Number(x.qty||1),0),sum=mfixPosTotal800();
   return {units,sum};
 }
 function mfixSlow1280(product){
   const el=document.getElementById('mfix-pos-progress-1270');if(!el)return;
   const title=el.querySelector('#mfix-p-title-1270'),sub=el.querySelector('#mfix-p-sub-1270');
   if(title)title.textContent='⌛ עדיין עובד — אל תלחץ שוב';
   if(sub)sub.textContent='יש חשבונית מגיבה לאט · '+productTitle(product,'מוצר');
 }
 function mfixConfirmExpensive1280(product){
   const price=Number(product?.Price||0),st=mfix129SettingsGet(),stk=Number(stock(product));
   if(st.blockZeroStock&&stk<=0&&!confirm('אין מלאי למוצר הזה. להוסיף בכל זאת?'))return false;
   if(!st.expensive||price<Number(st.expensiveAt||1500))return true;
   return confirm(productTitle(product,'מוצר')+' · ₪'+price.toLocaleString('he-IL')+'\n\nמוצר יקר — להוסיף לחשבונית?');
 }
 function mfixStockNotice1280(product){
   const st=Number(stock(product));
   if(st===1)setTimeout(()=>toast('⚠️ נשארה יחידה אחרונה במלאי',2600),250);
 }
 function mfixFinishTransfer1280(){
   const x=mfixSaleStats1280();toast('✓ המכירה הועברה לתשלום · ₪'+x.sum.toLocaleString('he-IL',{maximumFractionDigits:2}),1800);
 }
 function mfixPosProgress1270(stage,product,detail=''){
   let el=document.getElementById('mfix-pos-progress-1270');
   if(!el){
     el=document.createElement('div');el.id='mfix-pos-progress-1270';el.dir='rtl';
     el.style.cssText='position:fixed;z-index:2147483647;top:16px;left:50%;transform:translateX(-50%);width:min(520px,88vw);padding:13px 18px;border-radius:16px;box-shadow:0 12px 38px #0007;color:white;font-family:Arial;text-align:right;pointer-events:none;background:#1e293b;overflow:hidden';
     el.innerHTML='<div id="mfix-p-title-1270" style="font-size:19px;font-weight:1000"></div><div id="mfix-p-sub-1270" style="font-size:13px;margin-top:3px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div><div style="height:5px;background:#ffffff25;border-radius:5px;margin-top:9px;overflow:hidden"><div id="mfix-p-bar-1270" style="height:100%;width:8%;background:#5eead4;transition:width .3s ease"></div></div>';
     document.documentElement.appendChild(el);
   }
   const title=el.querySelector('#mfix-p-title-1270'),sub=el.querySelector('#mfix-p-sub-1270'),bar=el.querySelector('#mfix-p-bar-1270');
   const name=productTitle(product,'מוצר'),price=Number(product?.Price||0);
   const map={
     start:['⏳ מתחיל הוספת מוצר…',12,'#1e293b'],
     find:['🔎 מאתר את המוצר ביש חשבונית…',32,'#1e293b'],
     invoice:['🧾 מוסיף לחשבונית…',58,'#1e293b'],
     wait:['⏳ ממתין לאישור מיש חשבונית…',82,'#1e293b'],
     ok:['✓ נוסף בהצלחה',100,'#15803d'],
     fail:['✕ המוצר לא נוסף',100,'#b91c1c']
   };
   const x=map[stage]||map.start;title.textContent=x[0];bar.style.width=x[1]+'%';el.style.background=x[2];
   sub.textContent=detail||(stage==='ok'?name+(price>0?' · ₪'+price.toLocaleString('he-IL',{maximumFractionDigits:2}):''):name);
   clearTimeout(el.__rm);
   if(stage==='wait'){
     el.__rm=setTimeout(()=>{
       const cur=document.getElementById('mfix-pos-progress-1270');
       if(cur===el){el.style.opacity='0';setTimeout(()=>el.remove(),220)}
     },4500);
   }else if(stage==='ok'||stage==='fail'){
     el.__rm=setTimeout(()=>{el.style.opacity='0';setTimeout(()=>el.remove(),220)},stage==='ok'?1600:2600);
   }
 }
 function mfixPosAddNotice1260(ok,product){
   const x=mfixSaleStats1280();
   mfixPosProgress1270(ok?'ok':'fail',product,ok?(productTitle(product,'מוצר')+' · '+x.units+' פריטים בסל · ₪'+x.sum.toLocaleString('he-IL',{maximumFractionDigits:2})):'אפשר לנסות שוב');
   mfixBeep1280(!!ok);
   if(ok){mfixLastAdded1280(product);mfix129RememberProduct(product);mfixStockNotice1280(product);mfixScannerState1280('● מוכן לסריקה',false);setTimeout(()=>mfix131ShowRecommendations(product),350);setTimeout(()=>mfix135PhoneChecklist(product),500)}
   else mfixScannerState1280('● שגיאה בהוספה',true);
 }

 function mfixPosSearch800(q){
   return new Promise(resolve=>{
     q=String(q||'').trim();
     if(!q){resolve([]);return}
     try{
       chrome.runtime.sendMessage({type:'MFIX_SEARCH',q},r=>{
         if(!r?.ok){resolve([]);return}
         const items=productArray(r.text)||[];
         resolve(items.slice(0,30));
       });
     }catch(_){resolve([])}
   });
 }


 // ===== MFIX POS 16.9.16 GLOBAL BARCODE SCANNER =====
 // The scanner is armed ONLY while the MFIX POS window itself is visible.
 // It works from anywhere inside POS, without forcing focus back to the search box.
 let mfixGlobalScanKeys16916=[];
 let mfixGlobalScanBusy16916=false;

 function mfixPosVisibleForGlobalScan16916(){
   const root=document.getElementById('mfix-pos-800');
   if(!root)return false;
   // The POS itself uses fixed positioning, so offsetParent is often null even
   // while the window is fully visible. Use geometry + computed visibility instead.
   const cs=getComputedStyle(root);
   const rect=root.getBoundingClientRect();
   return cs.display!=='none' && cs.visibility!=='hidden' && rect.width>0 && rect.height>0;
 }

 function mfixExactScannedMatch16916(items,q){
   const needle=String(q||'').trim().toLowerCase();
   return (items||[]).find(x=>{
     const vals=[
       x?.Barcode,x?.barcode,x?.Name,x?.name,
       x?.CatalogNumber,x?.catalogNumber,x?.SKU,x?.sku,
       x?.ID,x?.Id,x?.id,x?.__matchedSerial
     ].map(v=>String(v??'').trim().toLowerCase()).filter(Boolean);
     return vals.includes(needle);
   })||null;
 }

 function mfixLocalPosSearch16916(q){
   return new Promise(resolve=>{
     try{chrome.runtime.sendMessage({type:'MFIX_SEARCH_LOCAL_14',q,limit:40},r=>resolve(r?.ok?(r.items||[]):[]))}
     catch(_){resolve([])}
   });
 }

 async function mfixFindScannedProduct16916(q){