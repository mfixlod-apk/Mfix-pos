
     // Let YesInvoice populate price/description before saving.
     await sleep(500);
     await trySelectMatchedSerial(product);

     let save=null;
     for(let n=0;n<60&&!save;n++){
       save=[...document.querySelectorAll('button.buttonai,button')].find(e=>e.offsetParent!==null&&(e.innerText||'').replace(/\s+/g,' ').trim()==='שמירת פרטים');
       if(!save)await sleep(100);
     }
     if(!save){toast('המוצר נבחר — לא מצאתי שמירת פרטים');return}
     clickNative(save);

     for(let n=0;n<70;n++){
       await sleep(150);
       const text=document.body?.innerText||'';
       if((!bar||text.includes(bar)) && text.includes('מחיר ליחידה')){
         await chrome.storage.local.remove(PENDING);
         toast('המוצר הוכנס לחשבונית — מוכן למכירה ✓',3500);
         try{mfix131FirstItemConfirmed(product)}catch(_){}
         setTimeout(showCustomerDialog,250);
         return;
       }
     }
     toast('המוצר לא אושר בתוך שורת החשבונית — עצרתי לפני המשך המכירה',3600);
     // Keep pending state so the cashier can retry deliberately; do not continue to payment/customer as if successful.
   } finally {
     insertRunning=false;
   }
 }

 let lastManualEdit=0;
 function isEditable(el){
   return !!el && (el.matches?.('input,textarea,select,[contenteditable=\"true\"]'));
 }
 document.addEventListener('focusin',e=>{
   const main=generalSearchInput();
   if(isEditable(e.target) && e.target!==main) lastManualEdit=Date.now();
 },true);
 document.addEventListener('pointerdown',e=>{
   const main=generalSearchInput();
   if(isEditable(e.target) && e.target!==main) lastManualEdit=Date.now();
 },true);

 function focusMainSearch(){
   let forced=false;
   try{
     forced=sessionStorage.getItem('mfixForceSearch479')==='1' ||
            new URL(location.href).searchParams.get('mfixsearch')==='1';
   }catch(_){}

   if(!forced && !location.href.includes('/invoice/main')) return;

   const input=generalSearchInput();
   if(!input || input.offsetParent===null) return;

   // v4.8.9: while the user is typing in the main search,
   // never refocus/reselect it on DOM mutations.
   if(document.activeElement===input) return;

   const active=document.activeElement;
   if(!forced){
     // Never steal focus while the user intentionally works in another field.
     if(isEditable(active) && active!==input && Date.now()-lastManualEdit<8000) return;
     // Do not focus through an open YesInvoice modal/dialog.
     const modal=[...document.querySelectorAll('[role="dialog"],.pop2,.modal')]
       .find(x=>x.offsetParent!==null && x.contains(input)===false);
     if(modal) return;
   }

   try{
     input.focus({preventScroll:true});
   }catch(_){
     try{ input.focus(); }catch(__){}
   }

   try{
     sessionStorage.removeItem('mfixForceSearch479');
     const u=new URL(location.href);
     if(u.searchParams.get('mfixsearch')==='1'){
       u.searchParams.delete('mfixsearch');
       history.replaceState(history.state,'',u.pathname+u.search+u.hash);
     }
   }catch(_){}
 }

 function mfixKeyboardShortcuts490(e){
   const tag=(document.activeElement?.tagName||'').toLowerCase();
   const typing=tag==='input'||tag==='textarea'||document.activeElement?.isContentEditable;
   if(typing && !['F2','F4','F6','F8','Escape'].includes(e.key))return;

   if(e.key==='F2'){
     e.preventDefault();
     const b=[...document.querySelectorAll('#mfix-next-step-450 button')].find(x=>/עוד מוצר/.test(x.textContent||''));
     if(b){b.click();return}
     const input=generalSearchInput();
     if(input)input.focus();
   }
   if(e.key==='F4'){
     const b=document.getElementById('mfix-quick-cash-490');
     if(b){e.preventDefault();b.click()}
   }
   if(e.key==='F6'){
     const b=document.getElementById('mfix-quick-card-490');
     if(b){e.preventDefault();b.click()}
   }
   if(e.key==='F8'){
     const b=document.getElementById('mfix-reprint-last-490');
     if(b){e.preventDefault();b.click()}
   }
   if(e.key==='Escape'){
     document.getElementById('mfixSmartPay469')?.remove();
     document.getElementById('mfix43-customer-dialog')?.remove();
   }
 }



 function mfixManualFontControl503(){
   return; // 13.9.10 PERFORMANCE: no floating settings controls
   if(document.getElementById('mfix-font-float-503')) return;

   const applySize=size=>{
     const n=Number(size);
     if(!Number.isFinite(n)) return;
     document.documentElement.style.setProperty('--mfix-result-title',n+'px');
     document.documentElement.style.setProperty('--mfix-result-meta',Math.max(13,n-5)+'px');
     document.documentElement.style.setProperty('--mfix-result-row',Math.max(54,n*2.8)+'px');
     document.documentElement.style.setProperty('--mfix-result-button',Math.max(15,n-3)+'px');
     try{localStorage.setItem('mfixManualSearchFont503',String(n))}catch(_){}
   };

   const clearManual=()=>{
     document.documentElement.style.removeProperty('--mfix-result-title');
     document.documentElement.style.removeProperty('--mfix-result-meta');
     document.documentElement.style.removeProperty('--mfix-result-row');
     document.documentElement.style.removeProperty('--mfix-result-button');
     try{localStorage.removeItem('mfixManualSearchFont503')}catch(_){}
   };

   // Apply saved choice immediately.
   try{
     const saved=Number(localStorage.getItem('mfixManualSearchFont503')||'');
     if(Number.isFinite(saved) && saved>=16 && saved<=34) applySize(saved);
   }catch(_){}

   const float=document.createElement('div');
   float.id='mfix-font-float-503';
   float.style.cssText=[
     'position:fixed',
     'left:10px',
     'top:28%',
     'z-index:2147483644',
     'font-family:Arial,sans-serif',
     'user-select:none',
     'touch-action:none'
   ].join(';');

   try{
     const pos=JSON.parse(localStorage.getItem('mfixFontFloatPos503')||'null');
     if(pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)){
       float.style.left=Math.max(0,Math.min(window.innerWidth-62,pos.x))+'px';
       float.style.top=Math.max(0,Math.min(window.innerHeight-62,pos.y))+'px';
     }
   }catch(_){}

   const pill=document.createElement('button');
   pill.type='button';
   pill.textContent='Aa';
   pill.title='גודל תוצאות החיפוש';
   pill.style.cssText='width:48px;height:48px;border:0;border-radius:999px;background:#111827ee;color:#fff;font:bold 17px Arial;box-shadow:0 5px 16px #0006;backdrop-filter:blur(8px)';

   const panel=document.createElement('div');
   panel.style.cssText='display:none;position:absolute;left:54px;top:0;width:220px;background:#111827f5;color:#fff;border:1px solid #ffffff22;border-radius:14px;padding:10px;box-shadow:0 8px 24px #0007;backdrop-filter:blur(8px)';

   const title=document.createElement('div');
   title.textContent='גודל תוצאות החיפוש';
   title.style.cssText='font-weight:800;font-size:14px;margin-bottom:8px';

   const value=document.createElement('div');
   value.style.cssText='font-weight:800;font-size:18px;text-align:center;margin-bottom:6px';

   const slider=document.createElement('input');
   slider.type='range';
   slider.min='16';
   slider.max='34';
   slider.step='1';
   slider.style.cssText='width:100%';

   let current=20;
   try{
     const saved=Number(localStorage.getItem('mfixManualSearchFont503')||'');
     if(Number.isFinite(saved) && saved>=16 && saved<=34) current=saved;
   }catch(_){}
   slider.value=String(current);
   value.textContent=current+'px';

   slider.oninput=()=>{
     const n=Number(slider.value);
     value.textContent=n+'px';
     applySize(n);
   };

   const row=document.createElement('div');
   row.style.cssText='display:flex;gap:6px;margin-top:8px';

   const smaller=document.createElement('button');
   smaller.type='button';
   smaller.textContent='A−';
   smaller.style.cssText='flex:1;border:0;border-radius:9px;padding:8px;background:#374151;color:white;font-weight:800';
   smaller.onclick=()=>{
     slider.value=String(Math.max(16,Number(slider.value)-1));
     slider.oninput();
   };

   const bigger=document.createElement('button');
   bigger.type='button';
   bigger.textContent='A+';
   bigger.style.cssText='flex:1;border:0;border-radius:9px;padding:8px;background:#14b8a6;color:white;font-weight:800';
   bigger.onclick=()=>{
     slider.value=String(Math.min(34,Number(slider.value)+1));
     slider.oninput();
   };

   const auto=document.createElement('button');
   auto.type='button';
   auto.textContent='אוטומטי';
   auto.style.cssText='width:100%;margin-top:7px;border:0;border-radius:9px;padding:8px;background:#4b5563;color:white;font-weight:700';
   auto.onclick=()=>{
     clearManual();
     value.textContent='אוטומטי';
   };

   row.append(smaller,bigger);
   panel.append(title,value,slider,row,auto);
   float.append(pill,panel);
   document.documentElement.appendChild(float);

   pill.onclick=e=>{
     e.stopPropagation();
     panel.style.display=panel.style.display==='none'?'block':'none';
   };

   // Drag only the small Aa bubble; this keeps the panel from covering important UI.
   let drag=false,dx=0,dy=0,pid=null,moved=false;
   pill.addEventListener('pointerdown',e=>{
     drag=true;moved=false;pid=e.pointerId;
     const r=float.getBoundingClientRect();
     dx=e.clientX-r.left;dy=e.clientY-r.top;
     try{pill.setPointerCapture(pid)}catch(_){}
   });
   window.addEventListener('pointermove',e=>{
     if(!drag)return;
     moved=true;
     const x=Math.max(0,Math.min(window.innerWidth-float.offsetWidth,e.clientX-dx));
     const y=Math.max(0,Math.min(window.innerHeight-52,e.clientY-dy));
     float.style.left=x+'px';
     float.style.top=y+'px';
     e.preventDefault();
   },{passive:false});
   window.addEventListener('pointerup',()=>{
     if(!drag)return;
     drag=false;
     try{
       const r=float.getBoundingClientRect();
       localStorage.setItem('mfixFontFloatPos503',JSON.stringify({x:r.left,y:r.top}));
     }catch(_){}
     setTimeout(()=>{moved=false},60);
   });

   // Close the settings panel when tapping elsewhere.
   document.addEventListener('click',e=>{
     if(!float.contains(e.target)) panel.style.display='none';
   },true);
 }

 function mfixResponsiveUi502(){
   if(document.getElementById('mfix-responsive-style-502')) return;

   const style=document.createElement('style');
   style.id='mfix-responsive-style-502';
   style.textContent=`
     /* MFIX v5.0.2 responsive visual layer only.
        No business logic or selectors are changed. */

     :root{
       --mfix-search-font:16px;
       --mfix-result-title:16px;
       --mfix-result-meta:13px;
       --mfix-touch-min:42px;
       --mfix-result-row:54px;
       --mfix-result-button:15px;
       --mfix-result-row:48px;
     }

     /* Medium tablets / landscape phones / smaller Chromebooks */
     @media (min-width: 760px){
       :root{
         --mfix-search-font:18px;
         --mfix-result-title:18px;
         --mfix-result-meta:14px;
         --mfix-touch-min:46px;
       }
     }

     /* 10" tablets, DeX and Chromebook sized layouts */
     @media (min-width: 900px){
       :root{
         --mfix-search-font:21px;
         --mfix-result-title:19px;
         --mfix-result-meta:15px;
         --mfix-touch-min:50px;
       }
     }

     /* Large Chromebook / desktop */
     @media (min-width: 1200px){
       :root{
         --mfix-search-font:22px;
         --mfix-result-title:20px;
         --mfix-result-meta:15px;
         --mfix-touch-min:52px;
       }
     }

     /* Main/general-search input. Kept intentionally narrow in scope. */
     #generalSearchInput,
     input[placeholder*="חיפוש"],
     input[placeholder*="חפש"],
     input[type="search"]{
       font-size:inherit !important;
       line-height:1.35 !important;
     }

     /* MFIX-rendered search results only */
     #mfix-products43,
     #mfix-products43 *{
       box-sizing:border-box;
     }

     #mfix-products43 > div{
       min-height:var(--mfix-result-row) !important;
       padding-top:12px !important;
       padding-bottom:12px !important;
     }

     #mfix-products43 > div:not(:first-child){
       font-size:var(--mfix-result-meta) !important;
     }

     #mfix-products43 b{
       font-size:var(--mfix-result-title) !important;
       line-height:1.35 !important;
     }

     #mfix-products43 div[style*="font-size:12px"],
     #mfix-products43 div[style*="font-size: 12px"]{
       font-size:var(--mfix-result-meta) !important;
       line-height:1.4 !important;
     }

     #mfix-products43 button{
       min-height:var(--mfix-touch-min) !important;
       font-size:var(--mfix-result-button) !important;
       min-width:150px !important;
       padding:10px 14px !important;
     }

     /* MFIX quick bar: responsive sizing only, same buttons/behavior */
     #mfix-next-step-450{
       max-width:min(96vw,820px) !important;
     }

     @media (max-width: 899px){
       #mfix-next-step-450{
         transform:translateX(-50%) scale(.92);
         transform-origin:bottom center;
       }
     }

     @media (min-width: 900px){
       #mfix-next-step-450 button{
         min-height:48px;
       }
     }

     /* Floating print dock scales gently by viewport */
     #mfix-floating-dock-500{
       width:clamp(138px,15vw,178px) !important;
     }

     #mfix-floating-dock-500 button{
       font-size:clamp(13px,1.4vw,16px) !important;
       min-height:44px !important;
     }

     /* Customer dialog: keep usable on portrait/landscape/tablet */
     #mfix43-customer-dialog > div{
       width:min(92vw,520px) !important;
       max-height:88vh !important;
       overflow:auto !important;
     }

     #mfix43-customer-dialog input{
       font-size:clamp(16px,1.7vw,20px) !important;
       min-height:46px !important;
     }

     /* Avoid oversized visuals on phones */
     @media (max-width: 759px){
       #mfix-products43 b{font-size:16px !important;}
       #mfix-products43 div[style*="font-size:12px"]{font-size:13px !important;}
       #mfix-floating-dock-500{width:136px !important;}
     }
   `;
   document.documentElement.appendChild(style);
 }


 // ===== MFIX 6.1.2 PRO OPTIONAL TOOLKIT =====
 // Additive UI only. Core product/payment/Z-Credit/RawBT flows remain unchanged.

 const MFIX_FAV_600='mfixFavorites600';
 const MFIX_SETTINGS_600='mfixProSettings600';

 function mfixGetFavorites600(){
   try{
     const a=JSON.parse(localStorage.getItem(MFIX_FAV_600)||'[]');
     return Array.isArray(a)?a:[];
   }catch(_){return []}
 }

 function mfixSetFavorites600(a){
   try{localStorage.setItem(MFIX_FAV_600,JSON.stringify(a.slice(0,30)))}catch(_){}
 }

 function mfixToggleFavorite600(product){
   const a=mfixGetFavorites600();
   const key=String(product.__favKey??product.ID??product.Id??product.id??product.Barcode??product.CatalogNumber??product.Name??'');
   const i=a.findIndex(f=>String(f.__favKey??f.ID??f.Id??f.id??f.Barcode??f.CatalogNumber??f.Name??'')===key);
   if(i>=0){
     a.splice(i,1);
     toast('הוסר מהמועדפים',1100);
   }else{
     const safe={
       ...product,
       __favKey:key
     };
     a.unshift(safe);
     toast('★ נוסף למועדפים',1100);
   }
   mfixSetFavorites600(a);
 }

 function mfixSettings600(){
   const d={
     showTotal:true,
     showFavorites:true,
     showChange:true,
     showStock:true,
     showSuccess:true,
     doubleLock:true
   };
   try{return {...d,...JSON.parse(localStorage.getItem(MFIX_SETTINGS_600)||'{}')}}catch(_){return d}
 }

 function mfixSaveSettings600(v){
   try{localStorage.setItem(MFIX_SETTINGS_600,JSON.stringify(v))}catch(_){}
 }

 function mfixHighlightSearch600(root,q){
   const needle=String(q||'').trim();
   if(!needle || needle.length<2 || !root)return;
   const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
   const nodes=[];
   while(walk.nextNode())nodes.push(walk.currentNode);
   for(const n of nodes){
     if(n.parentElement?.closest('button'))continue;
     const txt=n.nodeValue||'';
     const i=txt.toLowerCase().indexOf(needle.toLowerCase());
     if(i<0)continue;
     const frag=document.createDocumentFragment();
     frag.append(txt.slice(0,i));
     const mark=document.createElement('mark');
     mark.textContent=txt.slice(i,i+needle.length);
     mark.style.cssText='background:#fde68a;border-radius:3px;padding:0 1px';
     frag.append(mark,txt.slice(i+needle.length));
     n.parentNode?.replaceChild(frag,n);
   }
 }

 function mfixInvoiceRows600(){
   return [...document.querySelectorAll(
     'div.servicesdesk div.lines div.grid-receipt div.item, div.lines div.grid-receipt div.item'
   )].filter(r=>{
     const t=normText(r.innerText||r.textContent||'');
     return t.includes('מחיר ליחידה') && t.includes('סה"כ');
   });
 }
