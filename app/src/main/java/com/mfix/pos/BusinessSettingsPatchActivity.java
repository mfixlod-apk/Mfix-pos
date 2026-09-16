package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds persistent business/receipt settings and activates the inventory management layer. */
public class BusinessSettingsPatchActivity extends InventoryManagementPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixBusinessSettingsPatchV2)return;window.__mfixBusinessSettingsPatchV2=true;"+
        "var KEY='mfix_business_settings_v1',PRINT='mfix_printer_settings_v1';"+
        "function esc(s){return String(s==null?'':s).replace(/[&<>\\\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[c];});}"+
        "function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}"+
        "function loadPrint(){try{return JSON.parse(localStorage.getItem(PRINT)||'{}')}catch(e){return {}}}"+
        "function save(){var x={name:document.getElementById('mfixBizName')?.value.trim()||'',phone:document.getElementById('mfixBizPhone')?.value.trim()||'',address:document.getElementById('mfixBizAddress')?.value.trim()||'',footer:document.getElementById('mfixBizFooter')?.value.trim()||''};localStorage.setItem(KEY,JSON.stringify(x));var p=loadPrint();p.storeName=x.name;p.storePhone=x.phone;p.storeAddress=x.address;p.footer=x.footer;localStorage.setItem(PRINT,JSON.stringify(p));toast('פרטי העסק והקבלה נשמרו','ok');}"+
        "function install(){var v=document.getElementById('view-settings');if(!v)return false;if(document.getElementById('mfixBusinessSettingsCard'))return true;var s=load(),box=document.createElement('div');box.id='mfixBusinessSettingsCard';box.className='card';box.style.marginBottom='12px';box.innerHTML='<div class=\"section-title\">🏪 פרטי העסק והקבלה</div><div class=\"grid2\"><div class=\"field\"><label class=\"flabel\">שם העסק</label><input class=\"input\" id=\"mfixBizName\" maxlength=\"80\" value=\"'+esc(s.name||'')+'\"></div><div class=\"field\"><label class=\"flabel\">טלפון</label><input class=\"input\" id=\"mfixBizPhone\" maxlength=\"30\" value=\"'+esc(s.phone||'')+'\"></div></div><div class=\"field\"><label class=\"flabel\">כתובת</label><input class=\"input\" id=\"mfixBizAddress\" maxlength=\"120\" value=\"'+esc(s.address||'')+'\"></div><div class=\"field\"><label class=\"flabel\">שורת תחתית בקבלה</label><input class=\"input\" id=\"mfixBizFooter\" maxlength=\"120\" value=\"'+esc(s.footer||'')+'\"></div><button type=\"button\" class=\"btn btn-primary\" onclick=\"window.__mfixBusinessSettingsSave()\">💾 שמור פרטי עסק</button><div class=\"muted\" style=\"font-size:11px;margin-top:8px\">הפרטים נשמרים מקומית ומסונכרנים גם להגדרות הקבלה של המדפסת.</div>';v.insertBefore(box,v.firstChild);window.__mfixBusinessSettingsSave=save;return true;}var n=0;function loop(){if(install())return;if(++n<100)setTimeout(loop,700);}loop();})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),9800);
    }
}
