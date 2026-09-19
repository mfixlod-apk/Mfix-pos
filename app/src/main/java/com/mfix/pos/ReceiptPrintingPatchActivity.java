package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Routes automatic receipt printing through the existing supported USB raster print pipeline. */
public class ReceiptPrintingPatchActivity extends ProductSerialManagementPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixReceiptPrintingV3)return;window.__mfixReceiptPrintingV3=true;"+
        "function settings(){try{return JSON.parse(localStorage.getItem('mfix_printer_settings_v1')||'{}');}catch(e){return {};}}"+
        "function save(s){try{localStorage.setItem('mfix_printer_settings_v1',JSON.stringify(s));}catch(e){}}"+
        "function printers(){try{return window.AndroidPrinter&&typeof AndroidPrinter.listUsbPrinters==='function'?JSON.parse(AndroidPrinter.listUsbPrinters()||'[]'):[];}catch(e){return [];}}"+
        "function selectedPrinter(s){var ps=printers(),id=String(s.device||localStorage.getItem('mfix_default_printer_v1')||'').trim();if(!id)return null;return ps.find(function(p){return String(p.id)===id||String(p.name)===id;})||null;}"+
        "function canPrint(s){var p=selectedPrinter(s);return !!(p&&p.authorized!==false);}"+
        "function lastSale(){try{var a=JSON.parse(localStorage.getItem('mfix_completed_sales_v1')||'[]');return Array.isArray(a)&&a.length?a[a.length-1]:null;}catch(e){return null;}}"+
        "function markPrinted(id){try{if(id)localStorage.setItem('mfix_last_auto_printed_sale_v1',String(id));}catch(e){}}"+
        "function wasPrinted(id){try{return !!id&&String(localStorage.getItem('mfix_last_auto_printed_sale_v1')||'')===String(id);}catch(e){return false;}}"+
        "function printLatest(reason){var s=settings();if(s.autoPrint===false)return;if(typeof window.printDoc!=='function'){if(typeof toast==='function')toast('המכירה נשמרה, אך מנגנון ההדפסה אינו זמין','err');return;}var sale=lastSale();if(!sale||!sale.id)return;if(wasPrinted(sale.id))return;if(!canPrint(s)){if(typeof toast==='function')toast('המכירה נשמרה. אין מדפסת USB ברירת מחדל מאושרת','err');return;}try{window.printDoc(sale.id);markPrinted(sale.id);if(reason&&typeof console!=='undefined')console.log('[MFIX] receipt queued via '+reason,sale.id);}catch(e){console.error('[MFIX] supported USB receipt print failed',e);if(typeof toast==='function')toast('המכירה נשמרה, אך ההדפסה נכשלה','err');}}"+
        "function install(){var b=document.querySelector('.mfix-finish-sale');if(b&&!b.__mfixReceiptHook){var old=b.onclick;if(typeof old==='function'){b.onclick=function(){var s=settings(),enabled=s.autoPrint!==false;s.autoPrint=false;save(s);try{return old.apply(this,arguments);}finally{setTimeout(function(){var r=settings();r.autoPrint=enabled;save(r);if(enabled)printLatest('onclick');},500);}};b.__mfixReceiptHook=true;}else{b.addEventListener('click',function(){setTimeout(function(){printLatest('click-listener');},500);},true);b.__mfixReceiptHook=true;}}if(!document.__mfixReceiptCapture){document.addEventListener('click',function(ev){var el=ev.target;while(el&&el!==document){if(el.classList&&el.classList.contains('mfix-finish-sale')){setTimeout(function(){printLatest('capture');},650);break;}el=el.parentNode;}},true);document.__mfixReceiptCapture=true;}return !!b;}"+
        "var n=0,t=setInterval(function(){n++;if(install()||n>=80)clearInterval(t);},250);console.log('[MFIX] supported USB receipt printing reliability patch V3 active');})();";

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
