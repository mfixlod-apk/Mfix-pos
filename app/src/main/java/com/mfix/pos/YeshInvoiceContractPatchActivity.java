package com.mfix.pos;

import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.view.View;
import android.view.ViewGroup;

public class YeshInvoiceContractPatchActivity extends GranularPermissionsActivePatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixYeshLauncher)return;window.__mfixYeshLauncher=true;" +
        "function add(){if(document.getElementById('mfixYeshOpenButton'))return;var host=document.querySelector('#topRight')||document.querySelector('.topbar-right')||document.querySelector('.topbar');" +
        "if(!host)return;var b=document.createElement('button');b.id='mfixYeshOpenButton';b.type='button';b.className='badge green';b.style.cssText='border:none;cursor:pointer;font-weight:800';b.textContent='🧾 יש חשבונית';" +
        "b.onclick=function(){try{var payload={cart:Array.isArray(window.STATE&&STATE.cart)?STATE.cart:[],customerName:window.STATE&&STATE.docCustomerName||'',customerPhone:window.STATE&&STATE.docCustomerPhone||''};window.AndroidYeshLauncher.openWithSale(JSON.stringify(payload));}catch(e){try{window.AndroidYeshLauncher.open();}catch(_){alert('פתיחת יש חשבונית נכשלה: '+e.message);}}};host.appendChild(b);}" +
        "add();setInterval(add,1000);})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView){
            WebView webView=(WebView)root;
            webView.getSettings().setJavaScriptEnabled(true);
            webView.addJavascriptInterface(new LauncherBridge(), "AndroidYeshLauncher");
            webView.postDelayed(()->webView.evaluateJavascript(PATCH,null),4000);
        }
    }

    private final class LauncherBridge {
        @JavascriptInterface public void open(){ openWithSale("{}"); }
        @JavascriptInterface public void openWithSale(String payload){
            runOnUiThread(()->{
                android.content.Intent i=new android.content.Intent(YeshInvoiceContractPatchActivity.this, YeshInvoiceWebActivity.class);
                i.putExtra("mfix_sale_payload", payload==null?"{}":payload);
                startActivity(i);
            });
        }
    }
}
