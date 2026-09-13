package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds safe cart/payment controls on top of the completed checkout flow. */
public class CheckoutControlsPatchActivity extends CheckoutCompletionPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixCheckoutControlsPatch)return;window.__mfixCheckoutControlsPatch=true;"+
        "function clearPayment(){try{if(window.STATE)window.STATE.currentPayment=null;localStorage.removeItem('mfix_current_payment_v1');}catch(e){}if(window.toast)window.toast('התשלום בוטל','ok');}"+
        "function clearCart(){var c=window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:[];if(!c.length){if(window.toast)window.toast('הסל כבר ריק','err');return;}if(!window.confirm('לנקות את כל הסל ולבטל את התשלום?'))return;try{window.STATE.cart=[];window.STATE.currentPayment=null;localStorage.removeItem('mfix_current_payment_v1');if(typeof window.render==='function')window.render();}catch(e){console.error(e);}if(window.toast)window.toast('הסל נוקה','ok');}"+
        "function install(){var v=document.getElementById('view-pos');if(!v){setTimeout(install,500);return;}if(v.querySelector('.mfix-checkout-controls'))return;var host=v.querySelector('#cartTotals')||v;var wrap=document.createElement('div');wrap.className='mfix-checkout-controls';wrap.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px 0';"+
        "var cancel=document.createElement('button');cancel.type='button';cancel.className='btn btn-ghost';cancel.textContent='↩ ביטול תשלום';cancel.onclick=function(){clearPayment();};"+
        "var clear=document.createElement('button');clear.type='button';clear.className='btn btn-ghost';clear.textContent='🗑 נקה סל';clear.onclick=clearCart;"+
        "wrap.appendChild(cancel);wrap.appendChild(clear);host.insertBefore(wrap,host.firstChild);"+
        "var finish=v.querySelector('.mfix-finish-sale');if(finish&&!finish.dataset.mfixGuarded){finish.dataset.mfixGuarded='1';var original=finish.onclick;finish.onclick=function(){if(finish.dataset.mfixBusy==='1')return;finish.dataset.mfixBusy='1';finish.disabled=true;try{if(typeof original==='function')original.call(finish);}finally{setTimeout(function(){finish.dataset.mfixBusy='0';finish.disabled=false;},1200);}};}"+
        "}install();console.log('[MFIX] checkout controls patch active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),2300);
    }
}
