package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Routes automatic receipt printing through the existing supported USB raster print pipeline. */
public class ReceiptPrintingPatchActivity extends ProductSerialManagementPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixReceiptPrintingV5)return;window.__mfixReceiptPrintingV5=true;"+
        "function core(){try{return window.STATE&&window.STATE.settings?window.STATE.settings:null;}catch(e){return null;}}"+
        "function printers(){var s=core();return s&&Array.isArray(s.printers)?s.printers:[];}"+
        "function selectedPrinter(){var s=core(),id=s&&s.defaultPrinterId?String(s.defaultPrinterId):'';if(!id)return null;var ps=printers();return ps.find(function(p){return String(p.id)===id;})||null;}"+
        "function autoEnabled(){var s=core();return !!(s&&s.printerAutoPrint!==false);}"+
        "function canPrint(){var p=selectedPrinter();return !!(p&&p.type==='USB'&&p.address&&window.AndroidPrinter&&typeof window.AndroidPrinter.printRasterToDevice==='function');}"+
        "function lastSale(){try{var a=JSON.parse(localStorage.getItem('mfix_completed_sales_v1')||'[]');return Array.isArray(a)&&a.length?a[a.length-1]:null;}catch(e){return null;}}"+
        "function markPrinted(id){try{if(id)localStorage.setItem('mfix_last_auto_printed_sale_v1',String(id));}catch(e){}}"+
        "function wasPrinted(id){try{return !!id&&String(localStorage.getItem('mfix_last_auto_printed_sale_v1')||'')===String(id);}catch(e){return false;}}"+
        "function printLatest(reason){if(!autoEnabled()||window.__mfixAutoPrintInFlight)return;if(typeof window.printDoc!=='function'){if(typeof toast==='function')toast('המכירה נשמרה, אך מנגנון ההדפסה אינו זמין','err');return;}var sale=lastSale(),p=selectedPrinter();if(!sale||!sale.id)return;if(wasPrinted(sale.id))return;if(!p){if(typeof toast==='function')toast('המכירה נשמרה. לא הוגדרה מדפסת ברירת מחדל','err');return;}if(!canPrint()){if(typeof toast==='function')toast('המכירה נשמרה. מדפסת ברירת המחדל אינה USB או אינה זמינה בנתיב ההדפסה הנתמך','err');return;}window.__mfixAutoPrintInFlight=true;var done=function(){window.__mfixAutoPrintInFlight=false;};try{Promise.resolve(window.printDoc(sale.id)).then(function(){markPrinted(sale.id);if(reason&&typeof console!=='undefined')console.log('[MFIX] receipt printed via '+reason,sale.id);done();}).catch(function(e){console.error('[MFIX] supported USB receipt print failed',e);if(typeof toast==='function')toast('המכירה נשמרה, אך ההדפסה נכשלה','err');done();});}catch(e){console.error('[MFIX] supported USB receipt print failed',e);if(typeof toast==='function')toast('המכירה נשמרה, אך ההדפסה נכשלה','err');done();}}"+
        "function install(){var b=document.querySelector('.mfix-finish-sale');if(b&&!b.__mfixReceiptHook){var old=b.onclick;if(typeof old==='function'){b.onclick=function(){try{return old.apply(this,arguments);}finally{setTimeout(function(){printLatest('onclick');},500);}};b.__mfixReceiptHook=true;}else{b.addEventListener('click',function(){setTimeout(function(){printLatest('click-listener');},500);},true);b.__mfixReceiptHook=true;}}if(!document.__mfixReceiptCapture){document.addEventListener('click',function(ev){var el=ev.target;while(el&&el!==document){if(el.classList&&el.classList.contains('mfix-finish-sale')){setTimeout(function(){printLatest('capture');},650);break;}el=el.parentNode;}},true);document.__mfixReceiptCapture=true;}return !!b;}"+
        "var n=0,t=setInterval(function(){n++;if(install()||n>=80)clearInterval(t);},250);console.log('[MFIX] supported USB receipt printing reliability patch V5 active');})();";

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
