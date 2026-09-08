package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Runtime user/role layer. Keeps the printer and existing safety layers intact. */
public class UsersPermissionsPatchActivity extends RuntimeSafetyPatchActivity {
    private static final String USERS_PATCH =
        "(function(){" +
        "if(window.__mfixUsersPatch)return;window.__mfixUsersPatch=true;" +
        "var KEY='mfix_pos_users_v1',ROLE_KEY='mfix_pos_active_user_v1';" +
        "function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]');}catch(e){return [];}}" +
        "function save(v){localStorage.setItem(KEY,JSON.stringify(v));}" +
        "function users(){var u=load();if(!u.length){u=[{id:'manager',name:'מנהל',role:'manager',pin:'1234',active:true}];save(u);}return u;}" +
        "function active(){var id=localStorage.getItem(ROLE_KEY)||'manager';return users().find(function(u){return u.id===id&&u.active!==false;})||users()[0];}" +
        "function isManager(){return active().role==='manager';}" +
        "window.mfixOpenUsers=function(){var u=users(),rows=u.map(function(x){return '<tr><td>'+x.name+'</td><td>'+({manager:'מנהל',cashier:'קופאי'}[x.role]||x.role)+'</td><td>'+(x.active===false?'לא פעיל':'פעיל')+'</td><td><button class=\\\"btn btn-ghost\\\" onclick=\\\"mfixLoginUser(\\\''+x.id+'\\\')\\\">החלף</button> '+(x.id==='manager'?'':'<button class=\\\"btn btn-red\\\" onclick=\\\"mfixToggleUser(\\\''+x.id+'\\\')\\\">'+(x.active===false?'הפעל':'השבת')+'</button>')+'</td></tr>';}).join('');var html='<div class=\\\"modal wide\\\"><div class=\\\"modal-head\\\"><h3>👥 משתמשים והרשאות</h3><button class=\\\"modal-close\\\" onclick=\\\"closeModal()\\\">✕</button></div><div class=\\\"modal-body\\\"><div class=\\\"card\\\" style=\\\"margin-bottom:14px\\\"><b>משתמש פעיל: '+active().name+'</b><div class=\\\"muted\\\">הרשאת '+(isManager()?'מנהל מלא':'קופאי — ללא גישה להגדרות/דוחות/ניהול משתמשים')+'</div></div><table class=\\\"tbl\\\"><thead><tr><th>שם</th><th>תפקיד</th><th>סטטוס</th><th></th></tr></thead><tbody>'+rows+'</tbody></table><hr><div class=\\\"grid3\\\"><input id=\\\"mfixUserName\\\" class=\\\"input\\\" placeholder=\\\"שם משתמש\\\"><select id=\\\"mfixUserRole\\\" class=\\\"input\\\"><option value=\\\"cashier\\\">קופאי</option><option value=\\\"manager\\\">מנהל</option></select><input id=\\\"mfixUserPin\\\" class=\\\"input\\\" type=\\\"password\\\" inputmode=\\\"numeric\\\" placeholder=\\\"PIN 4 ספרות\\\"></div></div><div class=\\\"modal-foot\\\"><button class=\\\"btn btn-primary\\\" onclick=\\\"mfixAddUser()\\\">הוסף משתמש</button></div></div>';openModal(html,{wide:true});};" +
        "window.mfixAddUser=function(){if(!isManager()){toast('אין הרשאה לניהול משתמשים','err');return;}var n=document.getElementById('mfixUserName').value.trim(),r=document.getElementById('mfixUserRole').value,p=document.getElementById('mfixUserPin').value;if(!n||!/^[0-9]{4,8}$/.test(p)){toast('יש להזין שם ו-PIN בן 4–8 ספרות','err');return;}var u=users();u.push({id:'u_'+Date.now(),name:n,role:r,pin:p,active:true});save(u);mfixOpenUsers();toast('המשתמש נוסף','ok');};" +
        "window.mfixToggleUser=function(id){if(!isManager()){toast('אין הרשאה','err');return;}var u=users();u.forEach(function(x){if(x.id===id)x.active=!x.active;});save(u);mfixOpenUsers();};" +
        "window.mfixLoginUser=function(id){var x=users().find(function(v){return v.id===id&&v.active!==false;});if(!x)return;var pin=prompt('הזן PIN עבור '+x.name);if(pin===x.pin){localStorage.setItem(ROLE_KEY,x.id);if(window.STATE)STATE.currentRole=x.role;toast('נכנסת כ-'+x.name,'ok');closeModal();apply();}else if(pin!==null)toast('PIN שגוי','err');};" +
        "function protectedArea(el){var t=(el.textContent||'')+' '+(el.getAttribute&&el.getAttribute('onclick')||'');return /הגדר|דוח|report|settings|mfixOpenUsers/i.test(t);}" +
        "document.addEventListener('click',function(e){if(isManager())return;var n=e.target.closest('button,.navtab,a');if(n&&protectedArea(n)){e.preventDefault();e.stopImmediatePropagation();toast('פעולה זו זמינה למנהל בלבד','err');}},true);" +
        "function apply(){if(window.STATE)STATE.currentRole=active().role;var host=document.querySelector('.topbar-right');if(host&&!document.getElementById('mfixUsersButton')){var b=document.createElement('button');b.id='mfixUsersButton';b.className='btn btn-outline';b.textContent='👤 '+active().name;b.onclick=function(){if(isManager())mfixOpenUsers();else mfixLoginUser('manager');};host.insertBefore(b,host.firstChild);}else{var b=document.getElementById('mfixUsersButton');if(b)b.textContent='👤 '+active().name;}}" +
        "users();apply();setInterval(apply,1000);console.log('[MFIX] users and permissions patch active');" +
        "})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup) findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) {
            ((WebView) root).postDelayed(() -> ((WebView) root).evaluateJavascript(USERS_PATCH, null), 1500);
        }
    }
}
