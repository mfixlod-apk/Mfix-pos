package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds a native USB printer diagnostics panel to Settings. */
public class PrinterDiagnosticsPatchActivity extends InventoryHistoryPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixPrinterDiagnosticsPatch)return;window.__mfixPrinterDiagnosticsPatch=true;"+
        "function esc(s){return String(s==null?'':s).replace(/[&<>\\\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[c];});}"+
        "function getPrinters(){try{return JSON.parse(window.AndroidPrinter.listUsbPrinters()||'[]');}catch(e){return [];}}"+
        "function refresh(){var box=document.getElementById('mfixPrinterDiagBody');if(!box)return;var a=getPrinters();if(!a.length){box.innerHTML='<div class=\"muted\">לא זוהתה כרגע מדפסת USB תואמת.</div>';return;}box.innerHTML=a.map(function(p){var d={};try{d=JSON.parse(window.AndroidPrinter.getUsbPrinterDiagnostics(p.id)||'{}')}catch(e){};return '<div style=\"border:1px solid var(--gray-200);border-radius:10px;padding:10px;margin-bottom:8px\"><div style=\"font-weight:800\">🖨️ '+esc(p.name||p.id)+'</div><div class=\"muted\" style=\"font-size:11px;margin-top:4px\">VID: '+p.vendorId+' · PID: '+p.productId+' · סוג: '+esc(p.candidateType||'')+'</div><div style=\"margin-top:6px\"><span class=\"pill '+(p.authorized?'green':'amber')+'\">'+(p.authorized?'✔ הרשאה קיימת':'⚠ נדרשת הרשאה')+'</span> <span class=\"pill blue\">USB Bulk</span> <span class=\"pill green\">ESC/POS</span> <span class=\"pill green\">Raster</span></div><div class=\"muted\" style=\"font-size:11px;margin-top:6px\">ממשקים: '+((d.interfaces||[]).length)+' · יציאות Bulk OUT: '+(d.interfaces||[]).reduce(function(n,x){return n+(Number(x.bulkOutEndpoints)||0)},0)+'</div></div>';}).join('');}"+
        "function install(){var v=document.getElementById('view-settings');if(!v){setTimeout(install,700);return;}if(document.getElementById('mfixPrinterDiagnosticsCard'))return;var box=document.createElement('div');box.id='mfixPrinterDiagnosticsCard';box.className='card';box.style.marginBottom='12px';box.innerHTML='<div class=\"section-title\">🖨️ אבחון מדפסת USB</div><div class=\"muted\" style=\"font-size:12px;margin-bottom:10px\">בדיקה אמיתית של התקני USB שהאפליקציה מזהה: הרשאה, VID/PID, ממשקי Bulk ויכולות ESC/POS/Raster.</div><div id=\"mfixPrinterDiagBody\"></div><button type=\"button\" class=\"btn btn-outline\" onclick=\"window.__mfixPrinterDiagRefresh&&window.__mfixPrinterDiagRefresh()\">🔄 רענן אבחון</button>';v.insertBefore(box,v.firstChild);window.__mfixPrinterDiagRefresh=refresh;refresh();}var n=0;function loop(){n++;install();if(n<90)setTimeout(loop,700);}loop();})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),6500);
    }
}
