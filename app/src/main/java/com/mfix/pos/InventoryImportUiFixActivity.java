package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Keeps inventory import on the WebView file-input path so CSV/XLSX mapping is used. */
public class InventoryImportUiFixActivity extends InventoryHistoryPatchActivity {
    private static final String FIX = "(function(){try{var input=document.getElementById('inventoryImportFile');if(input){window.openInventoryImport=function(){input.value='';input.click();};}}catch(e){console.error('[MFIX IMPORT UI FIX]',e);}})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView){
            WebView web=(WebView)root;
            web.postDelayed(()->web.evaluateJavascript(FIX,null),2400);
            web.postDelayed(()->web.evaluateJavascript(FIX,null),5000);
        }
    }
}
