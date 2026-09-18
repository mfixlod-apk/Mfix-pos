package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds verified provider guidance to the Yesh Invoice integration without guessing undocumented API endpoints. */
public class YeshInvoiceContractPatchActivity extends GranularPermissionsActivePatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixYeshContractPatch)return;window.__mfixYeshContractPatch=true;"+
        "var DOCS='https://user.yeshinvoice.co.il/api/doc';"+
        "function addDocs(){var b=document.getElementById('mfixYeshInvoiceButton');if(b&&!document.getElementById('mfixYeshDocsButton')){var d=document.createElement('button');d.id='mfixYeshDocsButton';d.type='button';d.className='btn btn-outline';d.textContent='📘 API';d.onclick=function(){window.open(DOCS,'_blank');};b.parentNode&&b.parentNode.insertBefore(d,b.nextSibling);}}"+
        "function enrich(){var m=document.querySelector('.modal h3');if(!m||String(m.textContent||'').indexOf('יש חשבונית')<0)return;var body=m.closest('.modal');if(!body||body.querySelector('.mfix-yesh-contract-note'))return;var note=document.createElement('div');note.className='card mfix-yesh-contract-note';note.style.marginTop='10px';note.innerHTML='<b>חיבור API מאומת בלבד</b><div class=\"muted\" style=\"margin-top:5px\">ה־API הרשמי מאפשר הפקת מסמכים ואוטומציה. פרטי ה־endpoint והבקשה נלקחים מהתיעוד הרשמי ולא מניחושים.</div><button type=\"button\" class=\"btn btn-outline\" style=\"margin-top:8px\">פתיחת תיעוד API</button>';var btn=note.querySelector('button');btn.onclick=function(){window.open(DOCS,'_blank');};var anchor=body.querySelector('.modal-body');if(anchor)anchor.appendChild(note);}"+
        "addDocs();setInterval(function(){addDocs();enrich();},1000);console.log('[MFIX] verified Yesh Invoice contract guidance active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),3500);
    }
}
