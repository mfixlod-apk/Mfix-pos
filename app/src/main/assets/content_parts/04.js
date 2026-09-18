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