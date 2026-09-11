package com.mfix.pos;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.Toast;

/** Native inventory import bridge plus printer diagnostics/checkout runtime hooks. */
public class InventoryImportPatchActivity extends MainActivity {
    private static final int REQUEST_IMPORT_INVENTORY = 4104;
    private static final String PATCH =
        "(function(){if(window.__mfixNativeInventoryImport)return;window.__mfixNativeInventoryImport=true;"+
        "function install(){"+
        "window.mfixReceiveNativeInventory=function(b64,name){try{"+
        "var bin=atob(b64),bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);"+
        "var file=new File([bytes],name||'inventory.csv',{type:'application/octet-stream'});"+
        "function run(attempt){if(typeof window.handleInventoryImportFile!=='function'){if(attempt<30){setTimeout(function(){run(attempt+1);},250);return;}toast('מנגנון ייבוא המלאי לא נטען','err');return;}"+
        "Promise.resolve(window.handleInventoryImportFile(file)).then(function(){console.log('[MFIX] native inventory import completed');}).catch(function(e){console.error(e);toast('שגיאה בייבוא המלאי: '+(e&&e.message?e.message:'שגיאה'),'err');});}"+
        "run(0);"+
        "}catch(e){console.error(e);toast('לא ניתן לקרוא את קובץ המלאי','err');}};"+
        "window.openInventoryImport=function(){if(window.AndroidPrinter&&typeof AndroidPrinter.pickInventoryFile==='function'){AndroidPrinter.pickInventoryFile();return;}toast('ייבוא מלאי Android אינו זמין','err');};"+
        "window.__mfixAutoPrintAfterSale=function(sale){try{if(!sale||!window.STATE||!window.STATE.settings||window.STATE.settings.printerAutoPrint===false)return;if(typeof window.printDoc!=='function')return;setTimeout(function(){try{window.printDoc(sale.id);}catch(e){console.error('[MFIX AUTO PRINT]',e);}},350);}catch(e){console.error('[MFIX AUTO PRINT HOOK]',e);}};"+
        "if(!window.__mfixFinalizeAutoPrintHook){window.__mfixFinalizeAutoPrintHook=true;var wait=0;function hook(){if(typeof window.finalizeSale!=='function'){if(wait++<40)setTimeout(hook,250);return;}var original=window.finalizeSale;window.finalizeSale=async function(){var before=window.STATE&&Array.isArray(window.STATE.sales)?window.STATE.sales.length:0;var result=await original.apply(this,arguments);var after=window.STATE&&Array.isArray(window.STATE.sales)?window.STATE.sales.length:0;if(after>before&&window.STATE.settings&&window.STATE.settings.printerAutoPrint!==false){window.__mfixAutoPrintAfterSale(window.STATE.sales[after-1]);}return result;};}hook();}"+
        "}install();console.log('[MFIX] native inventory import patch active');})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) {
            ((WebView)root).postDelayed(() -> ((WebView)root).evaluateJavascript(PATCH,null), 1600);
        }
    }

    public void openInventoryPicker() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        startActivityForResult(intent, REQUEST_IMPORT_INVENTORY);
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_IMPORT_INVENTORY || resultCode != Activity.RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        try {
            java.io.InputStream in = getContentResolver().openInputStream(uri);
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[8192]; int n;
            while (in != null && (n = in.read(buf)) != -1) out.write(buf,0,n);
            if (in != null) in.close();
            String name = null;
            Cursor cursor = null;
            try {
                cursor = getContentResolver().query(uri,new String[]{OpenableColumns.DISPLAY_NAME},null,null,null);
                if (cursor != null && cursor.moveToFirst()) name = cursor.getString(0);
            } finally { if (cursor != null) cursor.close(); }
            final String payload = Base64.encodeToString(out.toByteArray(),Base64.NO_WRAP);
            final String fileName = name == null ? "inventory.csv" : name;
            View root = ((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
            if (root instanceof WebView) ((WebView)root).evaluateJavascript("window.mfixReceiveNativeInventory("+org.json.JSONObject.quote(payload)+","+org.json.JSONObject.quote(fileName)+");",null);
        } catch (Exception e) {
            Toast.makeText(this, "שגיאה בייבוא מלאי: "+e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
}
