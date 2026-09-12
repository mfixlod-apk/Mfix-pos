package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Applies the active local user's role to sensitive navigation. */
public class RoleGuardPatchActivity extends UserPermissionsPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixRoleGuardV1)return;window.__mfixRoleGuardV1=true;"+
        "function users(){try{return JSON.parse(localStorage.getItem('mfix_users_v1'))||[];}catch(e){return [];}}"+
        "function current(){var a=users(),id=localStorage.getItem('mfix_pos_active_user_v1')||'admin';return a.find(function(x){return x.id===id&&x.active;})||a.find(function(x){return x.active&&x.role==='admin';})||{id:'admin',name:'מנהל',role:'admin',active:true};}"+
        "function apply(){var u=current(),tabs=document.querySelectorAll('.navtab');tabs.forEach(function(t){if(/הגדרות/.test(t.textContent))t.style.display=u.role==='admin'?'':'none';});var host=document.querySelector('.topbar-right');if(host&&!document.getElementById('mfixRoleBadge')){var s=document.createElement('span');s.id='mfixRoleBadge';s.className='badge blue';host.insertBefore(s,host.firstChild);}var b=document.getElementById('mfixRoleBadge');if(b)b.textContent=u.name+' · '+(u.role==='admin'?'מנהל':'קופאי');}"+
        "var n=0,t=setInterval(function(){apply();if(++n>50)clearInterval(t);},500);})();";
    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),8000);
    }
}
