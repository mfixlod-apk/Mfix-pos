/* MFIX backup/restore safety layer.
 * Makes backup import persistence deterministic instead of relying on the
 * debounced persist() writer. This matters because restore must not report
 * success before the restored datasets have actually been written.
 */
(function(){
  'use strict';

  function canRestore(){
    try{
      if(window.MFIXUsers && typeof window.MFIXUsers.can==='function'){
        return !!window.MFIXUsers.can('backup');
      }
    }catch(_){}
    // Keep compatibility with installations where the users module is not loaded.
    return true;
  }

  function install(){
    if(typeof window.importBackup!=='function' || typeof window.saveKey!=='function') return false;
    if(window.__mfixBackupRestoreSafetyInstalled) return true;

    const originalImport=window.importBackup;
    const originalPersist=window.persist;

    window.importBackup=function(evt){
      if(!canRestore()){
        try{
          if(typeof window.toast==='function') window.toast('אין הרשאה לשחזור גיבוי','err');
          else alert('אין הרשאה לשחזור גיבוי');
        }catch(_){}
        return false;
      }

      const directPersist=async function(part){
        const directMap={settings:'settings',products:'products',customers:'customers',sales:'sales',repairs:'repairs'};
        if(directMap[part]){
          const key=STORAGE_KEYS[part];
          return await saveKey(key, window.STATE[part], {silent:false});
        }
        if(['returns','preorders','giftCards','auditLog','inventoryHistory','shifts','currentShift'].includes(part)){
          const bundle={
            returns:window.STATE.returns||[],
            shifts:window.STATE.shifts||[],
            giftCards:window.STATE.giftCards||[],
            preorders:window.STATE.preorders||[],
            auditLog:window.STATE.auditLog||[],
            inventoryHistory:window.STATE.inventoryHistory||[]
          };
          return await saveKey(STORAGE_KEYS.misc,bundle,{silent:false});
        }
        return true;
      };

      window.persist=directPersist;
      try{
        return originalImport.call(this,evt);
      }finally{
        window.persist=originalPersist;
      }
    };

    window.__mfixBackupRestoreSafetyInstalled=true;
    return true;
  }

  if(!install()){
    let attempts=0;
    const timer=setInterval(function(){
      attempts++;
      if(install() || attempts>=100) clearInterval(timer);
    },50);
  }
})();