package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds a non-destructive reports summary/filter layer over the existing reports UI. */
public class ReportsDashboardPatchActivity extends DataIntegrityBasePatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixReportsDashboardPatch)return;window.__mfixReportsDashboardPatch=true;"+
        "function money(n){return '₪'+Number(n||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});}"+
        "function sales(){try{var a=JSON.parse(localStorage.getItem('mfix_completed_sales_v1')||'[]');if(Array.isArray(a)&&a.length)return a;}catch(e){}return window.STATE&&Array.isArray(window.STATE.sales)?window.STATE.sales:[];}"+
        "function amount(s){return Number(s.totalIncl||s.total||s.grandTotal||s.amount||0);}"+
        "function method(s){var p=s.payment||s.currentPayment||{};if(Array.isArray(p.parts)&&p.parts.length)return p.parts.map(function(x){return String(x.method||'other');});return [String(p.method||s.paymentMethod||'other')];}"+
        "function label(m){return m==='cash'?'מזומן':m==='card'?'אשראי':m==='transfer'?'העברה':m==='check'?'צ׳ק':'אחר';}"+
        "function parseDate(s){var d=new Date(s.at||s.createdAt||s.date||0);return isNaN(d.getTime())?null:d;}"+
        "function render(){var v=document.querySelector('.view.active');if(!v)return;var title=(document.querySelector('.topbar h1')||{}).textContent||'';if(!/דוחות|reports/i.test((v.textContent||'')+' '+title))return;if(document.getElementById('mfixReportSummary'))return;"+
        "var host=document.createElement('div');host.id='mfixReportSummary';host.className='card';host.style.marginBottom='12px';host.innerHTML='<div class=\"section-title\">📊 סיכום דוחות</div><div class=\"grid3\"><div class=\"field\"><label class=\"flabel\">מתאריך</label><input id=\"mfixReportFrom\" class=\"input\" type=\"date\"></div><div class=\"field\"><label class=\"flabel\">עד תאריך</label><input id=\"mfixReportTo\" class=\"input\" type=\"date\"></div><div class=\"field\" style=\"display:flex;align-items:end\"><button id=\"mfixReportApply\" class=\"btn btn-primary btn-block\" type=\"button\">רענן סיכום</button></div></div><div id=\"mfixReportStats\"></div>';"+
        "v.insertBefore(host,v.firstChild);"+
        "function refresh(){var from=(document.getElementById('mfixReportFrom')||{}).value||'',to=(document.getElementById('mfixReportTo')||{}).value||'';var fs=from?new Date(from+'T00:00:00'):null,ts=to?new Date(to+'T23:59:59'):null;var arr=sales().filter(function(s){var d=parseDate(s);return d&&(!fs||d>=fs)&&(!ts||d<=ts);});var total=arr.reduce(function(x,s){return x+amount(s);},0),count=arr.length,by={cash:0,card:0,transfer:0,check:0,other:0};arr.forEach(function(s){var a=amount(s),ms=method(s),share=ms.length?a/ms.length:0;ms.forEach(function(m){by[m]=(by[m]||0)+share;});});var stats=document.getElementById('mfixReportStats');if(stats)stats.innerHTML='<div class=\"grid3\"><div class=\"card\" style=\"background:var(--gray-50)\"><div class=\"muted\">עסקאות</div><strong style=\"font-size:24px\">'+count+'</strong></div><div class=\"card\" style=\"background:var(--gray-50)\"><div class=\"muted\">מחזור</div><strong style=\"font-size:24px\">'+money(total)+'</strong></div><div class=\"card\" style=\"background:var(--gray-50)\"><div class=\"muted\">ממוצע לעסקה</div><strong style=\"font-size:24px\">'+money(count?total/count:0)+'</strong></div></div><div style=\"margin-top:10px;display:flex;gap:8px;flex-wrap:wrap\">'+['cash','card','transfer','check','other'].map(function(m){return '<span class=\"pill blue\">'+label(m)+': '+money(by[m]||0)+'</span>';}).join('')+'</div>';};"+
        "document.getElementById('mfixReportApply').onclick=refresh;refresh();}"+
        "function install(){render();setTimeout(install,1200);}install();console.log('[MFIX] reports dashboard patch active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),4300);
    }
}
