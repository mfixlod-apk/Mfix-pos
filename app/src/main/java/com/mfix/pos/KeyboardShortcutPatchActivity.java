package com.mfix.pos;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds the physical-keyboard shortcut and keeps completed POS sales visible to reports. */
public class KeyboardShortcutPatchActivity extends CheckoutControlsPatchActivity {
    private boolean restarting;

    private static final String SALES_REPORT_SYNC_PATCH =
        "(function(){" +
        "if(window.__mfixCompletedSalesReportSync)return;window.__mfixCompletedSalesReportSync=true;" +
        "function sync(){" +
        "if(!window.STATE||!Array.isArray(window.STATE.sales))return;" +
        "var raw;try{raw=JSON.parse(localStorage.getItem('mfix_completed_sales_v1')||'[]');}catch(e){raw=[];}" +
        "if(!Array.isArray(raw)||!raw.length)return;" +
        "var byId={};window.STATE.sales.forEach(function(s){if(s&&s.id)byId[String(s.id)]=s;});" +
        "var changed=false;raw.forEach(function(s){if(!s||!s.id)return;var id=String(s.id),existing=byId[id];" +
        "if(!existing){var copy=JSON.parse(JSON.stringify(s));var p=copy.payment||{};" +
        "copy.createdAt=copy.createdAt||copy.at;copy.date=copy.date||copy.at;copy.status=copy.status||'completed';" +
        "if(!Array.isArray(copy.payments)){copy.payments=Array.isArray(p.parts)?p.parts.map(function(x){return {method:x.method||'other',amount:Number(x.amount||0)};}):[{method:p.method||'other',amount:Number(p.paid||copy.total||0)}];}" +
        "window.STATE.sales.push(copy);changed=true;}else if(!existing.payments){var ep=existing.payment||{};existing.payments=Array.isArray(ep.parts)?ep.parts.map(function(x){return {method:x.method||'other',amount:Number(x.amount||0)};}):[{method:ep.method||'other',amount:Number(ep.paid||existing.total||0)}];changed=true;}});" +
        "if(changed){try{if(typeof saveKey==='function')saveKey('sales',window.STATE.sales);}catch(e){console.error('[MFIX] report sales sync save failed',e);}if(typeof window.render==='function')window.render();}" +
        "}" +
        "function install(){if(!window.STATE){setTimeout(install,300);return;}sync();setInterval(sync,1500);console.log('[MFIX] completed sales report sync active');}" +
        "install();" +
        "})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup) findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) {
            WebView web = (WebView) root;
            PrinterManagementPatchActivity.install(web);
            OperationalSettingsBehaviorPatch.install(web);
            web.postDelayed(() -> web.evaluateJavascript(SALES_REPORT_SYNC_PATCH, null), 3200);
        }
    }

    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        if (event != null && event.getAction() == KeyEvent.ACTION_DOWN
                && event.getKeyCode() == KeyEvent.KEYCODE_F
                && event.isCtrlPressed() && event.isAltPressed()) {
            if (!restarting) restartMfix();
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    private void restartMfix() {
        restarting = true;
        try {
            Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
            if (launch == null) {
                restarting = false;
                return;
            }
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_CLEAR_TASK
                    | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                try {
                    startActivity(launch);
                    finishAndRemoveTask();
                } catch (Exception e) {
                    restarting = false;
                }
            }, 120);
        } catch (Exception e) {
            restarting = false;
        }
    }
}
