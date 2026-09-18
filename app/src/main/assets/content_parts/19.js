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
