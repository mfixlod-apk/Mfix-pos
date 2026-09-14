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

/** Native inventory/backup file bridges plus printer diagnostics/checkout runtime hooks. */
public class InventoryImportPatchActivity extends PatchedMainActivity {
    private static final int REQUEST_IMPORT_INVENTORY = 4104;
    private static final int REQUEST_RESTORE_BACKUP = 4103;
    private static final String PATCH =
        "(function(){if(window.__mfixNativeInventoryImport)return;window.__mfixNativeInventoryImport=true;"+
        "function install(){"+
        "window.mfixReceiveNativeInventory=function(b64,name){try{"+
        "var bin=atob(b64),bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);"+
        "var file=new File([bytes],name||'inventory.csv',{type:'application/octet-stream'});"+
        "function run(attempt){if(typeof window.handleInventoryImportFile!=='function'){if(attempt<40){setTimeout(function(){run(attempt+1);},250);return;}toast('מנגנון ייבוא המלאי לא נטען','err');return;}"+
        "Promise.resolve(window.handleInventoryImportFile(file)).then(function(){console.log('[MFIX] native inventory import completed');}).catch(function(e){console.error(e);toast('שגיאה בייבוא המלאי: '+(e&&e.message?e.message:'שגיאה'),'err');});}"+
        "run(0);"+
        "}catch(e){console.error(e);toast('לא ניתן לקרוא את קובץ המלאי','err');}};"+
        "window.openInventoryImport=function(){if(window.AndroidPrinter&&typeof window.AndroidPrinter.pickInventoryFile==='function'){window.AndroidPrinter.pickInventoryFile();return;}toast('ייבוא מלאי Android אינו זמין','err');};"+
        "window.mfixReceiveNativeBackup=function(b64){try{var bin=atob(b64),bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);var text=new TextDecoder('utf-8').decode(bytes),b=JSON.parse(text),st=b&&b.state?b.state:null;if(!st&&b&&b.format==='MFIX-POS-BACKUP'){st={settings:b.settings,products:b.products,customers:b.customers,sales:b.sales,repairs:b.repairs,returns:b.returns||[],shifts:b.shifts||[],giftCards:b.giftCards||[],preorders:b.preorders||[],auditLog:b.auditLog||[],inventoryHistory:b.inventoryHistory||[],currentShift:b.currentShift||null};}if(!st||typeof st!=='object'||!st.settings||!Array.isArray(st.products)||!Array.isArray(st.customers)||!Array.isArray(st.sales)||!Array.isArray(st.repairs))throw new Error('קובץ גיבוי לא תקין');var next=Object.assign({},st,{cart:[],cartCustomerId:null,linkedRepairId:null,docCustomerName:'',docCustomerPhone:'',pointsToRedeem:0,loaded:true});if(typeof window.saveKey!=='function')throw new Error('מנגנון שמירת הנתונים אינו זמין');Promise.resolve(window.saveKey('settings',st.settings)).then(function(){return window.saveKey('products',st.products);}).then(function(){return window.saveKey('customers',st.customers);}).then(function(){return window.saveKey('sales',st.sales);}).then(function(){return window.saveKey('repairs',st.repairs);}).then(function(){return window.saveKey('misc',{returns:Array.isArray(st.returns)?st.returns:[],shifts:Array.isArray(st.shifts)?st.shifts:[],giftCards:Array.isArray(st.giftCards)?st.giftCards:[],preorders:Array.isArray(st.preorders)?st.preorders:[],auditLog:Array.isArray(st.auditLog)?st.auditLog:[],inventoryHistory:Array.isArray(st.inventoryHistory)?st.inventoryHistory:[],currentShift:st.currentShift||null});}).then(function(){var old=window.STATE;Object.keys(old).forEach(function(k){delete old[k];});Object.assign(old,next);if(b.users!=null)localStorage.setItem('mfix_users_v1',b.users);if(b.activeUser!=null)localStorage.setItem('mfix_pos_active_user_v1',b.activeUser);if(b.yeshInvoice!=null)localStorage.setItem('mfix_yesh_invoice_v1',b.yeshInvoice);if(b.yeshInvoiceOutbox!=null)localStorage.setItem('mfix_yesh_invoice_outbox_v1',b.yeshInvoiceOutbox);if(typeof window.render==='function')window.render();toast('השחזור הושלם ונשמר. האפליקציה תיטען מחדש','ok');setTimeout(function(){location.reload();},700);}).catch(function(e){console.error('[MFIX BACKUP RESTORE]',e);toast('השחזור נכשל: '+(e&&e.message?e.message:'שגיאת שמירה'),'err');});}catch(e){console.error('[MFIX BACKUP RESTORE]',e);toast('השחזור נכשל: '+(e&&e.message?e.message:'קובץ גיבוי לא תקין'),'err');}};"+
        "if(!window.__mfixFinalizeAutoPrintHook){window.__mfixFinalizeAutoPrintHook=true;var wait=0;function hook(){if(typeof window.finalizeSale!=='function'){if(wait++<40)setTimeout(hook,250);return;}var original=window.finalizeSale;window.finalizeSale=async function(){var before=window.STATE&&Array.isArray(window.STATE.sales)?window.STATE.sales.length:0;var result=await original.apply(this,arguments);var after=window.STATE&&Array.isArray(window.STATE.sales)?window.STATE.sales.length:0;if(after>before&&window.STATE.settings&&window.STATE.settings.printerAutoPrint!==false){window.__mfixAutoPrintAfterSale(window.STATE.sales[after-1]);}return result;};}hook();}"+
        "window.__mfixAutoPrintAfterSale=function(sale){try{if(!sale||!window.STATE||!window.STATE.settings||window.STATE.settings.printerAutoPrint===false)return;if(typeof window.printDoc!=='function')return;setTimeout(function(){try{window.printDoc(sale.id);}catch(e){console.error('[MFIX AUTO PRINT]',e);}},350);}catch(e){console.error('[MFIX AUTO PRINT HOOK]',e);}};"+
        "}"+
        "install();console.log('[MFIX] native inventory + backup restore patch active');})();";

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
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"text/csv","text/plain","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
        startActivityForResult(intent, REQUEST_IMPORT_INVENTORY);
    }

    private String resolveDisplayName(Uri uri) {
        if (uri == null) return null;
        Cursor cursor = null;
        try {
            cursor = getContentResolver().query(uri,new String[]{OpenableColumns.DISPLAY_NAME},null,null,null);
            if (cursor != null && cursor.moveToFirst()) return cursor.getString(0);
        } catch (Exception ignored) {
        } finally {
            if (cursor != null) cursor.close();
        }
        return null;
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_IMPORT_INVENTORY || resultCode != Activity.RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        try {
            java.io.InputStream in = getContentResolver().openInputStream(uri);
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[16384]; int n;
            while (in != null && (n = in.read(buf)) != -1) out.write(buf,0,n);
            if (in != null) in.close();
            final String payload = Base64.encodeToString(out.toByteArray(),Base64.NO_WRAP);
            String resolved = resolveDisplayName(uri);
            final String fileName = resolved == null || resolved.trim().isEmpty() ? "inventory.csv" : resolved;
            View root = ((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
            if (root instanceof WebView) ((WebView)root).evaluateJavascript("window.mfixReceiveNativeInventory("+org.json.JSONObject.quote(payload)+","+org.json.JSONObject.quote(fileName)+");",null);
        } catch (Exception e) {
            Toast.makeText(this, "שגיאה בייבוא מלאי: "+e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
}