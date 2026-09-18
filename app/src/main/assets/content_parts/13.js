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