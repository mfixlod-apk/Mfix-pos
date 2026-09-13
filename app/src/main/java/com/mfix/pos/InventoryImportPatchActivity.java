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
public class InventoryImportPatchActivity extends PatchedMainActivity {
    private static final int REQUEST_IMPORT_INVENTORY = 4104;
    private static final String PATCH =
        "(function(){if(window.__mfixInventoryImportPatch)return;window.__mfixInventoryImportPatch=true;"+
        "function send(){var f=document.getElementById('inventoryImportFile');if(!f)return false;f.accept='.csv,.tsv,.txt,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain';f.style.display='block';f.style.position='fixed';f.style.left='0';f.style.top='0';f.style.width='1px';f.style.height='1px';f.style.opacity='0.01';f.style.zIndex='-1';if(!f.__mfixNativeHook){f.addEventListener('change',function(){if(this.files&&this.files[0]&&typeof window.handleInventoryImportFile==='function')window.handleInventoryImportFile(this.files[0]);this.value='';});f.__mfixNativeHook=true;}return true;}"+
        "window.mfixOpenInventoryImport=function(){if(window.AndroidPrinter&&AndroidPrinter.pickInventoryFile){AndroidPrinter.pickInventoryFile();return;}var f=document.getElementById('inventoryImportFile');if(f){send();f.click();}else if(window.toast)window.toast('בחירת קובץ מלאי אינה זמינה','err');};"+
        "window.mfixReceiveNativeInventory=function(b64,name){try{var bin=atob(b64),bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);var blob=new Blob([bytes],{type:'application/octet-stream'});var file=new File([blob],name||'inventory.csv');if(typeof window.handleInventoryImportFile==='function')window.handleInventoryImportFile(file);else window.__mfixPendingInventoryFile=file;}catch(e){if(window.toast)window.toast('שגיאה בטעינת קובץ המלאי: '+e.message,'err');}};"+
        "send();setInterval(send,2000);console.log('[MFIX] native inventory import bridge active');})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup) findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) {
            ((WebView) root).postDelayed(() -> ((WebView) root).evaluateJavascript(PATCH, null), 900);
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_IMPORT_INVENTORY || resultCode != Activity.RESULT_OK || data == null || data.getData() == null) return;
        try {
            Uri uri = data.getData();
            String name = resolveDisplayName(uri);
            java.io.InputStream in = getContentResolver().openInputStream(uri);
            java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
            byte[] chunk = new byte[16384]; int n;
            while ((n = in.read(chunk)) != -1) buffer.write(chunk, 0, n);
            in.close();
            String b64 = Base64.encodeToString(buffer.toByteArray(), Base64.NO_WRAP);
            String js = "window.mfixReceiveNativeInventory && window.mfixReceiveNativeInventory('" + b64 + "','" + WebViewEscape(name) + "')";
            View root = ((ViewGroup) findViewById(android.R.id.content)).getChildAt(0);
            if (root instanceof WebView) ((WebView) root).evaluateJavascript(js, null);
        } catch (Exception ex) {
            Toast.makeText(this, "שגיאה בייבוא מלאי: " + ex.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private String resolveDisplayName(Uri uri) {
        Cursor cursor = null;
        try {
            cursor = getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null);
            if (cursor != null && cursor.moveToFirst()) {
                int i = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (i >= 0) return cursor.getString(i);
            }
        } finally { if (cursor != null) cursor.close(); }
        String path = uri == null ? null : uri.getLastPathSegment();
        return path == null ? "inventory.csv" : path.replace("%20", " ");
    }

    private String WebViewEscape(String s) {
        if (s == null) return "inventory.csv";
        return s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ").replace("\r", " ");
    }
}
