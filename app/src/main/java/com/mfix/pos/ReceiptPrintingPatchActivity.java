package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Routes automatic receipt printing through the existing supported USB raster print pipeline. */
public class ReceiptPrintingPatchActivity extends ProductSerialManagementPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixReceiptPrintingV2)return;window.__mfixReceiptPrintingV2=true;"+
        "function settings(){try{return JSON.parse(localStorage.getItem('mfix_printer_settings_v1')||'{}');}catch(e){return {};}}"+
        "function save(s){try{localStorage.setItem('mfix_printer_settings_v1',JSON.stringify(s));}catch(e){}}"+
        "function printers(){try{return window.AndroidPrinter&&typeof AndroidPrinter.listUsbPrinters==='function'?JSON.parse(AndroidPrinter.listUsbPrinters()||'[]'):[];}catch(e){return [];}}"+
        "function selectedPrinter(s){var ps=printers(),id=String(s.device||localStorage.getItem('mfix_default_printer_v1')||'');return ps.find(function(p){return String(p.id)===id||String(p.name)===id;})||ps[0]||null;}"+
        "function canPrint(s){var p=selectedPrinter(s);if(!p)return false;if(p.authorized===false)return false;return true;}"+
        "function install(){var b=document.querySelector('.mfix-finish-sale');if(!b||b.__mfixReceiptHook)return false;var old=b.onclick;if(typeof old!=='function')return false;b.onclick=function(){var s=settings(),enabled=s.autoPrint!==false;s.autoPrint=false;save(s);old.call(this);if(enabled){setTimeout(function(){try{var a=JSON.parse(localStorage.getItem('mfix_completed_sales_v1')||'[]');var sale=Array.isArray(a)&&a.length?a[a.length-1]:null;if(!sale||typeof window.printDoc!=='function')return;if(!canPrint(s)){if(typeof toast==='function')toast('המכירה נשמרה. אין מדפסת USB מאושרת להדפסה אוטומטית','err');return;}window.printDoc(sale.id);}catch(e){console.error('[MFIX] supported USB receipt print failed',e);if(typeof toast==='function')toast('המכירה נשמרה, אך ההדפסה נכשלה','err');}finally{var r=settings();r.autoPrint=enabled;save(r);}},350);}else{var r=settings();r.autoPrint=false;save(r);} };b.__mfixReceiptHook=true;return true;}"+
        "var n=0,t=setInterval(function(){n++;if(install()||n>=40)clearInterval(t);},250);console.log('[MFIX] supported USB receipt printing guard active');})();";

    /** Installs automatic receipt printing on an already-active WebView. */
    public static void install(WebView webView) {
        if (webView == null) return;
        webView.postDelayed(() -> webView.evaluateJavascript(PATCH, null), 4200);
    }

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView) install((WebView)root);
    }
}
