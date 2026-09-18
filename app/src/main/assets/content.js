
(()=>{
 if(window.__MFIX43)return;window.__MFIX43=1;

 const PENDING='mfixPending43', PANEL='mfix-products43';
 let debounceTimer=null, insertRunning=false;
 // v4.6.2: safe default is price search; fast scan is opt-in.
 let mfixSearchMode='search', mfixFastHandledQuery='';
 let mfixLastAddKey='', mfixLastAddAt=0;
 let mfixScannerPendingQuery='';
 let mfixAfterCustomerDialog=null;

 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const isBarcode=v=>/^\d{8,16}$/.test(String(v||'').trim());

 function toast(t,ms=3500){
   let e=document.getElementById('mfix43-toast');
   if(!e){
     e=document.createElement('div');e.id='mfix43-toast';
     Object.assign(e.style,{position:'fixed',top:'10px',left:'10px',zIndex:2147483647,background:'#111',color:'#fff',padding:'10px 13px',borderRadius:'10px',font:'14px Arial',direction:'rtl',maxWidth:'90vw'});
     document.documentElement.appendChild(e);
   }
   e.textContent=t;e.style.display='block';clearTimeout(e._t);e._t=setTimeout(()=>e.style.display='none',ms);
 }

 function clickNative(el){
   if(!el)return false;
   try{
     el.scrollIntoView({block:'center',inline:'nearest'});
     const opts={bubbles:true,cancelable:true,view:window};
     try{el.dispatchEvent(new PointerEvent('pointerdown',{...opts,pointerType:'mouse'}))}catch(_){}
     el.dispatchEvent(new MouseEvent('mousedown',opts));
     el.dispatchEvent(new MouseEvent('mouseup',opts));
     el.click();
     return true;
   }catch(_){try{el.click();return true}catch(__){return false}}
 }

 function setValue(el,v){
   el.focus();
   const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
   const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
   setter?setter.call(el,v):el.value=v;
   el.dispatchEvent(new Event('input',{bubbles:true}));
   el.dispatchEvent(new Event('change',{bubbles:true}));
   try{
     el.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'7'}));
   }catch(_){}
 }

 function deepParse(v,d=0){
   if(d>7)return v;
   if(typeof v==='string'){try{return deepParse(JSON.parse(v),d+1)}catch(_){return v}}
   if(Array.isArray(v))return v.map(x=>deepParse(x,d+1));
   if(v&&typeof v==='object'){let o={};for(const[k,x]of Object.entries(v))o[k]=deepParse(x,d+1);return o}
   return v;
 }

 function productArray(raw){
   const root=deepParse(raw), arrays=[];
   const walk=(v,d=0)=>{
     if(d>8||v==null)return;
     if(Array.isArray(v)){
       if(v.some(x=>x&&typeof x==='object'&&('Name'in x||'Barcode'in x||'Price'in x||'CatalogNumber'in x)))arrays.push(v);
       v.forEach(x=>walk(x,d+1));
     }else if(typeof v==='object')Object.values(v).forEach(x=>walk(x,d+1));
   };
   walk(root);arrays.sort((a,b)=>b.length-a.length);return arrays[0]||[];
 }


 function productTitle(x,q=''){
   // Prefer the actual YesInvoice product fields. Do not scan the whole API object:
   // serial records contain dates/metadata which previously became the displayed title.
   const direct=[
     x?.Body,x?.body,x?.ProductName,x?.productName,x?.Description,x?.description,x?.Name,x?.name
   ].map(v=>String(v??'').trim()).filter(Boolean);
   const generic=/^(סריאלים?|serials?)$/i;
   const good=direct.find(v=>!generic.test(v) && (/[A-Za-zא-ת]/.test(v) || /\d/.test(v)));
   const sku=String(x?.CatalogNumber||x?.catalogNumber||x?.sku||x?.SKU||'').trim();
   return good || sku || String(x?.Barcode||x?.Name||x?.name||'פריט').trim();
 }


 const mfixProductDetailCache509=new Map();

 function mfixBestDisplayName509(x){
   const vals=[
     x?.Body,x?.body,
     x?.ProductName,x?.productName,
     x?.Description,x?.description,
     x?.Name,x?.name
   ].map(v=>String(v??'').trim()).filter(Boolean);

   // Avoid showing pure barcode/sku values as the title when a textual name exists.
   const textual=vals.find(v=>/[A-Za-zא-ת]/.test(v));
   return textual || vals[0] || '';
 }

 function mfixEnrichProductTitle509(x,row,q){
   const id=Number(x?.ID??x?.Id??x?.id);
   if(!id || !row)return;

   const apply=prod=>{
     if(!prod)return;
     const nm=mfixBestDisplayName509(prod);
     if(!nm || !/[A-Za-zא-ת]/.test(nm))return;

     const title=row.querySelector('.mfix-title-509');
     if(title)title.textContent=nm;
   };

   if(mfixProductDetailCache509.has(id)){
     apply(mfixProductDetailCache509.get(id));
     return;
   }

   try{
     chrome.runtime.sendMessage({type:'MFIX_PRODUCT_DETAIL_509',id},res=>{
       if(!res?.ok || !res.product)return;
       mfixProductDetailCache509.set(id,res.product);
       apply(res.product);
     });
   }catch(_){}
 }

 function stock(x){
   const nums=[x.allQuantity,x.AllQuantity,x.AvailableQuantity,x.StockQuantity,x.Quantity,x.QuantityStorage].map(Number).filter(Number.isFinite);
   return nums.find(v=>v>0)??nums[0]??'';
 }

 function generalSearchInput(){
   return [...document.querySelectorAll('input')].find(i=>{
     const s=((i.placeholder||'')+' '+(i.getAttribute('aria-label')||'')).trim();
     return s.includes('חיפוש')&&(s.includes('לקוח')||s.includes('מסמך')||s.includes('ספק')||s.includes('הוצאה')||s.includes('דוחות'));
   });
 }

 function ensurePanel(input){
   let p=document.getElementById(PANEL);
   if(p)return p;
   p=document.createElement('div');p.id=PANEL;
   Object.assign(p.style,{background:'#fff',border:'1px solid #ddd',borderRadius:'11px',margin:'8px 0',padding:'8px',direction:'rtl',font:'14px Arial',maxHeight:'43vh',overflow:'auto'});
   const anchor=input.closest('.md-input-container')||input.parentElement;
   const host=anchor?.parentElement||input.parentElement;
   if(anchor&&host)host.insertBefore(p,anchor.nextSibling);
   else input.insertAdjacentElement('afterend',p);
   return p;
 }

 function exactScanMatch(x,q){
   const needle=String(q||'').trim().toLowerCase();
   if(!needle)return false;
   const vals=[
     x?.Barcode,x?.barcode,x?.Name,x?.name,x?.__matchedSerial,
     x?.SerialNumber,x?.serialNumber
   ].map(v=>String(v??'').trim().toLowerCase()).filter(Boolean);
   return vals.includes(needle);
 }

 function mfixSearchScore490(x,q){
   const n=String(q||'').trim().toLowerCase();
   if(!n)return 99;
   const barcode=String(x?.Barcode||x?.barcode||'').trim().toLowerCase();
   const serial=String(x?.__matchedSerial||x?.SerialNumber||x?.serialNumber||'').trim().toLowerCase();
   const sku=String(x?.CatalogNumber||x?.catalogNumber||x?.sku||x?.SKU||'').trim().toLowerCase();
   const name=String(productTitle(x,q)||'').trim().toLowerCase();
   const body=String(x?.Body||x?.body||'').trim().toLowerCase();
   const codeName=String(x?.Name||x?.name||'').trim().toLowerCase();
   if(barcode===n||codeName===n)return 0;
   if(serial===n)return 1;
   if(sku===n)return 2;
   if(body===n||name===n)return 3;
   if(barcode.startsWith(n)||codeName.startsWith(n))return 4;
   if(sku.startsWith(n))return 5;
   if(body.startsWith(n)||name.startsWith(n))return 6;
   if(body.includes(n)||name.includes(n))return 7;
   return 20;
 }

 function mfixProductAddKey490(x){
   return String(
     x?.__matchedSerial || x?.Barcode || x?.barcode ||
     x?.CatalogNumber || x?.catalogNumber ||
     x?.ID || x?.Id || x?.id || x?.Name || x?.name || ''
   ).trim().toLowerCase();
 }

 function renderProducts(input,items,q){
   const p=ensurePanel(input);
   p.innerHTML='';

   const top=document.createElement('div');
   top.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 5px 9px;position:sticky;top:0;background:#fff;z-index:2;border-bottom:1px solid #eee';

   const title=document.createElement('b');
   title.textContent=`פריטים (${items.length})`;

   const modes=document.createElement('div');
   modes.style.cssText='display:flex;gap:5px;direction:rtl';

   const searchBtn=document.createElement('button');
   searchBtn.type='button';
   searchBtn.textContent='חיפוש מחיר';
   searchBtn.style.cssText=`padding:14px 20px;border-radius:14px;border:1px solid #15966a;font-weight:700;${mfixSearchMode==='search'?'background:#15966a;color:#fff':'background:#fff;color:#15966a'}`;

   const fastBtn=document.createElement('button');
   fastBtn.type='button';
   fastBtn.textContent='סריקה מהירה';
   fastBtn.style.cssText=`padding:7px 10px;border-radius:9px;border:1px solid #bbb;font-weight:700;${mfixSearchMode==='fast'?'background:#222;color:#fff':'background:#fff;color:#333'}`;

   searchBtn.addEventListener('click',e=>{
     e.preventDefault();e.stopPropagation();
     mfixSearchMode='search';
     mfixFastHandledQuery='';
     renderProducts(input,items,q);
     input.focus();
   });

   fastBtn.addEventListener('click',e=>{
     e.preventDefault();e.stopPropagation();
     mfixSearchMode='fast';
     mfixFastHandledQuery='';
     renderProducts(input,items,q);
     input.focus();
     toast('סריקה מהירה פעילה — התאמה מדויקת תיכנס לחשבונית',2600);
   });

   modes.append(searchBtn,fastBtn);
   top.append(title,modes);
   p.appendChild(top);

   const hint=document.createElement('div');
   hint.style.cssText='padding:7px 7px 3px;font-size:12px;color:#666';
   hint.textContent=mfixSearchMode==='search'
     ? 'ברירת מחדל: חיפוש בלבד. הכנסה לחשבונית רק בלחיצה.'
     : 'סריקה מהירה: ברקוד / Serial / IMEI מדויק ייכנס אוטומטית.';
   p.appendChild(hint);

   if(!items.length){
     const none=document.createElement('div');
     none.style.cssText='padding:8px';
     none.textContent='לא נמצאו פריטים';
     p.appendChild(none);
     return;
   }

   for(const x of items.slice(0,20)){
     const name=productTitle(x,q);
     const bar=x.Barcode||x.barcode||(isBarcode(x.Name)?x.Name:'');
     const price=x.Price??x.UnitPrice??'';
     const st=stock(x);
     const matchedSerial=String(x.__matchedSerial||'').trim();
     const row=document.createElement('div');
     const stNum=Number(st);
     const stockWarn=Number.isFinite(stNum)&&stNum<=1?(stNum<=0?'⚠️ אין מלאי':'⚠️ מלאי אחרון'):'';
     row.style.cssText='padding:10px 7px;border-top:1px solid #eee'+(stockWarn?';background:#fff8e8':'');
     const actualName=String(x.Body||x.body||x.ProductName||x.productName||x.Description||x.description||'').trim();
     const learnedName607=mfixBindKnownNameToProduct607(x);
     const titleText=actualName||learnedName607||name;
     row.innerHTML=`<b class="mfix-title-509">${esc(matchedSerial?'נמצא לפי Serial/IMEI — '+titleText:titleText)}</b><div style="font-size:12px;color:#666;margin-top:4px">${esc([bar&&'ברקוד: '+bar,x.CatalogNumber&&'מק״ט: '+x.CatalogNumber,matchedSerial&&'Serial/IMEI: '+matchedSerial,price!==''&&'₪'+Number(price).toLocaleString('he-IL'),st!==''&&'מלאי: '+st,stockWarn].filter(Boolean).join(' · '))}</div>`;
     mfixEnrichProductTitle509(x,row,q);

     const actions=document.createElement('div');
     actions.style.cssText='display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:7px';

     const btn=document.createElement('button');
     btn.type='button';
     btn.textContent='הוסף לחשבונית מס/קבלה';
     btn.style.cssText='padding:9px 11px;border:0;border-radius:8px;background:#15966a;color:#fff;font-weight:bold';
     btn.addEventListener('click',e=>{
       e.preventDefault();e.stopPropagation();
       if(matchedSerial)toast('📱 IMEI / Serial: '+matchedSerial,1800);
       openInvoiceForProduct(x);
     });

     const fav=document.createElement('button');
     fav.type='button';
     fav.title='הוסף/הסר ממועדפים';
     const favKey=String(x.ID??x.Id??x.id??bar??x.CatalogNumber??name);
     const isFav=()=>mfixGetFavorites600().some(f=>String(f.__favKey)===favKey);
     const paintFav=()=>{fav.textContent=isFav()?'★ מועדף':'☆ מועדף'};
     fav.style.cssText='padding:9px 11px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#374151;font-weight:bold';
     paintFav();
     fav.addEventListener('click',e=>{
       e.preventDefault();e.stopPropagation();
       mfixToggleFavorite600({...x,__favKey:favKey});
       paintFav();
       mfixRefreshProPanel600();
     });

     actions.append(btn,fav);
     row.appendChild(actions);

     if(matchedSerial){
       const imei=document.createElement('div');
       imei.textContent='📱 '+matchedSerial;
       imei.style.cssText='margin-top:7px;display:inline-block;background:#e0f2fe;color:#075985;border-radius:8px;padding:5px 8px;font-weight:800;font-size:14px';
       row.insertBefore(imei,actions);
     }

     // Highlight the exact text typed by the cashier, display-only.
     try{mfixHighlightSearch600(row,q)}catch(_){}

     p.appendChild(row);
   }

   const exact=items.find(x=>exactScanMatch(x,q));
   const key=String(q||'').trim().toLowerCase();

   if(mfixSearchMode==='fast'){
     if(exact && key && mfixFastHandledQuery!==key){
       mfixFastHandledQuery=key;
       toast('זוהה פריט מדויק — מציג מחיר…',1000);
       setTimeout(()=>mfixScannerAddWithPrice637(exact),120);
     }
   }

   if(exact && key && mfixScannerPendingQuery===key){
     mfixScannerPendingQuery='';
     toast('סריקה זוהתה — מציג מחיר…',900);
     setTimeout(()=>mfixScannerAddWithPrice637(exact),100);
   }
 }


 // ===== MFIX 14.1 UNIVERSAL INVENTORY BOOT =====
 let mfixInventoryBoot14=false, mfixInventoryBooting14=false;
 async function mfixBootstrapInventory14(force=false){
   if(mfixInventoryBooting14)return;
   mfixInventoryBooting14=true;
   try{chrome.runtime.sendMessage({type:'MFIX_INVENTORY_BOOTSTRAP_14',force},r=>{
     mfixInventoryBooting14=false;
     if(r?.ok){mfixInventoryBoot14=true;toast('✓ מלאי מוכן: '+r.count+' פריטים',1200)}
   })}catch(_){mfixInventoryBooting14=false}
 }
 function mfixAutoBootInventory14(){
   try{chrome.runtime.sendMessage({type:'MFIX_INVENTORY_STATUS_14'},r=>{if(r?.ok)mfixInventoryBoot14=true;else mfixBootstrapInventory14(false)})}catch(_){}
 }
 function runProductSearch(input){
   const q=input.value.trim();
   if(q.length<2){document.getElementById(PANEL)?.remove();return}

   let normalDone=false, serialDone=!(q.length>=5);
   let normalItems=[], serialItems=[];
   const finish=()=>{
     if(input.value.trim()!==q)return;
     const merged=[];
     const seen=new Set();
     for(const x of [...serialItems,...normalItems]){
       const key=String(x.ID??x.Id??x.id??x.Barcode??x.Name??Math.random());
       if(seen.has(key))continue;
       seen.add(key);merged.push(x);
     }
     merged.sort((a,b)=>mfixSearchScore490(a,q)-mfixSearchScore490(b,q));
     renderProducts(input,merged,q);
   };

   // Instant local cache search first; network search remains as fallback and refresh.
   try{chrome.runtime.sendMessage({type:'MFIX_SEARCH_LOCAL_14',q,limit:60},lr=>{
     if(input.value.trim()!==q)return;
     if(lr?.ok && lr.items?.length){normalItems=lr.items; normalDone=true; if(serialDone)finish();}
   })}catch(_){}

   chrome.runtime.sendMessage({type:'MFIX_SEARCH',q},r=>{
     normalDone=true;
     if(input.value.trim()!==q)return;
     if(r?.ok){const remote=productArray(r.text);if(remote.length)normalItems=remote;}
     if(serialDone)finish();
     else{
       const p=ensurePanel(input);
       p.innerHTML='<div style="padding:9px"><b>מחפש גם Serial / IMEI…</b><br><span style="font-size:12px;color:#666">בחיפוש הראשון זה יכול לקחת מעט זמן</span></div>';
     }
   });

   if(q.length>=5){
     chrome.runtime.sendMessage({type:'MFIX_SERIAL_SEARCH',q},r=>{
       serialDone=true;
       if(input.value.trim()!==q)return;
       if(r?.ok && r.match?.product){
         const sp={...r.match.product};
         const rawName=String(sp.Name||sp.name||'').trim();
         const serialSku=String(r.match.serialData?.sku||sp.CatalogNumber||sp.catalogNumber||sp.sku||sp.SKU||'').trim();
         if(/^(סריאלים?|serials?)$/i.test(rawName) && serialSku){
           sp.Name=serialSku;
           if(!sp.CatalogNumber)sp.CatalogNumber=serialSku;
         }
         serialItems=[{...sp,__matchedSerial:r.match.serial,__matchedSerialId:r.match.serialId}];
       }
       if(normalDone)finish();
     });
   }
 }

 function bindSearch(input){
   if(!input||input.__mfix43)return;
   input.__mfix43=1;
   input.__mfixKeyTimes490=[];

   input.addEventListener('keydown',e=>{
     if(e.key==='Enter'){
       const q=input.value.trim();
       const times=(input.__mfixKeyTimes490||[]).filter(t=>Date.now()-t<1800);
       let scannerLike=false;
       if(q.length>=5 && times.length>=Math.min(5,q.length)){
         const gaps=[];
         for(let i=1;i<times.length;i++)gaps.push(times[i]-times[i-1]);
         const avg=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:999;
         const max=gaps.length?Math.max(...gaps):999;
         scannerLike=avg<=65 && max<=160;
       }
       if(scannerLike){
         e.preventDefault();
         mfixScannerPendingQuery=q.toLowerCase();
         toast('סריקה זוהתה',900);
         runProductSearch(input);
       }
       input.__mfixKeyTimes490=[];
       return;
     }
     if(e.key.length===1){
       const a=input.__mfixKeyTimes490||(input.__mfixKeyTimes490=[]);
       a.push(Date.now());
       if(a.length>40)a.splice(0,a.length-40);
     }
   },true);

   input.addEventListener('input',()=>{
     clearTimeout(debounceTimer);
     debounceTimer=setTimeout(()=>runProductSearch(input),300);
   });
 }

 window.addEventListener('message',e=>{
   if(e.source===window&&e.data?.source==='MFIX_CAPTURE_609'&&e.data.type==='PRODUCT_RESPONSE'){
     let active=false;
     try{active=sessionStorage.getItem(MFIX_CAPTURE_ACTIVE_608)==='1'}catch(_){}
     if(active){
       const p=e.data.payload||{};
       let arr=[];
       try{arr=JSON.parse(sessionStorage.getItem(MFIX_CAPTURE_KEY_608)||'[]')}catch(_){}
       arr.push({kind:p.kind||'xhr',url:String(p.url||''),body:String(p.body||''),text:String(p.text||''),status:Number(p.status||0),at:Date.now()});
       arr=arr.slice(-30);
       try{sessionStorage.setItem(MFIX_CAPTURE_KEY_608,JSON.stringify(arr))}catch(_){}
       try{mfixUpdateCaptureButton608()}catch(_){}
       toast('✅ נקלטה קריאת מוצר ('+arr.length+')',1600);
     }
   }
   if(e.source===window&&e.data?.source==='MFIX43'&&e.data.type==='TEMPLATE'){
     const p=e.data.payload;if(p?.body){chrome.storage.local.set({mfixTemplate43:p},()=>mfixBootstrapInventory14(false));}
   }
 });

 const script=document.createElement('script');
 script.src=chrome.runtime.getURL('interceptor.js');
 script.onload=()=>script.remove();
 (document.head||document.documentElement).appendChild(script);
 setTimeout(mfixAutoBootInventory14,900);
 window.addEventListener('focus',()=>{if(!mfixInventoryBoot14)mfixAutoBootInventory14()});

 async function closeGeneralSearchExact(){
   let x=document.querySelector('main.masterpage.rtl.minimize > div.pop2 i.fal.fa-times.close, div.pop2 i.fal.fa-times.close');
   if(x){clickNative(x);await sleep(300);return true}
   return false;
 }


 async function chooseWalkInCustomer(){
   // Exact field learned from the mobile flow.
   let input=null;
   for(let n=0;n<70&&!input;n++){
     input=document.querySelector('#nameofCustomer');
     if(!(input&&input.offsetParent!==null))input=null;
     if(!input)await sleep(100);
   }
   if(!input)return false;

   // Opening the customer selector is enough to render the native customer list.
   input.focus();
   input.click();
   await sleep(180);

   let walkin=null;
   for(let n=0;n<50&&!walkin;n++){
     walkin=[...document.querySelectorAll('span.sn1')].find(e=>
       e.offsetParent!==null && (e.innerText||'').replace(/\s+/g,' ').trim()==='##לקוח מזדמן'
     );
     if(!walkin)await sleep(100);
   }
   if(!walkin)return false;
   clickNative(walkin);

   // Wait until the extended customer area / payment section begins to appear.
   for(let n=0;n<40;n++){
     if(document.body?.innerText?.includes('פרטי לקוח מורחב'))break;
     await sleep(100);
   }
   return true;
 }


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

     b.onclick=mfixCartOpen640;document.documentElement.appendChild(b);
   }
   b.textContent='🛒 סל '+n+' · ₪'+mfixCartTotal640().toLocaleString('he-IL',{maximumFractionDigits:2});
 }
 function mfixCartOpen640(){
   document.getElementById('mfix-cart-panel-640')?.remove();
   const a=mfixCartGet640(); if(!a.length)return;
   const ov=document.createElement('div');ov.id='mfix-cart-panel-640';ov.dir='rtl';
   ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0009;display:flex;align-items:center;justify-content:center;font-family:Arial';
   const rows=a.map((x,i)=>{
     const p=x.product||{}, price=Number(p.__mfixGeneralPrice640||p.Price||0), name=p.__mfixGeneralPrice640?'מוצר כללי':productTitle(p,'');
     return `<div style="display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:12px;border-bottom:1px solid #ffffff18">
       <div><b style="font-size:17px">${esc(name)}</b><div style="color:#94a3b8;font-size:13px">${p.Barcode?esc(String(p.Barcode)):''} · ₪${price.toLocaleString('he-IL',{maximumFractionDigits:2})}</div></div>
       <div style="display:flex;align-items:center;gap:7px"><button data-act="minus" data-i="${i}" style="width:34px;height:34px">−</button><b>${x.qty||1}</b><button data-act="plus" data-i="${i}" style="width:34px;height:34px">+</button></div>
       <button data-act="del" data-i="${i}" style="border:0;background:#991b1b;color:white;border-radius:9px;padding:9px">🗑️</button></div>`;
   }).join('');
   ov.innerHTML=`<div style="width:620px;max-width:94vw;max-height:88vh;overflow:auto;background:#111827;color:#fff;border-radius:22px;padding:20px;box-shadow:0 25px 70px #0009">
     <div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:25px;font-weight:1000">🛒 סל MFIX</div><div style="color:#94a3b8">סרוק כמה מוצרים שתרצה ורק בסוף הכנס לחשבונית</div></div><button id="mfix-cart-x-640" style="border:0;background:transparent;color:white;font-size:30px">×</button></div>
     <div style="margin-top:12px">${rows}</div>
     <div style="font-size:28px;font-weight:1000;margin:18px 0;text-align:center">סה״כ ₪${mfixCartTotal640().toLocaleString('he-IL',{maximumFractionDigits:2})}</div>
     <div style="display:flex;gap:10px"><button id="mfix-cart-clear-640" style="flex:1;border:0;border-radius:13px;padding:15px;background:#7f1d1d;color:#fff;font-weight:900">נקה סל</button><button id="mfix-cart-general-640" style="flex:1;border:0;border-radius:13px;padding:15px;background:#7c3aed;color:#fff;font-weight:900">🛒 מוצר כללי</button><button id="mfix-cart-send-640" style="flex:2;border:0;border-radius:13px;padding:15px;background:#16a34a;color:#fff;font-size:18px;font-weight:1000">הכנס הכל לחשבונית</button></div>
   </div>`;
   document.documentElement.appendChild(ov);
   ov.querySelector('#mfix-cart-x-640').onclick=()=>ov.remove();
   ov.querySelector('#mfix-cart-clear-640').onclick=()=>{mfixCartSet640([]);ov.remove()};
   ov.querySelector('#mfix-cart-general-640').onclick=async()=>{ov.remove();const price=await mfixAskGeneralProductPrice639();if(price>0)mfixCartAdd640({Body:window.__mfixGeneralName639||'מוצר כללי',Name:window.__mfixGeneralName639||'מוצר כללי',Price:price,__mfixGeneralPrice640:price,__mfixGeneralCustomName:window.__mfixGeneralCustomName639||''})};
   ov.querySelector('#mfix-cart-send-640').onclick=async e=>{
     e.preventDefault();e.stopPropagation();
     const b=e.currentTarget;
     b.disabled=true;b.textContent='מכניס לחשבונית…';
     ov.remove();
     await mfixCartSend640();
   };
   ov.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{
     const i=Number(b.dataset.i), arr=mfixCartGet640(), it=arr[i];if(!it)return;
     if(b.dataset.act==='plus')it.qty=(it.qty||1)+1;
     if(b.dataset.act==='minus'){it.qty=(it.qty||1)-1;if(it.qty<=0)arr.splice(i,1)}
     if(b.dataset.act==='del')arr.splice(i,1);
     mfixCartSet640(arr);ov.remove();if(arr.length)mfixCartOpen640();
   });
 }

 function mfixCartProgress642(msg,detail=''){
   let box=document.getElementById('mfix-cart-progress-642');
   if(!box){
     box=document.createElement('div');
     box.id='mfix-cart-progress-642';
     box.dir='rtl';
     box.style.cssText='position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:2147483647;background:#111827f8;color:#fff;border:1px solid #ffffff22;border-radius:18px;padding:18px 24px;min-width:320px;max-width:86vw;text-align:center;font-family:Arial;box-shadow:0 15px 45px #0008';
     document.documentElement.appendChild(box);
   }
   box.innerHTML='<div style="font-size:20px;font-weight:1000">'+msg+'</div>'+(detail?'<div style="margin-top:6px;color:#cbd5e1;font-size:14px">'+detail+'</div>':'');
   return box;
 }
 function mfixCartProgressClose642(delay=1200){
   setTimeout(()=>document.getElementById('mfix-cart-progress-642')?.remove(),delay);
 }

 async function mfixFindNativeAddLine642(){
   // Multi-item cart must open YesInvoice's PRODUCT LIST.
   // Do NOT click "הוספה שורה נוספת" - that only creates a blank manual line.
   const exactLabels=['הוספת פריט +','+ הוספת פריט','הוספת פריט','+הוספת פריט'];
   for(let n=0;n<35;n++){
     const controls=[...document.querySelectorAll('button,a,div.button,div.btn1,span,[role="button"],input[type="button"]')].filter(e=>{
       if(!e.offsetParent || e.closest('#mfix-cart-panel-640,#mfix-cart-progress-642,#mfix-next-step-450'))return false;
       const r=e.getBoundingClientRect(),cs=getComputedStyle(e);
       return r.width>3&&r.height>3&&cs.visibility!=='hidden'&&cs.display!=='none';
     });
     let hit=controls.find(e=>exactLabels.includes(normText(e.value||e.innerText||e.textContent||'')));
     if(!hit){
       hit=controls.find(e=>{
         const t=normText(e.value||e.innerText||e.textContent||'');
         return t.length<35 && /^\+?\s*הוספת\s+פריט\s*\+?$/.test(t);
       });
     }
     if(hit)return hit;
     await sleep(120);
   }
   return null;
 }

 async function mfixCartInsertOne640(product,index,totalCount){
   const before=desktopInvoiceLineCount();
   const title=product.__mfixGeneralPrice640?'מוצר כללי':productTitle(product,'');
   mfixCartProgress642('מכניס פריט '+index+' מתוך '+totalCount,title);

   const add=await mfixFindNativeAddLine642();
   if(!add){
     mfixCartProgress642('לא מצאתי הוספת פריט','לא נמצא הכפתור הירוק "הוספת פריט" של יש חשבונית');
     return false;
   }

   clickNative(add);
   await sleep(180);

   const pop=await waitDesktopProductModal();
   if(!pop){
     mfixCartProgress642('רשימת הפריטים לא נפתחה','נלחץ "הוספת פריט", אבל חלון רשימת הפריטים עדיין לא זוהה');
     return false;
   }

   mfixCartProgress642('מחפש פריט '+index+' מתוך '+totalCount,title);
   // General product has a fixed YesInvoice code. Searching by the Hebrew name is
   // slower and sometimes races the server-side product search, so use the exact code
   // only for this path while keeping the displayed/cart product unchanged.
   const searchProduct=product.__mfixGeneralPrice640
     ? {...product,Name:'14606113',CatalogNumber:'14606113'}
     : product;
   const picked=product.__mfixGeneralPrice640
     ? await desktopSearchExactFastGeneral(pop,'14606113')
     : await desktopSearchAndChoose(pop,searchProduct);
   if(!picked){
     mfixCartProgress642('לא מצאתי את הפריט ברשימה',title);
     return false;
   }

   await sleep(260);

   if(product.__mfixGeneralPrice640){
     const customName=String(product.__mfixGeneralCustomName||product.__mfixGeneralName||'').trim();
     if(customName){
       await mfixSetGeneralProductCustomName649(pop,customName);
       await sleep(80);
     }
     if(!(await mfixSetGeneralProductPrice639(pop,Number(product.__mfixGeneralPrice640)))){
       mfixCartProgress642('מוצר כללי נבחר','המחיר לא נקלט — MFIX לא ישמור 0 ₪');
       return false;
     }
     await sleep(320);
     if(!(await mfixSetGeneralProductPrice639(pop,Number(product.__mfixGeneralPrice640)))){
       mfixCartProgress642('מוצר כללי','המחיר התאפס לפני שמירה — לא שמרתי 0 ₪');
       return false;
     }
   }

   try{await trySelectMatchedSerial(product)}catch(_){}

   mfixCartProgress642('שומר פריט '+index+' מתוך '+totalCount,title);
   if(!await desktopSaveChanges()){
     mfixCartProgress642('לא מצאתי שמירת שינויים',title);
     return false;
   }

   const bar=String(product.Barcode||'').trim();
   for(let n=0;n<100;n++){
     await sleep(120);
     if(desktopInvoiceLineCount()>before)return true;

     const modalOpen=[...document.querySelectorAll('#pop1,div.pop1,[role="dialog"]')].some(e=>{
       if(!e.offsetParent)return false;
       const t=normText(e.innerText||e.textContent||'');
       return t.includes('רשימת פריטים')||t.includes('חיפוש פריט לפי שם');
     });
     if(!modalOpen){
       const body=normText(document.body?.innerText||'');
       if((bar&&body.includes(bar))||(title&&body.includes(title)))return true;
     }
   }

   mfixCartProgress642('השורה לא אושרה','הפריט אולי נכנס, אבל MFIX לא הצליח לאשר זאת');
   return false;
 }
 async function mfixCartSend640(){
   if(window.__mfixCartSending642)return;
   window.__mfixCartSending642=true;
   try{
     let flat=[];
     for(const x of mfixCartGet640())for(let n=0;n<(x.qty||1);n++)flat.push({...x.product});
     if(!flat.length){toast('הסל ריק',1500);return false}

     // If we are not inside an invoice yet, use the known stable route flow for the first item.
     if(!location.href.includes('/invoice/InvoiceDocument')){
       const first=flat.shift();
       sessionStorage.setItem('mfixCartQueue640',JSON.stringify(flat));
       sessionStorage.setItem('mfixCartBatch640','1');
       mfixCartProgress642('פותח חשבונית','מכניס קודם את הפריט הראשון');
       await openInvoiceForProduct(first);
       return true;
     }

     removeMfixNextStep();
     mfixCartProgress642('מתחיל הכנסת סל','סה״כ '+flat.length+' פריטים');
     let ok=0;
     for(let i=0;i<flat.length;i++){
       const good=await mfixCartInsertOne640(flat[i],i+1,flat.length);
       if(!good){
         toast('ההכנסה נעצרה אחרי '+ok+' פריטים',3000);
         return false;
       }
       ok++;
     }

     mfixCartSet640([]);
     sessionStorage.removeItem('mfixCartQueue640');
     sessionStorage.removeItem('mfixCartBatch640');
     mfixCartProgress642('✓ הסל הוכנס לחשבונית','נוספו '+ok+' פריטים');
     mfixCartProgressClose642(1800);
     setTimeout(showMfixNextStep,300);
     return true;
   }catch(err){
     console.error('MFIX cart 6.4.2',err);
     mfixCartProgress642('שגיאה בהכנסת הסל',String(err?.message||err||'שגיאה לא ידועה'));
     return false;
   }finally{
     window.__mfixCartSending642=false;
   }
 }
 async function mfixCartContinueAfterFirst640(){
   if(sessionStorage.getItem('mfixCartBatch640')!=='1')return false;
   let q=[];try{q=JSON.parse(sessionStorage.getItem('mfixCartQueue640')||'[]')}catch(_){}
   sessionStorage.removeItem('mfixCartQueue640');sessionStorage.removeItem('mfixCartBatch640');
   if(!q.length){mfixCartSet640([]);return false}
   removeMfixNextStep();
   let ok=1;
   for(let i=0;i<q.length;i++){
     if(await mfixCartInsertOne640(q[i],i+2,q.length+1))ok++;
     else{toast('הוכנסו '+ok+' פריטים ואז נעצר',3500);return true}
   }
   mfixCartSet640([]);
   toast('✓ כל '+ok+' הפריטים הוכנסו לחשבונית',2200);
   setTimeout(showMfixNextStep,180);
   return true;
 }
 setTimeout(mfixCartBadge640,900);

 function mfixAskGeneralProductPrice639(){
   return new Promise(resolve=>{
     document.getElementById('mfix-general-product-639')?.remove();
     const ov=document.createElement('div');
     ov.id='mfix-general-product-639'; ov.dir='rtl';
     ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0008;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif';
     ov.innerHTML=`<div style="width:390px;max-width:92vw;background:#111827;color:#fff;border-radius:20px;padding:22px;box-shadow:0 20px 60px #0009">
       <div style="font-size:24px;font-weight:1000">🛒 מוצר כללי</div>
       <div style="font-size:13px;color:#94a3b8;margin-top:5px">אפשר לתת שם חופשי למוצר. בחשבונית הוא עדיין מוזן דרך פריט „מוצר כללי” של יש חשבונית.</div>
       <label style="display:block;margin-top:15px;font-size:14px;font-weight:800">שם המוצר (אופציונלי)</label>
       <input id="mfix-general-name-639" type="text" placeholder="לדוגמה: תיקון / אביזר / מוצר מיוחד" style="width:100%;box-sizing:border-box;margin-top:7px;height:48px;border:0;border-radius:12px;padding:0 14px;font-size:17px;font-weight:800;outline:none">
       <label style="display:block;margin-top:14px;font-size:14px;font-weight:800">מחיר ללקוח</label>
       <input id="mfix-general-price-639" inputmode="decimal" type="number" min="0" step="0.01" placeholder="לדוגמה 10" style="width:100%;box-sizing:border-box;margin-top:7px;height:62px;border:0;border-radius:14px;padding:0 16px;font-size:30px;font-weight:1000;text-align:center;outline:none">
       <div style="display:flex;gap:10px;margin-top:16px"><button id="mfix-general-cancel-639" style="flex:1;height:48px;border:0;border-radius:12px;background:#374151;color:#fff;font-weight:900">ביטול</button><button id="mfix-general-go-639" style="flex:2;height:48px;border:0;border-radius:12px;background:#10b981;color:#fff;font-weight:1000">הכנס לחשבונית</button></div>
     </div>`;
     document.documentElement.appendChild(ov);
     const inp=ov.querySelector('#mfix-general-price-639'), nameInp=ov.querySelector('#mfix-general-name-639');
     setTimeout(()=>{nameInp?.focus()},80);
     const done=v=>{ov.remove();resolve(v)};
     ov.querySelector('#mfix-general-cancel-639').onclick=()=>done(null);
     ov.querySelector('#mfix-general-go-639').onclick=()=>{
       const v=Number(String(inp.value||'').replace(',','.'));
       if(!(v>0)){inp.focus();return}
       const typedName=(nameInp?.value||'').trim();
       // Important: blank name means the real/default name remains exactly "מוצר כללי".
       // Only a name actually typed by the user is allowed to overwrite the invoice line.
       window.__mfixGeneralCustomName639=typedName;
       window.__mfixGeneralName639=typedName||'מוצר כללי';
       done(Math.round((v+Number.EPSILON)*100)/100);
     };
     nameInp?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();inp.focus();inp.select?.()}if(e.key==='Escape')done(null)});
     inp.addEventListener('keydown',e=>{if(e.key==='Enter')ov.querySelector('#mfix-general-go-639').click();if(e.key==='Escape')done(null)});
   });
 }

 function mfixFindGeneralPriceInput649(pop){
   const visible=el=>{
     if(!el)return false;
     const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
     return r.width>3&&r.height>3&&cs.display!=='none'&&cs.visibility!=='hidden';
   };
   const search=desktopSearchInput(pop);
   const selected=[...pop.querySelectorAll('div.job.gray,div.job,tr,li,.item,.row')].find(r=>{
     if(!visible(r))return false;
     return normText(r.innerText||r.textContent||'').includes('פריט נבחר');
   });
   const scopes=[selected,pop].filter(Boolean);
   for(const scope of scopes){
     const inputs=[...scope.querySelectorAll('input')].filter(i=>
       visible(i)&&!i.disabled&&!i.readOnly&&i!==search&&
       ['text','number','tel'].includes((i.type||'text').toLowerCase())
     );
     let target=inputs.find(i=>{
       const meta=(String(i.id||'')+' '+String(i.name||'')+' '+String(i.className||'')+' '+String(i.placeholder||'')).toLowerCase();
       return /price|מחיר/.test(meta);
     });
     if(target)return target;
     target=inputs.find(i=>{
       let p=i,around='';
       for(let k=0;k<4&&p;k++,p=p.parentElement)around+=' '+normText(p.innerText||p.textContent||'');
       return /מחיר\s*(ליחידה|מכירה)?/.test(around)&&!/חיפוש|כמות/.test(around);
     });
     if(target)return target;
     if(scope===selected){
       target=inputs.find(i=>{
         const v=parseMoney(i.value),around=normText(i.parentElement?.innerText||'');
         return !/כמות/.test(around)&&(v===0||/מחיר/.test(around));
       });
       if(target)return target;
     }
   }
   return null;
 }

 async function mfixSetGeneralProductCustomName649(pop,name){
   name=String(name||'').trim();
   if(!name || name==='מוצר כללי')return true;
   const visible=el=>{
     if(!el)return false;
     const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
     return r.width>3&&r.height>3&&cs.display!=='none'&&cs.visibility!=='hidden';
   };
   const priceInput=mfixFindGeneralPriceInput649(pop);
   const search=desktopSearchInput(pop);
   const candidates=[...pop.querySelectorAll('textarea,input[type="text"],input:not([type])')].filter(el=>
     visible(el)&&!el.disabled&&!el.readOnly&&el!==priceInput&&el!==search
   );
   const score=el=>{
     const meta=[el.id,el.name,el.placeholder,el.className,el.getAttribute('aria-label')].filter(Boolean).join(' ');
     let around=''; let q=el;
     for(let i=0;i<4&&q;i++,q=q.parentElement)around+=' '+normText(q.innerText||q.textContent||'');
     const t=(meta+' '+around).toLowerCase();
     if(/תיאור\s*שורה|תיאור|פירוט|description/.test(t))return 100;
     if(/שם\s*(המוצר|פריט)?|product\s*name/.test(t))return 80;
     return 0;
   };
   candidates.sort((a,b)=>score(b)-score(a));
   const target=candidates[0];
   if(!target || score(target)<=0)return false;
   try{
     target.focus();target.select?.();
     const proto=target.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
     const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
     if(setter)setter.call(target,name);else target.value=name;
     try{target.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:name}))}
     catch(_){target.dispatchEvent(new Event('input',{bubbles:true}))}
     target.dispatchEvent(new Event('change',{bubbles:true}));
     return String(target.value||'').trim()===name;
   }catch(_){return false}
 }

 async function mfixSetGeneralProductPrice639(pop,price){
   const wanted=Math.round((Number(price)+Number.EPSILON)*100)/100;
   if(!(wanted>0))return false;

   let target=null;
   for(let n=0;n<16;n++){
     target=mfixFindGeneralPriceInput649(pop);
     if(target)break;
     await sleep(75);
   }
   if(!target)return false;

   const write=el=>{
     try{
       el.focus(); el.select?.();
       const nativeSetter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
       if(nativeSetter)nativeSetter.call(el,String(wanted)); else el.value=String(wanted);
       try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:String(wanted)}))}
       catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}
       el.dispatchEvent(new Event('change',{bubbles:true}));
       return true;
     }catch(_){return false}
   };

   if(!write(target))return false;

   // Short stability window: if YesInvoice re-renders back to 0, repair before Save.
   for(let check=0;check<6;check++){
     await sleep(90);
     const live=mfixFindGeneralPriceInput649(pop)||target;
     if(Math.abs(parseMoney(live.value)-wanted)>0.001){
       if(check>=3)return false;
       if(!write(live))return false;
     }
   }

   const finalField=mfixFindGeneralPriceInput649(pop)||target;
   return Math.abs(parseMoney(finalField.value)-wanted)<0.001;
 }


 async function mfixRenameSavedGeneralLine700(customName){
   customName=String(customName||'').trim();
   if(!customName || customName==='מוצר כללי')return true;

   const visible=el=>{
     if(!el || !(el instanceof Element))return false;
     const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
     return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>3&&r.height>3;
   };
   const txt=el=>String(el?.innerText||el?.textContent||'').replace(/\s+/g,' ').trim();
   const waitFor=async(getter,tries=50,delay=100)=>{
     for(let i=0;i<tries;i++){
       const v=getter(); if(v)return v;
       await sleep(delay);
     }
     return null;
   };
   const click=async(el)=>{
     if(!el)return false;
     try{
       el.scrollIntoView({block:'center',inline:'nearest'});
       el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,view:window,button:0}));
       await sleep(35);
       el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true,view:window,button:0}));
       el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window,button:0,detail:1}));
       return true;
     }catch(_){try{el.click();return true}catch(__){return false}}
   };
   const setValue=(el,value)=>{
     try{
       el.focus(); el.select?.();
       const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
       const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
       if(setter)setter.call(el,value);else el.value=value;
       try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}))}
       catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}
       el.dispatchEvent(new Event('change',{bubbles:true}));
       el.dispatchEvent(new Event('blur',{bubbles:true}));
       return String(el.value||'').trim()===value;
     }catch(_){return false}
   };

   try{
     // Wait for the saved native line and choose the LAST visible row with the fixed general SKU.
     const row=await waitFor(()=>{
       const rows=[...document.querySelectorAll('div.servicesdesk div.lines div.grid-receipt div.item,div.grid-receipt div.item')].filter(visible);
       const hits=rows.filter(r=>txt(r).includes('14606113')||txt(r).includes('מוצר כללי'));
       return hits[hits.length-1]||null;
     },55,100);
     if(!row)throw new Error('שורת מוצר כללי');

     // 1. Open the exact row menu and click "עריכת שורה".
     const dots=await waitFor(()=>{
       const own=[...row.querySelectorAll('i.fal.fa-ellipsis-v,.fa-ellipsis-v,[class*="ellipsis"]')].find(visible);
       if(own)return own;
       const btn=[...row.querySelectorAll('button,a,div,span')].find(e=>visible(e)&&(/[⋮]/.test(txt(e))||String(e.className||'').includes('ellipsis')));
       return btn||null;
     },20,80);
     if(!dots)throw new Error('שלוש הנקודות בשורה');
     await click(dots);

     const edit=await waitFor(()=>[...document.querySelectorAll('div.menu.withbg.active ul li a,div.menu.active ul li a,div.menu.withbg ul li a,button,a,li')]
       .find(e=>visible(e)&&txt(e)==='עריכת שורה'),45,100);
     if(!edit)throw new Error('עריכת שורה');
     await click(edit);

     // 2. Wait for the native edit dialog and find the field labeled exactly "פירוט".
     const dialog=await waitFor(()=>{
       const candidates=[...document.querySelectorAll('div.pop2,.pop2,[role="dialog"]')].filter(visible);
       return candidates.find(d=>/פירוט/.test(txt(d)))||candidates[candidates.length-1]||null;
     },45,100);
     if(!dialog)throw new Error('חלון עריכת שורה');

     let detail=null;
     const fields=[...dialog.querySelectorAll('textarea,input[type="text"],input:not([type])')].filter(visible);

     // IMPORTANT: never search "up" through the whole dialog for the word פירוט.
     // That made every field look like a פירוט field and selected the first one (SKU).
     // YesInvoice shows the label "פירוט" on the SAME visual row as its input, so
     // match by geometry first, then by the smallest local container.
     const labels=[...dialog.querySelectorAll('label,span,div,p,strong,b')]
       .filter(e=>visible(e)&&/^פירוט\s*\*?$/.test(txt(e)));
     if(labels.length){
       const label=labels[0];
       const lr=label.getBoundingClientRect();
       const localScore=el=>{
         const r=el.getBoundingClientRect();
         const cy=Math.abs((r.top+r.bottom)/2-(lr.top+lr.bottom)/2);
         // Prefer the field on the same horizontal line and near the label.
         const dx=Math.abs(r.left-lr.left)+Math.abs(r.right-lr.right);
         let score=cy*1000+Math.min(dx,1200);
         const meta=[el.id,el.name,el.placeholder,el.getAttribute('aria-label')].filter(Boolean).join(' ');
         if(/מק\s*[״"]?ט|sku|catalog|code|קוד|barcode|ברקוד/i.test(meta))score+=10000000;
         return score;
       };
       const near=fields.map(el=>({el,score:localScore(el),r:el.getBoundingClientRect()}))
         .filter(x=>x.score<10000000)
         .sort((a,b)=>a.score-b.score)[0];
       if(near && Math.abs((near.r.top+near.r.bottom)/2-(lr.top+lr.bottom)/2)<90)detail=near.el;
     }

     // Secondary fallback: only inspect each field's immediate row/container text.
     // Explicitly reject SKU/code fields so a wrong field can never be overwritten.
     if(!detail){
       detail=fields.find(el=>{
         const meta=[el.id,el.name,el.placeholder,el.getAttribute('aria-label')].filter(Boolean).join(' ');
         if(/מק\s*[״"]?ט|sku|catalog|code|קוד|barcode|ברקוד/i.test(meta))return false;
         const parent=txt(el.parentElement||el);
         return /פירוט|description|תיאור/.test(meta+' '+parent);
       });
     }
     if(!detail)throw new Error('שדה פירוט');
     if(!setValue(detail,customName))throw new Error('הזנת פירוט');

     // 3. Save with the exact native button "עדכון שורה".
     const update=await waitFor(()=>[...dialog.querySelectorAll('button,a,div')].find(e=>visible(e)&&txt(e)==='עדכון שורה')||
       [...document.querySelectorAll('button,a,div')].find(e=>visible(e)&&txt(e)==='עדכון שורה'),35,100);
     if(!update)throw new Error('עדכון שורה');
     await click(update);

     // Verify the dialog closed, then verify the row now contains the custom text.
     for(let i=0;i<50;i++){
       await sleep(100);

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

 function mfix134ManageAllRelations(){
   document.getElementById('mfix-related-all-1340')?.remove();
   const ov=document.createElement('div');ov.id='mfix-related-all-1340';ov.dir='rtl';
   ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0009;display:flex;align-items:center;justify-content:center;padding:3vh 4vw;font-family:Arial';
   const box=document.createElement('div');box.style.cssText='width:min(920px,95vw);height:88vh;background:white;border-radius:22px;padding:20px;overflow:auto';
   const items=mfix134AllKnownProducts(),phones=mfix134PhoneSetGet();
   box.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between"><div><div style="font-size:25px;font-weight:1000">🔗 ניהול המלצות לטלפונים</div><div style="font-size:13px;color:#64748b;margin-top:3px">סמן אילו מוצרים הם טלפונים, ואז לחץ "הגדר קשורים"</div></div><button id="mfix134-close" style="border:0;border-radius:10px;background:#e5e7eb;padding:9px 13px;font-size:18px">✕</button></div><div id="mfix134-list" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:15px"></div>`;
   ov.appendChild(box);document.documentElement.appendChild(ov);
   const list=box.querySelector('#mfix134-list');
   if(!items.length)list.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748b">עדיין אין מספיק מוצרים מוכרים ל-POS. הוסף מוצרים למועדפים או השתמש בהם פעם אחת.</div>';
   items.forEach(prod=>{
     const k=mfix131ProductKey(prod),auto=mfix134LooksLikePhone(prod),row=document.createElement('div');
     row.style.cssText='display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:9px;align-items:center;border:1px solid #e5e7eb;border-radius:12px;padding:10px';
     row.innerHTML=`<input type="checkbox" ${phones.has(k)||auto?'checked':''}><div style="min-width:0"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(productTitle(prod,'מוצר'))}</b><small style="color:#64748b">₪${Number(prod?.Price||0).toLocaleString('he-IL',{maximumFractionDigits:2})}</small></div><button style="border:0;border-radius:9px;background:#eef2ff;padding:8px 10px;font-weight:900">הגדר קשורים</button>`;
     const cb=row.querySelector('input'),btn=row.querySelector('button');
     cb.onchange=()=>{const set=mfix134PhoneSetGet();if(cb.checked)set.add(k);else set.delete(k);mfix134PhoneSetSave(set)};
     btn.onclick=()=>{const set=mfix134PhoneSetGet();set.add(k);mfix134PhoneSetSave(set);cb.checked=true;mfix131ManageRelated(prod)};
     list.appendChild(row);
   });
   box.querySelector('#mfix134-close').onclick=()=>ov.remove();
 }
function mfix131ManageRelated(product){
   document.getElementById('mfix-related-manager-1310')?.remove();
   const current=new Set(mfix131GetRelated(product).map(mfix131ProductKey));
   const items=mfix131Candidates(product).slice();
   // Keep previously saved manual recommendations visible/editable too.
   mfix131GetRelated(product).forEach(x=>{
     if(x?.__mfixManualRecommendation && !items.some(y=>mfix131ProductKey(y)===mfix131ProductKey(x)))items.push(x);
   });
   const ov=document.createElement('div');ov.id='mfix-related-manager-1310';ov.dir='rtl';
   ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0009;display:flex;align-items:center;justify-content:center;padding:4vh 5vw;font-family:Arial';
   const box=document.createElement('div');box.style.cssText='width:min(780px,94vw);max-height:86vh;background:white;border-radius:22px;padding:20px;overflow:auto';
   box.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div style="font-size:24px;font-weight:1000">🔗 מוצרים קשורים</div><div style="color:#64748b;margin-top:4px">${esc(productTitle(product,'מוצר'))}</div></div><button id="mfix131-rel-add-manual" style="border:0;border-radius:10px;background:#2563eb;color:white;padding:10px 13px;font-weight:1000">➕ הוסף מה שתרצה</button></div><div style="font-size:12px;color:#64748b;margin-top:8px">אפשר להוסיף גם המלצה ידנית שלא נמצאת ברשימה.</div><div id="mfix131-rel-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:15px"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px"><button id="mfix131-rel-save" style="height:50px;border:0;border-radius:12px;background:#0f766e;color:white;font-size:17px;font-weight:1000">שמור</button><button id="mfix131-rel-close" style="height:50px;border:0;border-radius:12px;background:#e5e7eb;font-size:17px;font-weight:900">ביטול</button></div>`;
   ov.appendChild(box);document.documentElement.appendChild(ov);
   const grid=box.querySelector('#mfix131-rel-grid');
   const renderItem=(x,i,checked=current.has(mfix131ProductKey(x)))=>{
     const id='mfix131r'+Date.now()+'_'+i,k=mfix131ProductKey(x),lab=document.createElement('label');
     lab.style.cssText='display:flex;gap:9px;align-items:center;padding:11px;border:1px solid #e5e7eb;border-radius:12px';
     const manual=x?.__mfixManualRecommendation?' <small style="color:#2563eb">ידני</small>':'';
     lab.innerHTML=`<input id="${id}" type="checkbox" ${checked?'checked':''}><span><b>${esc(productTitle(x,'מוצר'))}</b>${manual}<br><small>₪${Number(x?.Price||0).toLocaleString('he-IL',{maximumFractionDigits:2})}</small></span>`;
     lab.dataset.i=String(i);grid.appendChild(lab);
   };
   const renderAll=()=>{grid.innerHTML='';items.forEach((x,i)=>renderItem(x,i));if(!items.length)grid.innerHTML='<div style="grid-column:1/-1;padding:25px;text-align:center;color:#64748b">אין עדיין מוצרים. אפשר ללחוץ על „הוסף מה שתרצה”.</div>'};
   renderAll();
   box.querySelector('#mfix131-rel-add-manual').onclick=()=>{
     document.getElementById('mfix131-manual-rec')?.remove();
     const m=document.createElement('div');m.id='mfix131-manual-rec';m.style.cssText='position:fixed;inset:0;z-index:2147483648;background:#0008;display:flex;align-items:center;justify-content:center;padding:20px';
     m.innerHTML='<div style="width:min(420px,94vw);background:#fff;border-radius:18px;padding:18px;color:#111"><b style="font-size:20px">➕ הוספת המלצה ידנית</b><div style="margin-top:12px">שם המוצר / ההמלצה</div><input id="mfix131-manual-name" style="width:100%;box-sizing:border-box;padding:12px;margin-top:5px;font-size:16px" placeholder="לדוגמה: מגן מסך איכותי"><div style="margin-top:10px">מחיר</div><input id="mfix131-manual-price" type="number" inputmode="decimal" min="0" step="0.01" style="width:100%;box-sizing:border-box;padding:12px;margin-top:5px;font-size:18px" placeholder="0.00"><div style="display:flex;gap:8px;margin-top:15px"><button id="mfix131-manual-cancel" style="flex:1;padding:11px;border:0;border-radius:9px">ביטול</button><button id="mfix131-manual-ok" style="flex:2;padding:11px;border:0;border-radius:9px;background:#16a34a;color:#fff;font-weight:1000">הוסף לרשימה</button></div></div>';
     document.documentElement.appendChild(m);
     const close=()=>m.remove();m.querySelector('#mfix131-manual-cancel').onclick=close;
     const add=()=>{const name=m.querySelector('#mfix131-manual-name').value.trim(),price=Number(m.querySelector('#mfix131-manual-price').value||0);if(!name){m.querySelector('#mfix131-manual-name').focus();return}const x={Body:name,Name:name,Price:price,__mfixManualRecommendation:true,__mfixManualKey:'manual:'+Date.now()+':'+Math.random().toString(36).slice(2)};items.push(x);current.add(mfix131ProductKey(x));close();renderAll()};
     m.querySelector('#mfix131-manual-ok').onclick=add;m.querySelector('#mfix131-manual-name').focus();
   };
   box.querySelector('#mfix131-rel-close').onclick=()=>ov.remove();
   box.querySelector('#mfix131-rel-save').onclick=()=>{
     const chosen=[...grid.querySelectorAll('label')].filter(l=>l.querySelector('input')?.checked).map(l=>items[Number(l.dataset.i)]).filter(Boolean).map(x=>x?.__mfixManualRecommendation?{Body:x.Body,Name:x.Name,Price:Number(x.Price||0),__mfixManualRecommendation:true,__mfixManualKey:x.__mfixManualKey}:mfixPosSlim1000(x));
     const map=mfix131RelatedGet();map[mfix131ProductKey(product)]=chosen;mfix131RelatedSet(map);ov.remove();toast(chosen.length?'המוצרים הקשורים נשמרו ✓':'נשמר: ללא המלצות',1600);
   };
 }
 function mfix131SmartRecommendations(product){
   if(!mfix134LooksLikePhone(product))return [];
   const explicit=mfix131GetRelated(product);
   // If the user saved an explicit list, even an empty one, respect it exactly.
   if(mfix131HasExplicitRelated(product))return explicit.slice(0,8);
   const pool=mfix131Candidates(product),words=['כיסוי','מגן','מסך','מטען','כבל','case','glass','charger','cable'];
   return pool.filter(x=>words.some(w=>productTitle(x,'').toLowerCase().includes(w))).slice(0,4);
 }
 function mfix131ShowRecommendations(product){
   if(!mfix134LooksLikePhone(product))return;
   const rel=mfix131SmartRecommendations(product);
   document.getElementById('mfix-recommend-1310')?.remove();
   const bar=document.createElement('div');bar.id='mfix-recommend-1310';bar.dir='rtl';
   bar.style.cssText='position:fixed;z-index:2147483647;right:18px;bottom:18px;width:min(820px,94vw);background:#0f172a;color:white;border:2px solid #22c55e;border-radius:18px;padding:14px 16px;box-shadow:0 16px 42px #0009;font-family:Arial';
   bar.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:14px"><div><b style="font-size:20px">💡 המלצת מכירה</b><div style="font-size:12px;color:#cbd5e1;margin-top:2px">עבור ${esc(productTitle(product,'המוצר שנוסף'))}</div></div><div style="display:flex;gap:7px"><button id="mfix131-rec-manage" style="border:0;border-radius:9px;background:#ffffff18;color:white;padding:7px 10px;font-weight:900">🔗 הגדר קשורים</button><button id="mfix131-rec-close" style="border:0;background:transparent;color:white;font-size:20px">✕</button></div></div><div id="mfix131-rec-items" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"></div>`;
   const list=bar.querySelector('#mfix131-rec-items');
   if(rel.length){
     rel.forEach(x=>{const b=document.createElement('button');b.style.cssText='border:0;border-radius:11px;background:#16a34a;color:white;padding:10px 12px;font-weight:1000';b.textContent='+ '+productTitle(x,'מוצר')+' · ₪'+Number(x?.Price||0).toLocaleString('he-IL',{maximumFractionDigits:2});b.onclick=async()=>{if(!mfixConfirmExpensive1280(x))return;let ok=false;if(x?.__mfixManualRecommendation){try{const price=Number(x.Price||0);if(!(price>0)){toast('להמלצה ידנית חייב להיות מחיר מעל 0',1800);return}ok=await mfixAddGeneralProduct639AtLite700(price);if(ok)mfixPosCartAdd800(x,price)}catch(_){ok=false}}else ok=await mfixPosAddProduct800(x);mfixPosAddNotice1260(!!ok,x)};list.appendChild(b)});
   }else{
     list.innerHTML='<div style="background:#ffffff10;border-radius:10px;padding:10px 12px;color:#e2e8f0">עדיין אין מוצרים להצעה. לחץ „הגדר קשורים” ובחר מה להציע עם המוצר הזה.</div>';
   }
   document.documentElement.appendChild(bar);
   bar.querySelector('#mfix131-rec-close').onclick=()=>bar.remove();
   bar.querySelector('#mfix131-rec-manage').onclick=()=>mfix131ManageRelated(product);
   setTimeout(()=>{if(document.getElementById('mfix-recommend-1310')===bar)bar.remove()},18000);
 }
 function mfix131DuplicateConfirm(product){
   const key=String(product?.Barcode||product?.Name||product?.CatalogNumber||productTitle(product,'')).trim();
   const hit=mfixPosCartGet800().find(x=>x.key===key);
   if(!hit)return true;
   return confirm(`המוצר כבר נמצא בסל ×${Number(hit.qty||1)}\n\nלהוסיף עוד אחד?`);
 }
 function mfix131NoteGet(){try{return sessionStorage.getItem(MFIX131_NOTE)||''}catch(_){return''}}
 function mfix131NoteSet(v){try{sessionStorage.setItem(MFIX131_NOTE,String(v||''))}catch(_){}}

 // First-item watchdog: the native insertion happens after the route change.
 // When YesInvoice itself confirms the line, finish the MFIX progress immediately.
 function mfix131FirstItemConfirmed(product){
   try{
     if(sessionStorage.getItem(MFIX_POS_MODE_800)!=='1')return;
     mfixPosAddNotice1260(true,product);
     mfix131ShowRecommendations(product);
   }catch(_){}
 }
 function mfix130ShowScanPreview(product,onAdd){
   document.getElementById('mfix-scan-preview-1300')?.remove();
   const ov=document.createElement('div');ov.id='mfix-scan-preview-1300';ov.dir='rtl';
   ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0009;display:flex;align-items:center;justify-content:center;padding:4vh 5vw;font-family:Arial';
   const price=Number(product?.Price||0),st=stock(product),name=productTitle(product,'מוצר');
   const barcode=String(product?.Barcode||product?.Name||'');
   const sku=String(product?.CatalogNumber||'');
   const box=document.createElement('div');
   box.style.cssText='width:min(650px,94vw);background:white;border-radius:24px;padding:24px;box-shadow:0 18px 50px #0007';
   const cost=mfix131Cost(product),isPhone134=mfix134LooksLikePhone(product),related=isPhone134?mfix131SmartRecommendations(product):[],last135=mfix135LastSoldFor(product);
   box.innerHTML=`<div style="font-size:16px;color:#64748b;font-weight:900">בדיקת מחיר</div>
     <div style="font-size:30px;font-weight:1000;margin-top:6px;line-height:1.15">${esc(name)}</div>
     <div style="font-size:58px;font-weight:1000;color:#0f766e;margin-top:16px">₪${price.toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px">
       <div style="background:#f8fafc;border-radius:12px;padding:12px"><div style="font-size:12px;color:#64748b">ברקוד</div><b style="font-size:16px">${esc(barcode||'—')}</b></div>
       <div style="background:#f8fafc;border-radius:12px;padding:12px"><div style="font-size:12px;color:#64748b">מק״ט</div><b style="font-size:16px">${esc(sku||'—')}</b></div>
     </div>
     <div style="margin-top:12px;font-size:18px;font-weight:1000;color:${Number(st)<=0?'#dc2626':Number(st)<=2?'#f59e0b':'#16a34a'}">מלאי: ${esc(String(st??'—'))}</div>
     ${last135?`<div style="margin-top:10px;background:#fff7ed;border-radius:10px;padding:9px;font-size:13px">🏷️ נמכר לאחרונה ב־<b>₪${Number(last135.price||0).toLocaleString('he-IL',{maximumFractionDigits:2})}</b></div>`:''}
     <div style="display:flex;gap:8px;align-items:center;margin-top:12px">
       <button id="mfix131-cost-btn" style="border:0;border-radius:10px;background:#0f172a;color:white;padding:9px 12px;font-weight:900">💰 הצג עלות</button>
       <span id="mfix131-cost-val" style="display:none;font-size:17px;font-weight:1000;color:#7c3aed">${cost===null?'עלות לא זמינה':'₪'+cost.toLocaleString('he-IL',{maximumFractionDigits:2})}</span>
       <button id="mfix131-related-manage" style="margin-right:auto;border:0;border-radius:10px;background:#eef2ff;padding:9px 12px;font-weight:900;${isPhone134?'':'display:none'}">🔗 הגדר קשורים</button>
     </div>
     <div id="mfix131-related-preview" style="margin-top:12px;${related.length?'':'display:none'}"><div style="font-size:13px;font-weight:900;color:#64748b;margin-bottom:6px">מוצרים קשורים</div><div style="display:flex;gap:6px;flex-wrap:wrap">${related.map(x=>`<span style="background:#f1f5f9;border-radius:9px;padding:7px 9px;font-size:12px">${esc(productTitle(x,'מוצר'))} · ₪${Number(x?.Price||0).toLocaleString('he-IL',{maximumFractionDigits:2})}</span>`).join('')}</div></div>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px">
       <button id="mfix130-add" style="height:62px;border:0;border-radius:14px;background:#16a34a;color:white;font-size:22px;font-weight:1000">הוסף לסל</button>
       <button id="mfix130-close" style="height:62px;border:0;border-radius:14px;background:#e5e7eb;color:#111827;font-size:20px;font-weight:1000">סגור</button>
     </div>`;
   ov.appendChild(box);document.documentElement.appendChild(ov);
   box.querySelector('#mfix131-cost-btn').onclick=()=>{const v=box.querySelector('#mfix131-cost-val');v.style.display=v.style.display==='none'?'inline':'none'};
   box.querySelector('#mfix131-related-manage').onclick=()=>mfix131ManageRelated(product);
   const mfix130ReturnToSearch=()=>{
     const search=document.getElementById('mfix-pos-search-800');
     const results=document.getElementById('mfix-pos-results-800');
     if(search){search.value='';}
     if(results){results.innerHTML='';}
     setTimeout(()=>search?.focus(),100);
   };
   box.querySelector('#mfix130-close').onclick=()=>{ov.remove();mfix130ReturnToSearch()};
   if(localStorage.getItem(MFIX135_PRICECHECK)==='1'){const ab=box.querySelector('#mfix130-add');ab.textContent='בדיקת מחיר בלבד';ab.disabled=true;ab.style.opacity='.55'}
   box.querySelector('#mfix130-add').onclick=async()=>{
     if(!mfixConfirmExpensive1280(product))return;
     const b=box.querySelector('#mfix130-add');b.disabled=true;b.textContent='מוסיף…';
     mfixScannerState1280('⏳ מעבד…',true);mfixPosProgress1270('start',product);
     const slow=setTimeout(()=>mfixSlow1280(product),4000);
     const ok=await onAdd(product);
     clearTimeout(slow);
     if(ok){ov.remove();mfixPosAddNotice1260(true,product);mfix130ReturnToSearch()}
     else{mfixPosAddNotice1260(false,product);b.disabled=false;b.textContent='הוסף לסל'}
   };
 }
 function mfix129ShowShelf(title,items){document.getElementById('mfix-pos-shelf-1290')?.remove();const ov=document.createElement('div');ov.id='mfix-pos-shelf-1290';ov.dir='rtl';ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0008;display:flex;align-items:center;justify-content:center;padding:4vh 5vw;font-family:Arial';const box=document.createElement('div');box.style.cssText='width:90vw;height:84vh;background:white;border-radius:20px;padding:18px;overflow:auto';box.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:26px">${esc(title)}</b><button id="mfix129-close" style="font-size:22px;border:0;background:#eee;border-radius:10px;padding:8px 13px">✕</button></div><div id="mfix129-grid" style="margin-top:15px;display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:10px"></div>`;ov.appendChild(box);document.documentElement.appendChild(ov);box.querySelector('#mfix129-close').onclick=()=>ov.remove();const g=box.querySelector('#mfix129-grid');if(!items.length){g.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:50px;color:#64748b">אין פריטים עדיין</div>';return}items.forEach(prod=>{const b=document.createElement('button');b.style.cssText='border:1px solid #e5e7eb;border-radius:15px;background:white;padding:12px;text-align:right;min-height:110px';b.innerHTML=`<b>${esc(productTitle(prod,'מוצר'))}</b><div style="margin-top:8px;font-size:22px;font-weight:1000;color:#0f766e">₪${Number(prod?.Price||0).toLocaleString('he-IL',{maximumFractionDigits:2})}</div>`;b.onclick=async()=>{ov.remove();if(!mfixConfirmExpensive1280(prod))return;mfixScannerState1280('⏳ מעבד…',true);mfixPosProgress1270('start',prod);const ok=await mfixPosAddProduct800(prod);mfixPosAddNotice1260(!!ok,prod)};g.appendChild(b)})}
 function mfix129ShowQuickCash(done){
   const total=mfixPosTotal800();if(!(total>0)){toast('אין סכום לתשלום',1400);return}
   document.getElementById('mfix-cash-1290')?.remove();document.getElementById('mfix-cash-given-624')?.remove();
   const ov=document.createElement('div');ov.id='mfix-cash-1290';ov.dir='rtl';
   ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0009;display:flex;align-items:center;justify-content:center;font-family:Arial';
   const box=document.createElement('div');
   box.style.cssText='width:min(560px,94vw);max-height:92vh;overflow:auto;background:#0f172a;color:white;border-radius:24px;padding:14px 18px 16px;box-shadow:0 18px 55px #0009;box-sizing:border-box';
   box.innerHTML=`<div style="position:sticky;top:-14px;z-index:5;display:flex;align-items:center;justify-content:space-between;background:#0f172a;padding:10px 0 8px">
       <div><div style="font-size:25px;font-weight:1000">💵 מזומן מהיר</div><div style="font-size:12px;color:#94a3b8;margin-top:2px">מנגנון מזומן ועודף</div></div>
       <button id="mfix129-cancel-x" style="height:42px;padding:0 14px;border:1px solid #64748b;border-radius:10px;background:#1f2937;color:white;font-size:15px;font-weight:1000">✕ ביטול / חזרה</button>
     </div>
     <div style="margin-top:10px;background:#111827;border-radius:15px;padding:12px;text-align:center">
       <div style="font-size:13px;color:#94a3b8">לתשלום</div>
       <div style="font-size:42px;font-weight:1000">₪${total.toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
     </div>
     <div style="font-size:14px;color:#cbd5e1;margin:13px 0 6px">כמה הלקוח נתן?</div>
     <input id="mfix129-cashinput" inputmode="decimal" placeholder="לדוגמה: 100" style="width:100%;height:54px;box-sizing:border-box;border:2px solid #334155;border-radius:13px;background:#fff;color:#111827;font-size:24px;text-align:center;padding:0 12px">
     <div id="mfix129-livechange" style="min-height:34px;margin-top:8px;text-align:center;font-size:21px;font-weight:1000;color:#6ee7b7"></div>
     <div id="mfix129-cashbtns" style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:8px"></div>
     <div id="mfix129-keypad" style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px"></div>
     <div style="display:grid;grid-template-columns:1fr 1.2fr;gap:9px;margin-top:10px">
       <button id="mfix129-exact" style="height:52px;border:0;border-radius:12px;background:#334155;color:white;font-size:16px;font-weight:1000">סכום מדויק</button>
       <button id="mfix129-go" style="height:52px;border:0;border-radius:12px;background:#16a34a;color:white;font-size:18px;font-weight:1000">המשך למזומן</button>
     </div>
     <button id="mfix129-cancel" style="width:100%;height:40px;margin-top:8px;border:0;border-radius:10px;background:#1f2937;color:#cbd5e1;font-weight:900">ביטול</button>`;
   ov.appendChild(box);document.documentElement.appendChild(ov);

   const inp=box.querySelector('#mfix129-cashinput'),live=box.querySelector('#mfix129-livechange');
   const update=()=>{
     const g=Number(String(inp.value||'').replace(',','.'))||0;
     if(!g){live.textContent='';return}
     if(g<total){live.style.color='#fca5a5';live.textContent='חסר ₪'+(total-g).toLocaleString('he-IL',{maximumFractionDigits:2})}
     else{live.style.color='#6ee7b7';live.textContent='עודף ₪'+(g-total).toLocaleString('he-IL',{maximumFractionDigits:2})}
   };
   inp.addEventListener('input',update);

   const common=[50,100,200,500].filter(v=>v>=total);
   let vals=[...common];
   const rounded=[Math.ceil(total/10)*10,Math.ceil(total/50)*50,Math.ceil(total/100)*100].filter(v=>v>=total);
   vals=[...new Set([...vals,...rounded])].sort((a,b)=>a-b).slice(0,4);
   if(!vals.length)vals=[Math.ceil(total/100)*100];
   vals.forEach(v=>{const b=document.createElement('button');b.style.cssText='height:46px;border:0;border-radius:10px;background:#16a34a;color:white;font-size:16px;font-weight:1000';b.textContent='₪'+v;b.onclick=()=>{inp.value=String(v);update()};box.querySelector('#mfix129-cashbtns').appendChild(b)});

   ['1','2','3','4','5','6','7','8','9','.','0','⌫'].forEach(k=>{
     const b=document.createElement('button');b.textContent=k;b.style.cssText='height:40px;border:0;border-radius:10px;background:#334155;color:white;font-size:19px;font-weight:900';
     b.onclick=()=>{if(k==='⌫')inp.value=inp.value.slice(0,-1);else inp.value+=k;update()};box.querySelector('#mfix129-keypad').appendChild(b);
   });

   const closeCash=()=>{document.removeEventListener('keydown',cashKey,true);ov.remove()};
   const cashKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeCash()}};
   document.addEventListener('keydown',cashKey,true);
   const finish=v=>{
     v=Number(v);
     if(!(v>=total)){live.style.color='#fca5a5';live.textContent='הסכום שהתקבל נמוך מהחשבון';return}
     const ch=v-total,cb=document.getElementById('mfix-pos-change-box-1000'),ce=document.getElementById('mfix-pos-change-1000');
     if(cb&&ce){ce.textContent='₪'+ch.toLocaleString('he-IL',{maximumFractionDigits:2});cb.style.display='block';setTimeout(()=>cb.style.display='none',10000)}
     // Hand the amount to the old stable cash automation so it will NOT ask a second time.
     window.__mfixCashGivenFromPos1320=v;
     closeCash();done?.(v,ch);
   };
   box.querySelector('#mfix129-exact').onclick=()=>finish(total);
   box.querySelector('#mfix129-go').onclick=()=>finish(inp.value||total);
   box.querySelector('#mfix129-cancel').onclick=box.querySelector('#mfix129-cancel-x').onclick=closeCash;
   setTimeout(()=>inp.focus(),80);
 }
 function mfix129DailyHit(){try{const d=new Date().toISOString().slice(0,10),sum=mfixPosTotal800();let x=JSON.parse(localStorage.getItem(MFIX129_DAILY)||'{}');if(x.date!==d)x={date:d,count:0,total:0};x.count++;x.total+=sum;localStorage.setItem(MFIX129_DAILY,JSON.stringify(x));mfix129RenderDaily()}catch(_){}}
 function mfix129RenderDaily(){const e=document.getElementById('mfix-pos-daily-1290');if(!e)return;let x={count:0,total:0};try{x=JSON.parse(localStorage.getItem(MFIX129_DAILY)||'{}')}catch(_){}e.textContent=`הועברו לתשלום היום: ${Number(x.count||0)} · ₪${Number(x.total||0).toLocaleString('he-IL',{maximumFractionDigits:2})}`}
 function mfix129CustomerBadge(){const n=document.getElementById('mfix-pos-customer-name-900')?.value.trim(),ph=document.getElementById('mfix-pos-customer-phone-900')?.value.trim(),e=document.getElementById('mfix-pos-customer-badge-1290');if(e)e.textContent='👤 '+(n||'לקוח מזדמן')+(ph?' · '+ph:'')}
 function mfix129PaymentAllowed(kind){if(window.__mfixPosAdding800){toast('מוצר עדיין בתהליך הוספה — המתן',2200);return false}const total=mfixPosTotal800(),st=mfix129SettingsGet();if(st.paymentConfirm&&total>=Number(st.paymentAt||2500))return confirm(`לתשלום ${kind==='terminal'?'באשראי':'במזומן'} ₪${total.toLocaleString('he-IL')}\nלהמשיך?`);return true}
 function mfix129ApplyTheme(){const root=document.getElementById('mfix-pos-800'),st=mfix129SettingsGet();if(!root)return;const dark=st.darkAuto&&(new Date().getHours()>=19||new Date().getHours()<6);root.style.background=dark?'#111827':'#f4f6f8'}
 function mfixPosCartAdd800(product,priceOverride=null){
   const a=mfixPosCartGet800();if(!a.length)mfix129SaleEnsure();
   const key=String(product?.Barcode||product?.Name||product?.CatalogNumber||productTitle(product,'')).trim();
   const price=Number(priceOverride??product?.Price??0);
   const hit=a.find(x=>x.key===key && !priceOverride);
   if(hit)hit.qty=(hit.qty||1)+1;
   else a.push({key,name:productTitle(product,''),barcode:String(product?.Barcode||product?.Name||''),price,cost:mfix131Cost(product),qty:1});
   mfixPosCartSet800(a);mfix129RememberProduct(product);mfix129HeaderMeta();
 }
 function mfixPosTotal800(){
   try{
     const o=Number(sessionStorage.getItem(MFIX_POS_TOTAL_OVERRIDE_1365)||0);
     if(o>0)return o;
   }catch(_){}
   return mfixPosCartGet800().reduce((s,x)=>s+(Number(x.price||0)*(x.qty||1)),0);
 }







 const MFIX_PRICE_ASSIST_1370='mfixPriceAssist1370';

 function mfixPriceNote1370(text,bg='#1d4ed8'){
   let n=document.getElementById('mfix-price-note-1370');
   if(!n){
     n=document.createElement('div');
     n.id='mfix-price-note-1370';
     n.dir='rtl';
     n.style.cssText='position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:2147483647;max-width:760px;padding:13px 18px;border-radius:14px;color:#fff;font:bold 17px Arial;box-shadow:0 8px 28px #0008;text-align:center;pointer-events:none';
     document.documentElement.appendChild(n);
   }
   n.style.background=bg;
   n.textContent=text;
   return n;
 }

 function mfixPriceSetEditor1370(el,val){
   if(!el)return false;
   try{
     const v=String(val);
     el.focus();
     if(el.matches('input,textarea')){
       const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
       const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
       if(setter)setter.call(el,v); else el.value=v;
       try{el.select()}catch(_){}
       el.dispatchEvent(new Event('input',{bubbles:true}));
       el.dispatchEvent(new Event('change',{bubbles:true}));
       return true;
     }
     if(el.isContentEditable){
       el.textContent=v;
       el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:v}));
       return true;
     }
   }catch(_){}
   return false;
 }

 function mfixPricePressEnter1370(el){
   try{
     el.focus();
     const o={key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true,cancelable:true};
     el.dispatchEvent(new KeyboardEvent('keydown',o));
     el.dispatchEvent(new KeyboardEvent('keypress',o));
     el.dispatchEvent(new KeyboardEvent('keyup',o));
     return true;
   }catch(_){}
   return false;
 }

 function mfixPriceTarget1370(){
   const vis=e=>{
     if(!e||!(e instanceof Element))return false;
     const r=e.getBoundingClientRect(),st=getComputedStyle(e);
     return r.width>3&&r.height>3&&st.display!=='none'&&st.visibility!=='hidden';
   };
   const txt=e=>String(e?.innerText||e?.textContent||'').replace(/\s+/g,' ').trim();

   const labels=[...document.querySelectorAll('div,span,strong,b,label,td')].filter(e=>{
     if(!vis(e)||e.closest('#mfix-pos-800,#mfix-next-step-450,#mfix-change-popup-624,#mfix-price-note-1370'))return false;
     const t=txt(e);
     return /^סה["״']?כ\s+לתשלום$/.test(t)||t==='סהכ לתשלום';
   });

   for(const label of labels){
     // Use the smallest common parent that contains both the label and the amount.
     let scope=label.parentElement;
     for(let depth=0; depth<4 && scope; depth++,scope=scope.parentElement){
       if(!vis(scope))continue;
       const candidates=[...scope.querySelectorAll('div,span,b,strong,td')].filter(e=>{
         if(!vis(e)||e===label||e.contains(label))return false;
         const t=txt(e).replace(/\s/g,'');
         return /^₪?[\d,.]+$/.test(t) && Number(t.replace('₪','').replace(/,/g,''))>0;
       });
       if(candidates.length){
         candidates.sort((a,b)=>{
           const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
           return (ar.width*ar.height)-(br.width*br.height);
         });
         return {label,amount:candidates[0],scope};
       }
     }
   }
   return null;
 }

 function mfixPriceFindEditorInScope1370(scope){
   const vis=e=>{
     if(!e||!(e instanceof Element))return false;
     const r=e.getBoundingClientRect(),st=getComputedStyle(e);
     return r.width>3&&r.height>3&&st.display!=='none'&&st.visibility!=='hidden';
   };
   if(!scope)return null;

   // STRICT: never use a random page input.
   const scopes=[scope,scope.parentElement,scope.parentElement?.parentElement].filter(Boolean);
   for(const sc of scopes){
     const list=[...sc.querySelectorAll('input,textarea,[contenteditable="true"]')].filter(e=>vis(e));
     if(list.length){
       const active=document.activeElement;
       if(active && list.includes(active))return active;
       return list[0];
     }
   }
   return null;
 }






 const MFIX_FULL_PRICE_EXPORT_1381='mfixFullPriceExport1381';

 function mfixFullPriceExportLearner1381(){
   if(window.__mfixFullPriceExportLearner1381)return;
   window.__mfixFullPriceExportLearner1381=true;
   document.getElementById('mfix-pos-800')?.remove();
   window.__mfixPosSuspendUntil820=Date.now()+600000;

   const started=Date.now();
   const events=[];
   const mutations=[];
   const visible=e=>e && e instanceof Element && e.offsetParent!==null;
   const clean=t=>String(t||'').replace(/\s+/g,' ').trim();
   const selector=e=>{try{return mfixLearnSelector1373(e)}catch(_){return ''}};
   const describe=el=>{
     try{
       if(!(el instanceof Element))return {};
       return {
         tag:String(el.tagName||'').toLowerCase(),
         id:String(el.id||''),
         name:String(el.getAttribute?.('name')||''),
         type:String(el.getAttribute?.('type')||''),
         role:String(el.getAttribute?.('role')||''),
         selector:selector(el),
         text:clean(el.innerText||el.textContent).slice(0,220),
         value:('value' in el)?String(el.value??'').slice(0,220):'',
         placeholder:String(el.getAttribute?.('placeholder')||'').slice(0,120),
         className:String(el.className||'').slice(0,220)
       };
     }catch(_){return {}}
   };
   const push=(type,e,extra={})=>{
     try{
       if(e?.target instanceof Element && e.target.closest('#mfix-full-export-1381'))return;
       events.push({
         n:events.length+1,
         ms:Date.now()-started,
         type,
         target:describe(e?.target),
         active:describe(document.activeElement),
         ...extra
       });
       const c=document.getElementById('mfix-full-export-count-1381');
       if(c)c.textContent=events.length+' פעולות';
     }catch(_){}
   };

   const bar=document.createElement('div');
   bar.id='mfix-full-export-1381';bar.dir='rtl';
   bar.style.cssText='position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:2147483647;background:#111827;color:#fff;border-radius:14px;padding:10px 12px;box-shadow:0 10px 30px #0008;font-family:Arial;display:flex;align-items:center;gap:10px';
   bar.innerHTML='<b>🔴 מקליט את כל עריכת המחיר</b><span id="mfix-full-export-count-1381" style="color:#bfdbfe">0 פעולות</span><button id="mfix-full-export-save-1381" style="height:38px;border:0;border-radius:9px;background:#16a34a;color:#fff;font-weight:900;padding:0 16px">✅ זהו — שמור קובץ</button><button id="mfix-full-export-cancel-1381" style="height:38px;border:0;border-radius:9px;background:#7f1d1d;color:#fff;font-weight:900;padding:0 12px">ביטול</button>';
   document.documentElement.appendChild(bar);

   const handlers={
     pointerdown:e=>push('pointerdown',e,{button:e.button,buttons:e.buttons,clientX:e.clientX,clientY:e.clientY}),
     pointerup:e=>push('pointerup',e,{button:e.button,buttons:e.buttons,clientX:e.clientX,clientY:e.clientY}),
     mousedown:e=>push('mousedown',e,{button:e.button,detail:e.detail}),
     mouseup:e=>push('mouseup',e,{button:e.button,detail:e.detail}),
     click:e=>push('click',e,{button:e.button,detail:e.detail}),
     dblclick:e=>push('dblclick',e,{button:e.button,detail:e.detail}),
     focusin:e=>push('focusin',e),
     focusout:e=>push('focusout',e),
     beforeinput:e=>push('beforeinput',e,{inputType:e.inputType||'',data:e.data??null}),
     input:e=>push('input',e,{inputType:e.inputType||'',data:e.data??null}),
     change:e=>push('change',e),
     keydown:e=>push('keydown',e,{key:e.key,code:e.code,ctrlKey:e.ctrlKey,altKey:e.altKey,shiftKey:e.shiftKey,metaKey:e.metaKey}),
     keyup:e=>push('keyup',e,{key:e.key,code:e.code,ctrlKey:e.ctrlKey,altKey:e.altKey,shiftKey:e.shiftKey,metaKey:e.metaKey}),
     submit:e=>push('submit',e)
   };
   for(const [t,h] of Object.entries(handlers))document.addEventListener(t,h,true);

   const obs=new MutationObserver(list=>{
     try{
       for(const m of list.slice(0,40)){
         const rec={
           ms:Date.now()-started,
           type:m.type,
           target:describe(m.target),
           attributeName:m.attributeName||'',
           added:[...m.addedNodes].filter(n=>n instanceof Element).slice(0,5).map(describe),
           removed:[...m.removedNodes].filter(n=>n instanceof Element).slice(0,5).map(describe)
         };
         mutations.push(rec);
         if(mutations.length>1200)mutations.shift();
       }
     }catch(_){}
   });
   obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','value','aria-hidden','aria-expanded']});

   const cleanup=()=>{
     for(const [t,h] of Object.entries(handlers))document.removeEventListener(t,h,true);
     obs.disconnect();
     window.__mfixFullPriceExportLearner1381=false;
     window.__mfixPosSuspendUntil820=0;
   };

   const saveFile=()=>{
     const data={
       app:'MFIX POS',
       version:'13.8.1',
       purpose:'full-native-price-edit-learning',
       url:location.href,
       startedAt:new Date(started).toISOString(),
       finishedAt:new Date().toISOString(),
       viewport:{width:innerWidth,height:innerHeight,devicePixelRatio:window.devicePixelRatio||1},
       events,
       mutations
     };
     try{localStorage.setItem(MFIX_FULL_PRICE_EXPORT_1381,JSON.stringify(data))}catch(_){}
     const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
     const url=URL.createObjectURL(blob);
     const a=document.createElement('a');
     const stamp=new Date().toISOString().replace(/[:.]/g,'-');
     a.href=url;
     a.download='MFIX-price-learning-'+stamp+'.json';
     a.style.display='none';
     document.documentElement.appendChild(a);
     a.click();
     setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},1500);
     return data;
   };

   bar.querySelector('#mfix-full-export-save-1381').onclick=e=>{
     e.stopPropagation();
     cleanup();
     const data=saveFile();
     bar.innerHTML='<b>✓ נשמר קובץ עם '+data.events.length+' פעולות</b><button id="mfix-full-export-pos-1381" style="height:38px;border:0;border-radius:9px;background:#475569;color:#fff;font-weight:900;padding:0 14px">חזרה ל־POS</button>';
     bar.style.background='#047857';
     bar.querySelector('#mfix-full-export-pos-1381').onclick=ev=>{
       ev.stopPropagation();bar.remove();try{mfixPosOpen800()}catch(_){}
     };
   };
   bar.querySelector('#mfix-full-export-cancel-1381').onclick=e=>{
     e.stopPropagation();cleanup();bar.remove();try{mfixPosOpen800()}catch(_){}
   };
 }

 const MFIX_OPEN_PRICE_LOG_1380='mfixOpenPriceLog1380';


 function mfixLearnOpenPrice1380(){
   if(window.__mfixLearnOpenPrice1380)return;
   window.__mfixLearnOpenPrice1380=true;
   document.getElementById('mfix-pos-800')?.remove();
   window.__mfixPosSuspendUntil820=Date.now()+180000;

   const events=[];
   const started=Date.now();
   const visible=e=>e && e instanceof Element && e.offsetParent!==null;
   const text=e=>String(e?.innerText||e?.textContent||'').replace(/\s+/g,' ').trim().slice(0,100);
   const selector=e=>{try{return mfixLearnSelector1373(e)}catch(_){return ''}};

   const bar=document.createElement('div');
   bar.id='mfix-open-price-learn-1380'; bar.dir='rtl';
   bar.style.cssText='position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:2147483647;background:#111827;color:#fff;border-radius:14px;padding:10px 12px;box-shadow:0 10px 30px #0008;font-family:Arial;display:flex;gap:10px;align-items:center';
   bar.innerHTML='<b>🎓 למד רק איך פותחים עריכת מחיר</b><span id="mfix-open-count-1380">0</span><button id="mfix-open-cancel-1380" style="height:36px;border:0;border-radius:9px;background:#7f1d1d;color:#fff;font-weight:900;padding:0 12px">ביטול</button>';
   document.documentElement.appendChild(bar);

   const mine=e=>e.target instanceof Element && !!e.target.closest('#mfix-open-price-learn-1380');
   const push=(type,e)=>{
     if(mine(e)||!(e.target instanceof Element))return;
     const el=e.target;
     events.push({n:events.length+1,ms:Date.now()-started,type,tag:(el.tagName||'').toLowerCase(),selector:selector(el),text:text(el),detail:e.detail||0});
     const c=bar.querySelector('#mfix-open-count-1380'); if(c)c.textContent=events.length+' פעולות';
   };
   const handlers={
     pointerdown:e=>push('pointerdown',e),
     click:e=>push('click',e),
     dblclick:e=>push('dblclick',e),
     focusin:e=>push('focusin',e)
   };
   for(const [t,h] of Object.entries(handlers))document.addEventListener(t,h,true);

   const cleanup=()=>{
     for(const [t,h] of Object.entries(handlers))document.removeEventListener(t,h,true);
     obs.disconnect(); clearInterval(timer);
     window.__mfixLearnOpenPrice1380=false;
     window.__mfixPosSuspendUntil820=0;
   };

   const finish=()=>{
     const ip=[...document.querySelectorAll('#iprice2')].find(visible);
     if(!ip)return false;
     cleanup();
     const data={version:'13.8.0',events,priceInput:'#iprice2'};
     try{localStorage.setItem(MFIX_OPEN_PRICE_LOG_1380,JSON.stringify(data))}catch(_){}
     const compact=JSON.stringify(data,null,2);
     bar.innerHTML='<b>✓ שדה המחיר נפתח — זה בדיוק מה שחסר</b><button id="mfix-copy-open-1380" style="height:36px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-weight:900;padding:0 14px">📋 העתק ושלח לי</button><button id="mfix-back-open-1380" style="height:36px;border:0;border-radius:9px;background:#475569;color:#fff;font-weight:900;padding:0 12px">חזרה ל־POS</button>';
     bar.querySelector('#mfix-copy-open-1380').onclick=async e=>{
       e.stopPropagation();
       try{await navigator.clipboard.writeText(compact);toast('הועתק ✓',1200)}
       catch(_){
         const ta=document.createElement('textarea'); ta.value=compact;
         ta.style.cssText='position:fixed;z-index:2147483647;inset:70px 20px 20px';
         document.documentElement.appendChild(ta); ta.select();
       }
     };
     bar.querySelector('#mfix-back-open-1380').onclick=e=>{e.stopPropagation();bar.remove();try{mfixPosOpen800()}catch(_){}};
     return true;
   };

   const obs=new MutationObserver(()=>finish());
   obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true});
   const timer=setInterval(()=>finish(),120);

   bar.querySelector('#mfix-open-cancel-1380').onclick=e=>{
     e.stopPropagation(); cleanup(); bar.remove(); try{mfixPosOpen800()}catch(_){}
   };
 }

 async function mfixRealItemPrice1378(){
   const current=Number(mfixPosTotal800()||0);
   if(!(current>0)){toast('אין סכום במכירה',1700);return false}
   const raw=prompt('מחיר חדש למוצר',current.toFixed(2));
   if(raw===null)return false;
   const wanted=Number(String(raw).replace(',','.'));
   if(!(wanted>0)){toast('מחיר לא תקין',1800);return false}

   document.getElementById('mfix-pos-800')?.remove();
   window.__mfixPosSuspendUntil820=Date.now()+45000;
   const note=mfixPriceNote1370('✏️ שלב 1/4 — פותח תפריט שורת מוצר…');

   const visible=e=>{
     try{
       if(!e || !(e instanceof Element))return false;
       const r=e.getBoundingClientRect(),cs=getComputedStyle(e);
       return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0;
     }catch(_){return false}
   };
   const txt=e=>String(e?.innerText||e?.textContent||'').replace(/\s+/g,' ').trim();

   const realClick=async(el)=>{
     if(!el)return false;
     try{
       el.scrollIntoView({block:'center',inline:'nearest'});
       const o={bubbles:true,cancelable:true,view:window,button:0};
       try{el.dispatchEvent(new PointerEvent('pointerdown',{...o,pointerType:'mouse',buttons:1}))}catch(_){}
       el.dispatchEvent(new MouseEvent('mousedown',{...o,buttons:1}));
       await sleep(35);
       try{el.dispatchEvent(new PointerEvent('pointerup',{...o,pointerType:'mouse',buttons:0}))}catch(_){}
       el.dispatchEvent(new MouseEvent('mouseup',{...o,buttons:0}));
       el.dispatchEvent(new MouseEvent('click',{...o,detail:1,buttons:0}));
       return true;
     }catch(_){
       try{el.click();return true}catch(__){return false}
     }
   };

   try{
     // EXACT recorder result:
     // div.servicesdesk ... div.item ... div.g-bu2.meg > i.fal.fa-ellipsis-v
     let dots=null;
     for(let i=0;i<35&&!dots;i++){
       dots=[...document.querySelectorAll(
         'div.servicesdesk div.lines div.grid-receipt div.item div.g-bu2.meg > i.fal.fa-ellipsis-v,'+
         'div.grid-receipt div.item div.g-bu2.meg > i.fal.fa-ellipsis-v,'+
         'div.g-bu2.meg > i.fal.fa-ellipsis-v'
       )].find(visible);
       if(!dots)await sleep(100);
     }
     if(!dots)throw new Error('שלוש הנקודות');

     // Remember the exact native item row being edited, so only its POS cart price is updated.
     const editedNativeRow=dots.closest('div.grid-receipt div.item,div.item');
     const editedNativeText=txt(editedNativeRow||'');

     await realClick(dots);

     if(note)note.textContent='✏️ שלב 2/4 — בוחר „עריכת שורה”…';

     let edit=null;
     for(let i=0;i<40&&!edit;i++){
       edit=[...document.querySelectorAll(
         'div.menu.withbg.active ul li a,'+
         'div.menu.active ul li a,'+
         'div.menu.withbg ul li a'
       )].find(e=>visible(e)&&txt(e)==='עריכת שורה');
       if(!edit)await sleep(100);
     }
     if(!edit)throw new Error('עריכת שורה');

     await realClick(edit);

     if(note)note.textContent='✏️ שלב 3/4 — מכניס את המחיר החדש…';

     let priceInput=null;
     for(let i=0;i<45&&!priceInput;i++){
       priceInput=[...document.querySelectorAll('#iprice2')].find(visible);
       if(!priceInput)await sleep(100);
     }
     if(!priceInput)throw new Error('שדה מחיר #iprice2');

     // Replay typing more like the real recording instead of only assigning .value.
     try{
       priceInput.focus();
       priceInput.select?.();
       const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
       if(setter)setter.call(priceInput,''); else priceInput.value='';
       priceInput.dispatchEvent(new Event('input',{bubbles:true}));
       const chars=String(wanted);
       let acc='';
       for(const ch of chars){
         const code=/\d/.test(ch)?'Digit'+ch:(ch==='.'?'Period':'');
         priceInput.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:ch,code}));
         acc+=ch;
         if(setter)setter.call(priceInput,acc); else priceInput.value=acc;
         try{
           priceInput.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:ch}));
         }catch(_){
           priceInput.dispatchEvent(new Event('input',{bubbles:true}));
         }
         priceInput.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:ch,code}));
         await sleep(45);
       }
       priceInput.dispatchEvent(new Event('change',{bubbles:true}));
     }catch(_){
       const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
       if(setter)setter.call(priceInput,String(wanted)); else priceInput.value=String(wanted);
       priceInput.dispatchEvent(new Event('input',{bubbles:true}));
       priceInput.dispatchEvent(new Event('change',{bubbles:true}));
     }

     if(note)note.textContent='✏️ שלב 4/4 — לוחץ „עדכון שורה”…';

     let update=null;
     for(let i=0;i<35&&!update;i++){
       update=[...document.querySelectorAll('div.pop2 button.buttonai,button.buttonai,button')]
         .find(e=>visible(e)&&txt(e)==='עדכון שורה');
       if(!update)await sleep(100);
     }
     if(!update)throw new Error('עדכון שורה');

     await realClick(update);

     // Wait until the edit form actually closes.
     for(let i=0;i<45;i++){
       await sleep(120);
       if(![...document.querySelectorAll('#iprice2')].some(visible))break;
     }

     try{sessionStorage.removeItem(MFIX_POS_TOTAL_OVERRIDE_1365)}catch(_){}

     // Sync the successful REAL line-price edit back into the MFIX POS cart.
     // Match by barcode/name from the exact native row we edited; if there is only
     // one cart line, update that one directly.
     try{
       const cart=mfixPosCartGet800();
       let hitIndex=-1;
       if(cart.length===1){
         hitIndex=0;
       }else if(cart.length>1){
         const rowText=String(editedNativeText||'').replace(/\s+/g,' ').trim().toLowerCase();
         hitIndex=cart.findIndex(x=>{
           const barcode=String(x.barcode||x.key||'').trim().toLowerCase();
           const name=String(x.name||'').trim().toLowerCase();
           return (barcode && rowText.includes(barcode)) || (name && rowText.includes(name));
         });
       }
       if(hitIndex>=0){
         cart[hitIndex].price=wanted;
         sessionStorage.setItem(MFIX_POS_CART_800,JSON.stringify(cart));
       }
     }catch(_){}

     window.__mfixPosSuspendUntil820=0;

     if(note){
       note.style.background='#047857';
       note.textContent='✓ מחיר המוצר עודכן ל־₪'+wanted;
       setTimeout(()=>note.remove(),1200);
     }

     setTimeout(()=>{
       try{
         sessionStorage.setItem(MFIX_POS_MODE_800,'1');
         document.getElementById('mfix-pos-800')?.remove();
         mfixPosOpen800();
         mfixPosRenderCart800();
         mfix129HeaderMeta();
       }catch(_){}
     },500);
     return true;

   }catch(err){
     window.__mfixPosSuspendUntil820=0;
     const step=String(err?.message||err||'לא ידוע');
     if(note){
       note.style.background='#b91c1c';
       note.textContent='נעצר בשלב: '+step;
       setTimeout(()=>note.remove(),4000);
     }
     toast('נעצר בשלב: '+step,4000);
     setTimeout(()=>{try{mfixPosOpen800()}catch(_){}},700);
     return false;
   }
 }
 const MFIX_FULL_PRICE_LOG_1376='mfixFullPriceLog1376';

 function mfixFullPriceLearner1376(){
   if(window.__mfixFullPriceLearner1376)return;
   window.__mfixFullPriceLearner1376=true;
   document.getElementById('mfix-pos-800')?.remove();
   window.__mfixPosSuspendUntil820=Date.now()+300000;

   const log=[];
   const started=Date.now();
   const shortText=el=>String(el?.innerText||el?.textContent||'').replace(/\s+/g,' ').trim().slice(0,180);
   const sel=el=>{try{return mfixLearnSelector1373(el)}catch(_){return ''}};
   const push=(type,el,extra={})=>{
     try{
       log.push({
         n:log.length+1,
         ms:Date.now()-started,
         type,
         tag:String(el?.tagName||'').toLowerCase(),
         selector:sel(el),
         text:shortText(el),
         value:(el && ('value' in el))?String(el.value).slice(0,180):'',
         ...extra
       });
       const c=document.getElementById('mfix-full-learn-count-1376');
       if(c)c.textContent=log.length+' אירועים';
     }catch(_){}
   };

   const bar=document.createElement('div');
   bar.id='mfix-full-learn-bar-1376';bar.dir='rtl';
   bar.style.cssText='position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:2147483647;background:#111827;color:#fff;border-radius:14px;padding:10px 12px;box-shadow:0 10px 30px #0008;font-family:Arial;display:flex;align-items:center;gap:10px';
   bar.innerHTML='<b>🔴 מקליט את כל שינוי המחיר</b><span id="mfix-full-learn-count-1376" style="color:#bfdbfe">0 אירועים</span><button id="mfix-full-learn-done-1376" style="height:38px;border:0;border-radius:9px;background:#16a34a;color:#fff;font-weight:900;padding:0 16px">✅ זהו</button><button id="mfix-full-learn-cancel-1376" style="height:38px;border:0;border-radius:9px;background:#7f1d1d;color:#fff;font-weight:900;padding:0 12px">ביטול</button>';
   document.documentElement.appendChild(bar);

   const mine=e=>e.target instanceof Element && !!e.target.closest('#mfix-full-learn-bar-1376');
   const handlers={
     pointerdown:e=>{if(!mine(e))push('pointerdown',e.target,{button:e.button})},
     pointerup:e=>{if(!mine(e))push('pointerup',e.target,{button:e.button})},
     click:e=>{if(!mine(e))push('click',e.target,{detail:e.detail})},
     dblclick:e=>{if(!mine(e))push('dblclick',e.target,{detail:e.detail})},
     focusin:e=>{if(!mine(e))push('focusin',e.target)},
     input:e=>{if(!mine(e))push('input',e.target,{inputType:e.inputType||''})},
     change:e=>{if(!mine(e))push('change',e.target)},
     keydown:e=>{if(!mine(e))push('keydown',e.target,{key:e.key,code:e.code})},
     keyup:e=>{if(!mine(e))push('keyup',e.target,{key:e.key,code:e.code})},
     submit:e=>{if(!mine(e))push('submit',e.target)}
   };
   for(const [t,h] of Object.entries(handlers))document.addEventListener(t,h,true);

   const cleanup=()=>{
     for(const [t,h] of Object.entries(handlers))document.removeEventListener(t,h,true);
     window.__mfixFullPriceLearner1376=false;
     window.__mfixPosSuspendUntil820=0;
   };

   bar.querySelector('#mfix-full-learn-done-1376').onclick=e=>{
     e.stopPropagation();
     cleanup();
     const data={version:'13.7.6',startedAt:new Date(Date.now()-(Date.now()-started)).toISOString(),finishedAt:new Date().toISOString(),events:log};
     try{localStorage.setItem(MFIX_FULL_PRICE_LOG_1376,JSON.stringify(data))}catch(_){}
     const txt=JSON.stringify(data,null,2);
     bar.innerHTML='<b>✓ ההקלטה הסתיימה</b><button id="mfix-copy-log-1376" style="height:38px;border:0;border-radius:9px;background:#2563eb;color:white;font-weight:900;padding:0 16px">📋 העתק מה הוא עשה</button><button id="mfix-back-pos-1376" style="height:38px;border:0;border-radius:9px;background:#475569;color:white;font-weight:900;padding:0 14px">חזרה ל־POS</button>';
     bar.querySelector('#mfix-copy-log-1376').onclick=async ev=>{
       ev.stopPropagation();
       try{await navigator.clipboard.writeText(txt);toast('ההקלטה הועתקה ✓',1600)}
       catch(_){
         const ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;inset:70px 20px 20px;z-index:2147483647';
         document.documentElement.appendChild(ta);ta.select();toast('סמן והעתק את הטקסט',2200);
       }
     };
     bar.querySelector('#mfix-back-pos-1376').onclick=ev=>{
       ev.stopPropagation();bar.remove();try{mfixPosOpen800()}catch(_){}
     };
   };
   bar.querySelector('#mfix-full-learn-cancel-1376').onclick=e=>{
     e.stopPropagation();cleanup();bar.remove();try{mfixPosOpen800()}catch(_){}
   };
 }

 const MFIX_PRICE_ACTIONS_1373='mfixPriceActions1373';

 function mfixLearnSelector1373(el){
   try{
     if(!el || !(el instanceof Element))return '';
     if(el.id)return '#'+CSS.escape(el.id);
     const parts=[];
     let cur=el;
     for(let n=0;n<7&&cur&&cur!==document.body;n++,cur=cur.parentElement){
       let part=(cur.tagName||'').toLowerCase();
       if(!part)break;
       const cls=[...cur.classList].filter(x=>x && !/\d{3,}/.test(x)).slice(0,3);
       if(cls.length)part+='.'+cls.map(x=>CSS.escape(x)).join('.');
       if(cur.parentElement){
         const same=[...cur.parentElement.children].filter(x=>x.tagName===cur.tagName);
         if(same.length>1)part+=`:nth-of-type(${same.indexOf(cur)+1})`;
       }
       parts.unshift(part);
     }
     return parts.join(' > ');
   }catch(_){return ''}
 }

 function mfixPriceLearner1373(){
   if(window.__mfixPriceLearner1373)return;
   window.__mfixPriceLearner1373=true;
   document.getElementById('mfix-pos-800')?.remove();
   window.__mfixPosSuspendUntil820=Date.now()+180000;

   const actions=[];
   let lastInputKey='';

   const bar=document.createElement('div');
   bar.id='mfix-price-learner-bar-1373';
   bar.dir='rtl';
   bar.style.cssText='position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:2147483647;background:#111827;color:#fff;border-radius:14px;padding:10px 12px;box-shadow:0 10px 30px #0008;font-family:Arial;display:flex;align-items:center;gap:10px';
   bar.innerHTML='<b>🎓 לימוד שינוי מחיר אמיתי</b><span id="mfix-learn-count-1373" style="color:#bfdbfe">0 פעולות</span><button id="mfix-learn-save-1373" style="height:36px;border:0;border-radius:9px;background:#16a34a;color:white;font-weight:900;padding:0 14px">✅ זהו — שמור</button><button id="mfix-learn-cancel-1373" style="height:36px;border:0;border-radius:9px;background:#7f1d1d;color:white;font-weight:900;padding:0 12px">ביטול</button>';
   document.documentElement.appendChild(bar);

   const count=()=>{const e=bar.querySelector('#mfix-learn-count-1373');if(e)e.textContent=actions.length+' פעולות'};
   const isMine=e=>!!(e.target instanceof Element && e.target.closest('#mfix-price-learner-bar-1373'));

   const add=(a)=>{
     const prev=actions[actions.length-1];
     if(a.type==='input' && prev?.type==='input' && prev.selector===a.selector){
       actions[actions.length-1]=a;
     }else actions.push(a);
     count();
   };

   const onClick=e=>{
     if(isMine(e) || !(e.target instanceof Element))return;
     const el=e.target.closest('button,a,input,div,span,label,td')||e.target;
     add({type:'click',selector:mfixLearnSelector1373(el),text:String(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim().slice(0,120)});
   };
   const onDbl=e=>{
     if(isMine(e) || !(e.target instanceof Element))return;
     const el=e.target.closest('button,a,input,div,span,label,td')||e.target;
     add({type:'dblclick',selector:mfixLearnSelector1373(el),text:String(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim().slice(0,120)});
   };
   const onInput=e=>{
     if(isMine(e) || !(e.target instanceof Element))return;
     const el=e.target;
     if(!(el.matches('input,textarea')||el.isContentEditable))return;
     const selector=mfixLearnSelector1373(el);
     const value=String(el.value??el.textContent??'');
     add({type:'input',selector,value,numeric:/^\s*[\d,.]+\s*$/.test(value)});
     lastInputKey=selector;
   };
   const onKey=e=>{
     if(isMine(e) || e.key!=='Enter' || !(e.target instanceof Element))return;
     const el=e.target;
     add({type:'enter',selector:mfixLearnSelector1373(el)});
   };

   const cleanup=()=>{
     document.removeEventListener('click',onClick,true);
     document.removeEventListener('dblclick',onDbl,true);
     document.removeEventListener('input',onInput,true);
     document.removeEventListener('keydown',onKey,true);
     window.__mfixPriceLearner1373=false;
   };

   document.addEventListener('click',onClick,true);
   document.addEventListener('dblclick',onDbl,true);
   document.addEventListener('input',onInput,true);
   document.addEventListener('keydown',onKey,true);

   bar.querySelector('#mfix-learn-save-1373').onclick=e=>{
     e.stopPropagation();
     cleanup();
     // The last numeric input is treated as the learned price field during future replay.
     let priceSelector='';
     for(let i=actions.length-1;i>=0;i--){
       if(actions[i].type==='input' && actions[i].numeric){priceSelector=actions[i].selector;break}
     }
     try{localStorage.setItem(MFIX_PRICE_ACTIONS_1373,JSON.stringify({actions,priceSelector,savedAt:Date.now()}))}catch(_){}
     bar.remove();
     window.__mfixPosSuspendUntil820=0;
     toast('✓ לימוד שינוי המחיר נשמר',1500);
     setTimeout(()=>{
       try{
         document.getElementById('mfix-pos-800')?.remove();
         mfixPosOpen800();
       }catch(_){}
     },180);
   };
   bar.querySelector('#mfix-learn-cancel-1373').onclick=e=>{
     e.stopPropagation();cleanup();bar.remove();
     setTimeout(()=>{try{mfixPosOpen800()}catch(_){}},400);
   };
 }


 async function mfixReplayLearnedPrice1374(){
   let learned=null;
   try{learned=JSON.parse(localStorage.getItem(MFIX_PRICE_ACTIONS_1373)||'null')}catch(_){}
   if(!learned?.actions?.length){
     toast('עדיין לא נשמר לימוד שינוי מחיר',2200);
     return false;
   }

   const current=Number(mfixPosTotal800()||0);
   if(!(current>0)){toast('אין סכום במכירה',1700);return false}
   const raw=prompt('מחיר חדש למוצר',current.toFixed(2));
   if(raw===null)return false;
   const wanted=Number(String(raw).replace(',','.'));
   if(!(wanted>0)){toast('מחיר לא תקין',1800);return false}

   document.getElementById('mfix-pos-800')?.remove();
   window.__mfixPosSuspendUntil820=Date.now()+60000;
   mfixPriceNote1370('✏️ מבצע את שינוי המחיר שלמדתי…');

   const visible=e=>e && e instanceof Element && e.offsetParent!==null;
   const findByAction=a=>{
     try{
       if(a.selector){
         const e=[...document.querySelectorAll(a.selector)].find(visible);
         if(e)return e;
       }
     }catch(_){}
     if(a.text){
       const t=String(a.text).replace(/\s+/g,' ').trim();
       const all=[...document.querySelectorAll('button,a,div,span,label,td')].filter(visible);
       return all.find(e=>String(e.innerText||e.textContent||'').replace(/\s+/g,' ').trim()===t) ||
              all.find(e=>String(e.innerText||e.textContent||'').replace(/\s+/g,' ').trim().includes(t));
     }
     return null;
   };

   try{
     for(const a of learned.actions){
       // Ignore learner UI itself if it was accidentally captured.
       if(String(a.selector||'').includes('mfix-price-learner'))continue;

       let el=null;
       for(let i=0;i<25&&!el;i++){
         el=findByAction(a);
         if(!el)await sleep(100);
       }
       if(!el)continue;

       if(a.type==='click'){

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

   box.style.cssText='position:fixed;z-index:2147483647;top:50%;left:50%;transform:translate(-50%,-50%);width:min(420px,92vw);max-height:88vh;overflow:auto;background:#111827;color:white;border:2px solid #f59e0b;border-radius:18px;padding:18px;box-shadow:0 20px 60px #000a;font-family:Arial';
   box.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div style="font-size:20px;font-weight:1000">🖨️ הגדרות מדפסת</div><div style="font-size:12px;color:#cbd5e1;margin-top:3px">הגדרות נשמרות קבוע בתוסף</div></div><button id="mfix-prn-close-165" style="border:0;background:#374151;color:white;border-radius:9px;padding:8px 12px;font-size:18px">✕</button></div>
   <div id="mfix-prn-status-165" style="margin-top:12px;padding:9px;border-radius:9px;background:#1f2937;color:#fbbf24;font-size:13px">טוען מדפסות…</div>
   <label style="display:block;margin-top:12px;font-weight:800">מדפסת קבועה</label><select id="mfix-prn-device-165" style="width:100%;margin-top:6px;padding:11px;border-radius:9px;border:1px solid #4b5563;background:#0b1220;color:white"><option value="">אוטומטי</option></select>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px"><label>רוחב נייר<select id="mfix-prn-paper-165" style="width:100%;margin-top:5px;padding:10px;border-radius:9px;background:#0b1220;color:white;border:1px solid #4b5563"><option value="80MM">80 מ״מ</option><option value="58MM">58 מ״מ</option><option value="AUTO">אוטומטי</option></select></label><label>התאמת גודל<select id="mfix-prn-fit-165" style="width:100%;margin-top:5px;padding:10px;border-radius:9px;background:#0b1220;color:white;border:1px solid #4b5563"><option value="NONE">100% / ללא הקטנה</option><option value="AUTO">התאמה אוטומטית</option><option value="FIT">התאם לדף</option></select></label></div>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px"><label>כיוון<select id="mfix-prn-orient-165" style="width:100%;margin-top:5px;padding:10px;border-radius:9px;background:#0b1220;color:white;border:1px solid #4b5563"><option value="PORTRAIT">אנכי</option><option value="LANDSCAPE">אופקי</option></select></label><label>עותקים<input id="mfix-prn-copies-165" type="number" min="1" max="9" value="1" style="width:100%;box-sizing:border-box;margin-top:5px;padding:10px;border-radius:9px;background:#0b1220;color:white;border:1px solid #4b5563"></label></div>
   <label style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;padding:12px;background:#1f2937;border-radius:10px"><span><b>✂️ חיתוך אוטומטי</b><br><small style="color:#cbd5e1">אם המדפסת/הדרייבר תומכים</small></span><input id="mfix-prn-cut-165" type="checkbox" style="width:22px;height:22px"></label>
   <div style="display:flex;gap:8px;margin-top:14px"><button id="mfix-prn-save-165" style="flex:1;border:0;border-radius:10px;padding:12px;background:#f59e0b;color:#111827;font-weight:1000">💾 שמור קבוע</button><button id="mfix-prn-test-165" style="flex:1;border:0;border-radius:10px;padding:12px;background:#0f766e;color:white;font-weight:1000">🧪 הדפסת ניסיון</button></div><div style="font-size:11px;color:#94a3b8;margin-top:10px">הערה: Chrome לא נותן פקודת CUT ישירה לכל מדפסת. האפשרות נשמרת והחיתוך תלוי בתמיכת המדפסת/הדרייבר.</div>`;
   document.documentElement.appendChild(box);
   const q=id=>box.querySelector(id), status=q('#mfix-prn-status-165');
   q('#mfix-prn-close-165').onclick=()=>box.remove();
   const send=(msg)=>new Promise(resolve=>chrome.runtime.sendMessage(msg,r=>resolve(chrome.runtime.lastError?{ok:false,error:chrome.runtime.lastError.message}:r||{ok:false,error:'אין תשובה'})));
   (async()=>{
     const r=await send({type:'MFIX_PRINT_1535_LIST'});
     if(!r?.ok){status.textContent='שגיאה בטעינת מדפסות: '+(r?.error||'לא ידוע');return}
     const current=r.settings||{},sel=q('#mfix-prn-device-165');
     (r.printers||[]).forEach(x=>{const o=document.createElement('option');o.value=x.printer.id;o.textContent=x.printer.name||x.printer.id;sel.appendChild(o)});
     sel.value=current.printerId||''; q('#mfix-prn-paper-165').value=current.paperMode||'80MM';q('#mfix-prn-fit-165').value=current.fit||'NONE';q('#mfix-prn-orient-165').value=current.orientation||'PORTRAIT';q('#mfix-prn-copies-165').value=current.copies||1;q('#mfix-prn-cut-165').checked=!!current.autoCut;
     status.textContent=(r.printers||[]).length?'✓ נמצאו '+r.printers.length+' מדפסות':'לא נמצאה מדפסת'; status.style.color='#86efac';
   })();
   const values=()=>({printerId:q('#mfix-prn-device-165').value,paperMode:q('#mfix-prn-paper-165').value,fit:q('#mfix-prn-fit-165').value,orientation:q('#mfix-prn-orient-165').value,copies:Math.max(1,Math.min(9,Number(q('#mfix-prn-copies-165').value||1))),autoCut:q('#mfix-prn-cut-165').checked});
   q('#mfix-prn-save-165').onclick=async()=>{const r=await send({type:'MFIX_PRINT_1535_SAVE',settings:values()});status.textContent=r?.ok?'✓ ההגדרות נשמרו קבוע':'שגיאה: '+(r?.error||'לא נשמר');status.style.color=r?.ok?'#86efac':'#fca5a5'};
   q('#mfix-prn-test-165').onclick=async()=>{status.textContent='שולח הדפסת ניסיון…';const r=await send({type:'MFIX_PRINT_1535_TEST',override:values()});status.textContent=r?.ok?'✓ נשלח למדפסת: '+(r.printer?.name||''):'שגיאה: '+(r?.error||'לא ידוע');status.style.color=r?.ok?'#86efac':'#fca5a5'};
 }


 async function mfixPosFinishSale810(){
   if(window.__mfixPosFinish810)return false;
   window.__mfixPosFinish810=true;
   try{
     // Keep the POS closed while YesInvoice performs the native issuance flow.
     window.__mfixPosSuspendUntil820=Date.now()+12000;
     document.getElementById('mfix-pos-800')?.remove();

     await sleep(250);

     // A document cannot be issued until the native registered customer is truly selected.
     const customerOk=await mfixPosEnsureWalkIn830();
     if(!customerOk){
       toast('לא נבחר ##לקוח מזדמן — עצרתי לפני הפקת המסמך',3600);
       window.__mfixPosSuspendUntil820=Date.now()+5000;
       return false;
     }

     // First choice: the exact learned "הפקת מסמך" control from the stable checkout flow.
     let issue=mfixFindLearnedIssue628();

     // If the learned selector is stale, find the native visible control by exact text.
     if(!issue){
       const controls=[...document.querySelectorAll(
         'button,a,input[type="button"],input[type="submit"],div.btn1,div.button,[role="button"],span'
       )].filter(e=>{
         if(!e.offsetParent)return false;
         const st=getComputedStyle(e),r=e.getBoundingClientRect();
         if(st.display==='none'||st.visibility==='hidden'||r.width<4||r.height<4)return false;
         if(e.closest('#mfix-pos-800,#mfix-next-step-450,#mfix-pro-panel-600'))return false;
         return normText(e.value||e.innerText||e.textContent||'')==='הפקת מסמך';
       });

       // Prefer an actual clickable parent if exact text is on a nested span/div.
       let raw=controls[0]||null;
       if(raw){
         issue=raw.closest('button,a,input[type="button"],input[type="submit"],div.btn1,div.button,[role="button"]')||raw;
       }
     }

     if(issue){
       // ONE click only. No retries, to avoid duplicate document issuance.
       try{
         clickNative(issue);
         toast('הפקת מסמך הופעלה ✓',1800);
       }catch(_){
         toast('לא הצלחתי ללחוץ על הפקת מסמך',2800);
         return false;
       }

       // Clear MFIX cart only after the issuance click was actually sent.
       try{sessionStorage.removeItem(MFIX_POS_CART_800)}catch(_){}
       // Stay on the native document/print screen. POS opens only when cashier presses POS.
       try{sessionStorage.removeItem(MFIX_POS_MODE_800)}catch(_){}
       window.__mfixPosSuspendUntil820=Date.now()+120000;
       return true;
     }

     // First-time / stale-selector fallback: invoke the already proven learner.
     toast('צריך ללמד פעם אחת את כפתור "הפקת מסמך"',2600);
     try{mfixLearnIssueDocument628()}catch(_){}
     // Do NOT reopen POS over the learner/native page.
     window.__mfixPosSuspendUntil820=Date.now()+15000;
     return false;
   }finally{
     setTimeout(()=>window.__mfixPosFinish810=false,1000);
   }
 }
 
 async function mfixFastWalkInForCredit1385(){
   const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
   const field=()=>document.querySelector('#nameofCustomer') ||
     [...document.querySelectorAll('input[placeholder*="שם לקוח"]')][0] || null;
   const isReady=()=>{
     const i=field();
     return !!i && norm(i.value).includes('לקוח מזדמן');
   };

   if(isReady())return true;

   let i=null;
   for(let n=0;n<18&&!i;n++){
     i=field();
     if(!i)await sleep(70);
   }
   if(!i)return false;

   // If YesInvoice temporarily left "1" in the customer field, replace it immediately.
   try{
     i.focus();
     const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
     if(setter)setter.call(i,'##לקוח מזדמן'); else i.value='##לקוח מזדמן';
     i.dispatchEvent(new Event('input',{bubbles:true}));
     i.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'ן'}));
   }catch(_){}

   // Pick the real registered customer object; text alone is not enough.
   let opt=null;
   for(let n=0;n<24&&!opt;n++){
     opt=[...document.querySelectorAll('span.sn1,div.sn1,li,div[role="option"],span[role="option"],ul.autocomplete li')]
       .find(e=>e.offsetParent!==null && norm(e.innerText||e.textContent)==='##לקוח מזדמן');
     if(!opt)await sleep(70);
   }
   if(!opt){
     // One native click can force YesInvoice to open its customer suggestions.
     try{clickNative(i)}catch(_){}
     for(let n=0;n<18&&!opt;n++){
       opt=[...document.querySelectorAll('span.sn1,div.sn1,li,div[role="option"],span[role="option"],ul.autocomplete li')]
         .find(e=>e.offsetParent!==null && norm(e.innerText||e.textContent).includes('לקוח מזדמן'));
       if(!opt)await sleep(70);
     }
   }
   if(!opt)return false;

   clickNative(opt);

   // Do not open credit until the native field itself confirms the customer.
   for(let n=0;n<28;n++){
     if(isReady())return true;
     await sleep(70);
   }
   return isReady();
 }

async function mfixPosStartPayment840(kind){
   // From payment onward stay in native YesInvoice until the cashier manually opens POS.
   try{sessionStorage.removeItem(MFIX_POS_MODE_800)}catch(_){}
   try{mfixPosArmReturnAfterIssue910()}catch(_){}

   // Hide POS FIRST so the real native customer field becomes visible.
   window.__mfixPosSuspendUntil820=Date.now()+120000;
   document.getElementById('mfix-pos-800')?.remove();

   const norm=v=>String(v||'').replace(/\s+/g,' ').trim();

   const selectExactWalkIn=async()=>{
     let input=null;
     for(let n=0;n<40&&!input;n++){
       const x=document.querySelector('#nameofCustomer');
       if(x && x.offsetParent!==null)input=x;
       if(!input)await sleep(80);
     }
     if(!input)return false;

     if(norm(input.value).includes('לקוח מזדמן'))return true;

     try{
       input.focus();
       const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
       if(setter)setter.call(input,''); else input.value='';
       input.dispatchEvent(new Event('input',{bubbles:true}));
       await sleep(80);

       if(setter)setter.call(input,'##לקוח מזדמן'); else input.value='##לקוח מזדמן';
       input.dispatchEvent(new Event('input',{bubbles:true}));
       input.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'ן'}));
     }catch(_){}

     let opt=null;
     for(let n=0;n<40&&!opt;n++){
       opt=[...document.querySelectorAll('span.sn1,div.sn1')]
         .find(e=>e.offsetParent!==null && norm(e.innerText||e.textContent)==='##לקוח מזדמן');
       if(!opt)await sleep(80);
     }

     if(!opt){
       try{clickNative(input)}catch(_){}
       for(let n=0;n<25&&!opt;n++){
         opt=[...document.querySelectorAll('span.sn1,div.sn1')]
           .find(e=>e.offsetParent!==null && norm(e.innerText||e.textContent).includes('לקוח מזדמן'));
         if(!opt)await sleep(80);
       }
     }

     if(!opt)return false;
     clickNative(opt);

     for(let n=0;n<35;n++){
       if(norm(document.querySelector('#nameofCustomer')?.value||'').includes('לקוח מזדמן'))return true;
       await sleep(80);
     }
     return false;
   };

   // IMPORTANT: customer selection happens only here, before payment UI exists.
   const okCustomer=await selectExactWalkIn();
   if(!okCustomer){
     toast('לא הצלחתי לבחור ##לקוח מזדמן — התשלום נעצר',3200);
     return false;
   }

   // Only now create/use the stable hidden payment bar.
   try{window.__mfixHeadlessQuick1060=true;showMfixNextStep()}catch(_){}

   const id=kind==='terminal'?'mfix-quick-card-490':'mfix-quick-cash-490';
   let btn=null;
   for(let n=0;n<35&&!btn;n++){
     btn=document.getElementById(id);
     if(!btn)await sleep(100);
   }
   if(!btn){
     toast(kind==='terminal'?'לא מצאתי את כפתור האשראי היציב':'לא מצאתי את כפתור המזומן היציב',2800);
     return false;
   }

   if(kind==='terminal'){
     // Preserve confirmed Z-Credit amount / number-of-payments handling.
     try{mfixArmTerminalAmount647()}catch(_){}
   }

   try{
     btn.click();
     return true;
   }catch(_){
     try{clickNative(btn);return true}catch(__){}
   }
   return false;
 }
 function mfixHideLegacyQuickBar1010(){
   try{
     document.getElementById('mfix-quickbar-restore-501')?.remove();
     const wrap=document.getElementById('mfix-next-step-450');
     if(wrap){
       // Do not remove: payment automation may be using its hidden buttons.
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
     }
     document.querySelectorAll('#mfix-quickbar-restore-501,#mfix-quick-bar,#mfix-quick-panel,#mfix-quick-490').forEach(el=>el.remove());
   }catch(_){}
 }

 let __mfixLegacyQuickWatch1030=null;
 function mfixWatchLegacyQuick1030(){
   if(__mfixLegacyQuickWatch1030)return;
   __mfixLegacyQuickWatch1030=setInterval(()=>{
     try{if(document.getElementById('mfix-pos-800'))mfixHideLegacyQuickBar1010()}catch(_){}
   },500);
 }

 function mfixPosOpen800(){
   if(document.getElementById('mfix-pos-800'))return;
   try{sessionStorage.setItem(MFIX_POS_MODE_800,'1')}catch(_){}

   const root=document.createElement('div');
   root.id='mfix-pos-800';root.dir='rtl';
   root.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#f4f6f8;font-family:Arial,sans-serif;color:#111827;display:flex;flex-direction:column;overflow:hidden;overscroll-behavior:contain;touch-action:manipulation';

   root.innerHTML=`<div style="height:78px;background:#0b0f14;color:white;display:flex;align-items:center;justify-content:space-between;padding:0 24px;box-sizing:border-box">
      <div style="display:flex;align-items:center;gap:14px;white-space:nowrap">
        <div style="font-size:30px;font-weight:1000;letter-spacing:1px">MFIX <span style="color:#2dd4bf">POS</span></div>
        <div style="height:32px;width:1px;background:#ffffff33"></div>
        <div>
          <div style="font-size:15px;font-weight:900">יש חשבונית</div>
          <div style="font-size:18px;font-weight:1000"><span id="mfix-pos-greeting-1250" style="color:#fbbf24">שלום</span> · <span id="mfix-pos-clock-1250" style="color:#5eead4;font-size:22px">--:--</span></div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;margin-right:auto;margin-left:18px">
        <div style="font-size:18px">סה״כ <b id="mfix-pos-top-total-1000" style="font-size:25px">₪0.00</b></div>
        <div id="mfix-pos-change-box-1000" style="display:none;background:#f59e0b;color:#111827;border-radius:12px;padding:8px 16px;font-weight:1000">💵 להחזיר <span id="mfix-pos-change-1000" style="font-size:27px">₪0</span></div>
      </div>
      <div style="display:flex;gap:12px;align-items:center"><span style="font-size:13px;color:#86efac">● יש חשבונית</span><span id="mfix-pos-net-1280" style="font-size:13px;color:#86efac">● אינטרנט</span><span id="mfix-pos-smartcart-1350" style="font-size:12px;color:#bfdbfe">0 פריטים</span><span id="mfix-pos-head-count-1280" style="font-size:13px;color:#bfdbfe">🛒 0</span><button id="mfix-pos-pricecheck-1350">🔎 בדיקת מחיר</button><button id="mfix-pos-sound-1290">🔊</button><button id="mfix-pos-settings-btn-800">⚙️</button><button id="mfix-pos-exit-800">יציאה</button></div>
   </div>
   <div style="flex:1;min-height:0;overflow:hidden;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(360px,.75fr);gap:14px;padding:14px">
     <section style="background:white;border-radius:18px;padding:10px;min-width:0;min-height:0;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 3px 14px #0001">
       <div style="display:grid;grid-template-columns:1fr 110px;gap:8px;flex:0 0 auto">
         <input id="mfix-pos-search-800" placeholder="חפש מוצר / סרוק ברקוד" style="height:48px;border:2px solid #e5e7eb;border-radius:12px;padding:0 14px;font-size:20px;outline:none">
         <button id="mfix-pos-general-800" style="height:48px;border:0;border-radius:12px;background:#14b8a6;color:white;font-size:15px;font-weight:900">מוצר כללי +</button>
       </div>
       <div style="height:25px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex:0 0 auto;padding:0 3px">
         <span id="mfix-pos-scan-state-1280" style="font-size:12px;font-weight:900;color:#86efac">● מוכן לסריקה</span>
         <span id="mfix-pos-last-1280" style="font-size:11px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">אחרון: —</span>
       </div>
       <div id="mfix-pos-search-history-1290" style="min-height:24px;display:flex;gap:5px;align-items:center;overflow:hidden"></div><div style="margin-top:7px;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:7px;flex:0 0 auto">
         <button id="mfix-pos-favs-big-1220" style="height:48px;border:0;border-radius:12px;background:#fff7ed;font-size:15px;font-weight:1000">⭐ מועדפים</button>
         <button id="mfix-pos-cats-big-1220" style="height:48px;border:0;border-radius:12px;background:#eef2ff;font-size:15px;font-weight:1000">📂 קטגוריות</button>
         <button id="mfix-pos-best-big-1220" style="height:48px;border:0;border-radius:12px;background:#fef2f2;font-size:15px;font-weight:1000">🔥 נמכרים ביותר</button>
         <button id="mfix-pos-recents-1290" style="height:48px;border:0;border-radius:12px;background:#ecfeff;font-size:15px;font-weight:1000">🕘 אחרונים</button>
       </div>
       <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:6px">
         <button id="mfix135-profit-btn" style="height:38px;border:0;border-radius:10px;background:#ecfdf5;font-weight:900">💰 רווח</button>
         <button id="mfix135-stock-btn" style="height:38px;border:0;border-radius:10px;background:#fff7ed;font-weight:900">⚠️ מלאי נמוך</button>
         <button id="mfix135-discount-btn" style="height:38px;border:0;border-radius:10px;background:#f5f3ff;font-weight:900">🏷️ הנחה מהירה</button>
       </div>
       <div id="mfix-pos-favs-1000" style="display:none"></div>
       <div id="mfix-pos-cats-1000" style="display:none"></div>
       <button id="mfix-pos-fav-help-1000" style="display:none">עריכה</button>
       <div id="mfix-pos-results-800" style="margin-top:5px;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;display:grid;align-content:start;grid-template-columns:repeat(3,minmax(165px,1fr));gap:9px;padding:2px 4px 14px 2px"></div>
     </section>
     <aside style="background:white;border-radius:20px;padding:16px;display:flex;flex-direction:column;box-shadow:0 3px 14px #0001;min-height:0;overflow:hidden">
       <div style="font-size:27px;font-weight:1000">🛒 סל מכירה</div>

       <div style="margin-top:7px;padding:8px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;flex:0 0 auto">
         <div id="mfix-pos-customer-badge-1290" style="font-weight:1000;margin-bottom:4px;font-size:13px;color:#0f766e">👤 לקוח מזדמן</div><div style="font-weight:900;margin-bottom:5px;font-size:13px">פרטי לקוח <span style="font-weight:500;color:#64748b">· ריק = ##לקוח מזדמן</span></div>
         <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
           <input id="mfix-pos-customer-name-900" placeholder="שם על המסמך" style="width:100%;box-sizing:border-box;height:36px;border:1px solid #d1d5db;border-radius:9px;padding:0 9px;font-size:13px">
           <input id="mfix-pos-customer-phone-900" placeholder="טלפון נייד" inputmode="tel" style="width:100%;box-sizing:border-box;height:36px;border:1px solid #d1d5db;border-radius:9px;padding:0 9px;font-size:13px">
         </div>
         <input id="mfix-pos-sale-note-1310" placeholder="📝 הערה למכירה (נשמרת ב-POS)" style="width:100%;box-sizing:border-box;height:34px;margin-top:6px;border:1px solid #d1d5db;border-radius:9px;padding:0 9px;font-size:12px">
       </div>

       <div style="margin-top:8px;flex:0 0 auto">
         <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
           <b style="font-size:14px">🧾 פריטים במכירה</b>
           <span id="mfix-pos-items-count-1080" style="font-size:12px;color:#64748b">0 פריטים</span>
         </div>
         <div id="mfix-pos-cart-800" style="height:70px;min-height:70px;max-height:70px;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;padding:0 4px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc"></div>
       </div>

       <div style="border-top:2px solid #e5e7eb;padding-top:12px">
         <div style="font-size:14px;color:#6b7280;text-align:center">סה״כ</div>
         <div id="mfix-pos-total-800" style="font-size:39px;font-weight:1000;color:#0f9f9a;text-align:center;margin:1px 0 7px">₪0.00</div>
         <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
           <button id="mfix-pos-cash-1000" style="height:54px;border:0;border-radius:14px;background:#16a34a;color:white;font-size:20px;font-weight:1000">💵 מזומן</button>
           <button id="mfix-pos-card-1000" style="height:54px;border:0;border-radius:14px;background:#2563eb;color:white;font-size:20px;font-weight:1000">💳 אשראי</button>
         </div>
         <div id="mfix-pos-daily-1290" style="text-align:center;font-size:11px;color:#64748b;margin-top:6px">הועברו לתשלום היום: 0 · ₪0</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-top:5px"><button id="mfix-pos-new-sale-1290" style="height:36px;border:0;border-radius:10px;background:#0f766e;color:white;font-size:12px;font-weight:900">🧹 מכירה חדשה</button><button id="mfix-pos-price-edit-1365" style="height:36px;border:0;border-radius:10px;background:#7c3aed;color:white;font-size:12px;font-weight:900">🏷️ הנחה / סה״כ (ידני)</button><button id="mfix-pos-price-learn-1373" style="height:36px;border:0;border-radius:10px;background:#b45309;color:white;font-size:12px;font-weight:900">✏️ שינוי מחיר מוצר</button><button id="mfix-pos-continue-900" style="height:36px;border:0;border-radius:10px;background:#334155;color:white;font-size:12px;font-weight:900">המשך ידנית</button></div>
       </div>
     </aside>
   </div>`;

   document.documentElement.appendChild(root);
   const mfixHeaderClock1250=()=>{
     const d=new Date(),h=d.getHours();
     const greet=h>=5&&h<12?'בוקר טוב':h>=12&&h<17?'צהריים טובים':h>=17&&h<22?'ערב טוב':'לילה טוב';
     const g=root.querySelector('#mfix-pos-greeting-1250'),c=root.querySelector('#mfix-pos-clock-1250');
     if(g)g.textContent=greet;
     if(c)c.textContent=d.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit',hour12:false});
   };
   mfixHeaderClock1250();
   mfixInternet1280();
   window.addEventListener('online',mfixInternet1280,{once:true});window.addEventListener('offline',mfixInternet1280,{once:true});
   try{const la=JSON.parse(localStorage.getItem(MFIX_LAST_ADDED_1280)||'null');const le=root.querySelector('#mfix-pos-last-1280');if(la?.name&&le)le.textContent='אחרון: '+la.name}catch(_){}

   const mfixClockTimer1250=setInterval(()=>{if(!document.getElementById('mfix-pos-800')){clearInterval(mfixClockTimer1250);return}mfixHeaderClock1250();mfix129HeaderMeta()},1000);mfix129HeaderMeta();mfix129RenderSearchHistory();mfix129RenderDaily();mfix129CustomerBadge();mfix129ApplyTheme();root.querySelector('#mfix-pos-recents-1290').onclick=()=>{let a=[];try{a=JSON.parse(localStorage.getItem(MFIX129_RECENTS)||'[]')}catch(_){}mfix129ShowShelf('🕘 מוצרים אחרונים',a)};root.querySelector('#mfix135-profit-btn').onclick=mfix135ProfitPanel;root.querySelector('#mfix135-stock-btn').onclick=mfix135LowStock;root.querySelector('#mfix135-discount-btn').onclick=mfix135DiscountBox;root.querySelector('#mfix-pos-sound-1290').onclick=()=>{const st=mfix129SettingsGet();st.sound=!st.sound;mfix129SettingsSet(st);root.querySelector('#mfix-pos-sound-1290').textContent=st.sound?'🔊':'🔇'};root.querySelector('#mfix-pos-sound-1290').textContent=mfix129SettingsGet().sound?'🔊':'🔇';const pc135=root.querySelector('#mfix-pos-pricecheck-1350'),updpc135=()=>{const on=localStorage.getItem(MFIX135_PRICECHECK)==='1';pc135.textContent=on?'🔎 בדיקת מחיר: פעיל':'🔎 בדיקת מחיר';pc135.style.background=on?'#7c3aed':'#ffffff10'};updpc135();pc135.onclick=()=>{localStorage.setItem(MFIX135_PRICECHECK,localStorage.getItem(MFIX135_PRICECHECK)==='1'?'0':'1');updpc135()};
   [...root.querySelectorAll('#mfix-pos-settings-btn-800,#mfix-pos-exit-800,#mfix-pos-sound-1290,#mfix-pos-pricecheck-1350')].forEach(b=>b.style.cssText='height:42px;padding:0 16px;border:1px solid #ffffff33;border-radius:10px;background:#ffffff10;color:white;font-weight:900');

   const search=root.querySelector('#mfix-pos-search-800');
   const results=root.querySelector('#mfix-pos-results-800');
   search.addEventListener('change',()=>mfix129RememberSearch(search.value));
   let timer=null,seq=0;

   const render=items=>{
     results.innerHTML='';
     if(!items.length){
       results.innerHTML='<div style="grid-column:1/-1;text-align:center;color:#9ca3af;padding:30px;font-size:20px">לא נמצאו מוצרים</div>';
       return;
     }
     items.forEach(product=>{
       const card=document.createElement('button');
       const nm=productTitle(product,'');
       const price=Number(product?.Price||0);
       const st=stock(product);
       const initialCost=mfix131Cost(product);
       const costId='mfix-card-cost-'+Math.random().toString(36).slice(2,9);
       card.style.cssText='height:154px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:11px;text-align:right;box-shadow:0 2px 8px #0000000a;cursor:pointer;font-family:Arial;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box';
       card.innerHTML=`<div style="font-size:var(--mfix-pos-card-font,17px);font-weight:1000;line-height:1.15;height:39px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${esc(nm)}</div>
         <div style="margin-top:3px;color:#6b7280;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(String(product?.Barcode||product?.Name||''))}</div>
         <div style="display:flex;align-items:end;justify-content:space-between;gap:5px;margin-top:4px">
           <div>
             <div style="font-size:22px;font-weight:1000;color:#0f9f9a">₪${price.toLocaleString('he-IL',{maximumFractionDigits:2})}</div>
             <div id="${costId}" style="font-size:11px;font-weight:900;color:#7c3aed;margin-top:1px">${initialCost!==null?'עלות: ₪'+initialCost.toLocaleString('he-IL',{maximumFractionDigits:2}):'עלות: …'}</div>
           </div>
           <div style="font-size:11px;font-weight:800;color:${Number(st)<=0?'#dc2626':Number(st)<=2?'#f59e0b':'#16a34a'}">מלאי: ${esc(String(st??''))}</div>
         </div>`;

       // If search results do not include the purchase cost, fetch the native product detail once.
       if(initialCost===null){
         const id=Number(product?.ID??product?.Id??product?.id);
         if(id){
           try{
             chrome.runtime.sendMessage({type:'MFIX_PRODUCT_DETAIL_509',id},res=>{
               const el=document.getElementById(costId);
               if(!el)return;
               const c=res?.ok?mfix131Cost(res.product):null;
               el.textContent=c!==null?'עלות: ₪'+c.toLocaleString('he-IL',{maximumFractionDigits:2}):'עלות: לא זמינה';
               if(c===null)el.style.color='#94a3b8';
             });
           }catch(_){
             const el=document.getElementById(costId);
             if(el){el.textContent='עלות: לא זמינה';el.style.color='#94a3b8'}
           }
         }else{
           const el=document.getElementById(costId);
           if(el){el.textContent='עלות: לא זמינה';el.style.color='#94a3b8'}
         }
       }
       const actions=document.createElement('div');
       actions.style.cssText='display:grid;grid-template-columns:1fr 42px 42px;gap:6px;margin-top:auto;padding-top:6px;flex:0 0 auto';
       const addBtn=document.createElement('button');
       addBtn.textContent='הוסף';
       addBtn.style.cssText='height:38px;border:0;border-radius:9px;background:#0f172a;color:white;font-weight:900;font-size:14px';
       const favBtn=document.createElement('button');
       favBtn.textContent='⭐';
       favBtn.title='מועדפים';
       favBtn.style.cssText='height:38px;border:0;border-radius:9px;background:#fff7ed;font-size:19px';
       const catBtn=document.createElement('button');
       catBtn.textContent='📂';
       catBtn.title='קטגוריה';
       catBtn.style.cssText='height:38px;border:0;border-radius:9px;background:#eef2ff;font-size:19px';
       actions.append(addBtn,favBtn,catBtn);
       card.appendChild(actions);

       const addProduct=async()=>{
         if(!mfixConfirmExpensive1280(product))return;
         addBtn.disabled=true;addBtn.style.opacity='.72';
         const oldText=addBtn.textContent;addBtn.textContent='מוסיף…';mfixScannerState1280('⏳ מעבד…',true);
         const slowTimer=setTimeout(()=>mfixSlow1280(product),4000);
         mfixPosProgress1270('start',product);
         setTimeout(()=>{if(document.getElementById('mfix-pos-progress-1270'))mfixPosProgress1270('find',product)},180);
         setTimeout(()=>{if(document.getElementById('mfix-pos-progress-1270'))mfixPosProgress1270('invoice',product)},650);
         setTimeout(()=>{if(document.getElementById('mfix-pos-progress-1270'))mfixPosProgress1270('wait',product)},1300);
         const ok=await mfixPosAddProduct800(product);
         clearTimeout(slowTimer);mfixPosAddNotice1260(!!ok,product);
         if(ok){
           setTimeout(()=>{if(document.getElementById('mfix-pos-800')){search.value='';results.innerHTML='';search.focus()}},250);
         }else{
           addBtn.disabled=false;addBtn.style.opacity='1';addBtn.textContent=oldText||'הוסף';
         }
       };

       addBtn.onclick=(e)=>{e.stopPropagation();addProduct()};
       card.onclick=(e)=>{
         if(e.target===addBtn||e.target===favBtn||e.target===catBtn)return;
         addProduct();
       };

       favBtn.onclick=(e)=>{
         e.stopPropagation();
         const a=mfixPosFavsGet1000(), k=mfixPosProdKey1000(product);
         const i=a.findIndex(x=>mfixPosProdKey1000(x)===k);
         if(i>=0){
           a.splice(i,1);mfixPosFavsSet1000(a);toast('הוסר מהמועדפים',1300);
         }else{
           a.push(mfixPosSlim1000(product));mfixPosFavsSet1000(a);toast('נוסף למועדפים ⭐',1300);
         }
         renderNav1000();
       };

       catBtn.onclick=(e)=>{
         e.stopPropagation();
         const cats=mfixPosCatsGet1000();
         if(!cats.length){toast('צור קודם קטגוריה דרך ⚙️',1900);return}
         const old=document.getElementById('mfix-pos-cat-pick-1010'); if(old)old.remove();
         const ov=document.createElement('div');ov.id='mfix-pos-cat-pick-1010';ov.dir='rtl';
         ov.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0008;display:flex;align-items:center;justify-content:center;font-family:Arial';
         ov.innerHTML=`<div style="width:min(440px,90vw);background:#fff;border-radius:18px;padding:18px">
           <div style="font-size:20px;font-weight:1000;margin-bottom:12px">שייך לקטגוריה</div>
           <div id="mfix-pos-cat-list-1010" style="display:grid;gap:8px"></div>
           <button id="mfix-pos-cat-close-1010" style="width:100%;height:44px;margin-top:10px;border:0;border-radius:10px;background:#111827;color:#fff;font-weight:900">סגור</button>
         </div>`;
         document.documentElement.appendChild(ov);
         const list=ov.querySelector('#mfix-pos-cat-list-1010');
         cats.forEach(c=>{
           const b=document.createElement('button');
           b.textContent=c.name;
           b.style.cssText='height:48px;border:0;border-radius:10px;background:#e2e8f0;font-weight:900;font-size:16px';
           b.onclick=()=>{
             const all=mfixPosCatsGet1000(), target=all.find(x=>x.id===c.id);
             if(!target)return;
             target.products=Array.isArray(target.products)?target.products:[];
             const k=mfixPosProdKey1000(product);
             if(!target.products.some(x=>mfixPosProdKey1000(x)===k))target.products.push(mfixPosSlim1000(product));
             mfixPosCatsSet1000(all);
             toast('נוסף לקטגוריה '+c.name,1500);
             ov.remove();renderNav1000();

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


       b.textContent='עכשיו לחץ על "סליקה" של המסופון';
       b.style.background='#c1121f';

       const capture=ev=>{
         const t=ev.target instanceof Element ? ev.target : null;
         if(!t || t===b || b.contains(t)) return;

         let chosen=t;
         // Prefer the actual clickable ancestor.
         let p=t;
         for(let i=0;i<6&&p;i++,p=p.parentElement){
           const tag=(p.tagName||'').toLowerCase();
           const role=p.getAttribute?.('role')||'';
           if(tag==='button'||tag==='a'||tag==='input'||role==='button'){
             chosen=p; break;
           }
         }

         const sel=mfixUniqueSelector495(chosen);
         const txt=String(chosen.value||chosen.innerText||chosen.textContent||'').replace(/\s+/g,' ').trim();

         try{
           localStorage.setItem('mfixTerminalSelector495',sel);
           localStorage.setItem('mfixTerminalText495',txt);
         }catch(_){}

         document.removeEventListener('click',capture,true);
         b.textContent='✓ כפתור סליקה נלמד';
         b.style.background='#087f5b';

         try{toast('כפתור הסליקה נשמר. מעכשיו "אשראי במסוף" ישתמש בו.',2800)}catch(_){}

         // Let the user's original click continue normally.
         setTimeout(()=>{ b.textContent='🎯 למד כפתור סליקה'; b.style.background='#7b2cbf'; },2500);
       };

       document.addEventListener('click',capture,true);
     };

     document.documentElement.appendChild(b);
   }

   function mfixClickLearnedTerminal495(){
     let sel='',txt='';
     try{
       sel=localStorage.getItem('mfixTerminalSelector495')||'';
       txt=localStorage.getItem('mfixTerminalText495')||'';
     }catch(_){}

     let el=null;
     if(sel){
       try{el=document.querySelector(sel)}catch(_){}
     }

     // Fallback if DOM structure shifts: use learned text among visible controls.
     if(!el && txt){
       const vis=e=>{
         if(!e || !(e instanceof Element))return false;
         const st=getComputedStyle(e),r=e.getBoundingClientRect();
         return st.display!=='none'&&st.visibility!=='hidden'&&r.width>4&&r.height>4;
       };
       const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
       el=[...document.querySelectorAll('button,a,input,[role="button"],div,span')]
         .filter(vis)
         .find(e=>norm(e.value||e.innerText||e.textContent)===txt);
     }

     if(!el)return false;

     try{
       el.scrollIntoView({block:'center',inline:'nearest'});
       el.click();
       return true;
     }catch(_){
       try{
         el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,composed:true,view:window}));
         return true;
       }catch(__){return false}
     }
   }

   async function mfixOpenNativeTerminal491(){
     const sleep=ms=>new Promise(r=>setTimeout(r,ms));
     const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
     const visible=e=>{
       if(!e || !(e instanceof Element))return false;
       const st=getComputedStyle(e),r=e.getBoundingClientRect();
       return st.display!=='none'&&st.visibility!=='hidden'&&r.width>4&&r.height>4;
     };
     const clickReal=e=>{
       if(!e)return false;
       try{
         e.scrollIntoView({block:'center',inline:'center'});
         for(const type of ['pointerdown','mousedown','pointerup','mouseup','click']){
           const C=type.startsWith('pointer')&&window.PointerEvent?PointerEvent:MouseEvent;
           e.dispatchEvent(new C(type,{bubbles:true,cancelable:true,composed:true,view:window}));
         }
         return true;
       }catch(_){try{e.click();return true}catch(__){return false}}
     };

     // If the Z-Credit terminal card is already visible, select that exact card.
     async function selectTerminalCard(){
       const all=[...document.querySelectorAll('body *')].filter(visible);
       const textNodes=all.filter(e=>{
         const t=norm(e.innerText||e.textContent);
         return t && (/מסופון/.test(t) || /48803491/.test(t));
       });

       // Prefer the smallest visible element containing the terminal identifier.
       textNodes.sort((a,b)=>{
         const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
         return (ar.width*ar.height)-(br.width*br.height);
       });

       for(const hit of textNodes){
         let card=hit;
         for(let i=0;i<7 && card;i++,card=card.parentElement){
           const txt=norm(card.innerText||card.textContent);
           if(!(/מסופון/.test(txt)||/48803491/.test(txt))) continue;

           // Click the radio/input inside the same terminal card if available.
           const radio=[...card.querySelectorAll('input[type="radio"],input[type="checkbox"],[role="radio"],.radio')]
             .find(visible);
           if(radio){
             clickReal(radio);
             await sleep(250);
             return true;
           }

           // Otherwise click the compact card itself.
           const r=card.getBoundingClientRect();
           if(r.width>120 && r.height>50 && r.height<450){
             clickReal(card);
             await sleep(250);
             return true;
           }
         }
       }
       return false;
     }

     // If chooser/modal isn't open yet, use the native credit/terminal control to open it.
     const bodyText=norm(document.body.innerText);
     if(!(/מסופון/.test(bodyText) || /48803491/.test(bodyText))){
       const controls=[...document.querySelectorAll('button,a,input,[role="button"],div')].filter(visible);
       let opener=controls.find(e=>{
         const t=norm(e.value||e.innerText||e.textContent);
         return /אשראי/.test(t) && (/סליקה/.test(t)||/במקום/.test(t)||/מסוף/.test(t));
       });
       if(!opener){
         opener=controls.find(e=>norm(e.value||e.innerText||e.textContent)==='אשראי');
       }
       if(opener){
         clickReal(opener);
         await sleep(700);
       }
     }

     const selected=await selectTerminalCard();
     if(!selected){
       try{toast('לא מצאתי את כרטיס המסופון Z-CREDIT',2500)}catch(_){}
       return false;
     }

     // After terminal card is selected, click the native "סליקה" action.
     await sleep(350);
     const controls=[...document.querySelectorAll('button,a,input,[role="button"],div,span')].filter(visible);
     let charge=controls.filter(e=>{
       const t=norm(e.value||e.innerText||e.textContent);
       return t==='סליקה' || /^סליקה\s*$/.test(t);
     }).sort((a,b)=>{
       const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
       return (ar.width*ar.height)-(br.width*br.height);
     })[0];

     if(charge){
       clickReal(charge);
       try{toast('נשלחה פקודת סליקה למסופון',1800)}catch(_){}
       return true;
     }

     // Some layouts continue automatically after choosing the terminal.
     try{toast('המסופון נבחר — ממתין לסליקה',1800)}catch(_){}
     return true;
   }

   function mfixWaitForTerminalApproval4811(){
     // Credit should use YesInvoice's native terminal flow.
     // We only save the receipt row after the page reports a successful transaction.
     try{window.__mfixTerminalObserver4811?.disconnect?.()}catch(_){}
     const successRe=/(עסקה\s*אושרה|העסקה\s*בוצעה\s*בהצלחה|התשלום\s*בוצע\s*בהצלחה|סליקה\s*בוצעה\s*בהצלחה|אושר\s*בהצלחה)/i;
     let done=false;
     const check=async()=>{
       if(done)return;
       const txt=String(document.body?.innerText||'').replace(/\s+/g,' ');
       if(successRe.test(txt)){
         done=true;
         try{window.__mfixTerminalObserver4811?.disconnect?.()}catch(_){}
         try{toast('האשראי אושר — שומר תקבול…',1800)}catch(_){}
         await new Promise(r=>setTimeout(r,450));
         await mfixSavePaymentRow471();
       }
     };
     const mo=new MutationObserver(()=>check());
     window.__mfixTerminalObserver4811=mo;
     mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
     setTimeout(()=>{
       if(!done){
         try{mo.disconnect()}catch(_){}
         if(window.__mfixTerminalObserver4811===mo) window.__mfixTerminalObserver4811=null;
       }
     },120000);
     check();
   }


   let mfixCashGiven624=0;
   let mfixNativeCashAmount635=0;
   let mfixInvoiceTotalSnapshot643=0;

   function mfixExactInvoiceTotal643(){
     const vis=e=>{
       if(!e||!(e instanceof Element))return false;
       const st=getComputedStyle(e),r=e.getBoundingClientRect();
       return st.display!=='none'&&st.visibility!=='hidden'&&r.width>3&&r.height>3;
     };
     const txt=e=>String(e?.innerText||e?.textContent||'').replace(/\s+/g,' ').trim();
     const excluded=e=>!!e.closest?.(
       '#mfix-change-popup-624,#mfix-next-step-450,#mfix-pro-panel-600,#mfixSmartPay469,'+
       '#mfix-cart-panel-640,#mfix-cart-progress-642,#mfix-general-product-639,'+
       'div.pop1,div.pop2,[role="dialog"],.modal,.popup'
     );

     // 1) Strongest source: visible native "סה״כ לתשלום" label and its local container.
     const labels=[...document.querySelectorAll('div,span,strong,b,label,td')].filter(e=>{
       if(!vis(e)||excluded(e))return false;
       const t=txt(e);
       return /^סה["״']?כ\s+לתשלום$/.test(t) || t==='סהכ לתשלום';
     });

     for(const label of labels){
       const scopes=[label.parentElement,label.parentElement?.parentElement,label.closest('div')].filter(Boolean);
       for(const scope of scopes){
         if(excluded(scope))continue;
         const t=txt(scope);
         // Prefer explicit ₪ amount in the same small area.
         const vals=[...t.matchAll(/₪\s*([\d,]+(?:\.\d+)?)/g)]
           .map(m=>parseMoney(m[1])).filter(v=>v>=0);
         if(vals.length){
           const v=vals[vals.length-1];
           if(v>0)return Math.round((v+Number.EPSILON)*100)/100;
         }

         // Some YesInvoice layouts put the number in a sibling cell with no ₪.
         const siblings=[...(scope.parentElement?.children||[])];
         for(const sib of siblings){
           if(!vis(sib)||excluded(sib))continue;
           const st=txt(sib);
           if(st.length>40)continue;
           const m=st.match(/^₪?\s*([\d,]+(?:\.\d+)?)\s*$/);
           if(m){
             const v=parseMoney(m[1]);
             if(v>0)return Math.round((v+Number.EPSILON)*100)/100;
           }
         }
       }
     }

     // 2) Sum native invoice line totals. This is still from the actual invoice DOM.
     const rows=[...document.querySelectorAll(
       'div.servicesdesk div.lines div.grid-receipt div.item, div.lines div.grid-receipt div.item'
     )].filter(r=>vis(r)&&!excluded(r));
     let sum=0, found=0;
     for(const row of rows){
       const t=txt(row);
       if(!t.includes('מחיר ליחידה')&&!t.includes('כמות'))continue;
       const ms=[...t.matchAll(/סה["״']?כ\s*[:\-]?\s*₪?\s*([\d,]+(?:\.\d+)?)/g)];
       if(!ms.length)continue;
       const v=parseMoney(ms[ms.length-1][1]);
       if(v>=0){sum+=v;found++}
     }
     if(found && sum>0)return Math.round((sum+Number.EPSILON)*100)/100;

     return 0;
   }

   function mfixCaptureInvoiceTotal643(){
     const v=Number(mfixExactInvoiceTotal643()||0);
     mfixInvoiceTotalSnapshot643=v>0?v:0;
     return mfixInvoiceTotalSnapshot643;
   }


   async function mfixResolveFinalTotal636(){
     // Safety rule: never guess from payment/confirmation dialogs.
     // They contain dates, receipt amounts and other numbers that caused wrong change.
     // Use only the real invoice total captured before payment, or the live invoice DOM.
     if(mfixInvoiceTotalSnapshot643>0)return mfixInvoiceTotalSnapshot643;

     for(let n=0;n<20;n++){
       const v=Number(mfixExactInvoiceTotal643()||0);
       if(v>0){
         mfixInvoiceTotalSnapshot643=v;
         return v;
       }
       await sleep(100);
     }
     return 0;
   }

   async function mfixShowCorrectChangeAfterSave636(){
     try{
       const total=Number(await mfixResolveFinalTotal636());
       if(!(total>0)){
         toast('⚠️ לא הצלחתי לאמת את סה״כ החשבונית — לא מציג עודף כדי למנוע טעות',5000);
         return;
       }
       if(mfixCashGiven624>=total){
         mfixShowChangePopup624(total,mfixCashGiven624);
       }else{
         toast('⚠️ התקבל פחות מהסכום לתשלום',3200);
       }
     }catch(_){}
   }


   const MFIX_CASH_SELECTOR_626='mfixCashSelector626';

   const MFIX_ISSUE_SELECTOR_628='mfixIssueDocumentSelector628';

   function mfixFindLearnedIssue628(){
     try{
       const sel=localStorage.getItem(MFIX_ISSUE_SELECTOR_628)||'';
       if(!sel)return null;
       const el=document.querySelector(sel);
       if(el && el.offsetParent!==null)return el;
     }catch(_){}
     return null;
   }

   function mfixLearnIssueDocument628(){
     if(window.__mfixIssueLearning628)return;
     window.__mfixIssueLearning628=true;

     document.getElementById('mfix-issue-learn-628')?.remove();
     const note=document.createElement('div');
     note.id='mfix-issue-learn-628';
     note.textContent='🎯 לחץ עכשיו פעם אחת על "הפקת מסמך" של יש חשבונית';
     note.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147483647;background:#7c2d12;color:#fff;padding:13px 18px;border-radius:13px;font:bold 17px Arial;direction:rtl;box-shadow:0 5px 18px #0008;pointer-events:none';
     document.documentElement.appendChild(note);

     const capture=ev=>{
       const target=ev.target instanceof Element?ev.target:null;
       if(!target)return;

       let chosen=target;
       for(let i=0,p=target;i<7&&p;i++,p=p.parentElement){
         const tag=(p.tagName||'').toLowerCase(),role=p.getAttribute?.('role')||'';
         if(tag==='button'||tag==='a'||tag==='input'||role==='button'){chosen=p;break}
       }

       const txt=String(chosen.value||chosen.innerText||chosen.textContent||chosen.getAttribute?.('aria-label')||'').replace(/\s+/g,' ').trim();
       if(txt!=='הפקת מסמך')return;

       try{localStorage.setItem(MFIX_ISSUE_SELECTOR_628,mfixUniqueSelector626(chosen))}catch(_){}
       document.removeEventListener('click',capture,true);
       note.textContent='✓ כפתור הפקת מסמך נלמד';
       note.style.background='#047857';
       setTimeout(()=>note.remove(),1300);
       window.__mfixIssueLearning628=false;
       // Do not block the user's native click on the first learning run.
     };
     document.addEventListener('click',capture,true);
   }

   async function mfixContinueIssueAfterManualSave628(){
     // Wait for the cash dialog to close / document action area to settle.
     await sleep(700);

     const learned=mfixFindLearnedIssue628();
     if(learned){
       // ONE native click only. No retry, to avoid duplicate document issuance.
       try{
         clickNative(learned);
         toast('הפקת מסמך הופעלה ✓',1600);
       }catch(_){}
       return;
     }

     toast('פעם ראשונה: למד אותי איפה "הפקת מסמך"',2600);
     mfixLearnIssueDocument628();
   }



   function mfixUniqueSelector626(el){
     if(!el || !(el instanceof Element))return '';
     if(el.id)return '#'+CSS.escape(el.id);
     const parts=[];
     let cur=el;
     for(let depth=0;cur&&cur.nodeType===1&&depth<7;depth++,cur=cur.parentElement){
       let part=(cur.tagName||'').toLowerCase();
       const cls=[...cur.classList].filter(c=>c&&!/\d{5,}/.test(c)).slice(0,2);
       if(cls.length)part+='.'+cls.map(c=>CSS.escape(c)).join('.');
       const par=cur.parentElement;
       if(par){
         const same=[...par.children].filter(x=>x.tagName===cur.tagName);
         if(same.length>1)part+=`:nth-of-type(${same.indexOf(cur)+1})`;
       }
       parts.unshift(part);
       const test=parts.join(' > ');
       try{if(document.querySelectorAll(test).length===1)return test}catch(_){}
     }
     return parts.join(' > ');
   }

   function mfixLearnCashClick626(payDialog){
     return new Promise(resolve=>{
       document.getElementById('mfix-cash-learn-626')?.remove();
       const note=document.createElement('div');
       note.id='mfix-cash-learn-626';
       note.textContent='🎯 לחץ עכשיו פעם אחת על "מזומן" של יש חשבונית';
       note.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147483647;background:#7c2d12;color:#fff;padding:13px 18px;border-radius:13px;font:bold 17px Arial;direction:rtl;box-shadow:0 5px 18px #0008;pointer-events:none';
       document.documentElement.appendChild(note);

       const capture=ev=>{
         const target=ev.target instanceof Element?ev.target:null;
         if(!target || !payDialog.contains(target))return;

         let chosen=target;
         for(let i=0,p=target;i<7&&p;i++,p=p.parentElement){
           const tag=(p.tagName||'').toLowerCase(),role=p.getAttribute?.('role')||'';
           if(tag==='button'||tag==='a'||tag==='input'||tag==='label'||role==='button'||role==='radio'){
             chosen=p;break;
           }
         }

         const txt=String(chosen.value||chosen.innerText||chosen.textContent||chosen.getAttribute?.('aria-label')||'').replace(/\s+/g,' ').trim();
         if(txt!=='מזומן')return;

         try{localStorage.setItem(MFIX_CASH_SELECTOR_626,mfixUniqueSelector626(chosen))}catch(_){}
         document.removeEventListener('click',capture,true);
         note.textContent='✓ כפתור מזומן נלמד';
         note.style.background='#047857';
         setTimeout(()=>note.remove(),1300);
         // Do not block the click. YesInvoice receives the user's native click.
         resolve(true);
       };
       document.addEventListener('click',capture,true);
     });
   }

   function mfixFindLearnedCash626(payDialog){
     try{
       const sel=localStorage.getItem(MFIX_CASH_SELECTOR_626)||'';
       if(sel){
         const el=document.querySelector(sel);
         if(el && payDialog.contains(el) && el.offsetParent!==null)return el;
       }
     }catch(_){}
     return null;
   }



   function mfixShowChangePopup624(total,given){
     const change=Math.max(0,Number(given||0)-Number(total||0));
     if(!Number.isFinite(change)||change<=0)return;
     document.getElementById('mfix-change-popup-624')?.remove();

     const box=document.createElement('div');
     box.id='mfix-change-popup-624';
     box.style.cssText='position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:2147483647;min-width:360px;max-width:78vw;height:48px;background:#052e2b;color:#fff;border:1px solid #34d399;border-radius:12px;padding:0 16px;display:flex;align-items:center;justify-content:center;gap:12px;font-family:Arial,sans-serif;direction:rtl;box-shadow:0 7px 22px #0007;pointer-events:none';
     box.innerHTML=`<span style="font-size:14px;color:#a7f3d0">הלקוח נתן ₪${Number(given).toLocaleString('he-IL',{maximumFractionDigits:2})}</span><b style="font-size:18px">עודף להחזיר:</b><strong style="font-size:28px;color:#6ee7b7">₪${Number(change).toLocaleString('he-IL',{maximumFractionDigits:2})}</strong>`;
     document.documentElement.appendChild(box);
     setTimeout(()=>box.remove(),12000);
   }

   function mfixAskCashGiven624(){
     return new Promise(resolve=>{
       // POS 13.2 already collected the cash amount in the single green dialog.
       // Consume it once and skip the legacy second cash dialog entirely.
       const fromPos=Number(window.__mfixCashGivenFromPos1320||0);
       if(fromPos>0){window.__mfixCashGivenFromPos1320=0;resolve(fromPos);return}
       if(!mfixSettings600().showChange){resolve(0);return}

       document.getElementById('mfix-cash-given-624')?.remove();
       const total=Number(mfixInvoiceTotalSnapshot643||mfixCaptureInvoiceTotal643()||0);
       const shade=document.createElement('div');
       shade.id='mfix-cash-given-624';
       shade.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0008;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;direction:rtl';

       const card=document.createElement('div');
       card.style.cssText='width:min(92vw,470px);max-height:92vh;overflow:auto;background:#0f172a;color:#fff;border-radius:22px;padding:14px 18px 16px;box-shadow:0 18px 55px #0009;box-sizing:border-box';
       card.innerHTML=`<div style="position:sticky;top:-14px;z-index:4;display:flex;justify-content:space-between;align-items:center;background:#0f172a;padding:8px 0">
           <b style="font-size:22px">💵 מזומן</b>
           <button id="mcg-close" style="height:40px;padding:0 13px;border:1px solid #64748b;border-radius:10px;background:#1f2937;color:white;font-size:14px;font-weight:1000">✕ ביטול / חזרה</button>
         </div>

         <div style="margin-top:8px;background:#111827;border-radius:15px;padding:12px;text-align:center">
           <div style="font-size:13px;color:#94a3b8">מחיר שהוזן</div>
           <div style="font-size:38px;font-weight:1000">${total>0?'₪'+total.toLocaleString('he-IL',{maximumFractionDigits:2}):'ייקלט מתוך חלון המזומן'}</div>
         </div>
         <div style="font-size:14px;color:#cbd5e1;margin:13px 0 6px">כמה הלקוח נתן?</div>
         <input id="mcg-input" inputmode="decimal" placeholder="לדוגמה: 100" style="box-sizing:border-box;width:100%;height:54px;border:0;border-radius:13px;padding:0 14px;font-size:24px;text-align:center">
         <div id="mcg-quick" style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:9px"></div>
         <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px">
           <button id="mcg-exact" style="height:48px;border:0;border-radius:12px;background:#374151;color:#fff;font-weight:900">סכום מדויק</button>
           <button id="mcg-go" style="height:48px;border:0;border-radius:12px;background:#059669;color:#fff;font-weight:900">המשך למזומן</button>
         </div>
         <div id="mcg-preview" style="margin-top:10px;text-align:center;font-size:18px;font-weight:900;color:#6ee7b7;min-height:24px"></div>`;

       shade.appendChild(card);document.documentElement.appendChild(shade);

       const inp=card.querySelector('#mcg-input');
       const preview=card.querySelector('#mcg-preview');
       const quick=card.querySelector('#mcg-quick');

       const candidates=[50,100,200,500].filter(x=>total>0?x>=total:true);
       if(total>0 && !candidates.length)candidates.push(Math.ceil(total/100)*100);
       // Always offer common notes, but avoid duplicates.
       [...new Set([...candidates,100,200].filter(x=>x>0))].slice(0,4).forEach(v=>{
         const b=document.createElement('button');
         b.type='button';b.textContent='₪'+v;
         b.style.cssText='height:44px;border:0;border-radius:11px;background:#1f2937;color:#fff;font-weight:900;font-size:16px';
         b.onclick=()=>{inp.value=String(v);inp.dispatchEvent(new Event('input',{bubbles:true}))};
         quick.appendChild(b);
       });

       const update=()=>{
         const g=Number(String(inp.value||'').replace(',','.'))||0;
         if(!g){preview.textContent='';return}
         if(!(total>0)){preview.style.color='#cbd5e1';preview.textContent='העודף יחושב לפי סכום המזומן ביש חשבונית';return}
         if(g<total){preview.style.color='#fca5a5';preview.textContent='חסר ₪'+(total-g).toLocaleString('he-IL',{maximumFractionDigits:2})}
         else{preview.style.color='#6ee7b7';preview.textContent='עודף ₪'+(g-total).toLocaleString('he-IL',{maximumFractionDigits:2})}
       };
       inp.addEventListener('input',update);

       const finish=v=>{shade.remove();resolve(Number(v||0))};
       card.querySelector('#mcg-close').onclick=()=>finish(0);
       card.querySelector('#mcg-exact').onclick=()=>finish(total>0?total:0);
       card.querySelector('#mcg-go').onclick=()=>{
         const g=Number(String(inp.value||'').replace(',','.'))||0;
         if(total>0 && g && g<total){preview.style.color='#fca5a5';preview.textContent='הסכום שהתקבל נמוך מהחשבון';return}
         finish(g||(total>0?total:0));
       };
       shade.onclick=e=>{if(e.target===shade)finish(0)};
       setTimeout(()=>inp.focus(),120);
     });
   }

   let mfixQuickPayLock492=false;


   // Chromebook/Desktop native cash flow learned from the actual YesInvoice screens:
   // "שורת תקבול +" -> "איך שילמו לך?" -> "מזומן" -> amount -> "שמירת תשלום".
   // Every submit/save step is clicked ONCE only.
   const mfixChromeCashFlow616=async()=>{
     mfixCaptureInvoiceTotal643();
     const n=v=>String(v||'').replace(/\s+/g,' ').trim();
     const vis=e=>{
       if(!e||!(e instanceof Element))return false;
       const st=getComputedStyle(e),r=e.getBoundingClientRect();
       return st.display!=='none'&&st.visibility!=='hidden'&&r.width>4&&r.height>4;
     };
     const t=e=>n(e?.value||e?.innerText||e?.textContent||e?.getAttribute?.('aria-label')||e?.getAttribute?.('title')||'');
     const wait=ms=>new Promise(r=>setTimeout(r,ms));
     const all=()=>[...document.querySelectorAll('button,a,input,label,[role="button"],[role="radio"],div,span')].filter(vis);
     const waitFind=async(fn,ms=5000)=>{
       const until=Date.now()+ms;
       while(Date.now()<until){
         const hit=all().filter(e=>{try{return fn(e)}catch(_){return false}})
           .sort((a,b)=>t(a).length-t(b).length)[0];
         if(hit)return hit;
         await wait(100);
       }
       return null;
     };

     const quick=document.getElementById('mfix-next-step-450');
     const oldDisplay=quick?.style.display||'';
     if(quick)quick.style.display='none';

     try{
       // 1) Open "שורת תקבול +"
       const add=await waitFind(e=>{
         const x=t(e);
         return x==='שורת תקבול +'||x==='שורת תקבול+'||x==='שורת תקבול'||
                (x.includes('שורת תקבול')&&x.length<40);
       },2200);
       if(!add){toast('לא מצאתי "שורת תקבול +"',2200);return false}
       clickNative(add);

       // 2) Wait for "איך שילמו לך?"
       let payDialog=null;
       const until=Date.now()+5000;
       while(Date.now()<until && !payDialog){
         const ds=[...document.querySelectorAll('[role="dialog"],.modal,.popup,.pop1,.pop2,div')].filter(vis);
         payDialog=ds.filter(d=>{
           const x=n(d.innerText||d.textContent||'');
           return x.includes('איך שילמו לך?') && x.includes('מזומן') && x.length<1800;
         }).sort((a,b)=>n(a.innerText).length-n(b.innerText).length)[0]||null;
         if(!payDialog)await wait(100);
       }
       if(!payDialog){toast('לא נפתח חלון "איך שילמו לך?"',2400);return false}

       // 3) Use learned cash click. First time: user teaches the exact native "מזומן".
       let cash=mfixFindLearnedCash626(payDialog);
       if(cash){
         clickNative(cash);
       }else{
         toast('פעם ראשונה: למד אותי איפה "מזומן"',2200);
         await mfixLearnCashClick626(payDialog);
       }

       // 4) Wait for native cash editor.
       let cashDialog=null;
       const until2=Date.now()+5000;
       while(Date.now()<until2 && !cashDialog){
         const ds=[...document.querySelectorAll('[role="dialog"],.modal,.popup,.pop1,.pop2,div')].filter(vis);
         cashDialog=ds.filter(d=>{
           const x=n(d.innerText||d.textContent||'');
           return x.includes('מזומן') && x.includes('סכום') && x.includes('שמירת תשלום') && x.length<1400;
         }).sort((a,b)=>n(a.innerText).length-n(b.innerText).length)[0]||null;
         if(!cashDialog)await wait(100);
       }
       if(!cashDialog){toast('לא נפתח חלון מזומן',2200);return false}

       // 5) Fill amount automatically, then capture the EXACT native "סכום" field.
       try{fillPaymentAmountIfOpen()}catch(_){}
       await wait(250);
       try{fillPaymentAmountIfOpen()}catch(_){}

       mfixNativeCashAmount635=0;
       try{
         const amountInputs=[...cashDialog.querySelectorAll('input')].filter(i=>!i.disabled&&!i.readOnly&&i.offsetParent!==null);
         for(const i of amountInputs){
           const around=n((i.parentElement?.innerText||'')+' '+(i.parentElement?.parentElement?.innerText||''));
           if(!around.includes('סכום'))continue;
           const v=parseMoney(i.value);
           if(v>0){mfixNativeCashAmount635=v;break}
         }
       }catch(_){}
       if(mfixNativeCashAmount635>0){
         try{
           const proTotal=document.querySelector('#mfix-total-600 .value');
           if(proTotal)proTotal.textContent='₪'+mfixNativeCashAmount635.toLocaleString('he-IL',{maximumFractionDigits:2});
         }catch(_){}
       }

       // 6) Learn/replay the native "שמירת תשלום" button.
       // First transaction: user clicks the native button once and MFIX learns it.
       // Following transactions: MFIX performs ONE native click only. Never retries submit.
       const saveKey630='mfixCashSavePaymentSelector630';
       const afterSave630=()=>{
         setTimeout(()=>{
           try{mfixShowCorrectChangeAfterSave636()}catch(_){}
           try{mfixContinueIssueAfterManualSave628()}catch(_){}
         },650);
       };
       let learnedSave630=null;
       try{
         const sel=localStorage.getItem(saveKey630)||'';
         if(sel){
           const q=document.querySelector(sel);
           if(q && vis(q) && cashDialog.contains(q) && t(q)==='שמירת תשלום')learnedSave630=q;
         }
       }catch(_){}

       if(learnedSave630){
         // Single activation only — critical duplicate-receipt guard.
         try{learnedSave630.click()}catch(_){}
         toast('שמירת תשלום הופעלה ✓',1500);
         afterSave630();
         return true;
       }

       const cssPath630=el=>{
         if(!el||!(el instanceof Element))return '';
         if(el.id)return '#'+CSS.escape(el.id);
         const parts=[];
         let cur=el;
         for(let depth=0;cur&&cur!==document.body&&depth<6;depth++,cur=cur.parentElement){
           let part=cur.tagName.toLowerCase();
           if(cur.classList?.length)part+='.'+[...cur.classList].slice(0,2).map(x=>CSS.escape(x)).join('.');
           if(cur.parentElement){
             const sib=[...cur.parentElement.children].filter(x=>x.tagName===cur.tagName);
             if(sib.length>1)part+=`:nth-of-type(${sib.indexOf(cur)+1})`;
           }
           parts.unshift(part);
         }
         return parts.join(' > ');
       };

       const onLearnSave630=ev=>{
         const el=ev.target instanceof Element?ev.target:null;
         if(!el || !cashDialog.contains(el))return;
         let x=el;
         for(let i=0,p=el;i<6&&p;i++,p=p.parentElement){
           const tag=(p.tagName||'').toLowerCase(),role=p.getAttribute?.('role')||'';
           if(tag==='button'||tag==='a'||tag==='input'||role==='button'){x=p;break}
         }
         if(t(x)!=='שמירת תשלום')return;
         document.removeEventListener('click',onLearnSave630,true);
         try{
           const sel=cssPath630(x);
           if(sel)localStorage.setItem(saveKey630,sel);
         }catch(_){}
         toast('למדתי "שמירת תשלום" ✓',1800);
         afterSave630();
       };
       document.addEventListener('click',onLearnSave630,true);
       toast('פעם אחת: לחץ ידנית על "שמירת תשלום" כדי שאלמד',4200);
       return true;
     }finally{
       if(quick){
         setTimeout(()=>{try{quick.style.display=oldDisplay||'flex'}catch(_){}},900);
       }
     }
   };

   const mfixContinueQuickPayment499=async(kind)=>{
     armDesktopPaymentAmount();

     // Chromebook/Desktop cash has its own exact native multi-step flow.
     // Credit/terminal remains on the already working Z-Credit path.
     if(kind==='cash'){
       return await mfixChromeCashFlow616();
     }

     // Open MFIX smart receipt chooser, then select the requested method.
     receipt.click();

     for(let n=0;n<35;n++){
       await sleep(100);
       const shade=document.getElementById('mfixSmartPay469');
       if(!shade)continue;
       const wanted=kind==='cash'?'מזומן':'אשראי במסוף';
       const b=[...shade.querySelectorAll('button')].find(x=>normText(x.textContent)===wanted);
       if(b){
         b.click();
         return true;
       }
     }

     toast('לא הצלחתי להמשיך לאמצעי התשלום',2200);
     return false;
   };

   const mfixQuickPay490=async(kind)=>{
     if(kind==='cash'){
       mfixInvoiceTotalSnapshot643=0;
       mfixCaptureInvoiceTotal643();
     }
     window.__mfixPayKind600=kind==='cash'?'מזומן':(kind==='terminal'?'אשראי במסוף':kind);
     if(kind==='cash')mfixNativeCashAmount635=0;
     if(mfixQuickPayLock492){
       toast('התשלום כבר בתהליך…',1200);
       return false;
     }
     mfixQuickPayLock492=true;

     if(kind==='cash'){
       try{
         mfixCashGiven624=await mfixAskCashGiven624();
         const proInp=document.querySelector('#mfix-given-600');
         if(proInp && mfixCashGiven624){
           proInp.value=String(mfixCashGiven624);
           proInp.dispatchEvent(new Event('input',{bubbles:true}));
         }
       }catch(_){mfixCashGiven624=0}
     }

     const unlock=()=>setTimeout(()=>{mfixQuickPayLock492=false},1200);

     // Keep registered walk-in customer as base customer.
     const customerInput=document.querySelector('#nameofCustomer');
     const customerNow=normText(customerInput?.value||'');
     if(!customerNow.includes('לקוח מזדמן')){
       const ok=await mfixPosEnsureWalkIn830();
       if(!ok)toast('לא הצלחתי לבחור ##לקוח מזדמן',2400);
     }

     // IMPORTANT: use the original global customer-dialog continuation.
     // v4.9.8 incorrectly passed callbacks into showCustomerDialog(), but that
     // function does not accept arguments; therefore payment never resumed.
     mfixAfterCustomerDialog=async()=>{
       try{
         await mfixContinueQuickPayment499(kind);
       }finally{
         unlock();
       }
     };

     // Always show customer details before a quick payment so the cashier
     // can enter name/phone, then automatically continue to cash/terminal.
     showCustomerDialog();

     // If dialog could not open for any reason, continue instead of hanging.
     if(!document.getElementById('mfix43-customer-dialog')){
       const cb=mfixAfterCustomerDialog;
       mfixAfterCustomerDialog=null;
       if(cb)await cb();
     }

     return true;
   };

   let mfixTerminalInvoiceTotal648=0;

   function mfixInvoicePayable647(){
     // Read the visible native "סה״כ לתשלום" first.
     try{
       const els=[...document.querySelectorAll('div,span,strong,b,td')].filter(e=>{
         if(!e.offsetParent || e.closest('div.pop1,div.pop2,[role="dialog"],#mfix-next-step-450,#mfix-pro-panel-600'))return false;
         return /^סה["״']?כ\s+לתשלום$/.test(normText(e.innerText||e.textContent||''));
       });
       for(const el of els){
         const p=el.parentElement;
         const area=normText(p?.innerText||'');
         const vals=[...area.matchAll(/₪\s*([\d,]+(?:\.\d+)?)/g)].map(m=>parseMoney(m[1])).filter(v=>v>0);
         if(vals.length)return vals[vals.length-1];

         const sib=[...(p?.parentElement?.children||[])];
         for(const x of sib){
           const t=normText(x.innerText||x.textContent||'');
           const m=t.match(/^₪?\s*([\d,]+(?:\.\d+)?)\s*$/);
           if(m){
             const v=parseMoney(m[1]); if(v>0)return v;
           }
         }
       }
     }catch(_){}

     // Stable fallback already used by 6.4.5.
     return Number(currentInvoiceTotal()||0);
   }

   function mfixArmTerminalAmount647(){
     mfixTerminalInvoiceTotal648=Number(mfixInvoicePayable647()||currentInvoiceTotal()||0);
     if(!(mfixTerminalInvoiceTotal648>0)){
       toast('לא הצלחתי לזהות את סה״כ החשבונית לפני אשראי',2600);
       return;
     }

     const started=Date.now();
     let stableHits=0;

     const visible=e=>{
       if(!e)return false;
       const r=e.getBoundingClientRect(),cs=getComputedStyle(e);
       return r.width>3&&r.height>3&&cs.display!=='none'&&cs.visibility!=='hidden';
     };
     const text=e=>normText(e?.innerText||e?.textContent||'');

     const findActualCreditPopup=()=>{
       // CRITICAL: never scan body/page wrappers.
       // The old code included "body > div", which could contain BOTH the credit popup
       // and customer fields. Then "first two inputs" became customer name/ID.
       const candidates=[...document.querySelectorAll(
         'div.pop2,div.pop1,[role="dialog"],.modal,.popup'
       )].filter(visible).filter(d=>{
         const t=text(d);
         return t.includes('מספר תשלומים') &&
                t.includes('סכום חיוב') &&
                (t.includes('סליקה במקום') || t.length<900);
       });

       // Prefer the smallest/most specific native popup.
       candidates.sort((a,b)=>{
         const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();
         const aa=ra.width*ra.height, ab=rb.width*rb.height;
         return aa-ab || text(a).length-text(b).length;
       });
       return candidates[0]||null;
     };

     const findFieldByLabel=(d,label)=>{
       const labels=[...d.querySelectorAll('label,div,span,b,strong')].filter(visible);
       const lab=labels
         .filter(e=>text(e)===label || text(e).startsWith(label))
         .sort((a,b)=>text(a).length-text(b).length)[0];
       if(!lab)return null;

       // Search a small native field container first.
       let box=lab;
       for(let k=0;k<5&&box;k++,box=box.parentElement){
         const inputs=[...box.querySelectorAll('input')].filter(i=>
           visible(i)&&!i.disabled&&!i.readOnly&&
           i.id!=='nameofCustomer' &&
           !/customer|client|identity|vat/i.test(String(i.id||'')+' '+String(i.name||'')) &&
           ['text','number','tel'].includes((i.type||'text').toLowerCase())
         );
         if(inputs.length===1)return inputs[0];
       }
       return null;
     };

     const fix=()=>{
       if(Date.now()-started>20000)return true;

       const d=findActualCreditPopup();
       if(!d)return false;

       // First try label-bound fields.
       let payments=findFieldByLabel(d,'מספר תשלומים');
       let amountInput=findFieldByLabel(d,'סכום חיוב');

       // Safe fallback: ONLY inputs inside the actual small credit popup.
       if(!payments || !amountInput){
         const numeric=[...d.querySelectorAll('input')].filter(i=>
           visible(i)&&!i.disabled&&!i.readOnly&&
           i.id!=='nameofCustomer' &&
           !i.closest('#mfix-pos-800') &&
           !/customer|client|identity|vat|nameOfCustomer/i.test(
             String(i.id||'')+' '+String(i.name||'')+' '+String(i.placeholder||'')
           ) &&
           ['text','number','tel'].includes((i.type||'text').toLowerCase())
         );

         // The native "סליקה במקום" popup has exactly these two editable numeric fields.
         if(!payments)payments=numeric[0]||null;
         if(!amountInput)amountInput=numeric.find(i=>i!==payments)||null;
       }

       if(!payments || !amountInput)return false;

       // Absolute safety: never touch anything outside the credit popup.
       if(!d.contains(payments) || !d.contains(amountInput))return false;
       if(payments.id==='nameofCustomer' || amountInput.id==='nameofCustomer')return false;

       if(String(payments.value||'').trim()!=='1'){
         setNativeInput(payments,'1');
         payments.dispatchEvent(new Event('input',{bubbles:true}));
         payments.dispatchEvent(new Event('change',{bubbles:true}));
         payments.dispatchEvent(new Event('blur',{bubbles:true}));
       }

       const wanted=(Math.round(mfixTerminalInvoiceTotal648*100)/100).toString();
       if(String(amountInput.value||'').trim()!==wanted){
         setNativeInput(amountInput,wanted);
         amountInput.dispatchEvent(new Event('input',{bubbles:true}));
         amountInput.dispatchEvent(new Event('change',{bubbles:true}));
         amountInput.dispatchEvent(new Event('blur',{bubbles:true}));
         stableHits=0;
         toast('אשראי: ₪'+mfixTerminalInvoiceTotal648.toLocaleString('he-IL',{maximumFractionDigits:2})+' · תשלום 1',1700);
       }else{
         stableHits++;
       }

       if(stableHits>=8)return true;
       return false;
     };

     fix();
     const timer=setInterval(()=>{if(fix())clearInterval(timer)},140);
     setTimeout(()=>clearInterval(timer),20500);
   }
   quickCash.onclick=()=>mfixQuickPay490('cash');
   quickCard.onclick=()=>{
     // Preserve the exact working terminal flow. Only correct the amount field.
     mfixArmTerminalAmount647();
     return mfixQuickPay490('terminal');
   };

   receipt.onclick=async()=>{
     const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
     const visible=e=>{
       if(!e || !(e instanceof Element)) return false;
       const st=getComputedStyle(e), r=e.getBoundingClientRect();
       return st.display!=='none' && st.visibility!=='hidden' && r.width>0 && r.height>0;
     };
     const clickLike=el=>{
       if(!el) return false;
       let p=el;
       for(let i=0;i<6 && p;i++,p=p.parentElement){
         const tag=(p.tagName||'').toLowerCase();
         if(tag==='button'||tag==='a'||tag==='label'||p.getAttribute?.('role')==='button'||getComputedStyle(p).cursor==='pointer'){
           el=p; break;
         }
       }
       try{
         el.scrollIntoView({block:'center',inline:'nearest'});
         const r=el.getBoundingClientRect(), x=r.left+r.width/2, y=r.top+r.height/2;
         const o={bubbles:true,cancelable:true,view:window,clientX:x,clientY:y};
         el.dispatchEvent(new MouseEvent('mousedown',o));
         el.dispatchEvent(new MouseEvent('mouseup',o));
         el.dispatchEvent(new MouseEvent('click',o));
         try{el.click()}catch(_){}
         return true;
       }catch(_){ try{el.click();return true}catch(__){return false} }
     };

     const methods=[
       ['מזומן',['מזומן','תשלום במזומן','תקבול מזומן'],'cash'],
       ['אשראי במסוף',['כרטיס אשראי','אשראי','אשראי במסוף'],'terminal'],
       ['העברה בנקאית',['העברה בנקאית'],'normal'],
       ['אפליקציית תשלום',['אפליקציית תשלום'],'normal'],
       ['צ׳ק',['צ׳ק','צק'],'normal'],

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


 function mfixChangeLastQty600(delta){
   const rows=mfixInvoiceRows600();
   const row=rows[rows.length-1];
   if(!row){toast('אין שורת מוצר לשינוי כמות',1700);return false}

   const inputs=[...row.querySelectorAll('input')].filter(i=>!i.disabled&&!i.readOnly);
   let qty=inputs.find(i=>{
     const txt=normText((i.closest('div')?.innerText||'')+' '+(i.parentElement?.parentElement?.innerText||''));
     return /כמות/.test(txt);
   });
   if(!qty){
     qty=inputs.find(i=>['number','tel'].includes((i.type||'').toLowerCase()) && Number(i.value)>0);
   }
   if(!qty){toast('לא זוהה שדה הכמות בשורה האחרונה',1900);return false}

   const now=Math.max(1,Number(qty.value)||1);
   const next=Math.max(1,now+delta);
   setNativeInput(qty,String(next));
   qty.dispatchEvent(new Event('change',{bubbles:true}));
   qty.dispatchEvent(new Event('blur',{bubbles:true}));
   toast('כמות: '+next,1100);
   return true;
 }

 function mfixUndoLastItem600(){
   const rows=mfixInvoiceRows600();
   const row=rows[rows.length-1];
   if(!row){toast('אין מוצר אחרון למחיקה',1600);return false}

   const candidates=[...row.querySelectorAll('button,a,[role="button"],i,span')];
   const del=candidates.find(e=>{
     const t=normText((e.title||'')+' '+(e.getAttribute?.('aria-label')||'')+' '+(e.innerText||e.textContent||''));
     const c=String(e.className||'');
     return /מחק|מחיקה|הסר|trash|delete/i.test(t+' '+c);
   });
   if(!del){toast('לא זוהה כפתור מחיקה בשורה האחרונה',1900);return false}

   const target=del.closest('button,a,[role="button"]')||del;
   if(!confirm('למחוק את המוצר האחרון מהחשבונית?'))return false;
   clickNative(target);
   toast('נשלחה מחיקת המוצר האחרון',1500);
   return true;
 }

 function mfixShowPaymentSuccess600(method){
   if(!mfixSettings600().showSuccess)return;
   document.getElementById('mfix-success-600')?.remove();

   const total=currentInvoiceTotal();
   const shade=document.createElement('div');
   shade.id='mfix-success-600';
   shade.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#0008;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif';

   const box=document.createElement('div');
   box.style.cssText='width:min(90vw,420px);background:#fff;border-radius:20px;padding:22px;direction:rtl;text-align:center;box-shadow:0 18px 50px #0007';
   box.innerHTML=`<div style="font-size:44px">✅</div>
     <div style="font-size:24px;font-weight:900;margin-top:5px">התשלום נשמר</div>
     <div style="font-size:17px;margin-top:8px">${esc(String(method||''))}</div>
     ${total?`<div style="font-size:32px;font-weight:900;margin-top:10px">₪${Number(total).toLocaleString('he-IL')}</div>`:''}`;

   const close=document.createElement('button');
   close.textContent='סגור';
   close.style.cssText='margin-top:16px;border:0;border-radius:12px;padding:11px 22px;background:#111827;color:#fff;font-weight:800;font-size:16px';
   close.onclick=()=>shade.remove();

   box.appendChild(close);
   shade.appendChild(box);
   shade.onclick=e=>{if(e.target===shade)shade.remove()};
   document.body.appendChild(shade);
   setTimeout(()=>shade.remove(),4200);
 }

 function mfixExportSettings600(){
   const payload={
     version:'6.0.0',
     favorites:mfixGetFavorites600(),
     pro:mfixSettings600(),
     searchFont:localStorage.getItem('mfixManualSearchFont503'),
     quickHidden:localStorage.getItem('mfixQuickBarHidden501'),
     quickPos:localStorage.getItem('mfixFloatingDockPos500'),
     fontPos:localStorage.getItem('mfixFontFloatPos503')
   };
   const text=JSON.stringify(payload,null,2);
   if(navigator.clipboard?.writeText){
     navigator.clipboard.writeText(text).then(()=>toast('הגדרות הועתקו ללוח ✓',1800)).catch(()=>{});
   }
   const blob=new Blob([text],{type:'application/json'});
   const a=document.createElement('a');
   a.href=URL.createObjectURL(blob);
   a.download='MFIX-settings.json';
   a.click();
   setTimeout(()=>URL.revokeObjectURL(a.href),1500);
 }

 function mfixImportSettings600(){
   const input=document.createElement('input');
   input.type='file';
   input.accept='application/json,.json';
   input.onchange=()=>{
     const f=input.files?.[0];
     if(!f)return;
     const r=new FileReader();
     r.onload=()=>{
       try{
         const d=JSON.parse(String(r.result||'{}'));
         if(Array.isArray(d.favorites))mfixSetFavorites600(d.favorites);
         if(d.pro)mfixSaveSettings600(d.pro);
         if(d.searchFont!=null)localStorage.setItem('mfixManualSearchFont503',String(d.searchFont));
         if(d.quickHidden!=null)localStorage.setItem('mfixQuickBarHidden501',String(d.quickHidden));
         if(d.quickPos!=null)localStorage.setItem('mfixFloatingDockPos500',String(d.quickPos));
         if(d.fontPos!=null)localStorage.setItem('mfixFontFloatPos503',String(d.fontPos));
         toast('הגדרות יובאו ✓ — מרענן',1800);
         setTimeout(()=>location.reload(),700);
       }catch(_){toast('קובץ הגדרות לא תקין',2200)}
     };
     r.readAsText(f);
   };
   input.click();
 }

 function mfixRefreshProPanel600(){
   const panel=document.getElementById('mfix-pro-panel-600');
   if(!panel || panel.style.display==='none')return;
   const favBox=panel.querySelector('#mfix-favs-600');
   if(!favBox)return;
   favBox.innerHTML='';

   const favs=mfixGetFavorites600();
   if(!favs.length){
     favBox.innerHTML='<div style="font-size:13px;color:#94a3b8;padding:5px">אין עדיין מועדפים. לחץ ☆ ליד מוצר בתוצאות החיפוש.</div>';
     return;
   }

   favs.slice(0,12).forEach(f=>{
     const card=document.createElement('button');
     card.type='button';

     // Confirmed YesInvoice API mapping:
     // Body = human-readable product name
     // Name = code/barcode in this account
     const productName=String(f.Body||f.body||f.ProductName||f.productName||'').trim() || 'מוצר';
     const code=String(f.Name||f.name||'').trim();
     const barcode=String(f.Barcode||f.barcode||'').trim();
     const sku=String(f.CatalogNumber||f.catalogNumber||f.SKU||f.sku||'').trim();
     const price=f.Price??f.price??'';
     const st=stock(f);

     card.style.cssText='display:block;width:100%;text-align:right;border:1px solid #ffffff20;border-radius:11px;padding:10px;margin:6px 0;background:#1f2937;color:#fff';
     const title=document.createElement('div');
     title.textContent='⭐ '+productName;
     title.style.cssText='font-size:15px;font-weight:900;line-height:1.35';

     const meta=document.createElement('div');
     meta.style.cssText='font-size:12px;color:#cbd5e1;margin-top:5px;line-height:1.55';
     meta.textContent=[
       code&&'קוד/ברקוד: '+code,
       barcode&&barcode!==code&&'ברקוד: '+barcode,
       sku&&'מק״ט: '+sku,
       price!==''&&Number.isFinite(Number(price))&&'מחיר: ₪'+Number(price).toLocaleString('he-IL'),
       st!==''&&'מלאי: '+st
     ].filter(Boolean).join(' · ');

     card.append(title,meta);
     card.onclick=()=>{panel.style.display='none';openInvoiceForProduct(f)};
     favBox.appendChild(card);
   });
 }

 function mfixEnsureProPanel600(){
   return; // 13.9.10 PERFORMANCE: old PRO gear removed
   if(document.getElementById('mfix-pro-button-600'))return;

   const btn=document.createElement('button');
   btn.id='mfix-pro-button-600';
   btn.type='button';
   btn.textContent='⚙️';
   btn.title='MFIX כלים והגדרות';
   btn.style.cssText='position:fixed;right:8px;top:38%;z-index:2147483644;width:48px;height:48px;border:0;border-radius:999px;background:#0f172aee;color:#fff;font-size:21px;box-shadow:0 5px 16px #0006';

   const panel=document.createElement('div');
   panel.id='mfix-pro-panel-600';
   panel.style.cssText='display:none;position:fixed;right:62px;top:7%;z-index:2147483645;width:min(92vw,440px);max-height:86vh;overflow:auto;background:#0b1220f7;color:#fff;border:1px solid #ffffff22;border-radius:22px;padding:14px;box-shadow:0 18px 45px #0009;direction:rtl;font-family:Arial,sans-serif';

   panel.innerHTML=`
     <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
       <div><b style="font-size:20px">MFIX PRO</b><div style="font-size:11px;color:#94a3b8;margin-top:2px">קופה · עודף · כמות · מועדפים</div></div>
       <button id="mfix-pro-close-600" style="border:0;background:transparent;color:#fff;font-size:20px">✕</button>
     </div>
     <div id="mfix-total-600" style="background:#111827;border-radius:12px;padding:12px;text-align:center;margin-bottom:9px">
       <div style="font-size:12px;color:#94a3b8">סה״כ לתשלום</div>
       <div class="value" style="font-size:30px;font-weight:900">₪0</div>
     </div>
     <div style="background:linear-gradient(135deg,#111827,#0f2f2a);border-radius:15px;padding:12px;margin-bottom:10px;border:1px solid #34d39933">
       <div style="display:flex;justify-content:space-between;align-items:center">
         <b>💵 מזומן חכם</b><span style="font-size:11px;color:#94a3b8">עודף בזמן אמת</span>
       </div>
       <div style="display:grid;grid-template-columns:1fr 125px;gap:8px;margin-top:8px">
         <input id="mfix-given-600" inputmode="decimal" placeholder="הלקוח נתן" style="min-width:0;border:0;border-radius:11px;padding:11px;font-size:19px;text-align:center">
         <div id="mfix-change-600" style="background:#064e3b;border-radius:11px;padding:11px 6px;text-align:center;font-weight:1000;font-size:16px">עודף ₪0</div>
       </div>
       <div id="mfix-cash-presets-624" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px">
         <button data-cash="50" style="border:0;border-radius:9px;padding:8px;background:#1f2937;color:#fff;font-weight:800">₪50</button>
         <button data-cash="100" style="border:0;border-radius:9px;padding:8px;background:#1f2937;color:#fff;font-weight:800">₪100</button>
         <button data-cash="200" style="border:0;border-radius:9px;padding:8px;background:#1f2937;color:#fff;font-weight:800">₪200</button>
         <button id="mfix-cash-exact-624" style="border:0;border-radius:9px;padding:8px;background:#0f766e;color:#fff;font-weight:800">מדויק</button>
       </div>
     </div>
     <div style="display:flex;gap:6px;margin-bottom:9px">
       <button id="mfix-qty-minus-600" style="flex:1;border:0;border-radius:10px;padding:10px;background:#374151;color:white;font-weight:800">➖ כמות</button>
       <button id="mfix-qty-plus-600" style="flex:1;border:0;border-radius:10px;padding:10px;background:#374151;color:white;font-weight:800">➕ כמות</button>
       <button id="mfix-undo-600" style="flex:1;border:0;border-radius:10px;padding:10px;background:#7f1d1d;color:white;font-weight:800">🗑️ אחרון</button>
     </div>
     <div style="background:#111827;border-radius:12px;padding:10px;margin-bottom:9px">
       <b>⭐ מוצרים מועדפים</b>
       <div id="mfix-favs-600" style="margin-top:6px"></div>
     </div>
     <div style="background:#111827;border-radius:12px;padding:10px;margin-bottom:9px">
       <b>🎛️ אפשרויות</b>
       <label style="display:block;margin-top:7px"><input type="checkbox" data-mfix-setting="showSuccess"> מסך אישור אחרי תשלום</label>
       <label style="display:block;margin-top:7px"><input type="checkbox" data-mfix-setting="showStock"> התראות מלאי</label>
       <label style="display:block;margin-top:7px"><input type="checkbox" data-mfix-setting="showChange"> מחשבון עודף</label>
       <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px">
         <button id="mfix-relearn-cash-628" style="border:0;border-radius:9px;padding:8px;background:#374151;color:#fff;font-weight:800">🎯 למד מזומן מחדש</button>
         <button id="mfix-relearn-issue-628" style="border:0;border-radius:9px;padding:8px;background:#374151;color:#fff;font-weight:800">🎯 למד הפקת מסמך</button>
       </div>
     </div>
     <div style="display:flex;gap:7px">
       <button id="mfix-export-600" style="flex:1;border:0;border-radius:10px;padding:10px;background:#0369a1;color:white;font-weight:800">⬆️ ייצוא</button>
       <button id="mfix-import-600" style="flex:1;border:0;border-radius:10px;padding:10px;background:#0369a1;color:white;font-weight:800">⬇️ ייבוא</button>
     </div>
     <div style="font-size:11px;color:#94a3b8;margin-top:9px">F2 עוד מוצר · F4 מזומן · F6 אשראי · F8 הדפס שוב</div>
   `;

   document.documentElement.append(btn,panel);

   btn.onclick=()=>{
     panel.style.display=panel.style.display==='none'?'block':'none';
     if(panel.style.display!=='none')mfixRefreshProPanel600();
   };
   panel.querySelector('#mfix-pro-close-600').onclick=()=>panel.style.display='none';
   panel.querySelector('#mfix-qty-minus-600').onclick=()=>mfixChangeLastQty600(-1);
   panel.querySelector('#mfix-qty-plus-600').onclick=()=>mfixChangeLastQty600(1);
   panel.querySelector('#mfix-undo-600').onclick=()=>mfixUndoLastItem600();
   panel.querySelector('#mfix-export-600').onclick=mfixExportSettings600;
   panel.querySelector('#mfix-import-600').onclick=mfixImportSettings600;
   panel.querySelector('#mfix-relearn-cash-628').onclick=()=>{
     try{localStorage.removeItem(MFIX_CASH_SELECTOR_626)}catch(_){}
     toast('לימוד מזומן אופס — בפעם הבאה לחץ על מזומן',2200);
   };
   panel.querySelector('#mfix-relearn-issue-628').onclick=()=>{
     try{localStorage.removeItem(MFIX_ISSUE_SELECTOR_628)}catch(_){}
     toast('לימוד הפקת מסמך אופס',1800);
     mfixLearnIssueDocument628();
   };

   const settings=mfixSettings600();
   panel.querySelectorAll('[data-mfix-setting]').forEach(c=>{
     const k=c.dataset.mfixSetting;
     c.checked=!!settings[k];
     c.onchange=()=>{
       const x=mfixSettings600();
       x[k]=c.checked;
       mfixSaveSettings600(x);
     };
   });

   const updateTotal=()=>{
     if(!panel.isConnected)return;
     const total=mfixCustomerFacingTotal628();
     const v=panel.querySelector('#mfix-total-600 .value');
     if(v){
       const shown=Number(total||0);
       v.textContent=shown>0?'₪'+shown.toLocaleString('he-IL',{maximumFractionDigits:2}):'—';
     }
     const inp=panel.querySelector('#mfix-given-600');
     const ch=panel.querySelector('#mfix-change-600');
     if(inp&&ch){
       const given=Number(String(inp.value||'').replace(',','.'))||0;
       const basis=Number(mfixInvoiceTotalSnapshot643||mfixExactInvoiceTotal643()||total||0);
       const change=Math.max(0,given-basis);
       ch.textContent='עודף ₪'+Number(change).toLocaleString('he-IL',{maximumFractionDigits:2});
     }
   };
   panel.querySelector('#mfix-given-600').addEventListener('input',updateTotal);
   panel.querySelectorAll('[data-cash]').forEach(b=>b.onclick=()=>{
     const inp=panel.querySelector('#mfix-given-600');
     inp.value=b.dataset.cash||'';
     inp.dispatchEvent(new Event('input',{bubbles:true}));
   });
   panel.querySelector('#mfix-cash-exact-624').onclick=()=>{
     const inp=panel.querySelector('#mfix-given-600');
     inp.value=String(Number(mfixCustomerFacingTotal628()||0));
     inp.dispatchEvent(new Event('input',{bubbles:true}));
   };
   setInterval(updateTotal,800);
   updateTotal();
 }

 function mfixGeneralClickGuard600(){
   if(window.__mfixGeneralLock600)return;
   window.__mfixGeneralLock600=1;
   let last=null,at=0;
   document.addEventListener('click',e=>{
     const b=e.target?.closest?.('#mfix-next-step-450 button,#mfixSmartPay469 button,#mfix-pro-panel-600 button');
     if(!b)return;
     if(!mfixSettings600().doubleLock)return;
     const now=Date.now();
     if(last===b && now-at<650){
       e.preventDefault();
       e.stopImmediatePropagation();
       toast('לחיצה כפולה נחסמה',900);
       return;
     }
     last=b;at=now;
   },true);
 }


 // ===== MFIX 6.1.2 PASSIVE NATIVE PRODUCT NAME CACHE =====
 const MFIX_NAME_CACHE_606='mfixProductNameCache606';
 function mfixNameCache606(){try{return JSON.parse(localStorage.getItem(MFIX_NAME_CACHE_606)||'{}')||{}}catch(_){return {}}}
 function mfixSaveNameCache606(x){try{localStorage.setItem(MFIX_NAME_CACHE_606,JSON.stringify(x))}catch(_){}}
 function mfixCleanProductName606(v){
   const t=String(v||'').replace(/\s+/g,' ').replace(/^שם מוצר\s*[:：]?\s*/,'').trim();
   if(!t||/^(false|true|null|undefined)$/i.test(t)||/^\d[\d\s._/-]*$/.test(t))return '';
   return /[A-Za-zא-ת]/.test(t)?t:'';
 }
 function mfixProductKeys606(x){return [...new Set([x?.ID,x?.Id,x?.id,x?.Barcode,x?.barcode,x?.CatalogNumber,x?.catalogNumber,x?.SKU,x?.sku].map(v=>String(v??'').trim()).filter(Boolean))]}
 function mfixRememberName606(name,keys){
   name=mfixCleanProductName606(name);if(!name||!keys.length)return;
   const c=mfixNameCache606();keys.forEach(k=>c[k]=name);mfixSaveNameCache606(c);
 }
 function mfixCachedName606(x){
   const c=mfixNameCache606();
   const keys=mfixProductKeys606(x);
   for(const k of keys){
     const n=mfixCleanProductName606(c[k]);
     if(n){
       // Once any identifier resolves, bind all identifiers of this product to the same name.
       let changed=false;
       for(const alias of keys){
         if(c[alias]!==n){c[alias]=n;changed=true}
       }
       if(changed)mfixSaveNameCache606(c);
       return n;
     }
   }
   return '';
 }

 function mfixBindKnownNameToProduct607(x){
   const c=mfixNameCache606();
   const keys=mfixProductKeys606(x);
   if(!keys.length)return '';

   // 1. Exact identifier alias already known.
   for(const k of keys){
     const n=mfixCleanProductName606(c[k]);
     if(n){
       keys.forEach(a=>c[a]=n);
       mfixSaveNameCache606(c);
       return n;
     }
   }

   // 2. YesInvoice sometimes returns the catalog number inside Name and the barcode separately.
   // If one of those identifiers was learned from the native product page, bind the whole result.
   const extra=[
     x?.Name,x?.name,x?.CatalogNumber,x?.catalogNumber,x?.Barcode,x?.barcode,x?.SKU,x?.sku
   ].map(v=>String(v??'').trim()).filter(Boolean);
   for(const k of extra){
     const n=mfixCleanProductName606(c[k]);
     if(n){
       [...new Set([...keys,...extra])].forEach(a=>c[a]=n);
       mfixSaveNameCache606(c);
       return n;
     }
   }
   return '';
 }

 function mfixValueBesideLabel606(label){
   const vals=[];
   const add=el=>{
     if(!el||!isVisible(el))return;
     let t=String(el.value??el.innerText??el.textContent??'').replace(/\s+/g,' ').trim();
     if(t.includes('שם מוצר'))t=t.split('שם מוצר').slice(1).join('שם מוצר').replace(/^[:：\s-]+/,'').trim();
     t=mfixCleanProductName606(t);if(t)vals.push(t);
   };
   add(label.previousElementSibling);add(label.nextElementSibling);
   const p=label.parentElement;
   if(p){[...p.children].filter(e=>e!==label).forEach(add);add(p.previousElementSibling);add(p.nextElementSibling)}
   // Native mobile detail layout: inspect a narrow band around the label.
   const all=[...document.querySelectorAll('div,span,p,input,textarea')].filter(isVisible);
   const lr=label.getBoundingClientRect();
   all.forEach(el=>{
     if(el===label||el.contains(label)||label.contains(el))return;
     const r=el.getBoundingClientRect();
     if(Math.abs((r.top+r.height/2)-(lr.top+lr.height/2))<70)add(el);
   });
   vals.sort((a,b)=>b.length-a.length);
   return vals[0]||'';
 }
 function mfixScanVisibleNativeProduct606(){
   const els=[...document.querySelectorAll('div,span,label,p,td,th')].filter(isVisible);
   const label=els.find(el=>normText(el.innerText||el.textContent||'')==='שם מוצר');
   if(!label)return;
   const name=mfixValueBesideLabel606(label);if(!name)return;
   const keys=[];
   const skuLabel=els.find(el=>/^מק["״']?ט$/.test(normText(el.innerText||el.textContent||'')));
   if(skuLabel){
     const sr=skuLabel.getBoundingClientRect();
     [...document.querySelectorAll('div,span,p,input')].filter(isVisible).forEach(el=>{
       if(el===skuLabel)return;
       const r=el.getBoundingClientRect();
       if(Math.abs((r.top+r.height/2)-(sr.top+sr.height/2))>60)return;
       const t=String(el.value??el.innerText??el.textContent??'').replace(/\s+/g,' ').trim();
       if(/^[A-Za-z0-9._/-]{4,}$/.test(t))keys.push(t);
     });
   }
   // Also collect barcode / product ID when visible on the native detail page.
   const pageText=String(document.body.innerText||'').replace(/\s+/g,' ');
   const barcodeMatches=[...pageText.matchAll(/(?:ברקוד|Barcode)\s*[:：]?\s*([A-Za-z0-9._/-]{4,})/gi)];
   barcodeMatches.forEach(m=>m?.[1]&&keys.push(m[1]));

   try{
     const u=new URL(location.href);
     ['id','productid','productId','itemid','itemId'].forEach(k=>{
       const v=u.searchParams.get(k);if(v)keys.push(v);
     });
   }catch(_){}

   if(keys.length)mfixRememberName606(name,[...new Set(keys)]);
 }
 function mfixStartNativeNameObserver606(){
   if(window.__mfixNameObs606)return;window.__mfixNameObs606=1;
   // PERFORMANCE: body.innerText scanning is useful only on native product/item pages.
   // Do not run it continuously on POS/invoice pages.
   const relevant=()=>/\/items|\/products/i.test(location.pathname||'');
   let tm=0;
   const scan=()=>{
     if(!relevant())return;
     clearTimeout(tm);
     tm=setTimeout(()=>{try{mfixScanVisibleNativeProduct606()}catch(_){}},500);
   };
   const mo=new MutationObserver(scan);
   mo.observe(document.documentElement,{subtree:true,childList:true});
   window.addEventListener('popstate',scan,true);
   window.addEventListener('pageshow',scan,true);
   scan();
 }

 // ===== MFIX 6.0.8 PRODUCT API CAPTURE =====
 // Diagnostic layer only. It listens to page fetch/XHR after the user presses "start capture".
 const MFIX_CAPTURE_KEY_608='mfixProductCapture608';
 const MFIX_CAPTURE_ACTIVE_608='mfixProductCaptureActive608';

 function mfixInjectCapture608(){
   if(document.documentElement.dataset.mfixCapture608)return;
   document.documentElement.dataset.mfixCapture608='1';
   const sc=document.createElement('script');
   sc.textContent=`(()=>{
     if(window.__mfixCap608)return;window.__mfixCap608=1;
     const send=(kind,url,body,text,status)=>{
       try{
         window.postMessage({__mfixCap608:1,kind,url:String(url||''),body:String(body||'').slice(0,5000),text:String(text||'').slice(0,120000),status:Number(status||0),at:Date.now()},'*');
       }catch(_){}
     };
     const of=window.fetch;
     window.fetch=async function(input,init){
       const url=typeof input==='string'?input:(input&&input.url)||'';
       const body=init&&init.body||'';
       const r=await of.apply(this,arguments);
       try{
         const c=r.clone(); const t=await c.text();
         send('fetch',url,body,t,r.status);
       }catch(_){}
       return r;
     };
     const XO=XMLHttpRequest.prototype.open, XS=XMLHttpRequest.prototype.send;
     XMLHttpRequest.prototype.open=function(m,u){this.__mfix608={m,u};return XO.apply(this,arguments)};
     XMLHttpRequest.prototype.send=function(body){
       const x=this;
       const done=()=>{try{send('xhr',x.__mfix608?.u||'',body||'',x.responseText||'',x.status)}catch(_){}};
       x.addEventListener('load',done,{once:true});
       return XS.apply(this,arguments);
     };
   })();`;
   (document.head||document.documentElement).appendChild(sc);
   sc.remove();

   window.addEventListener('message',e=>{
     const d=e.data;
     if(!d?.__mfixCap608)return;
     let active=false;
     try{active=sessionStorage.getItem(MFIX_CAPTURE_ACTIVE_608)==='1'}catch(_){}
     if(!active)return;

     const url=String(d.url||'');
     const text=String(d.text||'');

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

        dock.style.bottom='auto';
      }
      e.preventDefault();
    };
    const up=e=>{
      if(!drag)return;
      drag=false;
      try{
        const r=dock.getBoundingClientRect();
        localStorage.setItem('mfixFloatingDockPos500',JSON.stringify({x:r.left,y:r.top}));
      }catch(_){}
      try{head.releasePointerCapture(pid)}catch(_){}
      if(!moved633)setMenuOpen633(dock.dataset.open!=='1');
    };

    head.addEventListener('pointerdown',down);
    window.addEventListener('pointermove',move,{passive:false});
    window.addEventListener('pointerup',up);

    return dock;
  }

  const scan=()=>{
    const d=findPrintDialog();
    if(d)addButton(d);
    ensureReprintButton490();
    // Floating print/reprint dock intentionally disabled: printing is automatic.
    document.getElementById('mfix-floating-dock-500')?.remove();
    document.getElementById('mfix-print-menu-633')?.remove();
  };
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(scan,700);
})();

// ===== MFIX 16.7 Permanent Print Settings UI (ChromeOS only) =====
(()=>{
 if(window.__MFIX_PRINT_SETTINGS_167__)return;
 window.__MFIX_PRINT_SETTINGS_167__=1;
 const isCrOS=()=>/CrOS/i.test(navigator.userAgent||'');
 if(!isCrOS())return;
 const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 function msg(m){return new Promise(r=>chrome.runtime.sendMessage(m,x=>r(chrome.runtime.lastError?{ok:false,error:chrome.runtime.lastError.message}:x)))}
 async function openPanel(){
   document.getElementById('mfix-print-settings-167')?.remove();
   const data=await msg({type:'MFIX_PRINT_1535_LIST'});
   const p=document.createElement('div');p.id='mfix-print-settings-167';p.dir='rtl';
   p.style.cssText='position:fixed;inset:50% auto auto 50%;transform:translate(-50%,-50%);z-index:2147483647;width:min(540px,94vw);max-height:92vh;overflow:auto;background:#0b0b0b;color:#fff;border:2px solid #f97316;border-radius:18px;padding:18px;box-shadow:0 20px 60px #000c;font:14px Arial';
   if(!data?.ok){p.innerHTML='<b>שגיאת מדפסות</b><div>'+esc(data?.error||'')+'</div><button id="mfix-pr-close">סגור</button>';document.documentElement.appendChild(p);p.querySelector('#mfix-pr-close').onclick=()=>p.remove();return}
   const s=data.settings||{}, ps=data.printers||[];
   p.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><div><b style="font-size:21px;color:#fb923c">🖨️ הגדרות הדפסת MFIX 16.7</b><div style="font-size:12px;color:#aaa;margin-top:4px">הגדרות קבועות + אורך גליל + חיתוך אוטומטי + תצוגה מקדימה</div></div><button id="mfix-pr-x" style="border:0;background:#292929;color:white;border-radius:9px;padding:7px 11px">✕</button></div>
   <div style="margin-top:14px">מדפסת קבועה</div><select id="mfix-pr-printer" style="width:100%;padding:10px;border-radius:9px;margin-top:5px">${ps.map(x=>`<option value="${esc(x.printer.id)}" ${x.printer.id===s.printerId?'selected':''}>${esc(x.printer.name)} ${x.info?.status?'— '+esc(x.info.status):''}</option>`).join('')}</select>
   <div style="margin-top:12px">גודל נייר</div><select id="mfix-pr-paper" style="width:100%;padding:10px;border-radius:9px;margin-top:5px"><option value="80MM" ${(s.paperMode||'80MM')==='80MM'?'selected':''}>80 מ״מ — קופה</option><option value="58MM" ${s.paperMode==='58MM'?'selected':''}>58 מ״מ</option><option value="AUTO" ${s.paperMode==='AUTO'?'selected':''}>אוטומטי לפי המדפסת</option></select>
   <div style="margin-top:12px">גודל / התאמת המסמך</div><select id="mfix-pr-fit" style="width:100%;padding:10px;border-radius:9px;margin-top:5px"><option value="NONE" ${(s.fit||'NONE')==='NONE'?'selected':''}>100% — ללא הקטנה (מומלץ אם יוצא קטן)</option><option value="AUTO_FIT" ${s.fit==='AUTO_FIT'?'selected':''}>התאם אוטומטית לנייר</option><option value="FIT" ${s.fit==='FIT'?'selected':''}>הקטן כדי להיכנס בדף</option><option value="FILL" ${s.fit==='FILL'?'selected':''}>מלא את הדף</option></select>
   <div style="margin-top:12px">כיוון</div><select id="mfix-pr-orient" style="width:100%;padding:10px;border-radius:9px;margin-top:5px"><option value="PORTRAIT">לאורך</option><option value="LANDSCAPE" ${s.orientation==='LANDSCAPE'?'selected':''}>לרוחב</option></select>
   <div style="margin-top:12px">עותקים</div><input id="mfix-pr-copies" type="number" min="1" max="9" value="${Number(s.copies)||1}" style="width:100%;box-sizing:border-box;padding:10px;border-radius:9px;border:0;margin-top:5px">
   <div style="margin-top:12px">אורך נייר לקבלה</div><select id="mfix-pr-height" style="width:100%;padding:10px;border-radius:9px;margin-top:5px"><option value="120" ${Number(s.rollHeightMm)===120?'selected':''}>120 מ״מ — קצר</option><option value="150" ${Number(s.rollHeightMm)===150?'selected':''}>150 מ״מ</option><option value="200" ${Number(s.rollHeightMm||200)===200?'selected':''}>200 מ״מ — מומלץ</option><option value="250" ${Number(s.rollHeightMm)===250?'selected':''}>250 מ״מ</option><option value="300" ${Number(s.rollHeightMm)===300?'selected':''}>300 מ״מ</option></select>
   <label style="display:flex;align-items:center;gap:9px;margin-top:14px;padding:11px;background:#1d1d1d;border-radius:10px"><input id="mfix-pr-cut" type="checkbox" ${s.autoCut!==false?'checked':''} style="transform:scale(1.35)"><span><b>✂️ חיתוך אוטומטי בסוף הדפסה</b><br><small style="color:#aaa">נשלחת פקודת trim הרשמית של ChromeOS למדפסת</small></span></label>
   <div id="mfix-pr-cap" style="margin-top:8px;color:#fbbf24;font-size:12px">${ps.find(x=>x.printer.id===s.printerId)?.supportsCut?'✓ הדרייבר מדווח על תמיכת חיתוך':'נבדקת תמיכת חיתוך לפי הדרייבר של המדפסת'}</div>
   <div style="margin-top:12px;padding:10px;background:#1d1d1d;border-radius:10px;color:#ddd;line-height:1.5"><b style="color:#fb923c">מה תוקן:</b><br>לא שולחים יותר גובה A4 של 297 מ״מ — זה מה שיצר את עודף הנייר הלבן. כעת אורך הגליל נשלט כאן ונשמר קבוע.</div>
   <div id="mfix-pr-status" style="min-height:20px;margin-top:10px;color:#fbbf24"></div>
   <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"><button id="mfix-pr-save" style="padding:12px;border:0;border-radius:10px;background:#f97316;color:#111;font-weight:900">💾 שמור</button><button id="mfix-pr-test" style="padding:12px;border:0;border-radius:10px;background:#16a34a;color:white;font-weight:900">🧾 ניסיון</button><button id="mfix-pr-preview" style="padding:12px;border:0;border-radius:10px;background:#2563eb;color:white;font-weight:900">👁️ תצוגה</button></div><div id="mfix-pr-preview-box" style="display:none;margin-top:12px;background:#eee;border-radius:10px;padding:8px;text-align:center"><div style="color:#111;font-weight:bold;margin-bottom:6px">תצוגה מקדימה של הקבלה האחרונה</div><iframe id="mfix-pr-preview-frame" style="width:100%;height:430px;border:0;background:white;border-radius:6px"></iframe></div>`;
   document.documentElement.appendChild(p);
   p.querySelector('#mfix-pr-x').onclick=()=>p.remove();
   const settings=()=>({printerId:p.querySelector('#mfix-pr-printer').value,paperMode:p.querySelector('#mfix-pr-paper').value,fit:p.querySelector('#mfix-pr-fit').value,orientation:p.querySelector('#mfix-pr-orient').value,copies:Number(p.querySelector('#mfix-pr-copies').value)||1,rollHeightMm:Number(p.querySelector('#mfix-pr-height').value)||200,autoCut:p.querySelector('#mfix-pr-cut').checked,autoPrint:true});
   p.querySelector('#mfix-pr-save').onclick=async()=>{const r=await msg({type:'MFIX_PRINT_1535_SAVE',settings:settings()});p.querySelector('#mfix-pr-status').textContent=r?.ok?'נשמר קבוע ✓':'שגיאה: '+(r?.error||'')};
   p.querySelector('#mfix-pr-test').onclick=async()=>{const st=p.querySelector('#mfix-pr-status');st.textContent='שולח ניסיון…';await msg({type:'MFIX_PRINT_1535_SAVE',settings:settings()});const r=await msg({type:'MFIX_PRINT_1535_TEST'});st.textContent=r?.ok?'נשלח למדפסת ✓':'שגיאה: '+(r?.error||'')};
   p.querySelector('#mfix-pr-preview').onclick=()=>{const st=p.querySelector('#mfix-pr-status');let b64='';try{b64=sessionStorage.getItem('mfixLastNativePdf614')||''}catch(_){}if(!b64){st.textContent='אין עדיין קבלה אחרונה — הדפס קבלה אחת ואז פתח תצוגה';return}const bin=atob(b64),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);const url=URL.createObjectURL(new Blob([a],{type:'application/pdf'}));const box=p.querySelector('#mfix-pr-preview-box'),fr=p.querySelector('#mfix-pr-preview-frame');fr.src=url;box.style.display='block';st.textContent='תצוגה מקדימה נטענה ✓'};
 }
 function inject(){
   const settings=document.getElementById('mfix-pos-settings-800');
   if(!settings || settings.querySelector('#mfix-print-settings-btn-167'))return;
   const b=document.createElement('button');b.id='mfix-print-settings-btn-167';b.textContent='🖨️ הגדרות הדפסה קבועות';
   b.style.cssText='width:100%;margin-top:8px;padding:11px;border:0;border-radius:10px;background:#f97316;color:#111;font-weight:1000';
   b.onclick=e=>{e.preventDefault();e.stopPropagation();openPanel()};
   settings.appendChild(b);
 }
 new MutationObserver(inject).observe(document.documentElement,{subtree:true,childList:true});
 setInterval(inject,1200);
})();

// ===== MFIX 15.3.6 ChromeOS native-print dialog hard block =====
// Superseded in 15.3.7: the actual window.print() override now lives in
// interceptor.js, which runs in the page's main world and can reach the
// real window object. The isolated-world attempt that used to be here was
// a no-op (see MFIX code review, Sep 2026) and has been removed.


// ===== MFIX 16.9.0 — POS Backup / Restore =====
(()=>{
  const PREFIX='mfix';
  const isMfixKey=k=>/^(mfix|MFIX)/.test(String(k||''));

  async function mfixBackup169(){
    const local={}, session={}, chromeLocal={};
    try{
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i); if(k&&isMfixKey(k)) local[k]=localStorage.getItem(k);
      }
      for(let i=0;i<sessionStorage.length;i++){
        const k=sessionStorage.key(i); if(k&&isMfixKey(k)) session[k]=sessionStorage.getItem(k);
      }
    }catch(_){}
    try{
      if(chrome?.storage?.local){
        const all=await chrome.storage.local.get(null);
        for(const [k,v] of Object.entries(all||{})) if(isMfixKey(k)) chromeLocal[k]=v;
      }
    }catch(_){}

    const payload={
      app:'MFIX POS',
      format:'MFIX-POS-BACKUP',
      version:'16.9.0',
      createdAt:new Date().toISOString(),
      localStorage:local,
      sessionStorage:session,
      chromeStorage:chromeLocal
    };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='MFIX-POS-BACKUP-'+new Date().toISOString().slice(0,10)+'.json';
    document.documentElement.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    try{toast('גיבוי MFIX POS נשמר ✓',2200)}catch(_){}
  }

  async function mfixRestore169(file){
    const text=await file.text();
    const d=JSON.parse(text||'{}');
    if(d?.format!=='MFIX-POS-BACKUP') throw new Error('invalid');
    if(!confirm('לייבא את גיבוי MFIX POS? ההגדרות והנתונים הקיימים של התוסף יוחלפו.')) return;

    try{
      for(const [k,v] of Object.entries(d.localStorage||{}))
        if(isMfixKey(k)) localStorage.setItem(k,String(v));
      for(const [k,v] of Object.entries(d.sessionStorage||{}))
        if(isMfixKey(k)) sessionStorage.setItem(k,String(v));
      if(chrome?.storage?.local && d.chromeStorage && Object.keys(d.chromeStorage).length)
        await chrome.storage.local.set(d.chromeStorage);
    }catch(_){}
    try{toast('הגיבוי יובא ✓ — התוסף נטען מחדש',1800)}catch(_){}
    setTimeout(()=>location.reload(),700);
  }

  function addBackupUi169(){
    const settings=document.getElementById('mfix-pos-settings-800');
    if(!settings || settings.querySelector('#mfix-backup-row-169')) return;

    const row=document.createElement('div');
    row.id='mfix-backup-row-169';
    row.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px';

    const backup=document.createElement('button');
    backup.type='button'; backup.textContent='💾 גיבוי התוסף';
    backup.style.cssText='border:0;border-radius:10px;padding:11px;background:#0369a1;color:#fff;font-weight:900';

    const restore=document.createElement('button');
    restore.type='button'; restore.textContent='📥 ייבוא גיבוי';
    restore.style.cssText='border:0;border-radius:10px;padding:11px;background:#0f766e;color:#fff;font-weight:900';

    backup.onclick=e=>{e.preventDefault();e.stopPropagation();mfixBackup169().catch(()=>{try{toast('שגיאה ביצירת גיבוי',2200)}catch(_){}})};
    restore.onclick=e=>{
      e.preventDefault();e.stopPropagation();
      const input=document.createElement('input');
      input.type='file'; input.accept='.json,application/json';
      input.onchange=()=>{const f=input.files?.[0];if(f)mfixRestore169(f).catch(()=>{try{toast('קובץ גיבוי לא תקין',2200)}catch(_){}})};
      input.click();
    };
    row.append(backup,restore);
    settings.appendChild(row);
  }

  new MutationObserver(addBackupUi169).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(addBackupUi169,1000);
})();


