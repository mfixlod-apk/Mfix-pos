package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Activates practical POS operating settings used by the payment flow. */
public class OperationalSettingsActivePatchActivity extends YeshInvoiceActivePatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixOperationalSettingsV1)return;window.__mfixOperationalSettingsV1=true;"+
        "var KEY='mfix_operational_settings_v1';"+
        "function cfg(){try{return Object.assign({defaultPaymentMethod:'cash'},JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return {defaultPaymentMethod:'cash'};}}"+
        "function save(v){localStorage.setItem(KEY,JSON.stringify(v));}"+
        "function esc(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c];});}"+
        "window.mfixOpenOperationalSettings=function(){var c=cfg();var opts=[['cash','מזומן'],['card','אשראי'],['transfer','העברה בנקאית'],['check','צ׳ק'],['other','אחר']];var html='<div class=\"modal\"><div class=\"modal-head\"><h3>⚙️ הגדרות תפעול</h3><button class=\"modal-close\" onclick=\"closeModal()\">×</button></div><div class=\"modal-body\"><div class=\"field\"><label class=\"flabel\">אמצעי תשלום ברירת מחדל</label><select id=\"mfixDefaultPayment\" class=\"input\">'+opts.map(function(o){return '<option value=\"'+o[0]+'\" '+(c.defaultPaymentMethod===o[0]?'selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></div><div class=\"muted\" style=\"margin-top:8px\">הבחירה תשמש כערך התחלתי במסך התשלום. ניתן לשנות בכל עסקה ולפצל תשלום בין כמה אמצעים.</div></div><div class=\"modal-foot\"><button class=\"btn btn-primary\" id=\"mfixSaveOperational\">שמור</button></div></div>';openModal(html,{wide:false});setTimeout(function(){var b=document.getElementById('mfixSaveOperational');if(b)b.onclick=function(){var s=document.getElementById('mfixDefaultPayment');var v=s&&s.value||'cash';save({defaultPaymentMethod:v});toast('הגדרות התפעול נשמרו','ok');closeModal();};},0);};"+
        "function install(){var host=document.querySelector('.topbar-right');if(!host)return false;if(!document.getElementById('mfixOperationalSettingsButton')){var b=document.createElement('button');b.id='mfixOperationalSettingsButton';b.className='btn btn-outline';b.type='button';b.textContent='⚙️ תפעול';b.onclick=window.mfixOpenOperationalSettings;host.appendChild(b);}return true;}"+
        "var n=0;function loop(){if(install())return;if(++n<80)setTimeout(loop,600);}loop();console.log('[MFIX] operational settings active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),3000);
    }
}
