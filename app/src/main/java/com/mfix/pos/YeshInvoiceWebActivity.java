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
    private WebView web;
    private EditText product;
    private EditText price;
    private TextView status;
    private String salePayload = "{}";
    private boolean learning = false;

    @SuppressLint("SetJavaScriptEnabled")
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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
    }
}
