package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Activates the existing Yesh Invoice settings/outbox layer after backup/restore in the live chain. */
public class YeshInvoiceActivePatchActivity extends BackupRestoreActivePatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixYeshInvoiceActive)return;window.__mfixYeshInvoiceActive=true;"+
        "function install(){var host=document.querySelector('.topbar-right');if(!host)return false;var b=document.getElementById('mfixYeshInvoiceButton');if(!b){b=document.createElement('button');b.id='mfixYeshInvoiceButton';b.className='btn btn-outline';b.type='button';b.textContent='🧾 יש חשבונית';b.onclick=function(){if(typeof window.mfixOpenYeshInvoiceSettings==='function')window.mfixOpenYeshInvoiceSettings();else if(window.toast)window.toast('מודול יש חשבונית עדיין נטען','err');};host.appendChild(b);}return true;}"+
        "var n=0;function loop(){if(install())return;if(++n<80)setTimeout(loop,750);}loop();console.log('[MFIX] Yesh Invoice activation active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),15000);
    }
}
