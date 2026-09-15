package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Activates the live sales report dashboard on top of the MFIX chain. */
public class ReportsActivePatchActivity extends BackupRestoreActivePatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixReportsActive)return;window.__mfixReportsActive=true;"+
        "function money(n){return Number(n||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});}"+
        "function d(v){try{return new Date(v).toISOString().slice(0,10)}catch(e){return String(v||'').slice(0,10)}}"+
        "function calc(f,t){var a=(window.STATE&&Array.isArray(window.STATE.sales)?window.STATE.sales:[]).filter(function(s){if(!s||s.status==='cancelled')return false;var x=d(s.date||s.createdAt||s.at);return(!f||x>=f)&&(!t||x<=t)}),r={n:a.length,total:0,items:0,cash:0,card:0,other:0};a.forEach(function(s){r.total+=Number(s.total||s.amount||0);r.items+=(s.items||[]).reduce(function(q,i){return q+Number(i.qty||1)},0);var p=s.payment||{},m=String(p.method||'').toLowerCase();if(Array.isArray(p.parts))p.parts.forEach(function(x){var z=Number(x.amount||0),k=String(x.method||'').toLowerCase();if(k==='cash'||k==='מזומן')r.cash+=z;else if(k==='card'||k==='credit'||k==='אשראי')r.card+=z;else r.other+=z});else if(m==='cash'||m==='מזומן')r.cash+=Number(p.paid||s.total||0);else if(m==='card'||m==='credit'||m==='אשראי')r.card+=Number(p.paid||s.total||0);else r.other+=Number(p.paid||s.total||0)});return r}"+
        "function open(){var now=new Date(),t=d(now),f=d(new Date(now.getTime()-6*86400000));var h='<div class=\"modal wide\"><div class=\"modal-head\"><h3>📊 דוח מכירות</h3><button class=\"modal-close\" onclick=\"closeModal()\">×</button></div><div class=\"modal-body\"><div class=\"grid2\"><div class=\"field\"><label class=\"flabel\">מתאריך</label><input id=\"mfixReportFrom\" type=\"date\" class=\"input\" value=\"'+f+'\"></div><div class=\"field\"><label class=\"flabel\">עד תאריך</label><input id=\"mfixReportTo\" type=\"date\" class=\"input\" value=\"'+t+'\"></div></div><div id=\"mfixReportBody\" style=\"margin-top:12px\"></div></div><div class=\"modal-foot\"><button class=\"btn btn-outline\" onclick=\"mfixRefreshReport()\">🔄 רענן</button><button class=\"btn btn-primary\" onclick=\"closeModal()\">סגור</button></div></div>';openModal(h,{wide:true});window.mfixRefreshReport=function(){var r=calc(document.getElementById('mfixReportFrom').value,document.getElementById('mfixReportTo').value),e=document.getElementById('mfixReportBody');e.innerHTML='<div class=\"grid2\"><div class=\"card\"><div class=\"muted\">עסקאות</div><b style=\"font-size:22px\">'+r.n+'</b></div><div class=\"card\"><div class=\"muted\">מחזור</div><b style=\"font-size:22px\">'+money(r.total)+' ₪</b></div><div class=\"card\"><div class=\"muted\">פריטים</div><b style=\"font-size:22px\">'+r.items+'</b></div><div class=\"card\"><div class=\"muted\">ממוצע עסקה</div><b style=\"font-size:22px\">'+money(r.n?r.total/r.n:0)+' ₪</b></div></div><div class=\"card\" style=\"margin-top:12px\"><div class=\"section-title\">אמצעי תשלום</div><div>מזומן: <b>'+money(r.cash)+' ₪</b></div><div>אשראי: <b>'+money(r.card)+' ₪</b></div><div>אחר: <b>'+money(r.other)+' ₪</b></div></div>'};window.mfixRefreshReport()}"+
        "function install(){var host=document.querySelector('.topbar-right');if(!host)return false;if(!document.getElementById('mfixReportsButton')){var b=document.createElement('button');b.id='mfixReportsButton';b.className='btn btn-outline';b.type='button';b.textContent='📊 דוחות';b.onclick=open;host.appendChild(b)}return true}install();setInterval(install,1500);})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup) findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) {
            ((WebView) root).postDelayed(() -> ((WebView) root).evaluateJavascript(PATCH, null), 13500);
        }
    }
}