// Auto fullscreen disabled in 16.9.18 by user request.

// ===== MFIX 16.9.5 PRODUCTIVITY TOOLKIT (ADDITIVE ONLY) =====
(function(){
 const K='mfix1695Sounds';
 const beep=(ok=true)=>{
   if(localStorage.getItem(K)==='0')return;
   try{
     const C=window.AudioContext||window.webkitAudioContext; const c=new C();
     const o=c.createOscillator(),g=c.createGain(); o.frequency.value=ok?880:220;
     g.gain.setValueAtTime(.045,c.currentTime); g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.13);
     o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.14);
   }catch(_){}
 };
 const visible=e=>e&&e.offsetParent!==null;
 const focusSearch=()=>{
   const a=[...document.querySelectorAll('input')].find(e=>visible(e)&&(/חיפוש|ברקוד|מק"ט|מק״ט/i.test(e.placeholder||'')||e.id==='generalSearchInput'));
   if(a){a.focus();a.select?.();return true} return false;
 };
 const countLines=()=>document.querySelectorAll('div.servicesdesk div.lines div.grid-receipt div.item,div.grid-receipt div.item').length;
 let lastCount=countLines(), lastAdded=null;
 setInterval(()=>{
   const n=countLines();
   if(n>lastCount){beep(true);focusSearch();lastAdded=Date.now()}
   lastCount=n;
 },350);

 function modalGeneral(){
   if(document.getElementById('mfix1695-general'))return;
   const w=document.createElement('div');w.id='mfix1695-general';
   w.style.cssText='position:fixed;inset:0;background:#0008;z-index:2147483647;display:flex;align-items:center;justify-content:center;direction:rtl';
   w.innerHTML='<div style="background:#fff;border-radius:16px;padding:18px;width:min(92vw,360px);font-family:Arial;color:#111"><b style="font-size:20px">מוצר כללי</b><div style="margin-top:12px">תיאור (אופציונלי)</div><input id="mfix1695-desc" style="width:100%;padding:10px;box-sizing:border-box;font-size:17px" placeholder="לדוגמה: תיקון / שירות"><div style="margin-top:10px">מחיר</div><input id="mfix1695-price" type="number" inputmode="decimal" style="width:100%;padding:10px;box-sizing:border-box;font-size:20px" placeholder="0.00"><div style="display:flex;gap:8px;margin-top:14px"><button id="mfix1695-cancel" style="flex:1;padding:11px">ביטול</button><button id="mfix1695-ok" style="flex:2;padding:11px;background:#16a34a;color:#fff;border:0;border-radius:8px;font-weight:bold">הוסף</button></div></div>';
   document.documentElement.appendChild(w);
   const close=()=>w.remove(); w.querySelector('#mfix1695-cancel').onclick=close;
   let generalBusy=false;
   const run=async()=>{
     if(generalBusy)return;
     generalBusy=true;
     const p=Number(w.querySelector('#mfix1695-price').value);
     const d=w.querySelector('#mfix1695-desc').value.trim();
     if(!(p>0)){generalBusy=false;beep(false);w.querySelector('#mfix1695-price').focus();return}
     // Keep the custom text in ONE dedicated value. Do not write it to both the
     // product name and description paths, which caused duplicated text.
     window.__mfixGeneralCustomName639=d||'';
     window.__mfixGeneralName639=d||'מוצר כללי';
     try{sessionStorage.setItem('mfix1695GeneralDescription',window.__mfixGeneralName639)}catch(_){}
     w.querySelector('#mfix1695-ok').disabled=true;
     close();
     try{
       if(typeof mfixAddGeneralProduct639AtLite700==='function'){
         const ok=await mfixAddGeneralProduct639AtLite700(p,window.__mfixGeneralName639);
         if(ok)beep(true); else beep(false);
       }else{toast('מנוע מוצר כללי לא זמין',2200);beep(false)}
     }catch(_){beep(false);toast('הוספת מוצר כללי נכשלה',2200)}
   };
   w.querySelector('#mfix1695-ok').onclick=run;
   w.querySelector('#mfix1695-price').addEventListener('keydown',e=>{if(e.key==='Enter')run()});
   setTimeout(()=>w.querySelector('#mfix1695-price').focus(),50);
 }
 function quickBar(){
   if(document.getElementById('mfix1695-bar'))return;
   const b=document.createElement('div');b.id='mfix1695-bar';
   b.style.cssText='position:fixed;right:8px;bottom:8px;z-index:2147483000;display:flex;gap:6px;align-items:center;background:#ffffffee;padding:6px;border-radius:12px;box-shadow:0 2px 12px #0004;direction:rtl;font-family:Arial';
   b.innerHTML='<button id="mfix1695-general-btn">מוצר כללי</button><button id="mfix1695-search-btn">חיפוש</button><button id="mfix1695-sound-btn">🔊</button>';
   [...b.querySelectorAll('button')].forEach(x=>x.style.cssText='border:0;border-radius:8px;padding:9px 10px;background:#1f2937;color:#fff;font-weight:bold');
   b.querySelector('#mfix1695-general-btn').onclick=modalGeneral;
   b.querySelector('#mfix1695-search-btn').onclick=focusSearch;
   b.querySelector('#mfix1695-sound-btn').onclick=()=>{localStorage.setItem(K,localStorage.getItem(K)==='0'?'1':'0');toast(localStorage.getItem(K)==='0'?'צלילים כבויים':'צלילים פעילים',1000)};
   document.documentElement.appendChild(b);
 }
 setInterval(()=>{document.getElementById('mfix1695-bar')?.remove()},1000);

 document.addEventListener('keydown',e=>{
   if(e.key==='F2'){e.preventDefault();focusSearch()}
   if(e.key==='F9'){e.preventDefault();localStorage.setItem(K,localStorage.getItem(K)==='0'?'1':'0');toast(localStorage.getItem(K)==='0'?'צלילים כבויים':'צלילים פעילים',1000)}
   if(e.key==='F7'){e.preventDefault();const x=[...document.querySelectorAll('button,a,div')].find(el=>visible(el)&&/הסר|מחיקת פריט|מחק פריט/.test((el.innerText||'').trim())); if(x){x.click();toast('נשלחה בקשת הסרת פריט',1200)}else{beep(false);toast('לא נמצא כפתור הסרה',1500)}}
 },true);
 window.addEventListener('mfix-product-add-failed',()=>beep(false));
})();
