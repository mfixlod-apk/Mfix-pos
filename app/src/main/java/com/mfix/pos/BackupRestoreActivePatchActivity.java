package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Activates the existing backup/restore layer while preserving the current MFIX feature chain. */
public class BackupRestoreActivePatchActivity extends UserAccountsActivePatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixBackupRestoreActive)return;window.__mfixBackupRestoreActive=true;"+
        "function install(){if(typeof window.mfixOpenBackupRestore!=='function'){setTimeout(install,500);return;}"+
        "var host=document.querySelector('.topbar-right'),b=document.getElementById('mfixBackupButton');"+
        "if(host&&!b){b=document.createElement('button');b.id='mfixBackupButton';b.className='btn btn-outline';b.type='button';b.textContent='💾 גיבוי ושחזור';b.onclick=window.mfixOpenBackupRestore;host.appendChild(b);}"+
        "}install();setInterval(install,1500);console.log('[MFIX] backup/restore activation active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),12000);
    }
}
