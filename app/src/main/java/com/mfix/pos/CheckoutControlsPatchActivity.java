package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds safe cart/payment and suspended-sale controls on top of the completed checkout flow. */
public class CheckoutControlsPatchActivity extends CheckoutCompletionPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixCheckoutControlsPatchV2)return;window.__mfixCheckoutControlsPatchV2=true;"+
        "function clearPayment(){try{if(window.STATE)window.STATE.currentPayment=null;localStorage.removeItem('mfix_current_payment_v1');}catch(e){}if(window.toast)window.toast('התשלום בוטל','ok');}"+
        "function clearCart(){var c=window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:[];if(!c.length){if(window.toast)window.toast('הסל כבר ריק','err');return;}if(!window.confirm('לנקות את כל הסל ולבטל את התשלום?'))return;try{window.STATE.cart=[];window.STATE.currentPayment=null;localStorage.removeItem('mfix_current_payment_v1');if(typeof window.render==='function')window.render();}catch(e){console.error(e);}if(window.toast)window.toast('הסל נוקה','ok');}"+
        "function parked(){try{var x=JSON.parse(localStorage.getItem('mfix_parked_sales_v1')||'[]');return Array.isArray(x)?x:[];}catch(e){return[];}}"+
        "function parkSale(){var c=window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:[];if(!c.length){if(window.toast)window.toast('אין מוצרים לשמירה','err');return;}var list=parked();var now=new Date().toISOString();var p={id:'park_'+Date.now(),at:now,cart:JSON.parse(JSON.stringify(c)),payment:window.STATE&&window.STATE.currentPayment?JSON.parse(JSON.stringify(window.STATE.currentPayment)):null};list.unshift(p);list=list.slice(0,20);try{localStorage.setItem('mfix_parked_sales_v1',JSON.stringify(list));if(window.STATE)window.STATE.cart=[];if(window.STATE)window.STATE.currentPayment=null;localStorage.removeItem('mfix_current_payment_v1');if(typeof window.render==='function')window.render();if(window.toast)window.toast('העסקה נשמרה להמשך','ok');}catch(e){console.error(e);if(window.toast)window.toast('שמירת העסקה נכשלה','err');}}"+
        "function restoreSale(){var list=parked();if(!list.length){if(window.toast)window.toast('אין עסקאות שמורות','err');return;}var html='<div class=\\\"modal wide\\\"><div class=\\\"modal-head\\\"><h3>עסקאות שמורות</h3><button class=\\\"modal-close\\\" onclick=\\\"closeModal()\\\">×</button></div><div class=\\\"modal-body\\\"><div id=\\\"mfixParkedList\\\"></div></div></div>';openModal(html);var host=document.getElementById('mfixParkedList');host.innerHTML=list.map(function(x,i){var qty=(x.cart||[]).reduce(function(n,a){return n+Number(a.qty||1);},0);var total=(x.cart||[]).reduce(function(n,a){return n+Number(a.price||0)*Number(a.qty||1);},0);var d=new Date(x.at);var label=isNaN(d.getTime())?x.at:d.toLocaleString('he-IL');return '<div class=\\\"card\\\" style=\\\"margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:10px\\\"><div><b>'+label+'</b><div style=\\\"font-size:12px;color:var(--gray-500)\\\">'+qty+' פריטים · ₪'+total.toFixed(2)+'</div></div><button class=\\\"btn btn-primary\\\" data-mfix-restore=\\\"'+i+'\\\">שחזר</button></div>';}).join('');host.querySelectorAll('[data-mfix-restore]').forEach(function(b){b.onclick=function(){var i=Number(b.getAttribute('data-mfix-restore'));var x=list[i];if(!x)return;var current=window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:[];if(current.length&&!window.confirm('הסל הנוכחי אינו ריק. להחליף אותו בעסקה השמורה?'))return;try{window.STATE.cart=JSON.parse(JSON.stringify(x.cart||[]));window.STATE.currentPayment=x.payment?JSON.parse(JSON.stringify(x.payment)):null;list.splice(i,1);localStorage.setItem('mfix_parked_sales_v1',JSON.stringify(list));if(window.STATE.currentPayment)localStorage.setItem('mfix_current_payment_v1',JSON.stringify(window.STATE.currentPayment));else localStorage.removeItem('mfix_current_payment_v1');if(typeof window.render==='function')window.render();closeModal();if(window.toast)window.toast('העסקה שוחזרה','ok');}catch(e){console.error(e);if(window.toast)window.toast('שחזור העסקה נכשל','err');}};});}"+
        "function install(){var v=document.getElementById('view-pos');if(!v){setTimeout(install,500);return;}if(v.querySelector('.mfix-checkout-controls'))return;var host=v.querySelector('#cartTotals')||v;var wrap=document.createElement('div');wrap.className='mfix-checkout-controls';wrap.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px 0';"+
        "var cancel=document.createElement('button');cancel.type='button';cancel.className='btn btn-ghost';cancel.textContent='↩ ביטול תשלום';cancel.onclick=function(){clearPayment();};"+
        "var clear=document.createElement('button');clear.type='button';clear.className='btn btn-ghost';clear.textContent='🗑 נקה סל';clear.onclick=clearCart;"+
        "var park=document.createElement('button');park.type='button';park.className='btn btn-outline';park.textContent='⏸ שמור עסקה';park.onclick=parkSale;"+
        "var restore=document.createElement('button');restore.type='button';restore.className='btn btn-outline';restore.textContent='▶ שחזר עסקה';restore.onclick=restoreSale;"+
        "wrap.appendChild(cancel);wrap.appendChild(clear);wrap.appendChild(park);wrap.appendChild(restore);host.insertBefore(wrap,host.firstChild);"+
        "var finish=v.querySelector('.mfix-finish-sale');if(finish&&!finish.dataset.mfixGuarded){finish.dataset.mfixGuarded='1';var original=finish.onclick;finish.onclick=function(){if(finish.dataset.mfixBusy==='1')return;finish.dataset.mfixBusy='1';finish.disabled=true;try{if(typeof original==='function')original.call(finish);}finally{setTimeout(function(){finish.dataset.mfixBusy='0';finish.disabled=false;},1200);}};}"+
        "}install();console.log('[MFIX] checkout controls v2 patch active');})();";

    public static void install(WebView webView){
        if(webView!=null) webView.postDelayed(()->webView.evaluateJavascript(PATCH,null),700);
    }

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView) install((WebView)root);
    }
}
