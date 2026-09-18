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