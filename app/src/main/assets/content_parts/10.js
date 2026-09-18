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