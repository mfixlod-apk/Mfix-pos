package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Release-scope cleanup: keeps card payments as a recorded tender, but disables direct gateway/API integration and hides legacy integrations. */
public class ReleaseScopePatchActivity extends ProductEditPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixReleaseScopePatch)return;window.__mfixReleaseScopePatch=true;"+
        "function cleanup(){try{if(window.STATE&&window.STATE.settings){window.STATE.settings.creditClearingEnabled=false;window.STATE.settings.yeshInvoiceEnabled=false;window.STATE.settings.yeshInvoiceSyncMode='manual';}}catch(e){}"+
        "var cards=document.querySelectorAll('.card');Array.prototype.forEach.call(cards,function(card){var t=(card.textContent||'').trim();if(t.indexOf('סליקת אשראי (API)')>=0||t.indexOf('יש חשבונית — אינטגרציה')>=0){card.style.display='none';}});"+
        "if(typeof window.clearCreditRow==='function'){window.clearCreditRow=function(){if(window.toast)window.toast('אינטגרציית סליקה ישירה אינה פעילה בגרסת MFIX זו','err');};}"+
        "}"+
        "cleanup();setInterval(cleanup,1500);console.log('[MFIX] release scope patch active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),6200);
    }
}
