(()=>{
  'use strict';
  if(window.__MFIX_BACKUP_CORE_171__) return;
  window.__MFIX_BACKUP_CORE_171__=true;

  const CORE_KEYS=['cp_settings','cp_products','cp_customers','cp_sales','cp_repairs','cp_misc'];
  const PREFIX=/^(mfix|MFIX)/;
  const FORMAT='MFIX-POS-BACKUP';
  const VERSION='17.1.0';

  const toastSafe=(msg)=>{try{if(typeof toast==='function')toast(msg,2200);else alert(msg)}catch(_){}};
  const isCoreKey=k=>CORE_KEYS.includes(String(k||''));
  const isMfixKey=k=>PREFIX.test(String(k||''));

  function readStorage(storage,keysOrPredicate){
    const out={};
    try{
      for(let i=0;i<storage.length;i++){
        const k=storage.key(i);
        if(k && (Array.isArray(keysOrPredicate)?keysOrPredicate.includes(k):keysOrPredicate(k))) out[k]=storage.getItem(k);
      }
    }catch(_){}
    return out;
  }

  async function readChromeStorage(){
    try{
      if(!chrome?.storage?.local)return {};
      const all=await chrome.storage.local.get(null);
      const out={};
      for(const [k,v] of Object.entries(all||{})) if(isMfixKey(k)) out[k]=v;
      return out;
    }catch(_){return {}}
  }

  function parseJsonValue(v){
    if(typeof v!=='string')return v;
    try{return JSON.parse(v)}catch(_){return v}
  }

  function counts(core){
    const count=(k)=>{
      const v=parseJsonValue(core[k]);
      return Array.isArray(v)?v.length:(v&&typeof v==='object'?Object.keys(v).length:(v==null?0:1));
    };
    return {
      products:count('cp_products'),customers:count('cp_customers'),
      sales:count('cp_sales'),repairs:count('cp_repairs')
    };
  }

  async function buildBackup(){
    const core=readStorage(localStorage,CORE_KEYS);
    const mfix=readStorage(localStorage,isMfixKey);
    const session=readStorage(sessionStorage,isMfixKey);
    const chromeStorage=await readChromeStorage();
    const payload={
      app:'MFIX POS',format:FORMAT,version:VERSION,createdAt:new Date().toISOString(),
      schema:{coreKeys:CORE_KEYS.slice(),includesCoreData:true},
      counts:counts(core),
      coreStorage:core,
      mfixStorage:mfix,
      sessionStorage:session,
      chromeStorage
    };
    return payload;
  }

  function validateBackupPayload(d){
    if(!d || d.format!==FORMAT)throw new Error('קובץ הגיבוי אינו MFIX POS');
    if(!d.coreStorage || typeof d.coreStorage!=='object')throw new Error('הגיבוי חסר נתוני קופה');
    for(const k of CORE_KEYS){
      if(!(k in d.coreStorage))throw new Error('הגיבוי חסר: '+k);
    }
    const requiredArrays=['cp_products','cp_customers','cp_sales','cp_repairs'];
    for(const k of requiredArrays){
      const v=parseJsonValue(d.coreStorage[k]);
      if(!Array.isArray(v))throw new Error('נתון '+k+' אינו מערך תקין');
    }
    if(d.coreStorage.cp_settings!=null && typeof parseJsonValue(d.coreStorage.cp_settings)!=='object')
      throw new Error('הגדרות הקופה אינן תקינות');
    if(d.coreStorage.cp_misc!=null && typeof parseJsonValue(d.coreStorage.cp_misc)!=='object')
      throw new Error('נתוני misc אינם תקינים');
    return true;
  }

  function clearKeys(storage,predicate){
    try{
      const keys=[];
      for(let i=0;i<storage.length;i++){const k=storage.key(i);if(k&&predicate(k))keys.push(k)}
      keys.forEach(k=>storage.removeItem(k));
    }catch(_){}
  }

  function writeStorageSnapshot(storage,snapshot,predicate){
    clearKeys(storage,predicate);
    for(const [k,v] of Object.entries(snapshot||{})) storage.setItem(k,String(v));
  }

  async function writeChromeStorageSnapshot(snapshot){
    if(!chrome?.storage?.local)return;
    const current=await chrome.storage.local.get(null);
    const remove=Object.keys(current||{}).filter(isMfixKey);
    if(remove.length)await chrome.storage.local.remove(remove);
    if(snapshot && Object.keys(snapshot).length)await chrome.storage.local.set(snapshot);
  }

  async function restoreBackup(file){
    const text=await file.text();
    let d;
    try{d=JSON.parse(text)}catch(_){throw new Error('קובץ JSON לא תקין')}
    validateBackupPayload(d);

    const c=d.counts||counts(d.coreStorage);
    const summary=`מוצרים ${Number(c.products||0)} · לקוחות ${Number(c.customers||0)} · מכירות ${Number(c.sales||0)} · תיקונים ${Number(c.repairs||0)}`;
    if(!confirm('שחזור גיבוי MFIX POS\n\n'+summary+'\n\nהנתונים הנוכחיים יוחלפו. להמשיך?'))return false;

    // Capture the current dataset first so a failed write can be rolled back.
    const before={
      coreStorage:readStorage(localStorage,k=>isCoreKey(k)),
      mfixStorage:readStorage(localStorage,isMfixKey),
      sessionStorage:readStorage(sessionStorage,isMfixKey),
      chromeStorage:await readChromeStorage()
    };

    try{
      writeStorageSnapshot(localStorage,d.coreStorage,isCoreKey);
      writeStorageSnapshot(localStorage,d.mfixStorage,isMfixKey);
      writeStorageSnapshot(sessionStorage,d.sessionStorage,isMfixKey);
      await writeChromeStorageSnapshot(d.chromeStorage||{});
    }catch(err){
      // Best-effort rollback prevents a failed restore from leaving a mixed dataset.
      try{
        writeStorageSnapshot(localStorage,before.coreStorage,isCoreKey);
        writeStorageSnapshot(localStorage,before.mfixStorage,isMfixKey);
        writeStorageSnapshot(sessionStorage,before.sessionStorage,isMfixKey);
        await writeChromeStorageSnapshot(before.chromeStorage||{});
      }catch(_){ }
      throw new Error('שחזור נכשל והנתונים הקודמים שוחזרו ככל שניתן: '+(err?.message||err));
    }

    toastSafe('שחזור הושלם ✓ — '+summary);
    setTimeout(()=>location.reload(),700);
    return true;
  }

  async function saveBackup(){
    const payload=await buildBackup();
    validateBackupPayload(payload);
    const text=JSON.stringify(payload,null,2);
    const blob=new Blob([text],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='MFIX-POS-FULL-BACKUP-'+new Date().toISOString().slice(0,10)+'.json';
    document.documentElement.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    toastSafe('גיבוי מלא נשמר ✓ — '+counts(payload.coreStorage).products+' מוצרים');
    return payload;
  }

  window.MFIXBackupCore171={buildBackup,validateBackupPayload,saveBackup,restoreBackup,CORE_KEYS:CORE_KEYS.slice()};

  function wire(){
    const settings=document.getElementById('mfix-pos-settings-800');
    if(!settings)return false;
    let row=document.getElementById('mfix-backup-core-row-170');
    if(!row){
      row=document.createElement('div');row.id='mfix-backup-core-row-170';
      row.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px';
      const b=document.createElement('button');b.type='button';b.textContent='💾 גיבוי מלא';
      b.style.cssText='border:0;border-radius:10px;padding:11px;background:#0369a1;color:#fff;font-weight:900';
      const r=document.createElement('button');r.type='button';r.textContent='📥 שחזור מלא';
      r.style.cssText='border:0;border-radius:10px;padding:11px;background:#0f766e;color:#fff;font-weight:900';
      b.onclick=e=>{e.preventDefault();e.stopPropagation();saveBackup().catch(err=>toastSafe('גיבוי נכשל: '+(err?.message||err)))};
      r.onclick=e=>{e.preventDefault();e.stopPropagation();const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=()=>{const f=input.files?.[0];if(f)restoreBackup(f).catch(err=>toastSafe('שחזור נכשל: '+(err?.message||err)))};input.click()};
      row.append(b,r);settings.appendChild(row);
    }
    return true;
  }

  const observer=new MutationObserver(wire);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(wire,1000);
  setTimeout(wire,250);
})();
