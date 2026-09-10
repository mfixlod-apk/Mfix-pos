package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds a small live printer-management panel to the existing Settings printer section. */
public class PrinterManagementPatchActivity extends InventoryImportPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixPrinterManagement)return;window.__mfixPrinterManagement=true;"+
        "function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}"+
        "function printers(){try{return JSON.parse(window.AndroidPrinter.listUsbPrinters()||'[]');}catch(e){return [];}}"+
        "function b64(s){try{return btoa(s);}catch(e){return '';}}"+
        "function refresh(){var wrap=document.getElementById('printerProfilesWrap');if(!wrap)return;var old=document.getElementById('mfixPrinterManagement');if(!old){old=document.createElement('div');old.id='mfixPrinterManagement';old.style.marginTop='10px';wrap.appendChild(old);}var ps=printers();var selected=document.getElementById('st_defaultprinter')?.value||'';var p=ps.find(function(x){return x.id===selected||x.name===selected;})||ps[0];var status=p?(p.authorized?'מחוברת ומאושרת':'מחוברת — נדרשת הרשאת USB'):'לא נמצאה מדפסת USB';var ok=p&&p.authorized;old.innerHTML='<div class=\"card\" style=\"background:var(--gray-50);border:1px solid var(--gray-200)\"><b>🖨️ מצב מדפסת</b><div style=\"margin-top:6px;font-size:13px\">'+esc(status)+'</div><div style=\"margin-top:4px;font-size:12px;color:var(--gray-500)\">'+(p?esc(p.name)+' · VID '+p.vendorId+' / PID '+p.productId:'חבר מדפסת USB תרמית נתמכת')+'</div><div style=\"display:flex;gap:8px;flex-wrap:wrap;margin-top:10px\"><button id=\"mfixPrinterRefresh\" class=\"btn btn-ghost\">🔄 רענן</button><button id=\"mfixPrinterTest\" class=\"btn btn-primary\" '+(ok?'':'disabled')+'>🧪 הדפסת ניסיון</button></div></div>';document.getElementById('mfixPrinterRefresh').onclick=refresh;document.getElementById('mfixPrinterTest').onclick=function(){var id=document.getElementById('st_defaultprinter')?.value||'';var chosen=ps.find(function(x){return x.id===id||x.name===id;})||p;if(!chosen){toast('לא נמצאה מדפסת USB','err');return;}if(!window.AndroidPrinter||typeof AndroidPrinter.printEscPosToDevice!=='function'){toast('הדפסת ESC/POS אינה זמינה בגרסה זו','err');return;}var raw='\\x1b@MFIX POS TEST\\n\\nPrinter connection OK\\n\\n\\x1dV\\x00';var payload=b64(raw);if(!payload){toast('לא ניתן להכין נתוני הדפסה','err');return;}AndroidPrinter.printEscPosToDevice(chosen.id||chosen.name,payload);toast('נשלחה הדפסת ניסיון למדפסת','ok');};}"+
        "function install(){refresh();}install();setInterval(install,2000);console.log('[MFIX] printer management panel active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),3200);
    }
}
