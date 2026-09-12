package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds a lightweight cash-register shift open/close control using existing sales data. */
public class CashRegisterShiftPatchActivity extends SettingsManagementPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixCashShiftV1)return;window.__mfixCashShiftV1=true;"+
        "function read(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}"+
        "function sales(){var a=read('mfix_completed_sales_v1',[]);return Array.isArray(a)?a:[];}"+
        "function saleTime(x){var raw=x&&((x.at)||(x.date)||(x.createdAt)||(x.timestamp));var t=raw?new Date(raw).getTime():NaN;return isFinite(t)?t:0;}"+
        "function money(v){return Number(v||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});}"+
        "function shiftRows(sh){var since=sh?saleTime({at:sh.openedAt}):0;return sales().filter(function(x){var t=saleTime(x);return !since|| (t>0&&t>=since);});}"+
        "function totalRows(rows){return rows.reduce(function(n,x){return n+Number(x.total||x.amount||0);},0);}"+
        "function render(){var v=document.getElementById('view-pos');if(!v)return false;if(document.getElementById('mfixCashShift'))return true;var b=document.createElement('div');b.id='mfixCashShift';b.className='card';b.style.marginTop='12px';b.innerHTML='<div class=\"section-title\">💰 משמרת וסגירת קופה</div><div class=\"muted\">סיכום המכירות מאז פתיחת הקופה.</div><div id=\"mfixShiftState\" style=\"margin-top:8px\"></div><div id=\"mfixShiftSummary\" style=\"margin-top:10px\"></div><div style=\"display:flex;gap:8px;flex-wrap:wrap;margin-top:12px\"><button id=\"mfixOpenShift\" class=\"btn btn-green\">▶️ פתח קופה</button><button id=\"mfixCloseShift\" class=\"btn btn-amber\">🔒 סגור קופה</button></div>';v.appendChild(b);function refresh(){var sh=read('mfix_cash_shift_v1',null),rows=shiftRows(sh),tot=totalRows(rows);document.getElementById('mfixShiftState').innerHTML=sh?'<span class=\"badge green\">קופה פתוחה</span> <span class=\"muted\">נפתחה: '+new Date(sh.openedAt).toLocaleString('he-IL')+'</span>':'<span class=\"badge amber\">קופה סגורה</span>';document.getElementById('mfixShiftSummary').innerHTML='<b>עסקאות:</b> '+rows.length+' &nbsp; <b>מחזור:</b> ₪'+money(tot);};b.querySelector('#mfixOpenShift').onclick=function(){if(read('mfix_cash_shift_v1',null)){if(window.toast)window.toast('הקופה כבר פתוחה','warn');return;}localStorage.setItem('mfix_cash_shift_v1',JSON.stringify({openedAt:new Date().toISOString()}));refresh();if(window.toast)window.toast('הקופה נפתחה','ok');};b.querySelector('#mfixCloseShift').onclick=function(){var sh=read('mfix_cash_shift_v1',null);if(!sh){if(window.toast)window.toast('הקופה כבר סגורה','warn');return;}var rows=shiftRows(sh),tot=totalRows(rows);localStorage.setItem('mfix_last_cash_close_v1',JSON.stringify({openedAt:sh.openedAt,closedAt:new Date().toISOString(),salesCount:rows.length,total:tot}));localStorage.removeItem('mfix_cash_shift_v1');refresh();if(window.toast)window.toast('הקופה נסגרה · '+rows.length+' עסקאות · ₪'+money(tot),'ok');};refresh();return true;}var n=0,t=setInterval(function(){if(render()||n++>=40)clearInterval(t);},500);})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),5600);
    }
}
