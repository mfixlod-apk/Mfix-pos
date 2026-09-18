package com.mfix.pos;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
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
import org.json.JSONArray;
import org.json.JSONObject;

public class YeshInvoiceWebActivity extends Activity {
    private WebView web;
    private EditText product;
    private EditText price;
    private TextView status;
    private final Handler handler = new Handler();
    private String salePayload = "{}";

    @SuppressLint("SetJavaScriptEnabled")
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        salePayload = getIntent().getStringExtra("mfix_sale_payload");
        if (salePayload == null) salePayload = "{}";

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        LinearLayout bar = new LinearLayout(this);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(12, 8, 12, 8);
        bar.setBackgroundColor(Color.WHITE);

        Button back = new Button(this);
        back.setText("← MFIX");
        back.setOnClickListener(v -> finish());

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
        bar.addView(product, field);
        bar.addView(price, new LinearLayout.LayoutParams(110, -2));
        bar.addView(test);

        status = new TextView(this);
        status.setText("יש חשבונית: פותח/טוען…");
        status.setTextSize(12);
        status.setPadding(12, 5, 12, 5);

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
                status.setText("יש חשבונית מחובר/פתוח: " + url);
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Bridge(), "AndroidYesh");

        root.addView(bar);
        root.addView(status);
        root.addView(web, new LinearLayout.LayoutParams(-1, 0, 1f));
        setContentView(root);

        web.loadUrl("https://user.yeshinvoice.co.il/");
        handler.postDelayed(this::autoPrepareSale, 2200);
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
        return "'" + String.valueOf(s).replace("\\","\\\\").replace("'","\\'").replace("\n"," ") + "'";
    }

    private class Bridge {
        @JavascriptInterface public void result(String text){
            runOnUiThread(()->{
                status.setText(text);
                Toast.makeText(YeshInvoiceWebActivity.this, text, Toast.LENGTH_SHORT).show();
            });
        }
    }
}
