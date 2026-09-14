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
    private static final String PATCH =
        "(function(){if(window.__mfixNativeInventoryImportV2)return;window.__mfixNativeInventoryImportV2=true;"+
        "function esc(s){return String(s==null?'':s).replace(/[&<>\\\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[c];});}"+
        "function splitCsv(text){var rows=[],row=[],cell='',q=false;for(var i=0;i<text.length;i++){var c=text[i];if(c==='\\\"'){if(q&&text[i+1]==='\\\"'){cell+='\\\"';i++;}else q=!q;}else if(c===','&&!q){row.push(cell);cell='';}else if((c==='\\n'||c==='\\r')&&!q){if(c==='\\r'&&text[i+1]==='\\n')i++;row.push(cell);cell='';if(row.some(function(x){return String(x).trim()!=='';})){rows.push(row);}row=[];}else cell+=c;}row.push(cell);if(row.some(function(x){return String(x).trim()!=='';}))rows.push(row);return rows;}"+
        "function norm(s){return String(s==null?'':s).trim().toLowerCase().replace(/[ _-]/g,'');}"+
        "function col(headers,names){for(var i=0;i<headers.length;i++){var h=norm(headers[i]);for(var j=0;j<names.length;j++){if(h===norm(names[j])||h.indexOf(norm(names[j]))>=0)return i;}}return -1;}"+
        "function num(v,d){var x=Number(String(v==null?'':v).replace(/,/g,''));return Number.isFinite(x)?x:d;}"+
        "function fallbackImport(text,name){var rows=splitCsv(text.replace(/^\\uFEFF/,''));if(rows.length<2)throw new Error('קובץ המלאי ריק או חסר שורת כותרות');var headers=rows[0],nameCol=col(headers,['name','product','productname','שם','מוצר','שםמוצר']),skuCol=col(headers,['sku','מק״ט','מקט','קוד']),barcodeCol=col(headers,['barcode','ברקוד','ean']),priceCol=col(headers,['price','saleprice','מחיר','מחירמכירה']),costCol=col(headers,['cost','עלות','מחירעלות']),stockCol=col(headers,['stock','qty','quantity','מלאי','כמות']),imeiCol=col(headers,['imei','serial','serialnumber','מספרסידורי']);if(nameCol<0)throw new Error('לא נמצאה עמודת שם מוצר');var products=Array.isArray(window.STATE.products)?window.STATE.products:[],added=0,updated=0;for(var r=1;r<rows.length;r++){var a=rows[r],nm=String(a[nameCol]||'').trim();if(!nm)continue;var sku=skuCol>=0?String(a[skuCol]||'').trim():'';var barcode=barcodeCol>=0?String(a[barcodeCol]||'').trim():'';var idx=products.findIndex(function(p){return (sku&&String(p.sku||'')===sku)||(barcode&&String(p.barcode||'')===barcode);});var p=idx>=0?products[idx]:{id:'P'+Date.now()+'_'+r,name:nm,sku:sku,barcode:barcode,price:0,cost:0,stock:0};p.name=nm;if(sku)p.sku=sku;if(barcode)p.barcode=barcode;if(priceCol>=0)p.price=num(a[priceCol],Number(p.price||0));if(costCol>=0)p.cost=num(a[costCol],Number(p.cost||0));if(stockCol>=0)p.stock=Math.max(0,num(a[stockCol],Number(p.stock||0)));if(imeiCol>=0&&String(a[imeiCol]||'').trim()){p.trackSerial=true;if(!Array.isArray(p.serials))p.serials=[];var sv=String(a[imeiCol]).trim();if(!p.serials.some(function(x){return String(x&&x.value||x)===sv;}))p.serials.push({value:sv,status:'available',addedAt:new Date().toISOString()});}if(idx<0){products.push(p);added++;}else updated++;}window.STATE.products=products;if(typeof window.saveKey!=='function')throw new Error('מנגנון שמירת המלאי אינו זמין');return Promise.resolve(window.saveKey('products',products)).then(function(){if(typeof window.render==='function')window.render();toast('ייבוא המלאי הושלם: '+added+' נוספו, '+updated+' עודכנו','ok');});}"+
        "window.mfixReceiveNativeInventory=function(b64,name){try{var bin=atob(b64),bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);var text=new TextDecoder('utf-8').decode(bytes);if(typeof window.handleInventoryImportFile==='function'){var file=new File([bytes],name||'inventory.csv',{type:'text/csv'});Promise.resolve(window.handleInventoryImportFile(file)).then(function(){console.log('[MFIX] inventory import handler completed');}).catch(function(e){console.error(e);fallbackImport(text,name);});}else fallbackImport(text,name);}catch(e){console.error(e);toast('ייבוא המלאי נכשל: '+(e&&e.message?e.message:'קובץ לא תקין'),'err');}};"+
        "window.openInventoryImport=function(){if(window.AndroidPrinter&&typeof window.AndroidPrinter.pickInventoryFile==='function'){window.AndroidPrinter.pickInventoryFile();return;}toast('ייבוא מלאי Android אינו זמין','err');};"+
        "window.mfixReceiveNativeBackup=function(b64){try{var bin=atob(b64),bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);var text=new TextDecoder('utf-8').decode(bytes),b=JSON.parse(text),st=b&&b.state?b.state:null;if(!st&&b&&b.format==='MFIX-POS-BACKUP'){st={settings:b.settings,products:b.products,customers:b.customers,sales:b.sales,repairs:b.repairs,returns:b.returns||[],shifts:b.shifts||[],giftCards:b.giftCards||[],preorders:b.preorders||[],auditLog:b.auditLog||[],inventoryHistory:b.inventoryHistory||[],currentShift:b.currentShift||null};}if(!st||typeof st!=='object'||!st.settings||!Array.isArray(st.products)||!Array.isArray(st.customers)||!Array.isArray(st.sales)||!Array.isArray(st.repairs))throw new Error('קובץ גיבוי לא תקין');var next=Object.assign({},st,{cart:[],cartCustomerId:null,linkedRepairId:null,docCustomerName:'',docCustomerPhone:'',pointsToRedeem:0,loaded:true});if(typeof window.saveKey!=='function')throw new Error('מנגנון שמירת הנתונים אינו זמין');Promise.resolve(window.saveKey('settings',st.settings)).then(function(){return window.saveKey('products',st.products);}).then(function(){return window.saveKey('customers',st.customers);}).then(function(){return window.saveKey('sales',st.sales);}).then(function(){return window.saveKey('repairs',st.repairs);}).then(function(){return window.saveKey('misc',{returns:Array.isArray(st.returns)?st.returns:[],shifts:Array.isArray(st.shifts)?st.shifts:[],giftCards:Array.isArray(st.giftCards)?st.giftCards:[],preorders:Array.isArray(st.preorders)?st.preorders:[],auditLog:Array.isArray(st.auditLog)?st.auditLog:[],inventoryHistory:Array.isArray(st.inventoryHistory)?st.inventoryHistory:[],currentShift:st.currentShift||null});}).then(function(){var old=window.STATE;Object.keys(old).forEach(function(k){delete old[k];});Object.assign(old,next);if(b.users!=null)localStorage.setItem('mfix_users_v1',b.users);if(b.activeUser!=null)localStorage.setItem('mfix_pos_active_user_v1',b.activeUser);if(b.yeshInvoice!=null)localStorage.setItem('mfix_yesh_invoice_v1',b.yeshInvoice);if(b.yeshInvoiceOutbox!=null)localStorage.setItem('mfix_yesh_invoice_outbox_v1',b.yeshInvoiceOutbox);if(typeof window.render==='function')window.render();toast('השחזור הושלם ונשמר. האפליקציה תיטען מחדש','ok');setTimeout(function(){location.reload();},700);}).catch(function(e){console.error('[MFIX BACKUP RESTORE]',e);toast('השחזור נכשל: '+(e&&e.message?e.message:'שגיאת שמירה'),'err');});}catch(e){console.error('[MFIX BACKUP RESTORE]',e);toast('השחזור נכשל: '+(e&&e.message?e.message:'קובץ גיבוי לא תקין'),'err');}};"+
        "window.__mfixAutoPrintAfterSale=function(sale){try{if(!sale||!window.STATE||!window.STATE.settings||window.STATE.settings.printerAutoPrint===false)return;if(typeof window.printDoc!=='function')return;setTimeout(function(){try{window.printDoc(sale.id);}catch(e){console.error('[MFIX AUTO PRINT]',e);}},350);}catch(e){console.error('[MFIX AUTO PRINT HOOK]',e);}};"+
        "}"+
        "install();console.log('[MFIX] native inventory + backup restore patch V2 active');})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) ((WebView)root).postDelayed(() -> ((WebView)root).evaluateJavascript(PATCH,null), 1600);
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