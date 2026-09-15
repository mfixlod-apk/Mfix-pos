package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Activates a compact sales/report dashboard on top of the live MFIX chain. */
public class ReportsActivePatchActivity extends BackupRestoreActivePatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixReportsActive)return;window.__mfixReportsActive=true;"+
        "function money(n){return Number(n||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});}"+
        "function sales(){return window.STATE&&Array.isArray(window.STATE.sales)?window.STATE.sales.filter(function(s){return s&&s.status!=='cancelled';}):[];}"+
        "function dateOnly(v){try{return new Date(v).toISOString().slice(0,10);}catch(e){return String(v||'').slice(0,10);}}"+
        "function calc(from,to){var a=sales().filter(function(s){var d=dateOnly(s.date||s.createdAt||s.at);return (!from||d>=from)&&(!to||d<=to);}),total=0,cash=0,card=0,other=0,items=0;"+
        "a.forEach(function(s){var t=Number(s.total||s.amount||0);total+=t;items+=(Array.isArray(s.items)?s.items.reduce(function(x,i){return x+Number(i.qty||1);},0):0);var p=s.payment||{},m=String(p.method||'').toLowerCase();if(Array.isArray(p.parts)){p.parts.forEach(function(x){var z=Number(x.amount||0),mm=String(x.method||'').toLowerCase();if(mm==='cash'||mm==='מזומן')cash+=z;else if(mm==='card'||mm==='credit'||mm==='אשראי')card+=z;else other+=z;});}else if(m==='cash'||m==='מזומן')cash+=Number(p.paid||t);else if(m==='card'||m==='credit'||m==='אשראי')card+=Number(p.paid||t);else other+=Number(p.paid||t);});return {sales:a,total:total,cash:cash,card:card,other:other,items:items};}"+
        "function open(){var now=new Date(),to=now.toISOString().slice(0,10),from=new Date(now.getTime()-6*86400000).toISOString().slice(0,10),c=calc(from,to);var html='<div class=\"modal wide\"><div class=\"modal-head\"><h3>📊 דוח מכירות</h3><button class=\"modal-close\" onclick=\"closeModal()\">×</button></div><div class=\"modal-body\"><div class=\"grid2\"><div class=\"field\"><label class=\"flabel\">מתאריך</label><input id=\"mfixReportFrom\" type=\"date\" class=\"input\" value=\"'+from+'\"></div><div class=\"field\"><label class=\"flabel\">עד תאריך</label><input id=\"mfixReportTo\" type=\"date\" class=\"input\" value=\"'+to+'\"></div></div><div id=\"mfixReportSummary\" style=\"display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px\"></div><div id=\"mfixReportPayments\" class=\"card\" style=\"margin-top:12px\"></div></div><div class=\"modal-foot\"><button class=\"btn btn-outline\" onclick=\"mfixRefreshReport()\">🔄 רענן</button><button class=\"btn btn-primary\" onclick=\"closeModal()\">סגור</button></div></div>';openModal(html,{wide:true});window.mfixRefreshReport=function(){var f=document.getElementById('mfixReportFrom').value,t=document.getElementById('mfixReportTo').value;if(f&&t&&f>t){toast('טווח תאריכים לא תקין','err');return;}var r=calc(f,t),s=document.getElementById('mfixReportSummary'),p=document.getElementById('mfixReportPayments');s.innerHTML='<div class=\"card\"><div class=\"muted\">מכירות</div><b style=\"font-size:22px\">'+r.sales.length+'</b></div><div class=\"card\"><div class=\"muted\">מחזור</div><b style=\"font-size:22px\">'+money(r.total)+' ₪</b></div><div class=\"card\"><div class=\"muted\">פריטים</div><b style=\"font-size:22px\">'+r.items+'</b></div><div class=\"card\"><div class=\"muted\">ממוצע עסקה</div><b style=\"font-size:22px\">'+money(r.sales.length?r.total/r.sales.length:0)+' ₪</b></div>';p.innerHTML='<div class=\"section-title\">אמצעי תשלום</div><div>מזומן: <b>'+money(r.cash)+' ₪</b></div><div>אשראי: <b>'+money(r.card)+' ₪</b></div><div>אחר: <b>'+money(r.other)+' ₪</b></div>';};window.mfixRefreshReport();}"
        "function install(){var host=document.querySelector('.topbar-right');if(!host)return false;if(!document.getElementById('mfixReportsButton')){var b=document.createElement('button');b.id='mfixReportsButton';b.className='btn btn-outline';b.type='button';b.textContent='📊 דוחות';b.onclick=open;host.appendChild(b);}return true;}"
        "install();setInterval(install,1500);console.log('[MFIX] reports activation active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),13500);
    }
}
