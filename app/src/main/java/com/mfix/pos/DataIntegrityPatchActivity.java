package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds backup integrity safeguards without changing the existing checkout/report chain. */
public class DataIntegrityPatchActivity extends CompletedSalesReportsSyncPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixDataIntegrityPatch)return;window.__mfixDataIntegrityPatch=true;"+
        "function completed(){try{var a=JSON.parse(localStorage.getItem('mfix_completed_sales_v1')||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}"+
        "function mergeSales(){if(!window.STATE)return 0;var a=completed();if(!Array.isArray(window.STATE.sales))window.STATE.sales=[];var byId={};window.STATE.sales.forEach(function(s){if(s&&s.id)byId[String(s.id)]=s;});a.forEach(function(s){if(s&&s.id)byId[String(s.id)]=s;});var merged=Object.keys(byId).map(function(k){return byId[k];}).sort(function(x,y){return new Date(x.at||x.createdAt||0)-new Date(y.at||y.createdAt||0);});window.STATE.sales=merged;if(typeof window.saveKey==='function')try{window.saveKey('sales',merged);}catch(e){}return merged.length;}"+
        "function install(){var host=document.querySelector('.topbar-right');if(!host||document.getElementById('mfixIntegrityButton')){setTimeout(install,1000);return;}var b=document.createElement('button');b.id='mfixIntegrityButton';b.className='btn btn-outline';b.textContent='🛡️ בדיקת נתונים';b.onclick=function(){var n=mergeSales(),c=completed().length;toast('בדיקת נתונים הושלמה · מכירות מסונכרנות: '+n+' · מכירות שהושלמו: '+c,'ok');};host.appendChild(b);}"+
        "install();setInterval(function(){var b=document.getElementById('mfixIntegrityButton');if(!b)install();},3000);console.log('[MFIX] data integrity patch active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),3600);
    }
}
