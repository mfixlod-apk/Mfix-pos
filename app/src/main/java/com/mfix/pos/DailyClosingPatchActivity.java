package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds a practical end-of-day cash report to the existing POS. */
public class DailyClosingPatchActivity extends SalesReturnPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixDailyClosingV3)return;window.__mfixDailyClosingV3=true;"+
        "function read(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}"+
        "function sales(){var a=read('mfix_completed_sales_v1',[]);return Array.isArray(a)?a:[];}"+
        "function returns(){var a=read('mfix_sales_returns_v1',[]);return Array.isArray(a)?a:[];}"+
        "function money(v){return Number(v||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});}"+
        "function dayKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}"+
        "function paymentType(s){var p=s&&s.payment||{};if(Array.isArray(p.parts))return p.parts.map(function(x){return {type:x.method||x.type||'other',amount:Number(x.amount||0)};});return [{type:p.method||p.type||'other',amount:Number(p.paid||p.amount||s.total||0)}];}"+
        "function paymentBucket(v){var t=String(v||'').trim().toLowerCase();if(t==='cash'||t==='מזומן')return 'cash';if(t==='card'||t==='credit'||t==='credit_card'||t==='אשראי')return 'card';if(t==='bank'||t==='transfer'||t==='bank_transfer'||t==='העברה')return 'bank';return 'other';}"+
        "function build(){var v=document.getElementById('view-reports');if(!v)return false;if(document.getElementById('mfixDailyClosing'))return true;var b=document.createElement('div');b.id='mfixDailyClosing';b.className='card';b.style.marginTop='12px';b.innerHTML='<div class=\"section-title\">🧾 סיכום יומי</div><div class=\"muted\">סיכום מכירות והחזרים לפי תאריך.</div><div style=\"display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px\"><label class=\"flabel\" for=\"mfixDailyDate\">תאריך</label><input id=\"mfixDailyDate\" type=\"date\" class=\"input\"><button id=\"mfixRefreshDaily\" class=\"btn btn-ghost\" type=\"button\">↻ רענן</button></div><div id=\"mfixDailyClosingBody\" style=\"margin-top:12px\"></div>';v.appendChild(b);var dateInput=b.querySelector('#mfixDailyDate');dateInput.value=dayKey(new Date());function render(){var selected=dateInput.value||dayKey(new Date()),ss=sales().filter(function(s){var raw=s&& (s.at||s.date||s.createdAt||s.timestamp);var x=new Date(raw||0);return !isNaN(x.getTime())&&dayKey(x)===selected;}),rr=returns().filter(function(r){var raw=r&&(r.at||r.date||r.createdAt||r.timestamp);var x=new Date(raw||0);return !isNaN(x.getTime())&&dayKey(x)===selected;}),gross=0,refund=0,cash=0,card=0,bank=0,other=0;ss.forEach(function(s){gross+=Number(s.total||s.amount||0);paymentType(s).forEach(function(p){var a=Number(p.amount||0),bucket=paymentBucket(p.type);if(bucket==='cash')cash+=a;else if(bucket==='card')card+=a;else if(bucket==='bank')bank+=a;else other+=a;});});rr.forEach(function(r){refund+=Number(r.refundTotal||r.total||r.amount||0);});var net=gross-refund;document.getElementById('mfixDailyClosingBody').innerHTML='<div class=\"grid4\"><div><b>מכירות</b><div>'+ss.length+'</div></div><div><b>ברוטו</b><div>₪'+money(gross)+'</div></div><div><b>החזרים</b><div>₪'+money(refund)+'</div></div><div><b>נטו</b><div>₪'+money(net)+'</div></div></div><div class=\"muted\" style=\"margin-top:10px\">מזומן: ₪'+money(cash)+' · אשראי: ₪'+money(card)+' · העברה: ₪'+money(bank)+' · אחר: ₪'+money(other)+'</div>';};dateInput.onchange=render;b.querySelector('#mfixRefreshDaily').onclick=render;render();return true;}var n=0,t=setInterval(function(){if(build()||n++>=40)clearInterval(t);},500);})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),6200);
    }
}
