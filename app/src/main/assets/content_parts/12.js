
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