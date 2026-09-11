package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds practical hold/resume sale controls to the POS without replacing the existing checkout flow. */
public class SuspendedSalesPatchActivity extends CheckoutCompletionPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixSuspendedSalesPatch)return;window.__mfixSuspendedSalesPatch=true;"+
        "function load(){try{var x=JSON.parse(localStorage.getItem('mfix_held_sales_v1')||'[]');return Array.isArray(x)?x:[];}catch(e){return [];}}"+
        "function save(x){try{localStorage.setItem('mfix_held_sales_v1',JSON.stringify(x));return true;}catch(e){toast('לא ניתן לשמור מכירה מושהית','err');return false;}}"+
        "function hold(){var cart=window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:[];if(!cart.length){toast('הסל ריק — אין מה להשהות','err');return;}var name=prompt('שם למכירה המושהית (אופציונלי):','');var x=load();x.unshift({id:'H'+Date.now(),name:String(name||'').trim(),at:new Date().toISOString(),cart:JSON.parse(JSON.stringify(cart)),customer:window.STATE.customer||null,payment:window.STATE.currentPayment||null});if(save(x)){window.STATE.cart=[];window.STATE.customer=null;window.STATE.currentPayment=null;try{localStorage.removeItem('mfix_current_payment_v1');}catch(e){}if(window.render)window.render();toast('המכירה הושהתה','ok');}}"+
        "function resume(){var x=load();if(!x.length){toast('אין מכירות מושהות','err');return;}var html='<div class=\\\"modal wide\\\"><div class=\\\"modal-head\\\"><h3>מכירות מושהות</h3><button class=\\\"modal-close\\\" onclick=\\\"closeModal()\\\">×</button></div><div class=\\\"modal-body\\\">'+x.map(function(s,i){var total=(s.cart||[]).reduce(function(a,p){return a+Number(p.lineTotal||p.total||((Number(p.price)||Number(p.unitPrice)||0)*(Number(p.qty)||1)));},0);return '<div class=\\\"card\\\" style=\\\"margin-bottom:8px\\\"><b>'+(s.name?s.name:'מכירה '+s.id)+'</b><div style=\\\"font-size:12px;color:var(--gray-500)\\\">'+(s.cart||[]).length+' פריטים · ₪'+total.toFixed(2)+'</div><button class=\\\"btn btn-primary\\\" data-mfix-resume=\\\"'+i+'\\\">▶ המשך</button> <button class=\\\"btn btn-ghost\\\" data-mfix-delete=\\\"'+i+'\\\">🗑 מחק</button></div>';}).join('')+'</div></div>';openModal(html);document.querySelectorAll('[data-mfix-resume]').forEach(function(b){b.onclick=function(){var i=Number(b.getAttribute('data-mfix-resume')),a=load(),s=a[i];if(!s)return;window.STATE.cart=s.cart||[];window.STATE.customer=s.customer||null;window.STATE.currentPayment=s.payment||null;a.splice(i,1);save(a);closeModal();if(window.render)window.render();toast('המכירה חזרה לקופה','ok');};});document.querySelectorAll('[data-mfix-delete]').forEach(function(b){b.onclick=function(){var i=Number(b.getAttribute('data-mfix-delete')),a=load();a.splice(i,1);save(a);resume();};});}"+
        "function install(){var v=document.getElementById('view-pos');if(!v){setTimeout(install,500);return;}if(v.querySelector('.mfix-hold-sale'))return;var host=v.querySelector('#cartTotals')||v;var h=document.createElement('button');h.type='button';h.className='btn btn-outline mfix-hold-sale';h.textContent='⏸ השהה מכירה';h.style.margin='0 8px 10px 0';h.onclick=hold;var r=document.createElement('button');r.type='button';r.className='btn btn-ghost mfix-resume-sale';r.textContent='▶ מכירות מושהות';r.style.margin='0 8px 10px 0';r.onclick=resume;host.insertBefore(r,host.firstChild);host.insertBefore(h,host.firstChild);}"+
        "install();console.log('[MFIX] suspended sales patch active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),2200);
    }
}
