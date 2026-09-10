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

/** Native inventory import bridge. Reads CSV/XLS/XLSX through Android's document picker and hands bytes to the existing JS importer. */
public class InventoryImportPatchActivity extends YeshInvoicePatchActivity {
    private static final int REQUEST_IMPORT_INVENTORY = 4104;
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
        "window.__mfixAutoPrintAfterSale=function(sale){try{if(!sale||!window.STATE||!window.STATE.settings||window.STATE.settings.printerAutoPrint===false)return;if(typeof window.printDoc!=='function')return;setTimeout(function(){try{window.printDoc(sale.id);}catch(e){console.error('[MFIX AUTO PRINT]',e);}},350);}catch(e){console.error('[MFIX AUTO PRINT HOOK]',e);}};"+
        "if(!window.__mfixFinalizeAutoPrintHook){window.__mfixFinalizeAutoPrintHook=true;var wait=0;function hook(){if(typeof window.finalizeSale!=='function'){if(wait++<40)setTimeout(hook,250);return;}var original=window.finalizeSale;window.finalizeSale=async function(){var before=window.STATE&&Array.isArray(window.STATE.sales)?window.STATE.sales.length:0;var result=await original.apply(this,arguments);var after=window.STATE&&Array.isArray(window.STATE.sales)?window.STATE.sales.length:0;if(after>before&&window.STATE.settings&&window.STATE.settings.printerAutoPrint!==false){window.__mfixAutoPrintAfterSale(window.STATE.sales[after-1]);}return result;};}hook();}"+
        "var el=document.getElementById('inventoryImportFile');if(el){el.style.display='block';el.style.position='fixed';el.style.left='0';el.style.top='0';el.style.width='1px';el.style.height='1px';el.style.opacity='0.01';el.style.zIndex='-1';}"+
        "}install();setInterval(install,1000);console.log('[MFIX] native inventory import + auto print bridge active');})();";

    private void toast(String msg){
        runOnUiThread(() -> Toast.makeText(InventoryImportPatchActivity.this, msg == null ? "" : msg, Toast.LENGTH_LONG).show());
    }

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),2600);
    }

    /**
     * Android DocumentsProvider does not guarantee that Uri.getLastPathSegment()
     * is the original filename. The importer selects its parser from the file
     * extension, so losing the display name can turn XLS/XLSX into an unknown
     * extension. Resolve DISPLAY_NAME from the provider before handing the file
     * to JavaScript, while preserving the existing superclass behavior for all
     * other activity results.
     */
    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if(requestCode != REQUEST_IMPORT_INVENTORY){
            super.onActivityResult(requestCode, resultCode, data);
            return;
        }
        if(resultCode != Activity.RESULT_OK || data == null || data.getData() == null){
            toast("בחירת קובץ המלאי בוטלה");
            return;
        }
        WebView webView = findWebView();
        if(webView == null){
            toast("מסך MFIX עדיין לא מוכן לייבוא המלאי");
            return;
        }
        try{
            Uri uri = data.getData();
            String name = resolveDisplayName(uri);
            java.io.InputStream in = getContentResolver().openInputStream(uri);
            if(in == null) throw new java.io.IOException("לא ניתן לפתוח את הקובץ");
            java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
            byte[] chunk = new byte[16384];
            int n;
            while((n=in.read(chunk))!=-1) buffer.write(chunk,0,n);
            in.close();
            String b64 = Base64.encodeToString(buffer.toByteArray(), Base64.NO_WRAP);
            String safeName = WebViewEscape(name);
            final String js = "window.mfixReceiveNativeInventory && window.mfixReceiveNativeInventory('" + b64 + "','" + safeName + "')";
            webView.post(() -> webView.evaluateJavascript(js,null));
        }catch(Exception ex){
            toast("לא ניתן לקרוא את קובץ המלאי: " + (ex.getMessage()==null?"שגיאה":ex.getMessage()));
        }
    }

    private WebView findWebView(){
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        return root instanceof WebView ? (WebView)root : null;
    }

    private String resolveDisplayName(Uri uri){
        Cursor cursor=null;
        try{
            cursor=getContentResolver().query(uri,new String[]{OpenableColumns.DISPLAY_NAME},null,null,null);
            if(cursor!=null && cursor.moveToFirst()){
                int idx=cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if(idx>=0){
                    String value=cursor.getString(idx);
                    if(value!=null && !value.trim().isEmpty()) return value.trim();
                }
            }
        }catch(Exception ignored){}finally{
            if(cursor!=null) try{cursor.close();}catch(Exception ignored){}
        }
        String fallback=uri.getLastPathSegment();
        if(fallback==null || fallback.trim().isEmpty()) return "inventory.csv";
        fallback=fallback.replace("%20"," ");
        return fallback;
    }

    private String WebViewEscape(String s){
        if(s==null) return "inventory.csv";
        return s.replace("\\","\\\\").replace("'","\\'").replace("\n"," ").replace("\r"," ");
    }
}
