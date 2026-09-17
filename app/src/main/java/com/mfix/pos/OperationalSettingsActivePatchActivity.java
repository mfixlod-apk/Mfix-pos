package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Activates practical POS operating settings used by the payment flow. */
public class OperationalSettingsActivePatchActivity extends YeshInvoiceActivePatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixOperationalSettingsV2)return;window.__mfixOperationalSettingsV2=true;"+
        "var KEY='mfix_operational_settings_v1';"+
        "function cfg(){try{return Object.assign({defaultPaymentMethod:'cash',confirmBeforeVoid:true},JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return {defaultPaymentMethod:'cash',confirmBeforeVoid:true};}}"+
        "function save(v){localStorage.setItem(KEY,JSON.stringify(v));}"+
        "function esc(s){return String(s==null?'':s).replace(/[&<>\\\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[c];});}"+
        "function controls(){var c=cfg(),opts=[['cash','מזומן'],['card','אשראי'],['transfer','העברה בנקאית'],['check','צ׳ק'],['other','אחר']];return '<div id=\"mfixOperationalSettingsCard\" class=\"card\" style=\"margin-bottom:12px\"><div class=\"section-title\">⚙️ הגדרות תפעול קופה</div><div class=\"grid2\"><div class=\"field\"><label class=\"flabel\">אמצעי תשלום ברירת מחדל</label><select id=\"mfixDefaultPaymentSettings\" class=\"input\">'+opts.map(function(o){return '<option value=\"'+o[0]+'\" '+(c.defaultPaymentMethod===o[0]?'selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></div><label style=\"font-size:12px;font-weight:700;display:flex;align-items:center;gap:7px;margin-top:24px\"><input id=\"mfixConfirmVoidSettings\" type=\"checkbox\" '+(c.confirmBeforeVoid!==false?'checked':'')+'> דרוש אישור לפני ביטול פעולה</label></div><div class=\"muted\" style=\"font-size:11px;margin-top:8px\">הגדרות אלה נשמרות מקומית ומשמשות את זרימת התשלום. ניתן לשנות את אמצעי התשלום בכל עסקה.</div><button type=\"button\" id=\"mfixSaveOperationalSettings\" class=\"btn btn-primary\" style=\"margin-top:10px\">💾 שמור הגדרות תפעול</button></div>'; }"+
        "function bind(){var s=document.getElementById('mfixSaveOperationalSettings');if(!s||s.__mfixBound)return false;s.__mfixBound=true;s.onclick=function(){var p=document.getElementById('mfixDefaultPaymentSettings'),v={defaultPaymentMethod:p&&p.value?p.value:'cash',confirmBeforeVoid:!!document.getElementById('mfixConfirmVoidSettings').checked};save(v);toast('הגדרות התפעול נשמרו','ok');};return true;}"+
        "function inject(){var v=document.getElementById('view-settings');if(!v)return false;var old=document.getElementById('mfixOperationalSettingsCard');if(!old){v.insertAdjacentHTML('afterbegin',controls());}return bind();}"+
        "window.mfixOpenOperationalSettings=function(){var c=cfg(),opts=[['cash','מזומן'],['card','אשראי'],['transfer','העברה בנקאית'],['check','צ׳ק'],['other','אחר']];var html='<div class=\"modal\"><div class=\"modal-head\"><h3>⚙️ הגדרות תפעול</h3><button class=\"modal-close\" onclick=\"closeModal()\">×</button></div><div class=\"modal-body\"><div class=\"field\"><label class=\"flabel\">אמצעי תשלום ברירת מחדל</label><select id=\"mfixDefaultPayment\" class=\"input\">'+opts.map(function(o){return '<option value=\"'+o[0]+'\" '+(c.defaultPaymentMethod===o[0]?'selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></div><label class=\"flabel\" style=\"display:block;margin-top:12px\"><input id=\"mfixConfirmVoid\" type=\"checkbox\" '+(c.confirmBeforeVoid!==false?'checked':'')+'> דרוש אישור לפני ביטול פעולה</label></div><div class=\"modal-foot\"><button class=\"btn btn-primary\" id=\"mfixSaveOperational\">שמור</button></div></div>';openModal(html,{wide:false});setTimeout(function(){var b=document.getElementById('mfixSaveOperational');if(b)b.onclick=function(){save({defaultPaymentMethod:(document.getElementById('mfixDefaultPayment')||{}).value||'cash',confirmBeforeVoid:!!document.getElementById('mfixConfirmVoid').checked});toast('הגדרות התפעול נשמרו','ok');closeModal();inject();};},0);};"+
        "function installButton(){var host=document.querySelector('.topbar-right');if(!host)return false;if(!document.getElementById('mfixOperationalSettingsButton')){var b=document.createElement('button');b.id='mfixOperationalSettingsButton';b.className='btn btn-outline';b.type='button';b.textContent='⚙️ תפעול';b.onclick=window.mfixOpenOperationalSettings;host.appendChild(b);}return true;}"+
        "var n=0;function loop(){inject();installButton();if(++n<100)setTimeout(loop,700);}loop();console.log('[MFIX] operational settings V2 active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),3000);
    }
}
