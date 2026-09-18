          }) || null;
 }


 // FAST PATH — exact fixed-code product (used by "מוצר כללי").
 // The old generic search retried after ~4 seconds. On the first YesInvoice search
 // the server can still be loading, so the retry restarted the search and made the
 // first insertion take 10–15 seconds. Here we send ONE exact query and keep waiting
 // for the same result instead of resetting the search.
 async function desktopSearchExactFastGeneral(pop,code='14606113'){
   const input=desktopSearchInput(pop);
   if(!input)return false;
   const product={Name:String(code),CatalogNumber:String(code)};
   try{
     input.focus();
     setValue(input,'');
     setValue(input,String(code));
     // Different YesInvoice builds listen to different events; fire all relevant
     // native events immediately, without an artificial 180ms pause.
     try{input.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Enter',code:'Enter'}))}catch(_){}
     try{input.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Enter',code:'Enter'}))}catch(_){}
     try{input.dispatchEvent(new Event('search',{bubbles:true}))}catch(_){}
   }catch(_){return false}

   toast('מחפש מוצר כללי…',900);
   let row=null;
   // Keep the original request alive for up to 9 seconds. Do NOT clear/retype it.
   // This is specifically what avoids the slow first-search retry loop.
   for(let n=0;n<180&&!row;n++){
     const rows=desktopRows(pop);
     row=rows.find(r=>rowMatchesProduct(r,product));
     if(!row)await sleep(50);
   }
   if(!row)return false;

   const btn=chooseButtonInDesktopRow(row);
   if(!btn)return false;
   clickNative(btn);

   // Usually selection is instant. Give the UI a short confirmation window only.
   for(let n=0;n<20;n++){
     await sleep(50);
     const t=normText(row.innerText||row.textContent||'');
     if(t.includes('פריט נבחר') || rowMatchesProduct(row,product))return true;
   }
   return rowMatchesProduct(row,product);
 }

 async function desktopSearchAndChoose(pop,product){
   const input=desktopSearchInput(pop);
   if(!input)return false;

   const ids=mfixExactIds1394(product);
   const name=String(productTitle(product,'')||'').trim();
   const queries=ids.length ? ids : [name].filter(Boolean);

   for(const q of queries){
     for(let cycle=0;cycle<2;cycle++){
       try{
         input.focus();
         setValue(input,'');
         await sleep(180);
         setValue(input,q);
         input.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Enter',code:'Enter'}));
       }catch(_){}

       toast(cycle===0?'מחפש מוצר לפי קוד מדויק…':'מנסה שוב את אותו קוד…',1200);

       let row=null;
       for(let n=0;n<38&&!row;n++){
         const rows=desktopRows(pop);
         row=rows.find(r=>rowMatchesProduct(r,product));
         if(!row)await sleep(100);
       }

       if(!row){
         await sleep(220);
         continue;
       }

       const btn=chooseButtonInDesktopRow(row);
       if(!btn)continue;

       clickNative(btn);

       let selected=false;
       for(let n=0;n<16;n++){
         await sleep(100);
         const t=normText(row.innerText||row.textContent||'');
         if(t.includes('פריט נבחר')){selected=true;break}
       }

       if(!selected){
         try{btn.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'mouse',buttons:1}))}catch(_){}
         try{btn.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'mouse',buttons:0}))}catch(_){}
         try{btn.dispatchEvent(new MouseEvent('click',{bubbles:true,view:window,detail:1}))}catch(_){}
         for(let n=0;n<12;n++){
           await sleep(100);
           if(normText(row.innerText||row.textContent||'').includes('פריט נבחר')){selected=true;break}
         }
       }

       if(!rowMatchesProduct(row,product)){
         toast('זוהה מוצר אחר — עצרתי לפני שמירה',2200);
         return false;
       }

       if(selected || rowMatchesProduct(row,product))return true;
     }
   }

   toast('לא נמצאה התאמה מדויקת — לא הוספתי מוצר',2600);
   return false;
 }
 async function desktopSaveChanges(){
   for(let n=0;n<80;n++){
     const scope=[...document.querySelectorAll('#pop1,div.pop1,[role="dialog"]')].find(e=>{
       const t=normText(e.innerText||e.textContent||'');
       return t.includes('רשימת פריטים') || t.includes('חיפוש מוצרים');
     }) || document;
     const save=[...scope.querySelectorAll('input[type="button"],input[type="submit"],button,div.button,[role="button"]')].find(e=>{
       const t=normText(e.value||e.innerText||e.textContent||'');
       const cs=getComputedStyle(e), r=e.getBoundingClientRect();
       return t==='שמירת שינויים' && cs.display!=='none' && cs.visibility!=='hidden' && r.width>0 && r.height>0;
     });
     if(save){
       clickNative(save);
       return true;
     }
     await sleep(100);
   }
   return false;
 }

 async function desktopWaitInserted(product){
   const strong=[
     product?.Barcode,product?.barcode,
     product?.CatalogNumber,product?.catalogNumber,
     product?.Name,product?.name
   ].map(v=>String(v??'').trim()).filter(v=>v && (/[0-9]/.test(v)||v.length>=6));
   const name=String(productTitle(product,'')||'').trim();

   for(let n=0;n<80;n++){
     const page=normText(document.body?.innerText||'');
     const hasProduct=strong.length
       ? strong.some(v=>page.includes(v))
       : (!!name && page.includes(name));
     if(hasProduct && page.includes('מחיר ליחידה'))return true;
     await sleep(120);
   }
   return false;
 }

 async function desktopEnsurePaymentMenu(){
   // In the learned desktop flow "שמירת שינויים" opens this menu automatically.
   for(let n=0;n<35;n++){
     const p=[...document.querySelectorAll('div.pop2')].find(e=>
       e.offsetParent!==null && normText(e.innerText||'').startsWith('איך שילמו לך?')
     );
     if(p)return true;
     await sleep(100);
   }
   return false;
 }


 async function openDesktopPaymentMenu(){
   // If YesInvoice already opened the native payment picker after saving the item, keep it.
   if(await desktopEnsurePaymentMenu())return true;

   const phrases=[
     'הוספת תקבול +','+ הוספת תקבול','הוספת תקבול',
     'הוספת תשלום +','+ הוספת תשלום','הוספת תשלום',
     'אמצעי תשלום','לתשלום'
   ];
   for(const phrase of phrases){
     const el=[...document.querySelectorAll('button,a,div.button,div.btn1,span,[role="button"]')].find(e=>{
       if(!e.offsetParent || e.closest('#mfix-next-step-450,#mfix43-customer-dialog'))return false;
       return normText(e.innerText||e.textContent||e.value||'')===phrase;
     });
     if(!el)continue;
     clickNative(el);
     if(await desktopEnsurePaymentMenu())return true;
   }

   // Last fallback: any visible native control whose short label contains "תקבול" or "תשלום".
   const fallback=[...document.querySelectorAll('button,a,div.button,div.btn1,[role="button"]')].find(e=>{
     if(!e.offsetParent || e.closest('#mfix-next-step-450,#mfix43-customer-dialog'))return false;
     const t=normText(e.innerText||e.textContent||e.value||'');
     return t.length<45 && (/תקבול/.test(t) || /אמצעי תשלום/.test(t));
   });
   if(fallback){
     clickNative(fallback);
     if(await desktopEnsurePaymentMenu())return true;
   }
   toast('לא מצאתי את חלון אמצעי התשלום — לחץ עליו פעם אחת ידנית',3000);
   return false;
 }



 function parseMoney(v){
   let x=String(v??'').trim();
   if(!x)return 0;
   x=x.replace(/[₪\s]/g,'').replace(/,/g,'');
   const m=x.match(/-?\d+(?:\.\d+)?/);
   if(!m)return 0;
   const n=Number(m[0]);
   return Number.isFinite(n)?n:0;
 }

 function currentInvoiceTotal(){
   // Desktop learned invoice rows. Sum the line totals, so quantity/multiple items are respected.
   const rows=[...document.querySelectorAll(
     'div.servicesdesk div.lines div.grid-receipt div.item, '+
     'div.lines div.grid-receipt div.item'
   )].filter(r=>{
     const t=normText(r.innerText||r.textContent||'');
     return t.includes('מחיר ליחידה') && t.includes('סה"כ');
   });

   let sum=0;
   for(const row of rows){
     const t=normText(row.innerText||row.textContent||'');
     const matches=[...t.matchAll(/סה["״']?כ\s*₪?\s*([\d,]+(?:\.\d+)?)/g)];
     if(matches.length){
       const n=parseMoney(matches[matches.length-1][1]);
       if(n>0)sum+=n;
     }
   }
   if(sum>0)return Math.round((sum+Number.EPSILON)*100)/100;

   // Fallback: look for a visible invoice total, but ignore payment dialogs.
   const candidates=[...document.querySelectorAll('div,span,strong,b')].filter(e=>{
     if(!e.offsetParent)return false;
     if(e.closest('div.pop1,div.pop2,[role="dialog"]'))return false;
     const t=normText(e.innerText||e.textContent||'');
     return /סה["״']?כ/.test(t) && /₪\s*[\d,]+/.test(t) && t.length<90;
   });
   const vals=[];
   for(const e of candidates){
     const t=normText(e.innerText||e.textContent||'');
     for(const m of t.matchAll(/₪\s*([\d,]+(?:\.\d+)?)/g)){
       const n=parseMoney(m[1]);
       if(n>0)vals.push(n);
     }
   }
   return vals.length ? Math.max(...vals) : 0;
 }


 function mfixCustomerFacingTotal628(){
   // NEVER calculate VAT here.
   // MFIX must use the amount entered in the invoice lines exactly as-is.
   const vis=e=>!!(e && e.offsetParent!==null);
   const norm=v=>String(v||'').replace(/\s+/g,' ').trim();

   // A) If the native cash/payment dialog is open, its "סכום" field is authoritative.
   const dialogs=[...document.querySelectorAll('div.pop1,div.pop2,[role="dialog"],.modal,.popup')].filter(vis);
   for(const d of dialogs){
     const dt=norm(d.innerText||d.textContent||'');
     if(!dt.includes('סכום'))continue;
     const inputs=[...d.querySelectorAll('input')].filter(i=>vis(i)&&!i.disabled&&!i.readOnly);
     for(const i of inputs){
       const around=norm((i.parentElement?.innerText||'')+' '+(i.parentElement?.parentElement?.innerText||''));
       if(!/סכום/.test(around))continue;
       const v=parseMoney(i.value);
       if(v>0)return Math.round((v+Number.EPSILON)*100)/100;
     }
   }

   // B) Find the smallest visible native containers that look like invoice item rows.
   // We sum their displayed line "סה״כ" amounts. We explicitly exclude VAT/summary blocks.
   const candidates=[...document.querySelectorAll('div,li,tr,section')].filter(el=>{
     if(!vis(el))return false;
     if(el.closest('#mfix-next-step-450,#mfix-pro-panel-600,#mfix43-customer-dialog,#mfixSmartPay469'))return false;
     const t=norm(el.innerText||el.textContent||'');
     if(!t || t.length>900)return false;
     if(/סיכום חשבון|מע["״']?מ|סה["״']?כ לתשלום/.test(t))return false;
     const hasLineTotal=/סה["״']?כ\s*[:\-]?\s*₪?\s*[\d,.]+/.test(t);
     const looksItem=/מחיר ליחידה|כמות|פריט|שירות/.test(t);
     return hasLineTotal && looksItem;
   });

   // Keep only the smallest matching containers so parent wrappers aren't double-counted.
   const smallest=candidates.filter(el=>!candidates.some(other=>other!==el && el.contains(other)));
   let sum=0,found=0;
   for(const el of smallest){
     const t=norm(el.innerText||el.textContent||'');
     const ms=[...t.matchAll(/סה["״']?כ\s*[:\-]?\s*₪?\s*([\d,]+(?:\.\d+)?)/g)];
     if(!ms.length)continue;
     const v=parseMoney(ms[ms.length-1][1]);
     if(v>=0){sum+=v;found++}
   }
   if(found && sum>0)return Math.round((sum+Number.EPSILON)*100)/100;

   // C) Fallback: look for a standalone "סה״כ" that is NOT in VAT/account-summary areas.
   const totals=[...document.querySelectorAll('div,span,strong,b')].filter(el=>{
     if(!vis(el))return false;
     if(el.closest('#mfix-next-step-450,#mfix-pro-panel-600,#mfix43-customer-dialog,#mfixSmartPay469'))return false;
     const t=norm(el.innerText||el.textContent||'');
     if(!/סה["״']?כ/.test(t) || !/₪?\s*[\d,.]+/.test(t) || t.length>120)return false;
     const around=norm((el.parentElement?.innerText||'')+' '+(el.parentElement?.parentElement?.innerText||''));
     if(/סיכום חשבון|מע["״']?מ|סה["״']?כ לתשלום/.test(around))return false;
     return true;
   });

   const vals=[];
   for(const el of totals){
     const t=norm(el.innerText||el.textContent||'');
     for(const m of t.matchAll(/(?:₪\s*)?([\d,]+(?:\.\d+)?)/g)){
       const v=parseMoney(m[1]); if(v>0)vals.push(v);
     }
   }
   if(vals.length)return Math.min(...vals);

   // IMPORTANT: do NOT fall back to currentInvoiceTotal(), because that may be VAT-added.
   return 0;
 }

 function fillPaymentAmountIfOpen(){
   const amount=currentInvoiceTotal();
   if(!amount)return false;

   const boxes=[...document.querySelectorAll('div.pop2,div.pop1,[role="dialog"]')].filter(box=>{
     const t=normText(box.innerText||box.textContent||'');
     return t.includes('סכום') && box.querySelector('input');
   });

   for(const box of boxes){
     // Ignore our own MFIX customer dialog.
     if(box.closest('#mfix43-customer-dialog') || box.id==='mfix43-customer-dialog')continue;

     // IMPORTANT: Z-Credit "סליקה במקום" contains TWO numeric fields:
     // "מספר תשלומים" and "סכום חיוב". Generic auto-fill must NOT touch it,
     // otherwise the payment count can become the invoice amount (e.g. 10 payments).
     const boxText=normText(box.innerText||box.textContent||'');
     if(boxText.includes('מספר תשלומים') && boxText.includes('סכום חיוב'))continue;

     const inputs=[...box.querySelectorAll('input')].filter(i=>{
       const type=(i.type||'text').toLowerCase();
       return ['text','number','tel'].includes(type) && !i.disabled && !i.readOnly;
     });
     if(!inputs.length)continue;

     let target=inputs.find(i=>{
       const parent=i.closest('.md-input-container') || i.parentElement;
       const around=normText((parent?.innerText||'')+' '+(parent?.parentElement?.innerText||''));
       return /סכום/.test(around);
     });

     // Learned payment modal has fields: date, description, amount, currency.
     if(!target){
       target=inputs.find(i=>{
         const around=normText(i.parentElement?.parentElement?.innerText||'');
         return around.includes('סכום');
       });
     }
     if(!target)continue;

     const wanted=(Math.round(amount*100)/100).toString();
     if(String(target.value||'').trim()!==wanted){
       setNativeInput(target,wanted);
       target.dispatchEvent(new Event('blur',{bubbles:true}));
       toast('סכום החשבונית מולא אוטומטית ✓',1800);
     }
     return true;
   }
   return false;
 }

 function armDesktopPaymentAmount(){
   // Applies to cash, credit, transfer, cheque and every other native payment dialog
   // that contains a "סכום" field. Total is read from the invoice at the moment the dialog opens.
   fillPaymentAmountIfOpen();

   const ob=new MutationObserver(()=>fillPaymentAmountIfOpen());
   ob.observe(document.documentElement,{childList:true,subtree:true});

   // Also catch dialogs that are already open and only change class/display/value.
   const timer=setInterval(fillPaymentAmountIfOpen,350);
   setTimeout(()=>{
     ob.disconnect();
     clearInterval(timer);
   },120000);
 }


 function removeMfixNextStep(){
   document.getElementById('mfix-next-step-450')?.remove();
 }


 function mfixNativeInvoiceUnits1391(){
   try{
     const rows=[...document.querySelectorAll('div.servicesdesk div.lines div.grid-receipt > div.item, div.lines div.grid-receipt > div.item')].filter(e=>{
       if(e.offsetParent===null)return false;
       const t=normText(e.innerText||e.textContent||'');
       const hasMenu=!!e.querySelector('i.fa-ellipsis-v,i.fal.fa-ellipsis-v,div.g-bu2.meg');
       const hasMoney=/₪|מחיר|סה[״"]?כ/.test(t);
       return hasMenu || hasMoney;
     });
     return rows.length;
   }catch(_){return 0}
 }

 function desktopInvoiceLineCount(){
   return [...document.querySelectorAll(
     'div.servicesdesk div.lines div.grid-receipt div.item, div.lines div.grid-receipt div.item'
   )].filter(r=>{
     const t=normText(r.innerText||r.textContent||'');
     return t.includes('מחיר ליחידה') && t.includes('סה"כ');
   }).length;
 }

 async function ensureDesktopWalkInCustomer(){
   let input=document.querySelector('#nameofCustomer');
   if(input && normText(input.value||'').includes('לקוח מזדמן'))return true;

   // Desktop can render this control a little differently, so don't rely only on offsetParent.
   for(let n=0;n<50&&!input;n++){
     input=document.querySelector('#nameofCustomer');
     if(!input)await sleep(100);
   }
   if(!input)return false;

   input.focus();
   clickNative(input);
   await sleep(150);

   let walkin=null;
   for(let n=0;n<60&&!walkin;n++){
     walkin=[...document.querySelectorAll('span.sn1,div.sn1')].find(e=>
       normText(e.innerText||e.textContent)==='##לקוח מזדמן'
     );
     if(!walkin)await sleep(100);
   }
   if(!walkin)return false;

   clickNative(walkin);
   for(let n=0;n<30;n++){
     if(normText(document.querySelector('#nameofCustomer')?.value||'').includes('לקוח מזדמן'))return true;
     await sleep(100);
   }
   return true;
 }

 function watchAdditionalDesktopItem(beforeCount){
   let finished=false;
   const finish=()=>{
     if(finished)return;
     const count=desktopInvoiceLineCount();
     const modal=[...document.querySelectorAll('#pop1,div.pop1')].find(e=>{
       const t=normText(e.innerText||e.textContent||'');
       return t.includes('רשימת פריטים') && t.includes('חיפוש מוצרים');
     });
     // Once an additional invoice line appears and the item chooser is gone,
     // return to the same fast decision: another product or payment.
     if(count>beforeCount && !modal){
       finished=true;
       clearInterval(timer);
       toast('המוצר הנוסף הוכנס ✓',1600);
       setTimeout(showMfixNextStep,120);
     }
   };
   const timer=setInterval(finish,220);
   setTimeout(()=>{
     if(!finished)clearInterval(timer);
   },90000);
 }


 const MFIX_CART_640='mfixCart640';
 function mfixCartGet640(){
   try{const a=JSON.parse(sessionStorage.getItem(MFIX_CART_640)||'[]');return Array.isArray(a)?a:[]}catch(_){return[]}
 }
 function mfixCartSet640(a){
   sessionStorage.setItem(MFIX_CART_640,JSON.stringify(a||[]));
   mfixCartBadge640();
 }
 function mfixCartKey640(x){
   if(x?.__mfixGeneralPrice640)return 'GENERAL:'+String(x.__mfixGeneralPrice640);
   return String(x?.Barcode||x?.Name||x?.CatalogNumber||productTitle(x,'')||'').trim();
 }
 function mfixCartAdd640(product){
   // LITE: no cart. One chosen/scanned product goes straight to the current/new invoice.
   return openInvoiceForProduct(product);
 }
 function mfixCartTotal640(){
   return mfixCartGet640().reduce((sum,x)=>sum+(Number(x.product?.__mfixGeneralPrice640||x.product?.Price||0)*(x.qty||1)),0);
 }
 function mfixCartBadge640(){
   document.getElementById('mfix-cart-badge-640')?.remove();
   return;
   let b=document.getElementById('mfix-cart-badge-640');
   const a=mfixCartGet640(), n=a.reduce((q,x)=>q+(x.qty||1),0);
   if(!n){b?.remove();return}
   if(!b){
     b=document.createElement('button');b.id='mfix-cart-badge-640';b.dir='rtl';
     b.style.cssText='position:fixed;right:18px;bottom:92px;z-index:2147483645;border:0;border-radius:18px;background:#f59e0b;color:#111827;padding:13px 18px;font:900 17px Arial;box-shadow:0 8px 28px #0005;cursor:pointer';