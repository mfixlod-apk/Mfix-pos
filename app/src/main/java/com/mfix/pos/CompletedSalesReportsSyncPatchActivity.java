package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Keeps the completed-sales store used by checkout synchronized with STATE.sales used by reports. */
public class CompletedSalesReportsSyncPatchActivity extends CheckoutCompletionPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixCompletedSalesReportsSync)return;window.__mfixCompletedSalesReportsSync=true;"+
        "function sync(){try{if(!window.STATE)return;var raw=localStorage.getItem('mfix_completed_sales_v1')||'[]',sales=JSON.parse(raw);if(!Array.isArray(sales))sales=[];if(!Array.isArray(window.STATE.sales))window.STATE.sales=[];var byId={};window.STATE.sales.forEach(function(s){if(s&&s.id)byId[String(s.id)]=s;});sales.forEach(function(s){if(s&&s.id)byId[String(s.id)]=s;});var merged=Object.keys(byId).map(function(k){return byId[k];}).sort(function(a,b){return new Date(a.at||a.createdAt||0)-new Date(b.at||b.createdAt||0);});if(merged.length!==window.STATE.sales.length){window.STATE.sales=merged;if(typeof window.saveKey==='function')window.saveKey('sales',merged);if(typeof window.renderReports==='function')window.renderReports();}}catch(e){console.error('[MFIX SALES REPORT SYNC]',e);}}"+
        "sync();setInterval(sync,1000);console.log('[MFIX] completed sales report sync active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),2600);
    }
}
