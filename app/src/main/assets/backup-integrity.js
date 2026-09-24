(()=>{
  'use strict';
  if(window.__MFIX_BACKUP_INTEGRITY_180__) return;
  window.__MFIX_BACKUP_INTEGRITY_180__=true;

  const CORE=()=>window.MFIXBackupCore170;
  const toastSafe=(msg)=>{try{if(typeof toast==='function')toast(msg,2400);else alert(msg)}catch(_) {}};

  function canonical(v){
    if(Array.isArray(v)) return '['+v.map(canonical).join(',')+']';
    if(v && typeof v==='object') return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
    return JSON.stringify(v);
  }

  async function digestPayload(payload){
    if(!globalThis.crypto?.subtle) throw new Error('SHA-256 אינו זמין במכשיר');
    const clean={...payload};
    delete clean.integrity;
    const bytes=new TextEncoder().encode(canonical(clean));
    const hash=await crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function parse(text){
    try{return JSON.parse(text)}catch(_){throw new Error('קובץ JSON לא תקין')}
  }

  async function save(){
    const core=CORE();
    if(!core?.buildBackup) throw new Error('מנגנון הגיבוי אינו זמין');
    const payload=await core.buildBackup();
    core.validateBackupPayload(payload);
    payload.integrity={algorithm:'SHA-256',digest:await digestPayload(payload)};
    const text=JSON.stringify(payload,null,2);
    const blob=new Blob([text],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='MFIX-POS-FULL-BACKUP-'+new Date().toISOString().slice(0,10)+'.json';
    document.documentElement.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    toastSafe('גיבוי מלא אומת ונשמר ✓ SHA-256');
    return payload;
  }

  async function restore(file){
    const text=await file.text();
    const payload=parse(text);
    if(payload.integrity?.algorithm!=='SHA-256' || !payload.integrity.digest)
      throw new Error('לגיבוי חסומה חתימת תקינות SHA-256. צור גיבוי חדש לפני שחזור.');
    const expected=String(payload.integrity.digest).toLowerCase();
    const actual=(await digestPayload(payload)).toLowerCase();
    if(expected!==actual) throw new Error('בדיקת תקינות נכשלה — קובץ הגיבוי השתנה או נפגם');
    const core=CORE();
    if(!core?.restoreBackup) throw new Error('מנגנון השחזור אינו זמין');
    const cleanText=JSON.stringify(payload);
    return core.restoreBackup(new File([cleanText],'MFIX-POS-verified-backup.json',{type:'application/json'}));
  }

  window.MFIXBackupIntegrity180={save,restore,digestPayload};

  function wire(){
    const settings=document.getElementById('mfix-pos-settings-800');
    if(!settings)return false;
    const row=document.getElementById('mfix-backup-core-row-170');
    if(!row)return false;
    const buttons=row.querySelectorAll('button');
    if(buttons.length<2)return false;
    buttons[0].onclick=e=>{e.preventDefault();e.stopPropagation();save().catch(err=>toastSafe('גיבוי נכשל: '+(err?.message||err)))};
    buttons[1].onclick=e=>{e.preventDefault();e.stopPropagation();const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=()=>{const f=input.files?.[0];if(f)restore(f).catch(err=>toastSafe('שחזור נכשל: '+(err?.message||err)))};input.click()};
    return true;
  }

  const observer=new MutationObserver(wire);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(wire,1000);
  setTimeout(wire,300);
})();
