package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

public class FinalPolishPatchActivity extends ProductEditPatchActivity {
    private static final String PATCH = "(function(){if(window.__mfixFinalPolishPatch)return;window.__mfixFinalPolishPatch=true;function install(){var legacy=document.getElementById('mfixInventoryTools');if(legacy)legacy.style.display='none';var role=window.STATE&&String(window.STATE.currentRole||'').toLowerCase();if(role&&role!=='manager'){var add=document.getElementById('mfixSerialAdd');if(add)add.disabled=true;document.querySelectorAll('[data-mfix-serial-del]').forEach(function(b){b.disabled=true;});}}install();setInterval(install,1200);})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),6500);
    }
}
