package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Live launcher: inventory + IMEI/serial + product editing + user permissions + checkout controls + payments + reports + Yesh Invoice + backup/restore + cash shift + automatic receipt printing + operational settings. */
public class GranularPermissionsActivePatchActivity extends ProductEditPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixGranularPermissions)return;window.__mfixGranularPermissions=true;"+
        "var KEY='mfix_users_v2';var TABS=['pos','inventory','customers','repairs','reports','settings'];"+
        "function read(){try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}"+
        "function write(a){localStorage.setItem(KEY,JSON.stringify(a));}"+
        "function esc(s){return String(s==null?'':s).replace(/[&<>\\\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[c];});}"+
        "function label(t){return {pos:'קופה',inventory:'מלאי',customers:'לקוחות',repairs:'תיקונים',reports:'דוחות',settings:'הגדרות'}[t]||t;}"+
        "function usersForLogin(){return read().filter(function(u){return u&&u.active!==false&&u.name&&u.pin&&/^\\d{4,12}$/.test(String(u.pin));});}"+
        "function openUserLoginModal(mandatory){var users=usersForLogin();if(!users.length){openRoleLoginModal(mandatory);return;}openModal('<div class=\\\"modal wide\\\"><div class=\\\"modal-head\\\"><h3>👤 כניסה אישית לקופה</h3></div><div class=\\\"modal-body\\\"><div class=\\\"muted\\\" style=\\\"font-size:12.5px;margin-bottom:12px\\\">בחרו משתמש פעיל והזינו את ה-PIN האישי שלו. ההרשאות של המשתמש חלות על המשמרת.</div><div style=\\\"display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px\\\">'+users.map(function(u){return '<button type=\\\"button\\\" class=\\\"btn btn-outline btn-lg\\\" data-login-user=\\\"'+esc(u.id)+'\\\">'+(u.role==='manager'?'🔑 ':'🧑‍💼 ')+esc(u.name)+'</button>';}).join('')+'</div><input class=\\\"input\\\" type=\\\"password\\\" id=\\\"loginUserPin\\\" placeholder=\\\"PIN אישי\\\" inputmode=\\\"numeric\\\" maxlength=\\\"12\\\" autofocus><div id=\\\"loginUserError\\\" style=\\\"color:var(--red-600);font-size:12.5px;font-weight:700;margin-top:8px\\\"></div></div><div class=\\\"modal-foot\\\"><button class=\\\"btn btn-primary\\\" id=\\\"loginUserBtn\\\" disabled>כניסה</button></div></div>',{wide:true});var selected='';document.querySelectorAll('[data-login-user]').forEach(function(x){x.onclick=function(){selected=x.dataset.loginUser;document.querySelectorAll('[data-login-user]').forEach(function(y){y.classList.remove('btn-primary');y.classList.add('btn-outline');});x.classList.remove('btn-outline');x.classList.add('btn-primary');document.getElementById('loginUserPin').focus();document.getElementById('loginUserBtn').disabled=false;};});document.getElementById('loginUserBtn').onclick=function(){var pin=(document.getElementById('loginUserPin').value||'').trim(),u=users.find(function(x){return String(x.id)===String(selected);});if(!u){document.getElementById('loginUserError').textContent='בחרו משתמש';return;}if(pin!==String(u.pin)){document.getElementById('loginUserError').textContent='PIN שגוי';return;}STATE.currentUserId=u.id;STATE.currentRole=u.role==='manager'?'manager':'cashier';logAction('כניסת משתמש',u.name+' ('+STATE.currentRole+')');persist('auditLog');if(!tabAllowed(STATE.activeTab))STATE.activeTab='pos';closeModal();forceShellRebuild();toast('נכנסת כ'+u.name,'ok');};}"
        +"function card(){var v=document.getElementById('view-settings');if(!v)return false;if(document.getElementById('mfixGranularCard'))return true;var b=document.createElement('div');b.id='mfixGranularCard';b.className='card';b.style.marginBottom='12px';b.innerHTML='<div class=\\\"section-title\\\">🔐 הרשאות ומשתמשים</div><div class=\\\"muted\\\" style=\\\"font-size:12px;margin-bottom:10px\\\">מנהלים מקבלים גישה מלאה. לקופאים ניתן להגביל מסכים ולהשבית משתמש בלי למחוק את הנתונים שלו.</div><div id=\\\"mfixGranularRows\\\"></div>';v.insertBefore(b,v.firstChild);function draw(){var a=read();b.querySelector('#mfixGranularRows').innerHTML=a.length? a.map(function(u,i){var p=u.permissions||{},active=u.active!==false;return '<div class=\\\"card\\\" style=\\\"background:var(--gray-50);margin-bottom:8px;opacity:'+(active?'1':'.62')+'\\\"><div style=\\\"display:flex;align-items:center;justify-content:space-between;gap:8px\\\"><div><b>'+esc(u.name||'משתמש')+'</b><div class=\\\"muted\\\" style=\\\"font-size:11px;margin:3px 0 8px\\\">'+(u.role==='manager'?'מנהל':'קופאי')+' · '+(active?'פעיל':'מושבת')+'</div></div><button type=\\\"button\\\" class=\\\"btn '+(active?'btn-amber':'btn-green')+'\\\" data-user-active=\\\"'+i+'\\\">'+(active?'השבת משתמש':'הפעל משתמש')+'</button></div><div style=\\\"display:flex;gap:6px;flex-wrap:wrap\\\">'+TABS.map(function(t){var on=u.role==='manager'||p[t]!==false;return '<button type=\\\"button\\\" class=\\\"btn '+(on?'btn-primary':'btn-ghost')+'\\\" data-gp=\\\"'+i+'|'+t+'\\\" '+(u.role==='manager'||!active?'disabled':'')+'>'+(on?'✓ ':'')+label(t)+'</button>';}).join('')+'</div></div>';}).join(''):'<div class=\\\"empty-state\\\" style=\\\"padding:16px\\\">אין משתמשים מוגדרים.</div>';b.querySelectorAll('[data-gp]').forEach(function(x){x.onclick=function(){var z=x.dataset.gp.split('|'),i=Number(z[0]),t=z[1],a=read(),u=a[i];if(!u||u.role==='manager'||u.active===false)return;if(!u.permissions)u.permissions={};u.permissions[t]=u.permissions[t]===false;write(a);draw();toast('הרשאה עודכנה','ok');};});b.querySelectorAll('[data-user-active]').forEach(function(x){x.onclick=function(){var i=Number(x.dataset.userActive),a=read(),u=a[i];if(!u||u.role==='manager')return;u.active=u.active===false;write(a);draw();toast(u.active?'המשתמש הופעל':'המשתמש הושבת','ok');};});}draw();return true;}"+
        "function enforce(){if(typeof window.tabAllowed!=='function'||window.__mfixGranularWrapped)return;var old=window.tabAllowed;window.tabAllowed=function(tab){if(STATE.currentRole==='manager')return true;var id=STATE.currentUserId||'',u=read().find(function(x){return String(x.id)===String(id);});if(u&&u.active===false)return false;if(u&&u.permissions&&u.permissions[tab]===false)return false;return old(tab);};window.__mfixGranularWrapped=true;if(typeof forceShellRebuild==='function'&&(!tabAllowed(STATE.activeTab))){STATE.activeTab='pos';forceShellRebuild();}}"+
        "function syncUsers(){try{var target='mfix_users_v1',sources=['mfix_pos_users_v1','mfix_users_v2'],best=null;for(var i=0;i<sources.length;i++){var v=localStorage.getItem(sources[i]);if(v){try{var a=JSON.parse(v);if(Array.isArray(a)&&a.length){best=v;break;}}catch(e){}}}if(best)localStorage.setItem(target,best);}catch(e){console.error('[MFIX BACKUP USERS]',e);}}"+
        "function restoreUsers(){try{var v=localStorage.getItem('mfix_users_v1');if(!v)return;for(var i=0;i<2;i++){var k=i===0?'mfix_pos_users_v1':'mfix_users_v2';try{var a=JSON.parse(v);if(Array.isArray(a)&&a.length)localStorage.setItem(k,v);}catch(e){}}}catch(e){}}"+
        "restoreUsers();syncUsers();setInterval(syncUsers,1500);"+
        "var n=0;function loop(){n++;card();enforce();if(n<100)setTimeout(loop,800);}loop();console.log('[MFIX] granular permissions + per-user PIN login + user activation + inventory + checkout + payments + reports chain active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView){
            WebView webView=(WebView)root;
            webView.postDelayed(()->{
                webView.evaluateJavascript(PATCH,null);
                PrinterManagementPatchActivity.install(webView);
                BusinessSettingsPatchActivity.install(webView);
                OperationalSettingsActivePatchActivity.install(webView);
                CheckoutControlsPatchActivity.install(webView);
                PaymentManagementPatchActivity.install(webView);
                CompletedSalesReportsSyncPatchActivity.install(webView);
                DailyClosingPatchActivity.install(webView);
                CashRegisterShiftPatchActivity.install(webView);
                ReceiptPrintingPatchActivity.install(webView);
                YeshInvoicePatchActivity.install(webView);
                BackupRestoreLiveInstaller.install(webView);
                LowStockDashboardPatchActivity.install(webView);
                ReportsAnalyticsPatchActivity.install(webView);
                ReportsExportPatchActivity.install(webView);
                BackupRestoreSafetyPatchActivity.install(webView);
                UserManagementPatchActivity.install(webView);
            },2500);
        }
    }
}