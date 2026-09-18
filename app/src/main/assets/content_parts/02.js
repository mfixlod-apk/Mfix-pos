
 function findLabeledInput(label){
   const roots=[...document.querySelectorAll('div.md-input-container, div.relative, .notop')];
   // Prefer a small container whose own visible text contains the requested label.
   const candidates=roots.filter(r=>{
     const t=(r.innerText||'').replace(/\s+/g,' ').trim();
     return r.offsetParent!==null && t.includes(label) && r.querySelector('input.md-input,input');
   }).sort((a,b)=>(a.innerText||'').length-(b.innerText||'').length);
   return candidates[0]?.querySelector('input.md-input,input')||null;
 }

 async function openExtendedCustomer(){
   // Exact text learned in the customer/phone learner.
   let a=null;
   for(let n=0;n<40&&!a;n++){
     a=[...document.querySelectorAll('a')].find(e=>
       e.offsetParent!==null && (e.innerText||'').replace(/\s+/g,' ').trim()==='פרטי לקוח מורחב'
     );
     if(!a)await sleep(100);
   }
   if(!a)return false;

   // If fields are already visible, no need to click again.
   if(findLabeledInput('טלפון נייד'))return true;
   clickNative(a);
   for(let n=0;n<40;n++){
     if(findLabeledInput('טלפון נייד'))return true;
     await sleep(100);
   }
   return false;
 }

 // YesInvoice uses Angular/Material-style controls on some layouts. Setting .value alone
 // can change what is visible without updating the framework model. Keep one robust writer.
 function mfixNormalizeFieldValue(v,phone=false){
   const s=String(v??'').trim();return phone?s.replace(/\D/g,''):s.replace(/\s+/g,' ');
 }
 function mfixFindInvoiceField(label){
   const target=String(label||'').replace(/\s+/g,' ').trim();
   const visible=e=>!!e&&e.offsetParent!==null&&!e.disabled;
   const inputs=[...document.querySelectorAll('input,textarea')].filter(visible);
   let best=null,bestScore=-1;
   for(const el of inputs){
     let score=0;
     const attrs=[el.id,el.name,el.placeholder,el.getAttribute('aria-label'),el.getAttribute('ng-model')].filter(Boolean).join(' ');
     const wrap=el.closest('md-input-container,.md-input-container,.relative,.notop,[class*="input"]');
     const around=[wrap?.innerText,el.parentElement?.innerText,el.closest('div')?.innerText].filter(Boolean).join(' ');
     const text=(attrs+' '+around).replace(/\s+/g,' ');
     if(text.includes(target))score+=100;
     if(target==='טלפון נייד' && /(phone|mobile|טלפון)/i.test(attrs+' '+text))score+=80;
     if(target==='שם על המסמך' && /(document.*name|name.*document|שם)/i.test(attrs+' '+text))score+=80;
     const idFor=[...document.querySelectorAll('label[for]')].find(l=>visible(l)&&(l.innerText||'').replace(/\s+/g,' ').includes(target));
     if(idFor&&idFor.htmlFor===el.id)score+=200;
     if(score>bestScore){bestScore=score;best=el;}
   }
   return bestScore>0?best:null;
 }
 function mfixAngularCommit(el,val){
   try{
     const ng=window.angular;
     if(!ng?.element)return false;
     const jq=ng.element(el);
     const ctrl=jq.controller?.('ngModel')||jq.data?.('$ngModelController');
     if(!ctrl)return false;
     ctrl.$setViewValue(String(val));
     ctrl.$setDirty?.();ctrl.$setTouched?.();ctrl.$render?.();
     const scope=jq.scope?.()||jq.isolateScope?.();
     if(scope&&!scope.$$phase)scope.$applyAsync?.();
     return true;
   }catch(_){return false}
 }
 function setNativeInput(el,val){
   if(!el)return false;
   const value=String(val??'');
   try{el.focus({preventScroll:true})}catch(_){try{el.focus()}catch(__){}}
   try{el.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertText',data:value}))}catch(_){}
   let setter=null,proto=el;
   while(proto&&!setter){
     const d=Object.getOwnPropertyDescriptor(proto,'value');setter=d?.set||null;proto=Object.getPrototypeOf(proto);
   }
   try{setter?setter.call(el,value):el.value=value}catch(_){try{el.value=value}catch(__){}}
   mfixAngularCommit(el,value);
   try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}))}catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}
   el.dispatchEvent(new Event('change',{bubbles:true}));
   try{el.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Tab',code:'Tab'}))}catch(_){}
   try{el.blur()}catch(_){}
   try{el.dispatchEvent(new FocusEvent('focusout',{bubbles:true,relatedTarget:document.body}))}catch(_){el.dispatchEvent(new Event('focusout',{bubbles:true}))}
   return true;
 }
 async function mfixSetYesInvoiceField(label,val){
   const phone=label==='טלפון נייד';
   const wanted=mfixNormalizeFieldValue(val,phone);
   for(let attempt=0;attempt<4;attempt++){
     const el=mfixFindInvoiceField(label)||findLabeledInput(label);
     if(!el){await sleep(140);continue}
     setNativeInput(el,val);
     await sleep(180+attempt*120);
     const shown=mfixNormalizeFieldValue(el.value,phone);
     let modelOk=true;
     try{
       const ng=window.angular;if(ng?.element){const jq=ng.element(el);const ctrl=jq.controller?.('ngModel')||jq.data?.('$ngModelController');if(ctrl&&mfixNormalizeFieldValue(ctrl.$viewValue,phone)!==wanted){mfixAngularCommit(el,val);modelOk=mfixNormalizeFieldValue(ctrl.$viewValue,phone)===wanted;}}
     }catch(_){}
     if(shown===wanted&&modelOk)return true;
     try{el.click();el.blur()}catch(_){}
   }
   return false;
 }

 function runAfterCustomerDialog(){
   const cb=mfixAfterCustomerDialog;
   mfixAfterCustomerDialog=null;
   if(cb)setTimeout(()=>{try{cb()}catch(_){}},120);
 }

 function showCustomerDialog(){
   if(document.getElementById('mfix43-customer-dialog'))return;

   const overlay=document.createElement('div');
   overlay.id='mfix43-customer-dialog';
   overlay.style.cssText='position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.34);display:flex;align-items:flex-start;justify-content:center;padding:12px 16px;direction:rtl;font-family:Arial,sans-serif;pointer-events:none';
   // Chromebook/desktop: keep MFIX dialog above the native customer fields instead of covering them.
   overlay.style.paddingTop=(window.innerWidth>=760?'8px':'16px');

   const box=document.createElement('div');
   box.style.cssText='width:min(430px,100%);background:#fff;border-radius:16px;padding:14px 18px;box-shadow:0 12px 40px rgba(0,0,0,.3);pointer-events:auto;max-height:42vh;overflow:auto';
   box.innerHTML=`
     <div style="font-size:20px;font-weight:700;margin-bottom:4px">פרטי לקוח</div>
     <div style="font-size:13px;color:#666;margin-bottom:14px">לקוח מזדמן כבר נבחר. אפשר להשאיר ריק. אחרי שמירה נמשיך אוטומטית לתשלום שבחרת.</div>
     <label style="display:block;font-size:13px;margin:0 0 5px">שם על המסמך</label>
     <input id="mfix43-cname" autocomplete="off" style="box-sizing:border-box;width:100%;font-size:17px;padding:11px;border:1px solid #bbb;border-radius:9px;margin-bottom:11px">
     <label style="display:block;font-size:13px;margin:0 0 5px">טלפון נייד</label>
     <input id="mfix43-phone" inputmode="tel" autocomplete="tel" style="box-sizing:border-box;width:100%;font-size:18px;padding:11px;border:1px solid #bbb;border-radius:9px;margin-bottom:15px">
     <div style="display:flex;gap:9px">
       <button id="mfix43-skip" type="button" style="flex:1;padding:11px;border:1px solid #bbb;background:#fff;border-radius:9px;font-weight:700">ללא פרטים</button>
       <button id="mfix43-save" type="button" style="flex:1;padding:11px;border:0;background:#15966a;color:#fff;border-radius:9px;font-weight:700">שמור והמשך</button>
     </div>`;
   overlay.appendChild(box);document.documentElement.appendChild(overlay);

   const phone=box.querySelector('#mfix43-phone');
   const name=box.querySelector('#mfix43-cname');
   setTimeout(()=>phone.focus(),120);

   box.querySelector('#mfix43-skip').onclick=()=>{
     try{sessionStorage.setItem('mfixCustomerDialogDone499','1')}catch(_){}
     overlay.remove();
     runAfterCustomerDialog();
   };
   box.querySelector('#mfix43-save').onclick=async()=>{
     const nm=name.value.trim(), ph=phone.value.trim();
     try{
       if(nm)sessionStorage.setItem('mfixDocCustomerName499',nm);
       if(ph)sessionStorage.setItem('mfixDocCustomerPhone499',ph);
       sessionStorage.setItem('mfixCustomerDialogDone499','1');
     }catch(_){}
     if(!nm&&!ph){overlay.remove();runAfterCustomerDialog();return}

     const ok=await openExtendedCustomer();
     if(!ok){toast('לא הצלחתי לפתוח את פרטי הלקוח');return}

     // Do not cover YesInvoice's native "פרטי לקוח" inputs while we populate them.
     overlay.style.display='none';

     const nameOk=!nm || await mfixSetYesInvoiceField('שם על המסמך',nm);
     const phoneOk=!ph || await mfixSetYesInvoiceField('טלפון נייד',ph);
     if(!nameOk || !phoneOk){
       overlay.style.display='flex';
       toast(!nameOk?'שם הלקוח לא נשמר ביש חשבונית':'מספר הטלפון לא נשמר ביש חשבונית',3500);
       return;
     }
     overlay.remove();
     toast('פרטי הלקוח נשמרו ✓',1800);
     runAfterCustomerDialog();
   };
 }

 async function mfixOpenPendingInvoiceDocument612(){
   try{
     // We can arrive here from /invoice/items, favorites, or any other YesInvoice screen.
     // Pending product is already stored. Always move to the native main page first.
     if(!location.pathname.toLowerCase().includes('/invoice/main')){
       try{sessionStorage.setItem('mfixResumePending612','1')}catch(_){}
       location.href='/invoice/main?mfixpending=1';
       return false;
     }

     // The normal MFIX "general search as home" feature may auto-open on /invoice/main.
     // Close it before looking for the native "הפקת מסמך" button.
     await sleep(450);
     await closeGeneralSearchExact();

     let docBtn=null;
     for(let n=0;n<70&&!docBtn;n++){
       docBtn=[...document.querySelectorAll('div.btn1,button,a,[role="button"]')].find(e=>{
         if(e.offsetParent===null)return false;
         return (e.innerText||e.textContent||'').replace(/\s+/g,' ').trim()==='הפקת מסמך';
       });
       if(!docBtn){
         if(n===12)await closeGeneralSearchExact();
         await sleep(120);
       }
     }
     if(!docBtn){
       toast('לא מצאתי הפקת מסמך — נסה שוב מהמסך הראשי',2600);
       return false;
     }
     clickNative(docBtn);

     let inv=null;
     for(let n=0;n<70&&!inv;n++){
       inv=[...document.querySelectorAll('a,button,div,[role="menuitem"]')].find(e=>{
         if(e.offsetParent===null)return false;
         return (e.innerText||e.textContent||'').replace(/\s+/g,' ').trim()==='חשבונית מס/קבלה';
       });
       if(!inv)await sleep(100);
     }
     if(!inv){
       toast('לא מצאתי חשבונית מס/קבלה',2400);
       return false;
     }
     clickNative(inv);
     try{
       sessionStorage.removeItem('mfixResumePending612');
       const u=new URL(location.href);
       if(u.searchParams.get('mfixpending')==='1'){
         u.searchParams.delete('mfixpending');
         history.replaceState(history.state,'',u.pathname+u.search+u.hash);
       }
     }catch(_){}

     setTimeout(()=>{insertPendingProduct();try{mfixLiteResumeGeneral700()}catch(_){}},700);
     return true;
   }catch(_){
     toast('לא הצלחתי לפתוח חשבונית',2200);
     return false;
   }
 }


 async function mfixPriceCheck637(product){
   return new Promise(resolve=>{
     try{document.getElementById('mfix-price-check-637')?.remove()}catch(_){}
     const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
     const name=String(product?.Body||product?.body||product?.ProductName||product?.productName||product?.Description||product?.description||product?.Name||product?.name||'מוצר').trim();
     const code=String(product?.Barcode||product?.barcode||product?.Name||product?.name||product?.CatalogNumber||product?.catalogNumber||'').trim();
     const price=Number(product?.Price||product?.price||0);
     const rawStock=product?.allQuantity??product?.AllQuantity??product?.AvailableQuantity??product?.StockQuantity??product?.Quantity??product?.QuantityStorage;
     const stock=(rawStock===undefined||rawStock===null||rawStock==='')?null:Number(rawStock);
     const shade=document.createElement('div'); shade.id='mfix-price-check-637';
     shade.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#0008;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Arial,sans-serif;direction:rtl';
     const card=document.createElement('div');
     card.style.cssText='width:min(520px,94vw);background:#111827;color:#fff;border-radius:24px;padding:24px;box-shadow:0 25px 70px #0008;text-align:center;border:1px solid #ffffff20';
     card.innerHTML=`<div style="font-size:15px;color:#94a3b8">🔎 בדיקת מחיר</div>
       <div style="font-size:27px;font-weight:900;margin-top:7px">${esc(name)}</div>
       ${code?`<div style="font-size:14px;color:#94a3b8;margin-top:7px">${esc(code)}</div>`:''}
       <div style="font-size:64px;font-weight:1000;line-height:1;margin:24px 0 12px">${price>0?'₪'+price.toLocaleString('he-IL',{maximumFractionDigits:2}):'מחיר לא זמין'}</div>
       <div style="font-size:15px;color:${stock===null?'#cbd5e1':stock>0?'#86efac':'#fca5a5'};margin-bottom:20px">${stock===null?'מלאי: לא זמין':'מלאי: '+stock}</div>
       <div style="display:grid;grid-template-columns:1.3fr .7fr;gap:12px">
       <button id="mfix-pc-add637" style="border:0;border-radius:15px;padding:18px;background:#16a34a;color:#fff;font-size:20px;font-weight:900">➕ הוסף לחשבונית</button>
       <button id="mfix-pc-close637" style="border:0;border-radius:15px;padding:18px;background:#334155;color:#fff;font-size:20px;font-weight:900">סגור</button></div>
       <div style="font-size:12px;color:#64748b;margin-top:12px">Enter = הוסף · Esc = סגור</div>`;
     shade.appendChild(card); document.documentElement.appendChild(shade);
     let ended=false;
     const key=e=>{if(e.key==='Enter'){e.preventDefault();done(true)}else if(e.key==='Escape'){e.preventDefault();done(false)}};
     const done=v=>{if(ended)return;ended=true;document.removeEventListener('keydown',key,true);try{shade.remove()}catch(_){}resolve(v)};
     card.querySelector('#mfix-pc-add637').onclick=()=>done(true);
     card.querySelector('#mfix-pc-close637').onclick=()=>done(false);
     shade.onclick=e=>{if(e.target===shade)done(false)};
     document.addEventListener('keydown',key,true);
   });
 }
 async function mfixScannerAddWithPrice637(product){
   if(await mfixPriceCheck637(product)) return openInvoiceForProduct(product);
   return false;
 }

 async function openInvoiceForProduct(product){
   const addKey=mfixProductAddKey490(product);
   const now=Date.now();
   if(addKey && addKey===mfixLastAddKey && now-mfixLastAddAt<2200){
     toast('נחסמה סריקה כפולה של אותו פריט',1700);
     return;
   }
   mfixLastAddKey=addKey;
   mfixLastAddAt=now;

   const st=Number(stock(product));
   if(mfixSettings600().showStock){
     if(Number.isFinite(st) && st<=0)toast('🚨 אין מלאי לפי המערכת — ניתן להמשיך אם צריך',3600);
     else if(Number.isFinite(st) && st===1)toast('⚠️ יחידה אחרונה במלאי',2600);
   }

   const matchedSerial=String(product?.__matchedSerial||'').trim();
   const matchedSerialId=product?.__matchedSerialId??null;
   const cleanProduct={...product};
   delete cleanProduct.__matchedSerial;
   delete cleanProduct.__matchedSerialId;
   await chrome.storage.local.set({[PENDING]:{product:cleanProduct,matchedSerial,matchedSerialId,at:Date.now()}});
   toast('פותח חשבונית ומכניס את המוצר…',5000);

   // v6.1.2: favorites/search can be used from the Items page too.
   // Store pending first (done above), then safely route through /invoice/main.
   await mfixOpenPendingInvoiceDocument612();
 }

 function visibleText(el,txt){return el&&el.offsetParent!==null&&(el.innerText||'').replace(/\s+/g,' ').trim()===txt}

 async function findAddButton(){
   for(let n=0;n<100;n++){
     const all=[...document.querySelectorAll('button,div,a,span')];
     // Use the flow that was learned successfully.
     let el=all.find(e=>visibleText(e,'+ הוספת שירות')) ||
            all.find(e=>visibleText(e,'הוספת שירות'));
     if(el)return el;
     await sleep(120);
   }
   return null;
 }

 async function findTextarea(){
   for(let n=0;n<80;n++){
     let ta=[...document.querySelectorAll('textarea')].find(e=>e.offsetParent!==null&&
       ((e.placeholder||'').trim()==='מלאו כאן תיאור שורה' || (e.getAttribute('placeholder')||'').includes('תיאור שורה')));
     if(ta)return ta;
     await sleep(120);
   }
   return null;
 }

 async function chooseAutocomplete(product, queries){
   const bar=String(product.Barcode||'').trim();
   const name=productTitle(product,'');
   for(const q of queries){
     const ta=await findTextarea();
     if(!ta)return false;
     setValue(ta,'');
     await sleep(100);
     setValue(ta,q);
     toast('מחפש את המוצר בתוך החשבונית…',2500);

     for(let n=0;n<55;n++){
       const candidates=[...document.querySelectorAll('ul.autocomplete li .prodname, ul.autocomplete > li > div.prodname, ul.autocomplete li')].filter(e=>e.offsetParent!==null);
       let hit=candidates.find(e=>{
         const t=(e.innerText||e.textContent||'').replace(/\s+/g,'');
         return bar ? t.includes(bar) : t.includes(name.replace(/\s+/g,''));
       });
       if(hit){clickNative(hit);return true}
       await sleep(120);
     }
   }
   return false;
 }


 // ===== DESKTOP/TABLET FLOW 4.4 =====
 // This path is intentionally separate. The existing mobile 4.3 path below is left unchanged.
 function normText(v){return String(v||'').replace(/\s+/g,' ').trim()}

 function findVisibleByExactText(selector,txt){
   return [...document.querySelectorAll(selector)].find(e=>e.offsetParent!==null&&normText(e.innerText||e.textContent)===txt)||null;
 }

 function desktopAddProductButton(){
   // Exact desktop/tablet control learned from the desktop flow.
   return findVisibleByExactText('div.button.white,div.button,button,a,span','הוספת פריט +') ||
          findVisibleByExactText('div.button.white,div.button,button,a,span','+ הוספת פריט');
 }

 function isDesktopInvoiceLayout(){
   return !!desktopAddProductButton();
 }

 async function waitDesktopProductModal(){
   for(let n=0;n<100;n++){
     const all=[...document.querySelectorAll('#pop1,div.pop1,[id="pop1"]')];
     const pop=all.find(e=>{
       const t=normText(e.innerText||e.textContent||'');
       return t.includes('רשימת פריטים') && t.includes('חיפוש מוצרים');
     }) || all.find(e=>{
       const t=normText(e.innerText||e.textContent||'');
       return t.includes('חיפוש פריט לפי שם') && t.includes('פריט חדש');
     });
     if(pop)return pop;
     await sleep(100);
   }
   return null;
 }

 function desktopSearchInput(pop){
   if(!pop)return null;
   let exact=pop.querySelector('ul.content > li:nth-of-type(2) div.flex-3-15:nth-of-type(2) > div:nth-of-type(1) input.md-input');
   if(exact)return exact;
   const inputs=[...pop.querySelectorAll('input[type="text"],input.md-input')];
   return inputs.find(i=>{
     const box=i.closest('.md-input-container,.relative,div');
     const around=normText((box?.innerText||'')+' '+(box?.parentElement?.innerText||''));
     return around.includes('חיפוש פריט לפי שם');
   }) || inputs[0] || null;
 }

 function desktopRows(pop){
   if(!pop)return [];
   // Tablet/DeX: some YesInvoice builds no longer render the literal text "בחירת פריט".
   // Treat every visible product row as a candidate and match it by barcode/name below.
   let rows=[...pop.querySelectorAll('div.job.gray, div.job')].filter(r=>{
     const cs=getComputedStyle(r);
     const rect=r.getBoundingClientRect();
     return cs.display!=='none' && cs.visibility!=='hidden' && rect.width>0 && rect.height>0;
   });
   if(rows.length)return rows;

   // Fallback: build rows from the native choose buttons themselves.
   const buttons=[...pop.querySelectorAll('button,div.button,a')].filter(e=>
     /בחר\s*פריט/.test(normText(e.innerText||e.textContent||''))
   );
   return [...new Set(buttons.map(b=>b.closest('div.job.gray,div.job,tr,li')||b.parentElement).filter(Boolean))];
 }

 
 function mfixExactIds1394(product){
   return [
     product?.Barcode, product?.barcode,
     product?.CatalogNumber, product?.catalogNumber,
     product?.Name, product?.name
   ].map(v=>String(v??'').trim())
    .filter((v,i,a)=>v && a.indexOf(v)===i && (/[0-9]/.test(v) || v.length>=6));
 }

 function mfixNativeInvoiceHasExact1394(product){
   try{
     const ids=mfixExactIds1394(product);
     if(!ids.length)return false;
     const rows=[...document.querySelectorAll(
       'div.servicesdesk div.lines div.grid-receipt div.item,'+
       'div.grid-receipt div.item'
     )].filter(e=>e.offsetParent!==null);
     return rows.some(r=>{
       const t=normText(r.innerText||r.textContent||'');
       return ids.some(id=>t.includes(id));
     });
   }catch(_){return false}
 }

 function mfixNativeInvoiceExactCount1399(product){
   try{
     const ids=mfixExactIds1394(product);
     if(!ids.length)return 0;
     const rows=[...document.querySelectorAll(
       'div.servicesdesk div.lines div.grid-receipt div.item,'+
       'div.grid-receipt div.item'
     )].filter(e=>e.offsetParent!==null);
     return rows.filter(r=>{
       const t=normText(r.innerText||r.textContent||'');
       return ids.some(id=>t.includes(id));
     }).length;
   }catch(_){return 0}
 }

 function mfixCloseProductChooser1394(){
   try{
     const pop=[...document.querySelectorAll('#pop1,div.pop1,[role="dialog"],.modal,.popup')]
       .find(e=>e.offsetParent!==null && /רשימת פריטים|חיפוש מוצרים|חיפוש פריט לפי שם/.test(normText(e.innerText||e.textContent||'')));
     if(!pop)return false;
     const candidates=[...pop.querySelectorAll('i.fal.fa-times.close,i.fa-times.close,.close,button,a')];
     const x=candidates.find(e=>e.offsetParent!==null && (
       /סגירה|סגור|ביטול/.test(normText(e.innerText||e.textContent||'')) ||
       /fa-times|close/.test(String(e.className||''))
     ));
     if(x){clickNative(x);return true}
   }catch(_){}
   return false;
 }

