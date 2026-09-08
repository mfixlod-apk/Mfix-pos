package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/**
 * Runtime integration layer for Yesh Invoice.
 * The endpoint and credentials are intentionally user-configured; no API contract is claimed
 * until a real provider endpoint and response format are supplied and tested.
 */
public class YeshInvoicePatchActivity extends BackupRestorePatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixYeshInvoicePatch)return;window.__mfixYeshInvoicePatch=true;"+
        "var KEY='mfix_yesh_invoice_v1';"+
        "function cfg(){try{return Object.assign({enabled:false,endpoint:'',apiKey:'',autoSync:false},JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return {enabled:false,endpoint:'',apiKey:'',autoSync:false};}}"+
        "function save(v){localStorage.setItem(KEY,JSON.stringify(v));}"+
        "window.mfixOpenYeshInvoiceSettings=function(){var c=cfg();var html='<div class=\\\"modal wide\\\"><div class=\\\"modal-head\\\"><h3>🧾 יש חשבונית — אינטגרציה</h3><button class=\\\"modal-close\\\" onclick=\\\"closeModal()\\\">✕</button></div><div class=\\\"modal-body\\\"><div class=\\\"card\\\"><div class=\\\"field\\\"><label class=\\\"flabel\\\"><input id=\\\"yiEnabled\\\" type=\\\"checkbox\\\" '+(c.enabled?'checked':'')+'> הפעל אינטגרציה</label></div><div class=\\\"field\\\"><label class=\\\"flabel\\\">כתובת Endpoint</label><input id=\\\"yiEndpoint\\\" class=\\\"input\\\" style=\\\"direction:ltr\\\" value=\\\"'+esc(c.endpoint||'')+'\\\" placeholder=\\\"https://...\\\"></div><div class=\\\"field\\\"><label class=\\\"flabel\\\">API Key / Token</label><input id=\\\"yiApiKey\\\" class=\\\"input\\\" type=\\\"password\\\" style=\\\"direction:ltr\\\" value=\\\"'+esc(c.apiKey||'')+'\\\" placeholder=\\\"Token\\\"></div><label class=\\\"flabel\\\"><input id=\\\"yiAuto\\\" type=\\\"checkbox\\\" '+(c.autoSync?'checked':'')+'> שליחה אוטומטית לאחר מכירה</label><div class=\\\"muted\\\" style=\\\"margin-top:10px\\\">החיבור לא ישלח נתונים עד להגדרת Endpoint אמיתי. ניתן לבצע בדיקת חיבור לפני הפעלה.</div></div></div><div class=\\\"modal-foot\\\"><button class=\\\"btn btn-outline\\\" onclick=\\\"mfixYeshInvoiceTest()\\\">בדיקת חיבור</button><button class=\\\"btn btn-primary\\\" onclick=\\\"mfixSaveYeshInvoice()\\\">שמור</button></div></div>';openModal(html,{wide:true});};"+
        "window.mfixSaveYeshInvoice=function(){var v={enabled:document.getElementById('yiEnabled').checked,endpoint:document.getElementById('yiEndpoint').value.trim(),apiKey:document.getElementById('yiApiKey').value.trim(),autoSync:document.getElementById('yiAuto').checked};if(v.enabled&&!/^https:\\/\\//i.test(v.endpoint)){toast('יש להזין Endpoint מאובטח מסוג HTTPS','err');return;}save(v);toast('הגדרות יש חשבונית נשמרו','ok');closeModal();};"+
        "window.mfixYeshInvoiceTest=async function(){var c=cfg();if(!/^https:\\/\\//i.test(c.endpoint)){var ep=document.getElementById('yiEndpoint');if(ep)c.endpoint=ep.value.trim();}if(!/^https:\\/\\//i.test(c.endpoint)){toast('יש להזין Endpoint HTTPS לבדיקת חיבור','err');return;}try{var r=await fetch(c.endpoint,{method:'OPTIONS',headers:c.apiKey?{'Authorization':'Bearer '+c.apiKey}:{}});toast(r.ok||r.status===405?'ה־Endpoint הגיב ('+r.status+')':'ה־Endpoint החזיר '+r.status,r.ok||r.status===405?'ok':'err');}catch(e){toast('לא ניתן להתחבר ל־Endpoint: '+(e&&e.message?e.message:'שגיאה'),'err');}};"+
        "function inject(){var host=document.querySelector('.topbar-right');if(host&&!document.getElementById('mfixYeshInvoiceButton')){var b=document.createElement('button');b.id='mfixYeshInvoiceButton';b.className='btn btn-outline';b.textContent='🧾 יש חשבונית';b.onclick=window.mfixOpenYeshInvoiceSettings;host.appendChild(b);}}inject();setInterval(inject,1000);console.log('[MFIX] Yesh Invoice configuration layer active');}"+
        "})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),2100);
    }
}
