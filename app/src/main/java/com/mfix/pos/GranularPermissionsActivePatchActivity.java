package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Live launcher: inventory + IMEI/serial + product editing + user permissions + checkout controls + payments + reports + Yesh Invoice + backup/restore + cash shift + automatic receipt printing. */
public class GranularPermissionsActivePatchActivity extends ProductEditPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixGranularPermissions)return;window.__mfixGranularPermissions=true;"+
        "var KEY='mfix_users_v2';var TABS=['pos','inventory','customers','repairs','reports','settings'];"+
        "function read(){try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}"+
        "function write(a){localStorage.setItem(KEY,JSON.stringify(a));}"+
        "function esc(s){return String(s==null?'':s).replace(/[&<>\\\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[c];});}"+
        "function label(t){return {pos:'קופה',inventory:'מלאי',customers:'לקוחות',repairs:'תיקונים',reports:'דוחות',settings:'הגדרות'}[t]||t;}"+
        "function card(){var v=document.getElementById('view-settings');if(!v)return false;if(document.getElementById('mfixGranularCard'))return true;var b=document.createElement('div');b.id='mfixGranularCard';b.className='card';b.style.marginBottom='12px';b.innerHTML='<div class=\"section-title\">🔐 הרשאות לפי משתמש</div><div class=\"muted\" style=\"font-size:12px;margin-bottom:10px\">ניתן להגביל משתמשים למסכים מסוימים. מנהלים מקבלים גישה מלאה כברירת מחדל.</div><div id=\"mfixGranularRows\"></div>';v.insertBefore(b,v.firstChild);function draw(){var a=read();b.querySelector('#mfixGranularRows').innerHTML=a.length? a.map(function(u,i){var p=u.permissions||{};return '<div class=\"card\" style=\"background:var(--gray-50);margin-bottom:8px\"><b>'+esc(u.name)+'</b><div class=\"muted\" style=\"font-size:11px;margin:3px 0 8px\">'+(u.role==='manager'?'מנהל':'קופאי')+'</div><div style=\"display:flex;gap:6px;flex-wrap:wrap\">'+TABS.map(function(t){var on=u.role==='manager'||p[t]!==false;return '<button type=\"button\" class=\"btn '+(on?'btn-primary':'btn-ghost')+'\" data-gp=\"'+i+'|'+t+'\">'+(on?'✓ ':'')+label(t)+'</button>';}).join('')+'</div></div>';}).join(''):'<div class=\"empty-state\" style=\"padding:16px\">אין משתמשים מוגדרים.</div>';b.querySelectorAll('[data-gp]').forEach(function(x){x.onclick=function(){var z=x.dataset.gp.split('|'),i=Number(z[0]),t=z[1],a=read(),u=a[i];if(!u||u.role==='manager')return;if(!u.permissions)u.permissions={};u.permissions[t]=u.permissions[t]===false;write(a);draw();toast('הרשאה עודכנה','ok');};});}draw();return true;}"+
        "function enforce(){if(typeof window.tabAllowed!=='function'||window.__mfixGranularWrapped)return;var old=window.tabAllowed;window.tabAllowed=function(tab){if(STATE.currentRole==='manager')return true;var id=STATE.currentUserId||'',u=read().find(function(x){return String(x.id)===String(id)&&x.active!==false;});if(u&&u.permissions&&u.permissions[tab]===false)return false;return old(tab);};window.__mfixGranularWrapped=true;if(typeof forceShellRebuild==='function'&&!tabAllowed(STATE.activeTab)){STATE.activeTab='pos';forceShellRebuild();}}"+
        "function syncUsers(){try{var target='mfix_users_v1',sources=['mfix_pos_users_v1','mfix_users_v2'],best=null;for(var i=0;i<sources.length;i++){var v=localStorage.getItem(sources[i]);if(v){try{var a=JSON.parse(v);if(Array.isArray(a)&&a.length){best=v;break;}}catch(e){}}}if(best)localStorage.setItem(target,best);}catch(e){console.error('[MFIX BACKUP USERS]',e);}}"+
        "function restoreUsers(){try{var v=localStorage.getItem('mfix_users_v1');if(!v)return;for(var i=0;i<2;i++){var k=i===0?'mfix_pos_users_v1':'mfix_users_v2';try{var a=JSON.parse(v);if(Array.isArray(a)&&a.length)localStorage.setItem(k,v);}catch(e){}}}catch(e){}}"+
        "restoreUsers();syncUsers();setInterval(syncUsers,1500);"+
        "var n=0;function loop(){n++;card();enforce();if(n<100)setTimeout(loop,800);}loop();console.log('[MFIX] granular permissions + inventory + checkout + payments + reports chain active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView){
            WebView webView=(WebView)root;
            webView.postDelayed(()->{
                webView.evaluateJavascript(PATCH,null);
                PrinterManagementPatchActivity.install(webView);
                BusinessSettingsPatchActivity.install(webView);
                CheckoutControlsPatchActivity.install(webView);
                PaymentManagementPatchActivity.install(webView);
                CompletedSalesReportsSyncPatchActivity.install(webView);
                DailyClosingPatchActivity.install(webView);
                CashRegisterShiftPatchActivity.install(webView);
                ReceiptPrintingPatchActivity.install(webView);
                YeshInvoicePatchActivity.install(webView);
                BackupRestoreLiveInstaller.install(webView);
            },2500);
        }
    }
}
