package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds practical local users and permission controls to Settings. */
public class UserPermissionsPatchActivity extends ReportsAnalyticsPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixUsersV1)return;window.__mfixUsersV1=true;"+
        "function read(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}"+
        "function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}"+
        "function users(){var a=read('mfix_users_v1',null);if(!Array.isArray(a)||!a.length){a=[{id:'admin',name:'מנהל',role:'admin',active:true}];save('mfix_users_v1',a);}return a;}"+
        "function render(){var v=document.getElementById('view-settings');if(!v)return false;if(document.getElementById('mfixUsersPermissions'))return true;var b=document.createElement('div');b.id='mfixUsersPermissions';b.className='card';b.style.marginTop='12px';b.innerHTML='<div class=\"section-title\">👥 משתמשים והרשאות</div><div class=\"muted\">ניהול משתמשים מקומי והרשאת מנהל/קופאי.</div><div class=\"grid2\" style=\"margin-top:10px\"><div class=\"field\"><label class=\"flabel\">שם משתמש</label><input id=\"mfixUserName\" class=\"input\" placeholder=\"שם\"></div><div class=\"field\"><label class=\"flabel\">הרשאה</label><select id=\"mfixUserRole\" class=\"input\"><option value=\"cashier\">קופאי</option><option value=\"admin\">מנהל</option></select></div></div><div style=\"display:flex;gap:8px;flex-wrap:wrap;margin-top:10px\"><button id=\"mfixAddUser\" class=\"btn btn-primary\">➕ הוסף משתמש</button></div><div id=\"mfixUserList\" style=\"margin-top:12px\"></div>';function refresh(){var a=users();b.querySelector('#mfixUserList').innerHTML=a.map(function(u){return '<div style=\"display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eee;padding:9px 0;gap:8px\"><div><b>'+String(u.name).replace(/[<>]/g,'')+'</b><div class=\"muted\">'+(u.role==='admin'?'מנהל':'קופאי')+'</div></div><button class=\"btn btn-ghost\" data-id=\"'+u.id+'\">'+(u.active?'השבת':'הפעל')+'</button></div>';}).join('');b.querySelectorAll('[data-id]').forEach(function(btn){btn.onclick=function(){var a=users(),id=btn.getAttribute('data-id');a=a.map(function(u){if(u.id===id&&u.id!=='admin')u.active=!u.active;return u;});save('mfix_users_v1',a);refresh();};});}b.querySelector('#mfixAddUser').onclick=function(){var name=b.querySelector('#mfixUserName').value.trim();if(!name){if(window.toast)window.toast('יש להזין שם משתמש','warn');return;}var a=users();if(a.some(function(u){return u.name===name;})){if(window.toast)window.toast('המשתמש כבר קיים','warn');return;}a.push({id:'u_'+Date.now(),name:name,role:b.querySelector('#mfixUserRole').value,active:true});save('mfix_users_v1',a);b.querySelector('#mfixUserName').value='';refresh();if(window.toast)window.toast('המשתמש נוסף','ok');};v.appendChild(b);refresh();return true;}var n=0,t=setInterval(function(){if(render()||n++>=40)clearInterval(t);},500);})();";
    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),7400);
    }
}
