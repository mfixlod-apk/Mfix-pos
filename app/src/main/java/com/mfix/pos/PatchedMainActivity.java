package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/**
 * Small runtime compatibility layer for the embedded POS UI.
 * Keeps the original MainActivity printer bridge intact while applying
 * targeted business-logic fixes without duplicating the large WebView shell.
 */
public class PatchedMainActivity extends MainActivity {
    private static final String CART_DISCOUNT_PATCH =
        "(function(){" +
        "if(window.__mfixCartDiscountPatch)return;window.__mfixCartDiscountPatch=true;" +
        "function install(){" +
        "if(!window.STATE||typeof window.computeCartCalc!=='function'){setTimeout(install,250);return;}" +
        "var original=window.computeCartCalc;" +
        "window.computeCartCalc=function(){" +
        "var calc=original();var cd=window.STATE.cartDiscount;" +
        "if(!cd||!(Number(cd.amount)>0)||!calc.lines||!calc.lines.length)return calc;" +
        "var requested=Math.max(0,Number(cd.amount)||0);" +
        "var available=calc.lines.reduce(function(s,l){return s+Math.max(0,(Number(l.lineTotal)||0)-(Number(l.discount)||0));},0);" +
        "var extra=Math.min(requested,available);if(extra<=0)return calc;" +
        "var remaining=extra;var baseTotal=available;" +
        "calc.lines.forEach(function(l,i){var lineAvailable=Math.max(0,(Number(l.lineTotal)||0)-(Number(l.discount)||0));var share=i===calc.lines.length-1?remaining:Math.min(lineAvailable,Math.round(extra*(lineAvailable/baseTotal)*100)/100);l.discount=(Number(l.discount)||0)+share;remaining=Math.max(0,remaining-share);});" +
        "if(remaining>0){for(var j=calc.lines.length-1;j>=0&&remaining>0;j--){var l2=calc.lines[j],room=Math.max(0,(Number(l2.lineTotal)||0)-(Number(l2.discount)||0)),take=Math.min(room,remaining);l2.discount=(Number(l2.discount)||0)+take;remaining-=take;}}" +
        "calc.cartDiscount=Math.round(extra*100)/100;" +
        "calc.totalDiscount=Math.round(calc.lines.reduce(function(s,l){return s+(Number(l.discount)||0);},0)*100)/100;" +
        "calc.totalIncl=Math.round(Math.max(0,(Number(calc.subtotalIncl)||0)-calc.totalDiscount)*100)/100;" +
        "if(typeof window.splitVat==='function'){var vat=window.splitVat(calc.totalIncl);calc.vat=vat.vat;calc.base=vat.base;}" +
        "return calc;};" +
        "console.log('[MFIX] cart discount patch active');" +
        "}" +
        "install();" +
        "})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup) findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) {
            WebView web = (WebView) root;
            web.postDelayed(() -> web.evaluateJavascript(CART_DISCOUNT_PATCH, null), 700);
        }
    }
}
