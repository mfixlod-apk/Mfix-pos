package com.mfix.pos;

import android.webkit.WebView;

/** Applies the operational settings that are already exposed in Settings to the live UI. */
public final class OperationalSettingsBehaviorPatch {
    private OperationalSettingsBehaviorPatch() {}

    private static final String PATCH =
        "(function(){if(window.__mfixOperationalSettingsBehaviorV1)return;window.__mfixOperationalSettingsBehaviorV1=true;"+
        "function settings(){try{return Object.assign({lowStockThreshold:3,showLowStockAlerts:true},JSON.parse(localStorage.getItem('mfix_operational_settings_v1')||'{}'));}catch(e){return {lowStockThreshold:3,showLowStockAlerts:true};}}"+
        "function apply(){var s=settings(),v=document.getElementById('view-inventory');if(!v)return;var old=document.getElementById('mfixLowStockAlert');"+
        "if(!s.showLowStockAlerts){if(old)old.remove();return;}"+
        "var products=Array.isArray(window.STATE&&window.STATE.products)?window.STATE.products:[];var threshold=Math.max(0,Number(s.lowStockThreshold)||0);"+
        "var low=products.filter(function(p){return Number(p.stock||0)<=threshold;});"+
        "if(!low.length){if(old)old.remove();return;}"+
        "if(!old){old=document.createElement('div');old.id='mfixLowStockAlert';old.className='card';old.style.cssText='margin-bottom:12px;border:1px solid var(--amber-500);background:var(--amber-100);';v.insertBefore(old,v.firstChild);}"+
        "old.innerHTML='<div style=\"font-weight:800\">⚠️ מלאי נמוך</div><div style=\"font-size:13px;margin-top:5px\">'+low.length+' מוצרים נמצאים בכמות של '+threshold+' יחידות או פחות.</div><div style=\"font-size:12px;margin-top:5px\">'+low.slice(0,8).map(function(p){return String(p.name||p.sku||'מוצר')+' ('+Number(p.stock||0)+')';}).join(' · ')+(low.length>8?' · ועוד '+(low.length-8):'')+'</div>';"+
        "}apply();setInterval(apply,2500);console.log('[MFIX] operational settings behavior active');})();";

    public static void install(WebView webView) {
        if (webView == null) return;
        webView.postDelayed(() -> webView.evaluateJavascript(PATCH, null), 5600);
    }
}
