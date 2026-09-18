
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