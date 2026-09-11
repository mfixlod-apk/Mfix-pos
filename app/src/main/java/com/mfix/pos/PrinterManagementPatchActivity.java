package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds live USB printer management and verified test/reprint actions to Settings. */
public class PrinterManagementPatchActivity extends InventoryImportPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixPrinterManagement)return;window.__mfixPrinterManagement=true;"+
        "function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}"+
        "function printers(){try{return JSON.parse(window.AndroidPrinter.listUsbPrinters()||'[]');}catch(e){return [];}}"+
        "function b64(s){try{return btoa(unescape(encodeURIComponent(s)));}catch(e){return '';}}"+
        "function selected(ps){var id=(document.getElementById('st_defaultprinter')||{}).value||localStorage.getItem('mfix_default_printer_v1')||'';return ps.find(function(x){return x.id===id||x.name===id;})||ps[0]||null;}"+
        "function refresh(){var wrap=document.getElementById('printerProfilesWrap');if(!wrap)return;var old=document.getElementById('mfixPrinterManagement');if(!old){old=document.createElement('div');old.id='mfixPrinterManagement';old.style.marginTop='10px';wrap.appendChild(old);}var ps=printers(),p=selected(ps),status=p?(p.authorized?'מחוברת ומאושרת':'מחוברת — נדרשת הרשאת USB'):'לא נמצאה מדפסת USB',ok=!!(p&&p.authorized);old.innerHTML='<div class=\"card\" style=\"background:var(--gray-50);border:1px solid var(--gray-200)\"><b>🖨️ מצב מדפסת</b><div style=\"margin-top:6px;font-size:13px\">'+esc(status)+'</div><div style=\"margin-top:4px;font-size:12px;color:var(--gray-500)\">'+(p?esc(p.name)+' · VID '+p.vendorId+' / PID '+p.productId:'חבר מדפסת USB תרמית נתמכת')+'</div><div style=\"display:flex;gap:8px;flex-wrap:wrap;margin-top:10px\"><button id=\"mfixPrinterRefresh\" class=\"btn btn-ghost\">🔄 רענן</button><button id=\"mfixPrinterTest\" class=\"btn btn-primary\" '+(ok?'':'disabled')+'>🧪 הדפסת ניסיון</button><button id=\"mfixPrinterReprint\" class=\"btn btn-outline\" '+(ok?'':'disabled')+'>↩️ הדפס קבלה אחרונה</button></div><div id=\"mfixPrinterHint\" style=\"margin-top:8px;font-size:11px;color:var(--gray-500)\">החיבור המאומת כאן הוא USB עם יציאת bulk; אין כאן טענה לתמיכה ב-Bluetooth/Wi‑Fi.</div></div>';document.getElementById('mfixPrinterRefresh').onclick=refresh;document.getElementById('mfixPrinterTest').onclick=function(){var chosen=selected(ps);if(!chosen){toast('לא נמצאה מדפסת USB','err');return;}if(!window.AndroidPrinter||typeof AndroidPrinter.printEscPosToDevice!=='function'){toast('הדפסת ESC/POS אינה זמינה בגרסה זו','err');return;}var raw='\\x1b@MFIX POS TEST\\n\\nPrinter connection OK\\n\\n\\x1dV\\x00';var payload=btoa(raw);if(!payload){toast('לא ניתן להכין נתוני הדפסה','err');return;}AndroidPrinter.printEscPosToDevice(chosen.id||chosen.name,payload);toast('נשלחה הדפסת ניסיון למדפסת','ok');};document.getElementById('mfixPrinterReprint').onclick=function(){var chosen=selected(ps),sales=[];try{sales=JSON.parse(localStorage.getItem('mfix_completed_sales_v1')||'[]');if(!Array.isArray(sales))sales=[];}catch(e){}var sale=sales.length?sales[sales.length-1]:null;if(!chosen){toast('לא נמצאה מדפסת USB','err');return;}if(!sale){toast('אין קבלה קודמת להדפסה','err');return;}var lines=['MFIX POS','------------------------------','SALE '+String(sale.id||''),'TOTAL '+Number(sale.total||0).toFixed(2)+' NIS','PAID '+Number((sale.payment||{}).paid||0).toFixed(2)+' NIS','METHOD '+String((sale.payment||{}).method||'').toUpperCase(),'CHANGE '+Number((sale.payment||{}).change||0).toFixed(2)+' NIS','------------------------------','Thank you!','\\n\\n'];var raw='\\x1b@'+lines.join('\\n')+'\\x1dV\\x00';try{AndroidPrinter.printEscPosToDevice(chosen.id||chosen.name,btoa(raw));toast('נשלחה הדפסה חוזרת של '+sale.id,'ok');}catch(e){toast('שגיאה בהדפסה חוזרת','err');}};}"+
        "function install(){refresh();}install();setInterval(install,5000);console.log('[MFIX] printer management panel active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),3200);
    }
}
