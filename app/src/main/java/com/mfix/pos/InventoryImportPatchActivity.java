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

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

/** Native inventory/backup file bridges. Supports CSV and XLSX inventory files. */
public class InventoryImportPatchActivity extends PatchedMainActivity {
    private static final int REQUEST_IMPORT_INVENTORY = 4104;

    private static final String PATCH =
        "(function(){if(window.__mfixNativeInventoryImportV3)return;window.__mfixNativeInventoryImportV3=true;"+
        "function norm(s){return String(s==null?'':s).trim().toLowerCase().replace(/[ _-]/g,'');}"+
        "function col(h,n){for(var i=0;i<h.length;i++){var x=norm(h[i]);for(var j=0;j<n.length;j++){var y=norm(n[j]);if(x===y||x.indexOf(y)>=0)return i;}}return -1;}"+
        "function num(v,d){var x=Number(String(v==null?'':v).replace(/,/g,''));return Number.isFinite(x)?x:d;}"+
        "function csv(t){var rows=[],row=[],cell='',q=false;for(var i=0;i<t.length;i++){var c=t[i];if(c==='\\\"'){if(q&&t[i+1]==='\\\"'){cell+='\\\"';i++;}else q=!q;}else if(c===','&&!q){row.push(cell);cell='';}else if((c==='\\n'||c==='\\r')&&!q){if(c==='\\r'&&t[i+1]==='\\n')i++;row.push(cell);cell='';if(row.some(function(x){return String(x).trim()!=='';}))rows.push(row);row=[];}else cell+=c;}row.push(cell);if(row.some(function(x){return String(x).trim()!=='';}))rows.push(row);return rows;}"+
        "function saveProducts(rows){if(rows.length<2)throw new Error('קובץ המלאי ריק או חסר שורת כותרות');var h=rows[0],nc=col(h,['name','product','productname','שם','מוצר','שםמוצר']),sc=col(h,['sku','מק״ט','מקט','קוד']),bc=col(h,['barcode','ברקוד','ean']),pc=col(h,['price','saleprice','מחיר','מחירמכירה']),cc=col(h,['cost','עלות','מחירעלות']),qc=col(h,['stock','qty','quantity','מלאי','כמות']),ic=col(h,['imei','serial','serialnumber','מספרסידורי']);if(nc<0)throw new Error('לא נמצאה עמודת שם מוצר');var p=Array.isArray(window.STATE.products)?window.STATE.products:[],added=0,updated=0;for(var r=1;r<rows.length;r++){var a=rows[r],name=String(a[nc]||'').trim();if(!name)continue;var sku=sc>=0?String(a[sc]||'').trim():'';var barcode=bc>=0?String(a[bc]||'').trim():'';var idx=p.findIndex(function(x){return (sku&&String(x.sku||'')===sku)||(barcode&&String(x.barcode||'')===barcode);});var x=idx>=0?p[idx]:{id:'P'+Date.now()+'_'+r,name:name,sku:sku,barcode:barcode,price:0,cost:0,stock:0};x.name=name;if(sku)x.sku=sku;if(barcode)x.barcode=barcode;if(pc>=0)x.price=num(a[pc],Number(x.price||0));if(cc>=0)x.cost=num(a[cc],Number(x.cost||0));if(qc>=0)x.stock=Math.max(0,num(a[qc],Number(x.stock||0)));if(ic>=0&&String(a[ic]||'').trim()){x.trackSerial=true;if(!Array.isArray(x.serials))x.serials=[];var sv=String(a[ic]).trim();if(!x.serials.some(function(z){return String(z&&z.value||z)===sv;}))x.serials.push({value:sv,status:'available',addedAt:new Date().toISOString()});}if(idx<0){p.push(x);added++;}else updated++;}window.STATE.products=p;if(typeof window.saveKey!=='function')throw new Error('מנגנון שמירת המלאי אינו זמין');return Promise.resolve(window.saveKey('products',p)).then(function(){if(typeof window.render==='function')window.render();toast('ייבוא המלאי הושלם: '+added+' נוספו, '+updated+' עודכנו','ok');});}"+
        "window.mfixReceiveNativeInventoryText=function(text,name){try{saveProducts(csv(String(text||'').replace(/^\\uFEFF/,'')));}catch(e){console.error('[MFIX INVENTORY]',e);toast('ייבוא המלאי נכשל: '+(e&&e.message?e.message:'קובץ לא תקין'),'err');}};"+
        "window.mfixReceiveNativeInventory=function(b64,name){try{var bin=atob(b64),bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);var text=new TextDecoder('utf-8').decode(bytes);window.mfixReceiveNativeInventoryText(text,name);}catch(e){console.error(e);toast('ייבוא המלאי נכשל: '+(e&&e.message?e.message:'קובץ לא תקין'),'err');}};"+
        "window.openInventoryImport=function(){if(window.AndroidPrinter&&typeof AndroidPrinter.pickInventoryFile==='function'){AndroidPrinter.pickInventoryFile();return;}toast('ייבוא מלאי Android אינו זמין','err');};"+
        "window.mfixReceiveNativeBackup=function(b64){try{var bin=atob(b64),bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);var b=JSON.parse(new TextDecoder('utf-8').decode(bytes));var st=b&&b.state?b.state:b;if(b&&b.format==='MFIX-POS-BACKUP'){st={settings:b.settings,products:b.products,customers:b.customers,sales:b.sales,repairs:b.repairs,returns:b.returns||[],shifts:b.shifts||[],giftCards:b.giftCards||[],preorders:b.preorders||[],auditLog:b.auditLog||[],inventoryHistory:b.inventoryHistory||[],currentShift:b.currentShift||null};}if(!st||typeof st!=='object'||!Array.isArray(st.products))throw new Error('קובץ גיבוי לא תקין');var settings=st.settings||window.STATE.settings||{};var products=st.products||[],customers=Array.isArray(st.customers)?st.customers:[],sales=Array.isArray(st.sales)?st.sales:[],repairs=Array.isArray(st.repairs)?st.repairs:[],misc={returns:Array.isArray(st.returns)?st.returns:[],shifts:Array.isArray(st.shifts)?st.shifts:[],giftCards:Array.isArray(st.giftCards)?st.giftCards:[],preorders:Array.isArray(st.preorders)?st.preorders:[],auditLog:Array.isArray(st.auditLog)?st.auditLog:[],inventoryHistory:Array.isArray(st.inventoryHistory)?st.inventoryHistory:[],currentShift:st.currentShift||null};if(typeof window.saveKey!=='function')throw new Error('מנגנון שמירת הנתונים אינו זמין');Promise.resolve(window.saveKey('settings',settings)).then(function(){return window.saveKey('products',products);}).then(function(){return window.saveKey('customers',customers);}).then(function(){return window.saveKey('sales',sales);}).then(function(){return window.saveKey('repairs',repairs);}).then(function(){return window.saveKey('misc',misc);}).then(function(){var old=window.STATE;Object.keys(old).forEach(function(k){delete old[k];});Object.assign(old,{activeTab:'pos',settings:settings,products:products,customers:customers,sales:sales,repairs:repairs,returns:misc.returns,shifts:misc.shifts,giftCards:misc.giftCards,preorders:misc.preorders,auditLog:misc.auditLog,currentShift:misc.currentShift,inventoryHistory:misc.inventoryHistory,cart:[],cartCustomerId:null,linkedRepairId:null,docCustomerName:'',docCustomerPhone:'',pointsToRedeem:0,loaded:true});if(b&&b.users!=null)localStorage.setItem('mfix_users_v1',b.users);if(b&&b.activeUser!=null)localStorage.setItem('mfix_pos_active_user_v1',b.activeUser);if(b&&b.yeshInvoice!=null)localStorage.setItem('mfix_yesh_invoice_v1',b.yeshInvoice);if(b&&b.yeshInvoiceOutbox!=null)localStorage.setItem('mfix_yesh_invoice_outbox_v1',b.yeshInvoiceOutbox);if(typeof window.render==='function')window.render();toast('השחזור הושלם ונשמר. האפליקציה תיטען מחדש','ok');setTimeout(function(){location.reload();},700);}).catch(function(e){console.error('[MFIX BACKUP RESTORE]',e);toast('השחזור נכשל: '+(e&&e.message?e.message:'שגיאת שמירה'),'err');});}catch(e){console.error('[MFIX BACKUP RESTORE]',e);toast('השחזור נכשל: '+(e&&e.message?e.message:'קובץ גיבוי לא תקין'),'err');}};"+
        "window.__mfixAutoPrintAfterSale=function(sale){try{if(!sale||!window.STATE||!window.STATE.settings||window.STATE.settings.printerAutoPrint===false)return;if(typeof window.printDoc!=='function')return;setTimeout(function(){try{window.printDoc(sale.id);}catch(e){console.error('[MFIX AUTO PRINT]',e);}},350);}catch(e){console.error('[MFIX AUTO PRINT HOOK]',e);}};"+
        "})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) ((WebView)root).postDelayed(() -> ((WebView)root).evaluateJavascript(PATCH,null), 1600);
    }

    public void openInventoryPicker() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"text/csv","text/plain","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
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

    private static byte[] readAll(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) != -1) out.write(buf,0,n);
        return out.toByteArray();
    }

    private static String readZipEntry(byte[] data, String wanted) throws Exception {
        ZipInputStream zin = new ZipInputStream(new java.io.ByteArrayInputStream(data));
        try {
            ZipEntry e;
            while ((e = zin.getNextEntry()) != null) {
                if (wanted.equals(e.getName())) return new String(readAll(zin), StandardCharsets.UTF_8);
            }
        } finally { zin.close(); }
        return null;
    }

    private static String cellText(Element cell, HashMap<Integer,String> shared) {
        String type = cell.getAttribute("t");
        NodeList vs = cell.getElementsByTagName("v");
        String v = vs.getLength() > 0 ? vs.item(0).getTextContent() : "";
        if ("s".equals(type)) {
            try { return shared.getOrDefault(Integer.parseInt(v), ""); } catch (Exception ignored) { return ""; }
        }
        if ("inlineStr".equals(type)) {
            NodeList ts = cell.getElementsByTagName("t");
            return ts.getLength() > 0 ? ts.item(0).getTextContent() : "";
        }
        return v;
    }

    private static String xlsxToCsv(byte[] data) throws Exception {
        String sharedXml = readZipEntry(data,"xl/sharedStrings.xml");
        HashMap<Integer,String> shared = new HashMap<>();
        if (sharedXml != null) {
            Document d = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(new java.io.ByteArrayInputStream(sharedXml.getBytes(StandardCharsets.UTF_8)));
            NodeList si = d.getElementsByTagNameNS("*","si");
            for (int i=0;i<si.getLength();i++) {
                NodeList ts=((Element)si.item(i)).getElementsByTagNameNS("*","t");
                StringBuilder s=new StringBuilder(); for(int j=0;j<ts.getLength();j++)s.append(ts.item(j).getTextContent()); shared.put(i,s.toString());
            }
        }
        String sheet = readZipEntry(data,"xl/worksheets/sheet1.xml");
        if(sheet==null)throw new Exception("לא נמצאה גיליון עבודה ראשון");
        Document d=DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(new java.io.ByteArrayInputStream(sheet.getBytes(StandardCharsets.UTF_8)));
        NodeList rows=d.getElementsByTagNameNS("*","row");
        StringBuilder csv=new StringBuilder();
        for(int i=0;i<rows.getLength();i++){
            Element row=(Element)rows.item(i);NodeList cells=row.getElementsByTagNameNS("*","c");HashMap<Integer,String> vals=new HashMap<>();int max=-1;
            for(int j=0;j<cells.getLength();j++){Element c=(Element)cells.item(j);String ref=c.getAttribute("r");int col=0;while(col<ref.length()&&Character.isLetter(ref.charAt(col))){col=col*26+(Character.toUpperCase(ref.charAt(col))-'A'+1);}col--;vals.put(col,cellText(c,shared));if(col>max)max=col;}
            for(int c=0;c<=max;c++){if(c>0)csv.append(',');String v=vals.getOrDefault(c,"");csv.append('"').append(v.replace("\"","\"\"")).append('"');}csv.append('\n');
        }
        return csv.toString();
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != REQUEST_IMPORT_INVENTORY) {
            super.onActivityResult(requestCode, resultCode, data);
            return;
        }
        if (resultCode != Activity.RESULT_OK || data == null || data.getData() == null) return;
        Uri uri=data.getData();
        try {
            InputStream in=getContentResolver().openInputStream(uri);
            byte[] bytes=readAll(in); if(in!=null)in.close();
            String fileName=resolveDisplayName(uri); if(fileName==null||fileName.trim().isEmpty())fileName="inventory.csv";
            String lower=fileName.toLowerCase(java.util.Locale.ROOT);
            final String payload;
            final boolean xlsx=lower.endsWith(".xlsx");
            if(xlsx) payload=Base64.encodeToString(xlsxToCsv(bytes).getBytes(StandardCharsets.UTF_8),Base64.NO_WRAP);
            else payload=Base64.encodeToString(bytes,Base64.NO_WRAP);
            View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
            if(root instanceof WebView){
                String js="window.mfixReceiveNativeInventory("+org.json.JSONObject.quote(payload)+","+org.json.JSONObject.quote(fileName)+");";
                ((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(js,null),100);
            }
        } catch(Exception e){
            android.widget.Toast.makeText(this,"שגיאה בייבוא מלאי: "+e.getMessage(),android.widget.Toast.LENGTH_LONG).show();
        }
    }
}
