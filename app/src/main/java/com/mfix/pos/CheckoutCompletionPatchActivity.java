package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Completes a paid POS sale and records an immutable local sale record. */
public class CheckoutCompletionPatchActivity extends PaymentManagementPatchActivity {
    private static final String PATCH =
        "(function(){" +
        "if(window.__mfixCheckoutCompletionPatch)return;window.__mfixCheckoutCompletionPatch=true;" +
        "function money(n){return Number(n||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});}" +
        "function total(){try{if(typeof window.computeCartCalc==='function'){var c=window.computeCartCalc();return Number(c.totalIncl||c.total||0);}}catch(e){}return(window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:[]).reduce(function(s,x){return s+Number(x.lineTotal||x.total||((Number(x.price)||Number(x.unitPrice)||0)*(Number(x.qty)||1))||0);},0);}" +
        "function selectedPrinter(){try{var id=(document.getElementById('st_defaultprinter')||{}).value||localStorage.getItem('mfix_default_printer_v1')||'';var ps=JSON.parse(AndroidPrinter.listUsbPrinters()||'[]');return ps.find(function(p){return p.id===id||p.name===id;})||ps[0]||null;}catch(e){return null;}}" +
        "function b64(s){try{return btoa(s);}catch(e){return '';}}" +
        "function receipt(sale){var lines=['MFIX POS','------------------------------','SALE '+sale.id,'TOTAL '+money(sale.total)+' NIS','PAID '+money(sale.payment.paid)+' NIS','METHOD '+sale.payment.method.toUpperCase(),'CHANGE '+money(sale.payment.change)+' NIS','------------------------------','Thank you!','\\n\\n'];return b64('\\x1b@'+lines.join('\\n')+'\\x1dV\\x00');}" +
        "function finish(){var cart=window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:[];if(!cart.length){toast('הסל ריק — אין מה לסיים','err');return;}var t=total();var p=(window.STATE&&window.STATE.currentPayment)||null;if(!p||Number(p.remaining||Math.max(0,t-Number(p.paid||0)))>0){toast('יש להשלים תשלום לפני סיום המכירה','err');return;}var sale={id:'S'+Date.now(),at:new Date().toISOString(),total:Math.round(t*100)/100,items:cart.map(function(x){return JSON.parse(JSON.stringify(x));}),customer:(window.STATE&&window.STATE.customer)||null,payment:JSON.parse(JSON.stringify(p))};var sales=[];try{sales=JSON.parse(localStorage.getItem('mfix_completed_sales_v1')||'[]');if(!Array.isArray(sales))sales=[];}catch(e){}sales.push(sale);try{localStorage.setItem('mfix_completed_sales_v1',JSON.stringify(sales));localStorage.removeItem('mfix_current_payment_v1');}catch(e){}var pr=selectedPrinter();if(pr&&p){try{var raw=receipt(sale);if(raw&&AndroidPrinter.printEscPosToDevice)AndroidPrinter.printEscPosToDevice(pr.id||pr.name,raw);}catch(e){console.log('[MFIX] receipt print failed',e);}}window.STATE.cart=[];window.STATE.currentPayment=null;try{if(typeof window.render==='function')window.render();}catch(e){}if(window.closeModal)window.closeModal();toast('המכירה '+sale.id+' הושלמה בהצלחה','ok');}" +
        "function install(){var v=document.getElementById('view-pos');if(!v){setTimeout(install,500);return;}if(v.querySelector('.mfix-finish-sale'))return;var b=document.createElement('button');b.type='button';b.className='btn btn-primary btn-lg mfix-finish-sale';b.textContent='✅ סיום מכירה';b.style.margin='0 0 10px 10px';b.onclick=finish;var host=v.querySelector('#cartTotals')||v;host.insertBefore(b,host.firstChild);}" +
        "install();console.log('[MFIX] checkout completion patch active');" +
        "})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),1700);
    }
}
