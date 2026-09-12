package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds practical period and product sales analytics to the existing reports view. */
public class ReportsAnalyticsPatchActivity extends DailyClosingPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixReportsAnalyticsV1)return;window.__mfixReportsAnalyticsV1=true;"+
        "function read(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}"+
        "function sales(){var a=read('mfix_completed_sales_v1',[]);return Array.isArray(a)?a:[];}"+
        "function returns(){var a=read('mfix_sales_returns_v1',[]);return Array.isArray(a)?a:[];}"+
        "function money(v){return Number(v||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});}"+
        "function dateOf(x){return new Date(x.date||x.createdAt||x.timestamp||0);}"+
        "function render(){var v=document.getElementById('view-reports');if(!v)return false;if(document.getElementById('mfixReportsAnalytics'))return true;var b=document.createElement('div');b.id='mfixReportsAnalytics';b.className='card';b.style.marginTop='12px';b.innerHTML='<div class=\"section-title\">📊 ניתוח מכירות</div><div class=\"muted\">דוח לתקופה נבחרת ומוצרים מובילים.</div><div class=\"grid2\" style=\"margin-top:10px\"><div class=\"field\"><label class=\"flabel\">מתאריך</label><input id=\"mfixReportFrom\" class=\"input\" type=\"date\"></div><div class=\"field\"><label class=\"flabel\">עד תאריך</label><input id=\"mfixReportTo\" class=\"input\" type=\"date\"></div></div><button id=\"mfixBuildReport\" class=\"btn btn-primary\" style=\"margin-top:10px\">הצג דוח</button><div id=\"mfixReportBody\" style=\"margin-top:12px\"></div>';var now=new Date(),iso=function(d){return d.toISOString().slice(0,10);};b.querySelector('#mfixReportTo').value=iso(now);var start=new Date(now);start.setDate(start.getDate()-6);b.querySelector('#mfixReportFrom').value=iso(start);function build(){var from=b.querySelector('#mfixReportFrom').value,to=b.querySelector('#mfixReportTo').value,until=new Date(to+'T23:59:59'),ss=sales().filter(function(s){var d=dateOf(s);return d>=new Date(from+'T00:00:00')&&d<=until;}),rr=returns().filter(function(r){var d=dateOf(r);return d>=new Date(from+'T00:00:00')&&d<=until;}),gross=0,refund=0,items={};ss.forEach(function(s){gross+=Number(s.total||s.amount||0);(s.items||[]).forEach(function(i){var key=String(i.name||i.title||i.productName||i.sku||'מוצר');var q=Number(i.qty||i.quantity||1);if(!items[key])items[key]={qty:0,revenue:0};items[key].qty+=q;items[key].revenue+=Number(i.price||i.unitPrice||0)*q;});});rr.forEach(function(r){refund+=Number(r.refundTotal||r.total||r.amount||0);});var top=Object.keys(items).map(function(k){return {name:k,qty:items[k].qty,revenue:items[k].revenue};}).sort(function(a,c){return c.qty-a.qty;}).slice(0,10);var rows=top.map(function(x){return '<tr><td>'+x.name.replace(/[<>]/g,'')+'</td><td>'+x.qty+'</td><td>₪'+money(x.revenue)+'</td></tr>';}).join('');b.querySelector('#mfixReportBody').innerHTML='<div class=\"grid4\"><div><b>עסקאות</b><div>'+ss.length+'</div></div><div><b>ברוטו</b><div>₪'+money(gross)+'</div></div><div><b>החזרים</b><div>₪'+money(refund)+'</div></div><div><b>נטו</b><div>₪'+money(gross-refund)+'</div></div></div><div style=\"overflow:auto;margin-top:12px\"><table class=\"table\"><thead><tr><th>מוצר</th><th>כמות</th><th>מכירות</th></tr></thead><tbody>'+rows+'</tbody></table></div>';};b.querySelector('#mfixBuildReport').onclick=build;build();return true;}var n=0,t=setInterval(function(){if(render()||n++>=40)clearInterval(t);},500);})();";
    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),6800);
    }
}
