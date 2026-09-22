/* MFIX backup restore preflight.
 * Rejects empty/oversized/non-JSON/structurally incomplete restore files before the existing importer runs.
 * It mirrors the native restore bridge's required core datasets so direct WebView imports cannot bypass the same safety checks.
 * It does not claim to provide encryption or tamper-proof backup security.
 */
(function(){
  'use strict';
  const MAX_BYTES=25*1024*1024;
  const REQUIRED=['settings','products','customers','sales','repairs'];
  const ARRAY_FIELDS=['products','customers','sales','repairs'];
  let installed=false;

  function toast(msg,kind){
    if(typeof window.toast==='function') window.toast(msg,kind); else alert(msg);
  }
  function validateStructure(value){
    if(!value || typeof value!=='object' || Array.isArray(value)) return 'מבנה הגיבוי אינו תקין';
    const missing=REQUIRED.filter(k=>!(k in value));
    if(missing.length) return 'חסרים נתוני ליבה: '+missing.join(', ');
    for(const key of ARRAY_FIELDS){
      if(!Array.isArray(value[key])) return 'שדה '+key+' אינו רשימה תקינה';
    }
    // Newer backups may carry persisted misc data. Validate it when present,
    // while keeping compatibility with older backups that do not have this key.
    if(value.misc!=null){
      if(typeof value.misc!=='object' || Array.isArray(value.misc)) return 'שדה misc אינו אובייקט תקין';
      if(value.misc.inventoryHistory!=null && !Array.isArray(value.misc.inventoryHistory)){
        return 'שדה misc.inventoryHistory אינו רשימה תקינה';
      }
    }
    return '';
  }
  async function validateEvent(evt){
    const file=evt?.target?.files?.[0]||evt?.files?.[0];
    if(!file) return true;
    if(file.size<=0){ toast('קובץ הגיבוי ריק','err'); return false; }
    if(file.size>MAX_BYTES){ toast('קובץ הגיבוי גדול מדי (מקסימום 25MB)','err'); return false; }
    if(file.name && !/\.json$/i.test(file.name)){
      if(!confirm('שם הקובץ אינו מסתיים ב-JSON. לנסות לייבא בכל זאת?')) return false;
    }
    try{
      const raw=await file.text();
      const parsed=JSON.parse(raw);
      const error=validateStructure(parsed);
      if(error) throw new Error(error);
      return true;
    }catch(error){
      toast('קובץ הגיבוי לא תקין: '+(error&&error.message?error.message:'JSON לא תקין'),'err');
      return false;
    }
  }
  function install(){
    if(installed || typeof window.importBackup!=='function') return !!installed;
    const original=window.importBackup;
    window.importBackup=async function(evt){
      if(!(await validateEvent(evt))) return false;
      return original.call(this,evt);
    };
    installed=true;
    window.__mfixBackupRestoreValidatorInstalled=true;
    return true;
  }
  if(!install()){
    let attempts=0;
    const timer=setInterval(function(){
      attempts++;
      if(install()||attempts>=100) clearInterval(timer);
    },50);
  }
})();
