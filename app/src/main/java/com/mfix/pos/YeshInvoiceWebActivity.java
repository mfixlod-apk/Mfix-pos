package com.mfix.pos;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.hardware.usb.*;
import android.app.PendingIntent;
import android.content.*;
import android.graphics.Bitmap;
import android.graphics.pdf.PdfRenderer;
import android.os.ParcelFileDescriptor;
import android.util.Base64;
import android.graphics.Color;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;
import org.json.JSONObject;

public class YeshInvoiceWebActivity extends Activity {
    private static final String USB_ACTION = "com.mfix.pos.YESH_USB_PERMISSION";
    private UsbManager usbManager;
    private byte[] pendingPdf;
    private String pendingPaperMode = "80MM";
    private final BroadcastReceiver yeshUsbReceiver = new BroadcastReceiver() { public void onReceive(Context c, Intent i) { if(!USB_ACTION.equals(i.getAction()))return; UsbDevice d=i.getParcelableExtra(UsbManager.EXTRA_DEVICE); boolean ok=i.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED,false); if(ok&&d!=null&&pendingPdf!=null){byte[] p=pendingPdf;String m=pendingPaperMode;pendingPdf=null;new Thread(()->printPdfNative(d,p,m)).start();} } };
    private WebView web;
    private EditText product;
    private EditText price;
    private TextView status;
    private String salePayload = "{}";
    private boolean learning = false;

    @SuppressLint("SetJavaScriptEnabled")
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        usbManager=(UsbManager)getSystemService(Context.USB_SERVICE);
        IntentFilter uf=new IntentFilter(USB_ACTION); if(android.os.Build.VERSION.SDK_INT>=33)registerReceiver(yeshUsbReceiver,uf,Context.RECEIVER_NOT_EXPORTED); else registerReceiver(yeshUsbReceiver,uf);
        final android.content.SharedPreferences sp = getSharedPreferences("mfix_yesh_learning", MODE_PRIVATE);
        salePayload = getIntent().getStringExtra("mfix_sale_payload");
        if (salePayload == null) salePayload = "{}";

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        LinearLayout bar = new LinearLayout(this);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(8, 6, 8, 6);
        bar.setBackgroundColor(Color.WHITE);

        Button back = new Button(this);
        back.setText("← MFIX");
        back.setOnClickListener(v -> finish());

        Button learn = new Button(this);
        learn.setText("🎓 התחל לימוד");
        learn.setOnClickListener(v -> {
            learning = !learning;
            if (learning) {
                learn.setText("⏹ עצור ושמור");
                status.setText("מצב לימוד פעיל — בצע פעם אחת את התהליך ביש חשבונית");
                web.evaluateJavascript("window.MFIX_LEARNING_START&&window.MFIX_LEARNING_START();", null);
            } else {
                learn.setText("🎓 התחל לימוד");
                web.evaluateJavascript("window.MFIX_LEARNING_STOP&&window.MFIX_LEARNING_STOP();", null);
            }
        });

        Button replay = new Button(this);
        replay.setText("▶ הפעל לימוד");
        replay.setOnClickListener(v -> {
            String flow = sp.getString("flow", "");
            if (flow.isEmpty()) {
                status.setText("אין עדיין לימוד שמור");
                return;
            }
            status.setText("מפעיל את רצף הלימוד…");
            String payload = salePayload == null ? "{}" : salePayload;
            web.evaluateJavascript("window.MFIX_REPLAY&&window.MFIX_REPLAY(" + js(flow) + "," + js(payload) + ");", null);
        });

        product = new EditText(this);
        product.setHint("מוצר לבדיקה");
        product.setSingleLine(true);

        price = new EditText(this);
        price.setHint("מחיר");
        price.setInputType(2 | 8192);
        price.setSingleLine(true);

        Button test = new Button(this);
        test.setText("בדיקת העברה");
        test.setOnClickListener(v -> injectTestLine());

        LinearLayout.LayoutParams field = new LinearLayout.LayoutParams(0, -2, 1f);
        bar.addView(back);
        bar.addView(learn);
        bar.addView(replay);
        bar.addView(product, field);
        bar.addView(price, new LinearLayout.LayoutParams(100, -2));
        bar.addView(test);

        status = new TextView(this);
        status.setText("יש חשבונית: פותח/טוען…");
        status.setTextSize(12);
        status.setPadding(10, 4, 10, 4);

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setSupportZoom(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(web, true);

        web.setWebViewClient(new WebViewClient(){
            @Override public void onPageFinished(WebView view, String url){
                CookieManager.getInstance().flush();
                installAndroidExtensionShim();
                installExtensionInterceptor();
                installExtensionBackground();
                installLearningEngine();
                status.setText("יש חשבונית פתוח: " + url);
                if (salePayload != null && !salePayload.equals("{}")) {
                    view.postDelayed(YeshInvoiceWebActivity.this::autoPrepareSale, 700);
                    view.postDelayed(YeshInvoiceWebActivity.this::autoReplaySavedFlow, 1500);
                }
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Bridge(), "AndroidYesh");
        web.addJavascriptInterface(new NativePrinterBridge(), "AndroidPrinter");

        root.addView(bar);
        root.addView(status);
        root.addView(web, new LinearLayout.LayoutParams(-1, 0, 1f));
        setContentView(root);

        web.loadUrl("https://user.yeshinvoice.co.il/");
    }

    private void installExtensionInterceptor() {
        try {
            InputStream in = getAssets().open("mfix_extension_interceptor.js");
            ByteArrayOutputStream b = new ByteArrayOutputStream();
            byte[] buf = new byte[8192]; int n;
            while ((n = in.read(buf)) != -1) b.write(buf, 0, n);
            in.close();
            web.evaluateJavascript(new String(b.toByteArray(), StandardCharsets.UTF_8), null);
        } catch (Exception e) {
            status.setText("טעינת שכבת רשת MFIX נכשלה: " + e.getMessage());
        }
    }

    private void installExtensionBackground() {
        try {
            java.io.InputStream in = getAssets().open("mfix_extension_background.js");
            java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[8192]; int n;
            while ((n = in.read(buf)) != -1) b.write(buf, 0, n);
            in.close();
            web.evaluateJavascript(new String(b.toByteArray(), java.nio.charset.StandardCharsets.UTF_8), null);
        } catch (Exception e) {
            status.setText("טעינת לוגיקת MFIX נכשלה: " + e.getMessage());
        }
    }

    private void installAndroidExtensionShim() {
        try {
            InputStream in = getAssets().open("mfix_extension_android_shim.js");
            ByteArrayOutputStream b = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) b.write(buf, 0, n);
            in.close();
            String script = new String(b.toByteArray(), StandardCharsets.UTF_8);
            web.evaluateJavascript(script, null);
        } catch (Exception e) {
            status.setText("טעינת שכבת Android נכשלה: " + e.getMessage());
        }
    }

    private void installLearningEngine() {
        String script =
            "(function(){if(window.__MFIX_LEARNING_INSTALLED)return;window.__MFIX_LEARNING_INSTALLED=true;" +
            "function txt(e){return ((e.innerText||e.textContent||'').trim()).replace(/\\s+/g,' ').slice(0,120);}" +
            "function meta(e){var r=e.getBoundingClientRect();return {tag:e.tagName||'',id:e.id||'',name:e.getAttribute('name')||'',type:e.getAttribute('type')||'',placeholder:e.getAttribute('placeholder')||'',aria:e.getAttribute('aria-label')||'',text:txt(e),x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)};}" +
            "function selector(e){try{if(e.id)return '#'+CSS.escape(e.id);if(e.name)return e.tagName.toLowerCase()+'[name=\"'+String(e.name).replace(/\"/g,'\\\\\"')+'\"]';}catch(x){}return null;}" +
            "function useful(e){if(!e||e===document.body||e===document.documentElement)return false;var t=(e.tagName||'').toLowerCase();return ['button','a','input','textarea','select','option','label'].indexOf(t)>=0||!!e.getAttribute('role');}" +
            "function target(e){while(e&&e!==document.body&&!useful(e))e=e.parentElement;return e||null;}" +
            "window.__MFIX_FLOW=[];window.__MFIX_LEARNING=false;" +
            "window.MFIX_LEARNING_START=function(){window.__MFIX_FLOW=[];window.__MFIX_LEARNING=true;AndroidYesh.result('לימוד התחיל — בצע את התהליך פעם אחת');};" +
            "window.MFIX_LEARNING_STOP=function(){window.__MFIX_LEARNING=false;AndroidYesh.saveLearning(JSON.stringify(window.__MFIX_FLOW));};" +
            "document.addEventListener('click',function(ev){if(!window.__MFIX_LEARNING)return;var e=target(ev.target);if(!e)return;var m=meta(e);window.__MFIX_FLOW.push({op:'click',meta:m,selector:selector(e)});AndroidYesh.result('נלכדה לחיצה: '+(m.text||m.aria||m.placeholder||m.id||m.tag));},true);" +
            "document.addEventListener('change',function(ev){if(!window.__MFIX_LEARNING)return;var e=target(ev.target);if(!e)return;var m=meta(e);var v=(e.value!==undefined?String(e.value):'');var key=(m.placeholder+' '+m.name+' '+m.id+' '+m.aria+' '+m.text).toLowerCase();var dynamic=/מוצר|פריט|שם|מחיר|סכום|כמות|quantity|price|amount|product|item/.test(key);window.__MFIX_FLOW.push({op:'change',meta:m,selector:selector(e),value:dynamic?'__MFIX_DYNAMIC__':v});AndroidYesh.result('נלכד שינוי: '+(m.placeholder||m.name||m.id||m.tag));},true);" +
            "function find(m){var all=[].slice.call(document.querySelectorAll('input,textarea,select,button,a,[role]'));function ok(e){if(m.id&&e.id===m.id)return true;if(m.name&&e.getAttribute('name')===m.name)return true;if(m.aria&&e.getAttribute('aria-label')===m.aria)return true;if(m.placeholder&&e.getAttribute('placeholder')===m.placeholder)return true;var t=txt(e);if(m.text&&t===m.text)return true;return false;}var hit=all.find(ok);if(hit)return hit;return all.find(function(e){var r=e.getBoundingClientRect();return m.x>=r.left&&m.x<=r.right&&m.y>=r.top&&m.y<=r.bottom;})||null;}" +
            "function dynamicValue(payload,m){var key=((m.placeholder||'')+' '+(m.name||'')+' '+(m.id||'')+' '+(m.aria||'')+' '+(m.text||'')).toLowerCase();var cart=(payload&&payload.cart)||[];var first=cart[0]||{};if(/מחיר|סכום|price|amount/.test(key))return first.unitPrice==null?'':String(first.unitPrice);if(/כמות|quantity|qty/.test(key))return first.qty==null?'1':String(first.qty);if(/מוצר|פריט|product|item|description/.test(key))return first.name||'';if(/טלפון|phone/.test(key))return payload.customerPhone||'';if(/לקוח|שם|customer|name/.test(key))return payload.customerName||'';return '';}" +
            "function setValue(e,v){var proto=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');if(e.tagName==='TEXTAREA')proto=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value');if(proto&&proto.set)proto.set.call(e,String(v));else e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}" +
            "window.MFIX_REPLAY=function(flowText,payloadText){var flow;var payload;try{flow=JSON.parse(flowText);payload=JSON.parse(payloadText||'{}');}catch(e){AndroidYesh.result('לימוד פגום — לא ניתן להפעיל');return;}var i=0;function next(){if(i>=flow.length){AndroidYesh.result('לימוד הסתיים בהצלחה');return;}var step=flow[i++];var e=find(step.meta||{});if(!e){AndroidYesh.result('הלימוד נעצר בשלב '+i+' — האלמנט לא נמצא');return;}if(step.op==='click'){e.scrollIntoView({block:'center',inline:'center'});e.click();setTimeout(next,350);return;}if(step.op==='change'){var v=step.value==='__MFIX_DYNAMIC__'?dynamicValue(payload,step.meta||{}):step.value;setValue(e,v);setTimeout(next,250);return;}next();}next();};})();";
        web.evaluateJavascript(script, null);
    }

    private void autoReplaySavedFlow(){
        final String flow = getSharedPreferences("mfix_yesh_learning", MODE_PRIVATE).getString("flow", "");
        if (flow == null || flow.isEmpty()) {
            status.setText("אין לימוד שמור — בצע לימוד חד-פעמי");
            return;
        }
        final String payload = salePayload == null ? "{}" : salePayload;
        status.setText("מפעיל אוטומטית את תהליך יש חשבונית…");
        web.evaluateJavascript("window.MFIX_REPLAY&&window.MFIX_REPLAY(" + js(flow) + "," + js(payload) + ");", null);
    }

    private void autoPrepareSale(){
        try{
            JSONObject payload=new JSONObject(salePayload);
            JSONArray cart=payload.optJSONArray("cart");
            if(cart==null||cart.length()==0){status.setText("יש חשבונית פתוח — אין כרגע מוצרים בעגלה");return;}
            JSONObject first=cart.optJSONObject(0);
            if(first==null)return;
            String name=first.optString("name","");
            double unit=first.optDouble("unitPrice",0);
            double qty=first.optDouble("qty",1);
            product.setText(name);
            price.setText(String.valueOf(unit));
            status.setText("העסקה הועברה מ-MFIX: "+name+" × "+qty);
            injectCartLines(cart);
        }catch(Exception e){status.setText("העברת העסקה: "+e.getMessage());}
    }

    private void injectCartLines(JSONArray cart){
        String json=cart.toString();
        String script="(function(){var lines="+js(json)+";try{lines=JSON.parse(lines)}catch(e){return;}"+
            "var els=[].slice.call(document.querySelectorAll('input,textarea'));"+
            "function score(e,keys){var s=((e.placeholder||'')+' '+(e.name||'')+' '+(e.id||'')+' '+(e.getAttribute('aria-label')||'')).toLowerCase();return keys.some(function(k){return s.indexOf(k)>=0})}"+
            "var n=els.find(function(e){return score(e,['מוצר','פריט','שם','item','product','description'])});"+
            "var a=els.find(function(e){return score(e,['מחיר','סכום','price','amount'])});"+
            "function set(e,v){if(!e)return;var p=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');if(p&&p.set)p.set.call(e,String(v));else e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}"+
            "if(n&&lines[0])set(n,lines[0].name||'');if(a&&lines[0])set(a,lines[0].unitPrice||0);"+
            "AndroidYesh.result('נשלח ליש חשבונית: '+lines.length+' שורות; שדות בסיס '+(n?'✓':'✗')+'/'+(a?'✓':'✗'));})();";
        web.evaluateJavascript(script,null);
    }

    private void injectTestLine(){
        String p = js(product.getText().toString());
        String amount = js(price.getText().toString());
        String script =
            "(function(){"+
            "var name="+p+",amount="+amount+";"+
            "var els=[].slice.call(document.querySelectorAll('input,textarea'));"+
            "var pick=function(keys){return els.find(function(e){var s=((e.placeholder||'')+' '+(e.name||'')+' '+(e.id||'')+' '+(e.getAttribute('aria-label')||'')).toLowerCase();return keys.some(function(k){return s.indexOf(k)>=0;});});};"+
            "var n=pick(['מוצר','פריט','שם','item','product','description']);"+
            "var a=pick(['מחיר','סכום','price','amount']);"+
            "function set(e,v){if(!e)return false;var proto=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');if(proto&&proto.set)proto.set.call(e,v);else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;}"+
            "var okN=set(n,name),okA=set(a,amount);"+
            "AndroidYesh.result('שם: '+okN+' | מחיר: '+okA+' | שדות שנמצאו: '+els.length);"+
            "return okN||okA;})()";
        web.evaluateJavascript(script, value -> status.setText("בדיקת העברה: " + value));
    }

    private String js(String s){
        String v = String.valueOf(s);
        return "'" + v.replace("\\","\\\\").replace("'","\\'").replace("\n"," ").replace("\r"," ") + "'";
    }


    private class NativePrinterBridge {
        @JavascriptInterface public String submitPdfJob(String deviceName,String base64,String paperMode){
            try{byte[] pdf=Base64.decode(base64,Base64.DEFAULT);UsbDevice d=findPrinter(deviceName);if(d==null)throw new Exception("לא נמצאה מדפסת USB מחוברת");if(!usbManager.hasPermission(d)){pendingPdf=pdf;pendingPaperMode=paperMode==null?"80MM":paperMode;int f=PendingIntent.FLAG_UPDATE_CURRENT;if(android.os.Build.VERSION.SDK_INT>=31)f|=PendingIntent.FLAG_MUTABLE;PendingIntent pi=PendingIntent.getBroadcast(YeshInvoiceWebActivity.this,17,new Intent(USB_ACTION).setPackage(getPackageName()),f);usbManager.requestPermission(d,pi);return "USB_PERMISSION_REQUESTED";}new Thread(()->printPdfNative(d,pdf,paperMode)).start();return "QUEUED";}catch(Exception e){return "ERROR:"+e.getMessage();}
        }
    }
    private UsbDevice findPrinter(String name){for(UsbDevice d:usbManager.getDeviceList().values()){if(name!=null&&!name.isEmpty()&&!name.equals(d.getDeviceName()))continue;if(preferredPrinterInterface(d)!=null)return d;}return null;}
    private UsbInterface preferredPrinterInterface(UsbDevice d){UsbInterface f=null;for(int i=0;i<d.getInterfaceCount();i++){UsbInterface in=d.getInterface(i);boolean out=false;for(int e=0;e<in.getEndpointCount();e++){UsbEndpoint ep=in.getEndpoint(e);if(ep.getDirection()==UsbConstants.USB_DIR_OUT&&ep.getType()==UsbConstants.USB_ENDPOINT_XFER_BULK){out=true;break;}}if(!out)continue;if(in.getInterfaceClass()==UsbConstants.USB_CLASS_PRINTER)return in;if(f==null)f=in;}return f;}
    private UsbEndpoint findOut(UsbDevice d){UsbInterface in=preferredPrinterInterface(d);if(in==null)return null;for(int e=0;e<in.getEndpointCount();e++){UsbEndpoint ep=in.getEndpoint(e);if(ep.getDirection()==UsbConstants.USB_DIR_OUT&&ep.getType()==UsbConstants.USB_ENDPOINT_XFER_BULK)return ep;}return null;}
    private void printPdfNative(UsbDevice d,byte[] pdf,String mode){java.io.File tmp=null;PdfRenderer rr=null;UsbDeviceConnection c=null;UsbInterface in=null;try{tmp=java.io.File.createTempFile("mfix-", ".pdf",getCacheDir());try(java.io.FileOutputStream o=new java.io.FileOutputStream(tmp)){o.write(pdf);}rr=new PdfRenderer(ParcelFileDescriptor.open(tmp,ParcelFileDescriptor.MODE_READ_ONLY));int w="58MM".equalsIgnoreCase(mode)?464:640;c=usbManager.openDevice(d);if(c==null)throw new Exception("לא ניתן לפתוח מדפסת");UsbEndpoint ep=findOut(d);in=preferredPrinterInterface(d);if(ep==null||in==null||!c.claimInterface(in,true))throw new Exception("לא נמצאה יציאת USB להדפסה");writeEsc(c,ep,new byte[]{0x1b,0x40,0x1b,0x61,0x00});for(int p=0;p<rr.getPageCount();p++){PdfRenderer.Page page=rr.openPage(p);int h=Math.max(1,Math.round(w*(float)page.getHeight()/Math.max(1,page.getWidth())));Bitmap bm=Bitmap.createBitmap(w,h,Bitmap.Config.ARGB_8888);bm.eraseColor(android.graphics.Color.WHITE);page.render(bm,null,null,PdfRenderer.Page.RENDER_MODE_FOR_PRINT);page.close();byte[] raster=toMono(bm,w,h);bm.recycle();writeRaster(c,ep,raster,w,h);}writeEsc(c,ep,new byte[]{0x1b,0x64,0x03,0x1d,0x56,0x42,0x00});runOnUiThread(()->status.setText("החשבונית נשלחה למדפסת"));}catch(Exception e){runOnUiThread(()->status.setText("שגיאת הדפסה: "+e.getMessage()));}finally{try{if(in!=null&&c!=null)c.releaseInterface(in);}catch(Exception x){}try{if(c!=null)c.close();}catch(Exception x){}try{if(rr!=null)rr.close();}catch(Exception x){}if(tmp!=null)try{tmp.delete();}catch(Exception x){}}}
    private byte[] toMono(Bitmap b,int w,int h){int bpl=(w+7)/8;byte[] out=new byte[bpl*h];for(int y=0;y<h;y++)for(int x=0;x<w;x++){int q=b.getPixel(x,y);int g=(android.graphics.Color.red(q)*299+android.graphics.Color.green(q)*587+android.graphics.Color.blue(q)*114)/1000;if(g<180)out[y*bpl+(x>>3)]|=(byte)(0x80>>(x&7));}return out;}
    private void writeRaster(UsbDeviceConnection c,UsbEndpoint ep,byte[] d,int w,int h)throws Exception{int bpl=(w+7)/8;for(int y=0;y<h;y+=120){int rows=Math.min(120,h-y);byte[] p=new byte[8+rows*bpl];p[0]=0x1d;p[1]=0x76;p[2]=0x30;p[3]=0;p[4]=(byte)bpl;p[5]=(byte)(bpl>>8);p[6]=(byte)rows;p[7]=(byte)(rows>>8);System.arraycopy(d,y*bpl,p,8,rows*bpl);writeEsc(c,ep,p);}}
    private void writeEsc(UsbDeviceConnection c,UsbEndpoint ep,byte[] d)throws Exception{int o=0;while(o<d.length){int n=Math.min(16384,d.length-o);int sent=c.bulkTransfer(ep,d,o,n,15000);if(sent<=0)throw new Exception("USB לא שלח נתונים");o+=sent;}}

    private class Bridge {
        @JavascriptInterface public void result(String text){
            runOnUiThread(()->{
                status.setText(text);
                Toast.makeText(YeshInvoiceWebActivity.this, text, Toast.LENGTH_SHORT).show();
            });
        }

        @JavascriptInterface public void saveLearning(String flow){
            try{
                new JSONArray(flow);
                getSharedPreferences("mfix_yesh_learning", MODE_PRIVATE).edit().putString("flow", flow).apply();
                runOnUiThread(()->{
                    status.setText("הלימוד נשמר. בפעם הבאה אפשר להפעיל אותו.");
                    Toast.makeText(YeshInvoiceWebActivity.this,"הלימוד נשמר",Toast.LENGTH_SHORT).show();
                });
            }catch(Exception e){
                runOnUiThread(()->status.setText("שמירת לימוד נכשלה: "+e.getMessage()));
            }
        }
    }    @Override protected void onDestroy(){try{unregisterReceiver(yeshUsbReceiver);}catch(Exception ignored){}super.onDestroy();}
}
