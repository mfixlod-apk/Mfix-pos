package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/**
 * Runtime safety layer for business-logic fixes that must be applied
 * without duplicating the embedded single-page POS application.
 */
public class RuntimeSafetyPatchActivity extends PatchedMainActivity {
    private static final String RETURN_AND_IMPORT_PATCH =
        "(function(){" +
        "if(window.__mfixReturnImportSafetyPatch)return;window.__mfixReturnImportSafetyPatch=true;" +
        "function install(){" +
        "if(!window.STATE||typeof window.processReturn!=='function'||typeof window.commitInventoryImport!=='function'){setTimeout(install,250);return;}" +
        "window.returnedQty=function(saleId,itemIndex){var sale=(window.findSale&&window.findSale(saleId));var item=sale&&sale.items&&sale.items[itemIndex];if(!item)return 0;return (window.STATE.returns||[]).filter(function(r){return r.originalSaleId===saleId;}).reduce(function(sum,r){return sum+(r.items||[]).filter(function(it){return it.productId===item.productId&&String(it.imei||'')===String(item.imei||'');}).reduce(function(a,it){return a+(Number(it.qty)||0);},0);},0);};" +
        "var originalImport=window.commitInventoryImport;" +
        "window.commitInventoryImport=async function(){var before={};(window.STATE.products||[]).forEach(function(p){before[p.id]={qty:(p.trackSerial?(p.imeis||[]).filter(function(i){return i.status==='available';}).length:Number(p.stock)||0),name:p.name};});var result=await originalImport.apply(this,arguments);if(typeof window.addInventoryHistory==='function'){for(var i=0;i<(window.STATE.products||[]).length;i++){var p=window.STATE.products[i],after=p.trackSerial?(p.imeis||[]).filter(function(x){return x.status==='available';}).length:Number(p.stock)||0,b=before[p.id];if(!b&&after>0){await window.addInventoryHistory(p.id,'ייבוא מלאי',after,0,after,'ייבוא קובץ מלאי');}else if(b&&after!==b.qty){await window.addInventoryHistory(p.id,'ייבוא מלאי',after-b.qty,b.qty,after,'ייבוא קובץ מלאי');}}}return result;};" +
        "console.log('[MFIX] return and import safety patch active');" +
        "}" +
        "install();" +
        "})();";

    private static final String CHECKOUT_GUARD_PATCH =
        "(function(){" +
        "if(window.__mfixCheckoutGuardPatch)return;window.__mfixCheckoutGuardPatch=true;" +
        "function install(){" +
        "if(typeof window.finalizeSale!=='function'){setTimeout(install,250);return;}" +
        "var originalFinalize=window.finalizeSale,inFlight=false;" +
        "window.finalizeSale=async function(){" +
        "if(inFlight){if(typeof window.toast==='function')window.toast('המכירה כבר בתהליך. נא להמתין לסיום הפעולה','err');return;}" +
        "inFlight=true;var buttons=Array.prototype.slice.call(document.querySelectorAll('[onclick=\\\"finalizeSale()\\\"]'));buttons.forEach(function(b){b.disabled=true;});" +
        "try{return await originalFinalize.apply(this,arguments);}" +
        "finally{inFlight=false;buttons.forEach(function(b){b.disabled=false;});}" +
        "};" +
        "console.log('[MFIX] checkout duplicate-submit guard active');" +
        "}" +
        "install();" +
        "})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup) findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) {
            WebView web = (WebView) root;
            web.postDelayed(() -> {
                web.evaluateJavascript(RETURN_AND_IMPORT_PATCH, null);
                web.evaluateJavascript(CHECKOUT_GUARD_PATCH, null);
            }, 1100);
        }
    }
}
