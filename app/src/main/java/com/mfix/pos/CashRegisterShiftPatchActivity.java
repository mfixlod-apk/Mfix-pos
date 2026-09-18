package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds a lightweight cash-register shift open/close control using existing sales data. */
public class CashRegisterShiftPatchActivity extends SettingsManagementPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixCashShiftV2)return;window.__mfixCashShiftV2=true;"+
        "function read(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}"+
        "function sales(){var a=read('mfix_completed_sales_v1',[]);return Array.isArray(a)?a:[];}"+
        "function saleTime(x){var raw=x&&((x.at)||(x.date)||(x.createdAt)||(x.timestamp));var t=raw?new Date(raw).getTime():NaN;return isFinite(t)?t:0;}"+
        "function money(v){return Number(v||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});}"+
        "function methods(x){var p=x&&x.payment;return Array.isArray(p)?p:(x&&Array.isArray(x.payments)?x.payments:[]);}"+
        "function cashOf(x){var ps=methods(x);if(ps.length)return ps.reduce(function(n,p){var m=String((p&&p.method)||'').toLowerCase();return n+((m==='cash'||m==='מזומן')?Number(p.amount||p.total||0):0);},0);var m=String((x&&x.paymentMethod)||'').toLowerCase();return (m==='cash'||m==='מזומן')?Number(x.total||x.amount||0):0;}"+
        "function shiftRows(sh){var since=sh?saleTime({at:sh.openedAt}):0;return sales().filter(function(x){var t=saleTime(x);return !!since&&t>0&&t>=since;});}"+
        "function totalRows(rows){return rows.reduce(function(n,x){return n+Number(x.total||x.amount||0);},0);}"+
        "function cashRows(rows){return rows.reduce(function(n,x){return n+cashOf(x);},0);}"+
        "function render(){var v=document.getElementById('view-pos');if(!v)return false;if(document.getElementById('mfixCashShift'))return true;var b=document.createElement('div');b.id='mfixCashShift';b.className='card';b.style.marginTop='12px';b.innerHTML='<div class=\"section-title\">💰 משמרת וסגירת קופה</div><div class=\"muted\">פתיחה, מעקב מזומן וסגירת משמרת.</div><div id=\"mfixShiftState\" style=\"margin-top:8px\"></div><div id=\"mfixShiftSummary\" style=\"margin-top:10px\"></div><div id=\"mfixShiftOpenForm\" style=\"display:none;margin-top:10px\"><label>מזומן פתיחה ₪</label><input id=\"mfixOpeningCash\" type=\"number\" min=\"0\" step=\"0.01\" placeholder=\"0.00\"></div><div id=\"mfixShiftCloseForm\" style=\"display:none;margin-top:10px\"><label>מזומן בפועל בסגירה ₪</label><input id=\"mfixClosingCash\" type=\"number\" min=\"0\" step=\"0.01\" placeholder=\"0.00\"><div id=\"mfixVariance\" class=\"muted\" style=\"margin-top:6px\"></div></div><div style=\"display:flex;gap:8px;flex-wrap:wrap;margin-top:12px\"><button id=\"mfixOpenShift\" class=\"btn btn-green\">▶️ פתח קופה</button><button id=\"mfixCloseShift\" class=\"btn btn-amber\">🔒 סגור קופה</button></div>';v.appendChild(b);var openInput=b.querySelector('#mfixOpeningCash'),closeInput=b.querySelector('#mfixClosingCash');function refresh(){var sh=read('mfix_cash_shift_v1',null),rows=shiftRows(sh),tot=totalRows(rows),cash=cashRows(rows),opening=sh?Number(sh.openingCash||0):0;document.getElementById('mfixShiftState').innerHTML=sh?'<span class=\"badge green\">קופה פתוחה</span> <span class=\"muted\">נפתחה: '+new Date(sh.openedAt).toLocaleString('he-IL')+'</span>':'<span class=\"badge amber\">קופה סגורה</span>';document.getElementById('mfixShiftSummary').innerHTML='<b>עסקאות:</b> '+rows.length+' &nbsp; <b>מחזור:</b> ₪'+money(tot)+' &nbsp; <b>מזומן ממכירות:</b> ₪'+money(cash)+(sh?' &nbsp; <b>מזומן צפוי:</b> ₪'+money(opening+cash):'');document.getElementById('mfixShiftOpenForm').style.display=sh?'none':'block';document.getElementById('mfixShiftCloseForm').style.display=sh?'block':'none';};openInput.addEventListener('input',function(){});closeInput.addEventListener('input',function(){var sh=read('mfix_cash_shift_v1',null);if(!sh)return;var rows=shiftRows(sh),expected=Number(sh.openingCash||0)+cashRows(rows),actual=Number(closeInput.value||0),delta=actual-expected;document.getElementById('mfixVariance').textContent='הפרש: '+(delta>=0?'+':'')+'₪'+money(delta);});b.querySelector('#mfixOpenShift').onclick=function(){if(read('mfix_cash_shift_v1',null)){if(window.toast)window.toast('הקופה כבר פתוחה','warn');return;}var opening=Math.max(0,Number(openInput.value||0));localStorage.setItem('mfix_cash_shift_v1',JSON.stringify({openedAt:new Date().toISOString(),openingCash:opening}));refresh();if(window.toast)window.toast('הקופה נפתחה עם ₪'+money(opening),'ok');};b.querySelector('#mfixCloseShift').onclick=function(){var sh=read('mfix_cash_shift_v1',null);if(!sh){if(window.toast)window.toast('הקופה כבר סגורה','warn');return;}var rows=shiftRows(sh),tot=totalRows(rows),cash=cashRows(rows),opening=Number(sh.openingCash||0),expected=opening+cash,actual=Number(closeInput.value||0);if(!isFinite(actual)||actual<0){if(window.toast)window.toast('יש להזין מזומן בפועל בסגירה','warn');return;}var delta=actual-expected;localStorage.setItem('mfix_last_cash_close_v2',JSON.stringify({openedAt:sh.openedAt,closedAt:new Date().toISOString(),openingCash:opening,salesCount:rows.length,total:tot,cashSales:cash,expectedCash:expected,actualCash:actual,variance:delta}));localStorage.removeItem('mfix_cash_shift_v1');refresh();if(window.toast)window.toast('הקופה נסגרה · הפרש ₪'+money(delta),'ok');};refresh();return true;}var n=0,t=setInterval(function(){if(render()||n++>=40)clearInterval(t);},500);})();";

    /** Installs the shift controls on the already-active POS WebView. */
    public static void install(WebView webView) {
        if (webView == null) return;
        webView.postDelayed(() -> webView.evaluateJavascript(PATCH, null), 800);
    }

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView) install((WebView)root);
    }
}
