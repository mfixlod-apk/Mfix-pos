package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Keeps print requests ordered and exposes a small queue-control UI. */
public class PrinterQueuePatchActivity extends PrinterManagementPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixPrinterQueueV3)return;window.__mfixPrinterQueueV3=true;"+
        "var queue=[],busy=false,activeSaleId='';"+
        "function status(text,kind){var w=document.getElementById('mfixPrintQueueStatus');if(!w){var host=document.getElementById('mfixPrinterManagement');if(!host)return;w=document.createElement('div');w.id='mfixPrintQueueStatus';w.style.cssText='margin-top:8px;font-size:12px;font-weight:700;padding:7px 9px;border-radius:8px;background:var(--gray-100);color:var(--gray-700);';host.appendChild(w);}w.textContent=text;w.style.background=kind==='ok'?'var(--green-100)':kind==='err'?'var(--red-100)':'var(--gray-100)';w.style.color=kind==='ok'?'var(--green-600)':kind==='err'?'var(--red-600)':'var(--gray-700)';}"+
        "function refreshControls(){var host=document.getElementById('mfixPrinterManagement');if(!host)return;var b=document.getElementById('mfixPrinterQueueClear');if(!b){b=document.createElement('button');b.id='mfixPrinterQueueClear';b.className='btn btn-ghost';b.textContent='🗑️ נקה תור';var row=host.querySelector('div[style*=\"display:flex\"]');if(row)row.appendChild(b);b.onclick=function(){var dropped=queue.length;queue=[];refreshControls();status(dropped?'🗑️ הוסרו '+dropped+' עבודות ממתינות':'🖨️ אין עבודות ממתינות','ok');};}b.disabled=queue.length===0;}"+
        "function pump(){refreshControls();if(busy||!queue.length){if(!busy&&!queue.length)status('🖨️ תור ההדפסה ריק','ok');return;}busy=true;var job=queue.shift();activeSaleId=job.saleId||'';refreshControls();status('🖨️ שולח להדפסה...'+(queue.length?' נשארו '+queue.length+' בקשות':''));Promise.resolve().then(function(){return job.original.apply(job.context,job.args);}).then(function(){busy=false;activeSaleId='';if(queue.length)status('🖨️ הבקשה נשלחה — עוברים לבאה','ok');else status('🖨️ הבקשה נשלחה; התור ריק','ok');refreshControls();setTimeout(pump,120);}).catch(function(e){busy=false;activeSaleId='';console.error('[MFIX PRINT QUEUE]',e);status('⚠️ בקשת הדפסה נכשלה — '+String(e&&e.message||e),'err');refreshControls();setTimeout(pump,120);});}"+
        "function install(){if(typeof window.printDoc!=='function'){setTimeout(install,300);return;}if(window.printDoc.__mfixQueued)return;var original=window.printDoc;function queuedPrintDoc(saleId){if(!saleId)return original.apply(this,arguments);if(String(saleId)===String(activeSaleId))return;for(var i=0;i<queue.length;i++)if(String(queue[i].saleId)===String(saleId))return;queue.push({saleId:saleId,context:this,args:Array.prototype.slice.call(arguments),original:original});status('🖨️ בקשת הדפסה נוספה לתור ('+queue.length+')');refreshControls();pump();}queuedPrintDoc.__mfixQueued=true;window.printDoc=queuedPrintDoc;refreshControls();console.log('[MFIX] printer request queue V3 active');}"+
        "install();})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),6200);
    }
}
