package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Routes automatic receipt printing through the existing raster USB print pipeline. */
public class ReceiptPrintingPatchActivity extends ProductSerialManagementPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixReceiptPrintingV1)return;window.__mfixReceiptPrintingV1=true;"+
        "function settings(){try{return JSON.parse(localStorage.getItem('mfix_printer_settings_v1')||'{}');}catch(e){return {};}}"+
        "function save(s){try{localStorage.setItem('mfix_printer_settings_v1',JSON.stringify(s));}catch(e){}}"+
        "function install(){var b=document.querySelector('.mfix-finish-sale');if(!b||b.__mfixReceiptHook)return false;var old=b.onclick;if(typeof old!=='function')return false;b.onclick=function(){var s=settings(),enabled=s.autoPrint!==false;s.autoPrint=false;save(s);old.call(this);if(enabled){setTimeout(function(){try{var a=JSON.parse(localStorage.getItem('mfix_completed_sales_v1')||'[]');var sale=Array.isArray(a)&&a.length?a[a.length-1]:null;if(sale&&typeof window.printDoc==='function'){window.printDoc(sale.id);}}catch(e){console.error('[MFIX] raster receipt print failed',e);}finally{var r=settings();r.autoPrint=enabled;save(r);}},350);}else{var r=settings();r.autoPrint=false;save(r);} };b.__mfixReceiptHook=true;return true;}"+
        "var n=0,t=setInterval(function(){n++;if(install()||n>=40)clearInterval(t);},250);console.log('[MFIX] receipt printing raster pipeline patch active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),5200);
    }
}
