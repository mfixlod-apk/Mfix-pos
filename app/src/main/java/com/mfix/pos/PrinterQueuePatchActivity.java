package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Serializes receipt/reprint requests so concurrent clicks or auto-print cannot overlap on USB. */
public class PrinterQueuePatchActivity extends PrinterManagementPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixPrinterQueueV1)return;window.__mfixPrinterQueueV1=true;"+
        "var queue=[],busy=false;"+
        "function status(text,kind){var w=document.getElementById('mfixPrintQueueStatus');if(!w){var host=document.getElementById('mfixPrinterManagement');if(!host)return;w=document.createElement('div');w.id='mfixPrintQueueStatus';w.style.cssText='margin-top:8px;font-size:12px;font-weight:700;padding:7px 9px;border-radius:8px;background:var(--gray-100);color:var(--gray-700);';host.appendChild(w);}w.textContent=text;w.style.background=kind==='ok'?'var(--green-100)':kind==='err'?'var(--red-100)':'var(--gray-100)';w.style.color=kind==='ok'?'var(--green-600)':kind==='err'?'var(--red-600)':'var(--gray-700)';}"+
        "function pump(){if(busy||!queue.length)return;busy=true;var job=queue.shift();status('🖨️ מדפיס...'+(queue.length?' נשארו '+queue.length+' עבודות בתור':''));Promise.resolve().then(function(){return job.original(job.saleId);}).then(function(){busy=false;if(queue.length)status('🖨️ הודפס/הסתיים — עוברים לעבודה הבאה','ok');else status('🖨️ תור ההדפסה ריק','ok');pump();}).catch(function(e){busy=false;console.error('[MFIX PRINT QUEUE]',e);status('⚠️ עבודת הדפסה נכשלה — '+String(e&&e.message||e),'err');pump();});}"+
        "function install(){if(typeof window.printDoc!=='function'){setTimeout(install,300);return;}if(window.printDoc.__mfixQueued)return;var original=window.printDoc;function queuedPrintDoc(saleId){if(!saleId){return original.apply(this,arguments);}queue.push({saleId:saleId,original:original});status('🖨️ עבודת הדפסה נוספה לתור ('+queue.length+')');pump();}queuedPrintDoc.__mfixQueued=true;window.printDoc=queuedPrintDoc;console.log('[MFIX] printer queue active');}"+
        "install();})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),6200);
    }
}
