package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds a practical CSV export action to the existing reports screen. */
public class ReportsExportPatchActivity extends InventoryManagementPatchActivity {
    private static final String PATCH =
        "(function(){" +
        "if(window.__mfixReportsExportPatch)return;window.__mfixReportsExportPatch=true;" +
        "function install(){" +
        "if(!window.STATE||typeof window.renderReports!=='function'){setTimeout(install,250);return;}" +
        "function escCsv(v){v=String(v==null?'':v);return '\"'+v.replace(/\"/g,'\"\"')+'\"';}" +
        "function inRange(iso){var d=new Date(iso||0);if(isNaN(d.getTime()))return false;var f=window.reportDateFrom?new Date(window.reportDateFrom):null,t=window.reportDateTo?new Date(window.reportDateTo):null;return (!f||isNaN(f.getTime())||d>=f)&&(!t||isNaN(t.getTime())||d<=t);}" +
        "window.mfixExportReportsCsv=function(){" +
        "var sales=(window.STATE.sales||[]).filter(function(s){return inRange(s.createdAt||s.date||s.at);});" +
        "var rows=[['תאריך','מספר מסמך','לקוח','טלפון','סה\"כ','שולם','עודף','אמצעי תשלום','סטטוס']];" +
        "sales.forEach(function(s){var pays=(s.payments||s.paymentRows||[]).map(function(p){return p.method||p.type||'';}).join(' + ');rows.push([s.createdAt||s.date||s.at||'',s.number||s.docNumber||s.id||'',s.customerName||'',s.customerPhone||'',Number(s.totalIncl||s.total||0).toFixed(2),Number(s.paid||s.amountPaid||0).toFixed(2),Number(s.change||0).toFixed(2),pays,s.status||'completed']);});" +
        "var csv='\\uFEFF'+rows.map(function(r){return r.map(escCsv).join(',');}).join('\\r\\n');" +
        "var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='MFIX-report-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);if(window.toast)window.toast('הדוח יוצא כקובץ CSV ('+sales.length+' מכירות)','ok');" +
        "};" +
        "var original=window.renderReports;window.renderReports=function(){var r=original.apply(this,arguments);setTimeout(function(){var v=document.getElementById('view-reports');if(!v||v.querySelector('.mfix-report-export'))return;var b=document.createElement('button');b.type='button';b.className='btn btn-outline mfix-report-export';b.textContent='⬇️ ייצוא CSV';b.style.marginBottom='10px';b.onclick=window.mfixExportReportsCsv;v.insertBefore(b,v.firstChild);},0);return r;};" +
        "window.renderReports();console.log('[MFIX] reports CSV export patch active');" +
        "}" +
        "install();" +
        "})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup) findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) {
            ((WebView) root).postDelayed(() -> ((WebView) root).evaluateJavascript(PATCH, null), 1000);
        }
    }
}
