
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