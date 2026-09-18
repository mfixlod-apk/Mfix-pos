package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds CSV export for the selected sales-report period. */
public class ReportsExportPatchActivity extends ReportsAnalyticsPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixReportsExportV1)return;window.__mfixReportsExportV1=true;"+
        "function read(){try{var a=JSON.parse(localStorage.getItem('mfix_completed_sales_v1')||'[]');return Array.isArray(a)?a:[];}catch(e){return[];}}"+
        "function esc(v){var s=String(v==null?'':v);return '\"'+s.replace(/\"/g,'\"\"')+'\"';}"+
        "function dateOf(x){return new Date(x.at||x.createdAt||x.date||x.timestamp||0);}"+
        "function install(){var v=document.getElementById('view-reports');if(!v){setTimeout(install,500);return;}if(document.getElementById('mfixReportsExport'))return;var box=document.createElement('div');box.id='mfixReportsExport';box.className='card';box.style.marginTop='12px';box.innerHTML='<div class=\"section-title\">⬇️ ייצוא דוח מכירות</div><div class=\"muted\" style=\"font-size:12px;margin-bottom:10px\">ייצוא העסקאות בטווח התאריכים שנבחר למבנה CSV שנפתח ב-Excel.</div><button id=\"mfixExportCsv\" class=\"btn btn-outline\" type=\"button\">ייצא CSV</button>';var anchor=document.getElementById('mfixReportsAnalytics');if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(box,anchor.nextSibling);else v.appendChild(box);box.querySelector('#mfixExportCsv').onclick=function(){var from=(document.getElementById('mfixReportFrom')||{}).value||'',to=(document.getElementById('mfixReportTo')||{}).value||'';if(!from||!to){toast('בחר טווח תאריכים','err');return;}var start=new Date(from+'T00:00:00'),end=new Date(to+'T23:59:59'),rows=[['תאריך','מספר עסקה','לקוח','סכום','אמצעי תשלום']];read().filter(function(s){var d=dateOf(s);return d>=start&&d<=end;}).forEach(function(s){var p=s.payment||s.currentPayment||{},method=Array.isArray(p.parts)?p.parts.map(function(x){return String(x.method||'')+': '+Number(x.amount||0).toFixed(2);}).join(' | '):(p.method||s.paymentMethod||'');rows.push([dateOf(s).toLocaleString('he-IL'),s.id||s.saleId||'',s.customerName||s.customer||'',Number(s.totalIncl||s.total||s.amount||0).toFixed(2),method]);});var csv='\\uFEFF'+rows.map(function(r){return r.map(esc).join(',');}).join('\\r\\n');var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mfix-sales-'+from+'-'+to+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);toast('הדוח יוצא בהצלחה','ok');};}install();})();";

    public static void install(WebView webView){
        if(webView!=null) webView.postDelayed(()->webView.evaluateJavascript(PATCH,null),1000);
    }

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView) install((WebView)root);
    }
}
