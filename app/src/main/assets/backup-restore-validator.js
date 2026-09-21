/* MFIX backup restore preflight.
 * Rejects empty/oversized/non-JSON restore files before the existing importer runs.
 * It does not claim to provide encryption or tamper-proof backup security.
 */
(function(){
  'use strict';
  const MAX_BYTES=25*1024*1024;
  let installed=false;

  function toast(msg,kind){
    if(typeof window.toast==='function') window.toast(msg,kind); else alert(msg);
  }
  function validRoot(value){
    return !!value && typeof value==='object' && !Array.isArray(value);
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
      if(!validRoot(parsed)) throw new Error('מבנה JSON לא תקין');
      return true;
    }catch(_){
      toast('קובץ הגיבוי אינו JSON תקין ולכן לא יובא','err');
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