function rowMatchesProduct(row,product){
   const compact=normText(row.innerText||row.textContent).replace(/\s+/g,'').toLowerCase();

   // Strong identifiers from YesInvoice. When any one exists, NEVER fall back to product name.
   // This prevents similar names (for example multiple NORDIC products) from selecting the wrong row.
   const strong=[
     product?.Barcode, product?.barcode,
     product?.CatalogNumber, product?.catalogNumber,
     product?.Name, product?.name
   ].map(v=>String(v??'').trim().replace(/\s+/g,'').toLowerCase())
    .filter(v=>v && (/[0-9]/.test(v) || v.length>=6));

   if(strong.length){
     return strong.some(v=>compact.includes(v));
   }

   // Name fallback is allowed only for products that genuinely have no usable code/barcode/SKU.
   const name=String(productTitle(product,'')||'').trim().replace(/\s+/g,'').toLowerCase();
   return !!name && compact.includes(name);
 }

 function chooseButtonInDesktopRow(row){
   if(!row)return null;
   const candidates=[...row.querySelectorAll('button,div.button,a,[role="button"],input[type="button"]')];
   return row.querySelector('div.choose button.buttonai.width100, button.buttonai.width100') ||
          candidates.find(e=>{
            const t=normText(e.value||e.innerText||e.textContent||'');
            return t==='בחר פריט +' || t==='בחר פריט' || /בחר\s*פריט/.test(t);