/* MFIX user-management safety layer.
 * Extends the existing local user UI with safe role changes and prevents
 * removing the last active manager. This remains local application-level control.
 */
(function(){
  'use strict';
  const KEY='mfix_users_permissions_v1';
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}}
  function save(v){try{localStorage.setItem(KEY,JSON.stringify(v));return true}catch(_){return false}}
  function toast(msg,kind){if(typeof window.toast==='function')window.toast(msg,kind);else alert(msg)}
  function activeManagers(users,exceptId){return users.filter(u=>u.active&&u.role==='manager'&&u.id!==exceptId).length}
  function install(){
    if(!window.MFIXUsers||window.MFIXUsers.__managerSafety)return false;
    const original=window.MFIXUsers.edit;
    window.MFIXUsers.edit=function(id){
      const data=load();
      if(!data||!Array.isArray(data.users)){return original(id)}
      const u=data.users.find(x=>x.id===id); if(!u)return;
      const name=prompt('שם המשתמש:',u.name); if(name&&name.trim())u.name=name.trim();
      const nextRole=confirm('להגדיר כמנהל?\nאישור = מנהל, ביטול = קופאי')?'manager':'cashier';
      if(nextRole!==u.role){
        if(u.role==='manager'&&nextRole!=='manager'&&u.active&&activeManagers(data.users,id)===0){toast('לא ניתן להוריד את המנהל הפעיל האחרון לתפקיד קופאי','err');return}
        u.role=nextRole;
      }
      const block=confirm('לחסום את המשתמש?');
      if(block&&u.active&&u.role==='manager'&&activeManagers(data.users,id)===0){toast('לא ניתן לחסום את המנהל הפעיל האחרון','err');return}
      u.active=!block;
      if(u.id===data.currentUserId&&!u.active){const replacement=data.users.find(x=>x.active&&x.id!==u.id);if(!replacement){toast('לא ניתן לחסום את המשתמש הפעיל היחיד','err');return}data.currentUserId=replacement.id}
      if(!save(data)){toast('שמירת המשתמש נכשלה','err');return}
      if(typeof window.MFIXUsers.applyGuards==='function')window.MFIXUsers.applyGuards();
      if(typeof window.MFIXUsers.open==='function')window.MFIXUsers.open();
    };
    window.MFIXUsers.__managerSafety=true;
    return true;
  }
  if(install())return;
  let tries=0;const timer=setInterval(()=>{if(install()||++tries>=40)clearInterval(timer)},500);
})();
