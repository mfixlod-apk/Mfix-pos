package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Native inventory import bridge. Reads CSV/XLS/XLSX through Android's document picker and hands bytes to the existing JS importer. */
public class InventoryImportPatchActivity extends YeshInvoicePatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixNativeInventoryImport)return;window.__mfixNativeInventoryImport=true;"+
        "function install(){"+
        "window.mfixReceiveNativeInventory=function(b64,name){try{"+
        "var bin=atob(b64),bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);"+
        "var file=new File([bytes],name||'inventory.csv',{type:'application/octet-stream'});"+
        "if(typeof window.handleInventoryImportFile!=='function'){toast('מנגנון ייבוא המלאי עדיין נטען','err');return;}"+
        "Promise.resolve(window.handleInventoryImportFile(file)).catch(function(e){console.error(e);toast('שגיאה בייבוא המלאי: '+(e&&e.message?e.message:'שגיאה'),'err');});"+
        "}catch(e){console.error(e);toast('לא ניתן לקרוא את קובץ המלאי','err');}};"+
        "window.openInventoryImport=function(){if(window.AndroidPrinter&&typeof AndroidPrinter.pickInventoryFile==='function'){AndroidPrinter.pickInventoryFile();return;}toast('ייבוא מלאי Android אינו זמין','err');};"+
        "var el=document.getElementById('inventoryImportFile');if(el){el.style.display='block';el.style.position='fixed';el.style.left='0';el.style.top='0';el.style.width='1px';el.style.height='1px';el.style.opacity='0.01';el.style.zIndex='-1';}"+
        "}install();setInterval(install,1000);console.log('[MFIX] native inventory import bridge active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),2600);
    }
}
