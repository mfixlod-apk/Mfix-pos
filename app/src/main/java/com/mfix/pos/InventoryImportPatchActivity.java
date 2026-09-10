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
public class InventoryImportPatchActivity extends YeshInvoicePatchActivity {
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
        "window.mfixShowPrinterDiagnostics=function(deviceName){try{"+
        "if(!window.AndroidPrinter||typeof AndroidPrinter.getUsbPrinterDiagnostics!=='function'){toast('אבחון USB אינו זמין בגרסה זו','err');return;}"+
        "var raw=AndroidPrinter.getUsbPrinterDiagnostics(deviceName||'');var d=JSON.parse(raw||'{}');"+
        "var interfaces=(d.interfaces||[]).map(function(x){return '<tr><td>'+x.index+'</td><td>'+x.class+'</td><td>'+x.subclass+'</td><td>'+x.protocol+'</td><td>'+x.bulkOutEndpoints+'</td></tr>';}).join('');"+
        "var html='<div class=\\\"modal-head\\\"><h3>🧪 אבחון מדפסת USB</h3><button class=\\\"modal-close\\\" onclick=\\\"closeModal()\\\">✕</button></div>'+"+
        "'<div class=\\\"modal-body\\\"><div class=\\\"card\\\" style=\\\"background:var(--gray-50);margin-bottom:12px\\\">'+"+
        "'<b>'+((d.deviceName||'USB Printer'))+'</b><div style=\\\"font-size:12px;margin-top:5px\\\">VID: '+(d.vendorId??'—')+' | PID: '+(d.productId??'—')+' | הרשאה: '+(d.authorized?'כן':'לא')+' | סוג: '+(d.candidateType||'—')+'</div></div>'+"+
        "'<table class=\\\"tbl\\\"><thead><tr><th>ממשק</th><th>Class</th><th>SubClass</th><th>Protocol</th><th>Bulk OUT</th></tr></thead><tbody>'+interfaces+'</tbody></table>'+"+
        "'<div style=\\\"margin-top:12px;font-size:12px;color:var(--gray-500)\\\">יכולות המנגנון המדווחות: USB Bulk, ESC/POS, Raster ומגירת מזומן. האבחון מתאר את יכולות החיבור — הוא אינו הוכחה שהמדפסת הפיזית הדפיסה.</div></div>'+"+
        "'<div class=\\\"modal-foot\\\"><button class=\\\"btn btn-primary\\\" onclick=\\\"closeModal()\\\">סגור</button></div>';"+
        "openModal(html,{wide:true});"+
        "}catch(e){console.error('[MFIX PRINTER DIAGNOSTICS]',e);toast('אבחון המדפסת נכשל: '+(e&&e.message?e.message:'שגיאה'),'err');}};"+
        "function installPrinterDiagnosticsButton(){"+
        "var wrap=document.getElementById('printerProfilesWrap');if(!wrap||document.getElementById('mfixPrinterDiagnosticsButton'))return;"+
        "var b=document.createElement('button');b.id='mfixPrinterDiagnosticsButton';b.className='btn btn-ghost';b.style.marginTop='8px';b.textContent='🧪 אבחון USB';"+
        "b.onclick=function(){var id=document.getElementById('st_defaultprinter')?.value||'';var p=(window.STATE?.settings?.printers||[]).find(function(x){return x.id===id;});if(!p){toast('בחרו מדפסת ברירת מחדל לפני האבחון','err');return;}window.mfixShowPrinterDiagnostics(p.address||'');};"+
        "wrap.appendChild(b);"+
        "}"+
        "var el=document.getElementById('inventoryImportFile');if(el){el.style.display='block';el.style.position='fixed';el.style.left='0';el.style.top='0';el.style.width='1px';el.style.height='1px';el.style.opacity='0.01';el.style.zIndex='-1';}"+
        "installPrinterDiagnosticsButton();"+
        "}install();setInterval(install,1000);console.log('[MFIX] native inventory import + printer diagnostics + auto print bridge active');})();";

    private void toast(String msg){
        runOnUiThread(() -> Toast.makeText(InventoryImportPatchActivity.this, msg == null ? "" : msg, Toast.LENGTH_LONG).show());
    }

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),2600);
    }

    /** Android DocumentsProvider may expose a URI segment that is not the original filename. */
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
            if(buffer.size()>50*1024*1024) throw new java.io.IOException("הקובץ גדול מדי (מקסימום 50MB)");
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
