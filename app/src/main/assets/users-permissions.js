/* MFIX Users & Permissions
 * Local role/user management for the single-device POS.
 * This is application-level access control, not a secure identity provider.
 */
(function(){
  'use strict';
  const KEY='mfix_users_permissions_v1';
  const DEFAULT={
    users:[
      {id:'manager',name:'מנהל',role:'manager',active:true},
      {id:'cashier',name:'קופאי',role:'cashier',active:true}
    ],
    currentUserId:'manager',
    permissions:{
      manager:{pos:true,inventory:true,reports:true,settings:true,users:true,backup:true},
      cashier:{pos:true,inventory:true,reports:false,settings:false,users:false,backup:false}
    }
  };
  let data=null;
  function load(){
    try{ data=JSON.parse(localStorage.getItem(KEY)||'null'); }catch(_){ data=null; }
    if(!data || !Array.isArray(data.users) || !data.permissions){ data=JSON.parse(JSON.stringify(DEFAULT)); save(); }
    if(!data.users.some(u=>u.id===data.currentUserId)) data.currentUserId=data.users[0]?.id||'manager';
    return data;
  }
  function save(){ try{ localStorage.setItem(KEY,JSON.stringify(data)); }catch(_){} }
  function current(){ return data.users.find(u=>u.id===data.currentUserId)||data.users[0]; }
  function can(permission){ const u=current(); return !!(u && data.permissions[u.role] && data.permissions[u.role][permission]); }
  function toast(msg,kind){ if(typeof window.toast==='function') window.toast(msg,kind); else alert(msg); }
  function open(){
    if(!can('users')){ toast('אין הרשאה לניהול משתמשים','err'); return; }
    const users=data.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${u.role==='manager'?'מנהל':'קופאי'}</td><td>${u.active?'פעיל':'חסום'}</td><td><button class="btn btn-ghost" onclick="window.MFIXUsers.edit('${u.id}')">עריכה</button></td></tr>`).join('');
    const perms=(role)=>Object.entries(data.permissions[role]).map(([k,v])=>`<label style="display:flex;gap:8px;align-items:center;margin:6px 0"><input type="checkbox" data-perm-role="${role}" data-perm="${k}" ${v?'checked':''}> ${label(k)}</label>`).join('');
    const html=`<div class="modal wide"><div class="modal-head"><h3>👤 משתמשים והרשאות</h3><button class="modal-close" onclick="window.closeModal()">×</button></div><div class="modal-body">
      <div class="card" style="margin-bottom:12px"><div class="section-title">משתמש פעיל במכשיר</div><select id="mfixActiveUser" class="input">${data.users.filter(u=>u.active).map(u=>`<option value="${u.id}" ${u.id===data.currentUserId?'selected':''}>${esc(u.name)} — ${u.role==='manager'?'מנהל':'קופאי'}</option>`).join('')}</select><button class="btn btn-primary" style="margin-top:8px" onclick="window.MFIXUsers.setCurrent()">החלף משתמש</button></div>
      <div class="card" style="margin-bottom:12px"><div class="section-title">משתמשים</div><table class="tbl"><thead><tr><th>שם</th><th>תפקיד</th><th>מצב</th><th></th></tr></thead><tbody>${users}</tbody></table><button class="btn btn-outline" style="margin-top:10px" onclick="window.MFIXUsers.add()">＋ הוסף משתמש</button></div>
      <div class="grid2"><div class="card"><div class="section-title">הרשאות מנהל</div>${perms('manager')}</div><div class="card"><div class="section-title">הרשאות קופאי</div>${perms('cashier')}</div></div>
      <div class="muted" style="margin-top:12px;font-size:12px">ההרשאות נשמרות מקומית במכשיר. הן אינן מהוות מערכת התחברות מאובטחת.</div>
    </div><div class="modal-foot"><button class="btn btn-primary" onclick="window.MFIXUsers.savePermissions()">שמור הרשאות</button><button class="btn btn-ghost" onclick="window.closeModal()">סגור</button></div></div>`;
    window.openModal(html,{wide:true});
  }
  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function label(k){return ({pos:'קופה',inventory:'מלאי',reports:'דוחות',settings:'הגדרות',users:'משתמשים',backup:'גיבוי ושחזור'})[k]||k;}
  function add(){
    if(!can('users')) return;
    const name=prompt('שם המשתמש:','משתמש חדש'); if(!name||!name.trim()) return;
    const role=confirm('להגדיר כמנהל?\nאישור = מנהל, ביטול = קופאי')?'manager':'cashier';
    const id='u_'+Date.now().toString(36); data.users.push({id,name:name.trim(),role,active:true}); save(); open(); applyGuards();
  }
  function edit(id){
    const u=data.users.find(x=>x.id===id); if(!u) return;
    const name=prompt('שם המשתמש:',u.name); if(name&&name.trim()) u.name=name.trim();
    if(confirm('לחסום את המשתמש?')) u.active=false; else u.active=true;
    save(); open(); applyGuards();
  }
  function setCurrent(){ const id=document.getElementById('mfixActiveUser')?.value; if(!id) return; data.currentUserId=id; save(); applyGuards(); toast('המשתמש הפעיל עודכן','ok'); open(); }
  function savePermissions(){
    ['manager','cashier'].forEach(role=>{ document.querySelectorAll(`[data-perm-role="${role}"]`).forEach(el=>{ data.permissions[role][el.dataset.perm]=!!el.checked; }); });
    save(); applyGuards(); toast('ההרשאות נשמרו','ok');
  }
  function permissionForButton(btn){
    const tab=btn.getAttribute('data-tab')||'';
    return ({pos:'pos',inventory:'inventory',reports:'reports',settings:'settings'})[tab]||null;
  }
  function applyGuards(){
    load();
    document.querySelectorAll('.navtab').forEach(btn=>{
      const p=permissionForButton(btn); if(!p) return;
      const allowed=can(p); btn.style.display=allowed?'':'none'; btn.setAttribute('aria-disabled',allowed?'false':'true');
      if(!allowed && typeof window.STATE!=='undefined' && window.STATE.activeTab===p && typeof window.switchTab==='function') window.switchTab('pos');
    });
    const existing=document.getElementById('mfixUsersNav');
    if(existing) existing.style.display=can('users')?'flex':'none';
  }
  function install(){
    load();
    const nav=document.querySelector('.navtabs');
    if(nav && !document.getElementById('mfixUsersNav')){
      const b=document.createElement('button'); b.id='mfixUsersNav'; b.className='navtab'; b.innerHTML='<span class="ic">👤</span><span>משתמשים</span>'; b.onclick=open; nav.appendChild(b);
    }
    applyGuards();
  }
  window.MFIXUsers={open,add,edit,setCurrent,savePermissions,can,applyGuards};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
  const obs=new MutationObserver(()=>{ if(document.querySelector('.navtabs')) install(); });
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
