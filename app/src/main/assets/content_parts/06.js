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