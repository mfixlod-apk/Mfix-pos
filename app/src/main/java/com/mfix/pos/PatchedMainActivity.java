package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/**
 * Runtime compatibility layer for the embedded POS UI.
 * Keeps the original MainActivity printer bridge intact while applying
 * targeted business-logic and printer-management fixes without duplicating
 * the large WebView shell.
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

    private static final String PRINTER_MANAGEMENT_PATCH =
        "(function(){" +
        "if(window.__mfixPrinterManagementPatch)return;window.__mfixPrinterManagementPatch=true;" +
        "function install(){" +
        "if(!window.STATE||typeof window.renderPrinterProfilesWrap!=='function'){setTimeout(install,250);return;}" +
        "var originalRender=window.renderPrinterProfilesWrap;" +
        "function caps(address){try{if(!window.AndroidPrinter||typeof window.AndroidPrinter.getPrinterCapabilities!=='function')return null;return JSON.parse(window.AndroidPrinter.getPrinterCapabilities(address||'')||'{}');}catch(e){return {connected:false,error:String(e&&e.message||e)};}}" +
        "window.mfixAuthorizeAndTestPrinter=function(id){var p=((window.STATE.settings&&window.STATE.settings.printers)||[]).find(function(x){return x.id===id;});if(!p){if(window.toast)window.toast('המדפסת לא נמצאה','err');return;}if(!window.AndroidPrinter||typeof window.AndroidPrinter.requestUsbPrinterTest!=='function'){if(window.toast)window.toast('הרשאת USB זמינה רק ב-APK של MFIX','err');return;}var c=caps(p.address);if(!c||!c.connected){if(window.toast)window.toast('המדפסת אינה מחוברת','err');return;}if(c.authorized){window.AndroidPrinter.requestUsbPrinterTest(p.address||'');return;}if(window.toast)window.toast('Android יבקש כעת הרשאה למדפסת ולאחר האישור יודפס דף בדיקה');window.AndroidPrinter.requestUsbPrinterTest(p.address||'');};" +
        "function refresh(){var wrap=document.getElementById('printerProfilesWrap');if(!wrap)return;var table=wrap.querySelector('table');if(!table)return;var printers=(window.STATE.settings&&window.STATE.settings.printers)||[];var head=table.querySelector('thead tr');if(head&&!head.querySelector('.mfix-printer-status-head')){var th=document.createElement('th');th.className='mfix-printer-status-head';th.textContent='סטטוס';head.appendChild(th);var actions=document.createElement('th');actions.className='mfix-printer-tools-head';actions.textContent='כלים';head.appendChild(actions);}var rows=table.querySelectorAll('tbody tr');for(var i=0;i<rows.length;i++){var p=printers[i];if(!p)continue;var c=(String(p.type).toUpperCase()==='USB')?caps(p.address):null;var old=rows[i].querySelector('.mfix-printer-status-cell');if(old)old.remove();old=rows[i].querySelector('.mfix-printer-tools-cell');if(old)old.remove();var td=document.createElement('td');td.className='mfix-printer-status-cell';if(String(p.type).toUpperCase()!=='USB')td.innerHTML='<span class=\"pill gray\">לא נבדק</span>';else if(!window.AndroidPrinter)td.innerHTML='<span class=\"pill amber\">Bridge לא זמין</span>';else if(c&&c.connected)td.innerHTML='<span class=\"pill '+(c.authorized?'green':'amber')+'\">'+(c.authorized?'מחוברת ומורשית':'מחוברת - נדרשת הרשאה')+'</span>';else td.innerHTML='<span class=\"pill red\">לא מחוברת</span>';rows[i].appendChild(td);var tools=document.createElement('td');tools.className='mfix-printer-tools-cell';tools.innerHTML='<button class=\"btn btn-ghost mfix-diag\" type=\"button\">אבחון</button>'+(c&&c.connected?'<button class=\"btn btn-outline mfix-auth\" type=\"button\" style=\"margin-right:6px\">'+(c.authorized?'בדיקת הדפסה':'הרשאה + בדיקה')+'</button>':'');tools.querySelector('.mfix-diag').onclick=(function(id){return function(){window.mfixShowPrinterDiagnostics(id);};})(p.id);var auth=tools.querySelector('.mfix-auth');if(auth)auth.onclick=(function(id){return function(){window.mfixAuthorizeAndTestPrinter(id);};})(p.id);rows[i].appendChild(tools);}" +
        "var button=wrap.querySelector('.mfix-printer-refresh');if(!button){button=document.createElement('button');button.type='button';button.className='btn btn-outline mfix-printer-refresh';button.style.marginBottom='10px';button.textContent='↻ רענן חיבורי USB';button.onclick=refresh;wrap.insertBefore(button,wrap.firstChild);}" +
        "}" +
        "window.renderPrinterProfilesWrap=function(){var r=originalRender.apply(this,arguments);setTimeout(refresh,0);return r;};" +
        "window.mfixShowPrinterDiagnostics=function(id){var p=((window.STATE.settings&&window.STATE.settings.printers)||[]).find(function(x){return x.id===id;});if(!p){if(window.toast)window.toast('המדפסת לא נמצאה','err');return;}if(!window.AndroidPrinter||typeof window.AndroidPrinter.getUsbPrinterDiagnostics!=='function'){if(window.toast)window.toast('אבחון USB זמין רק ב-APK של MFIX','err');return;}var d;try{d=JSON.parse(window.AndroidPrinter.getUsbPrinterDiagnostics(p.address||'')||'{}');}catch(e){d={connected:false,error:String(e&&e.message||e)};}var interfaces=(d.interfaces||[]).map(function(x){return '<tr><td>'+x.index+'</td><td>'+x.class+'</td><td>'+x.subclass+'</td><td>'+x.protocol+'</td><td>'+x.bulkOutEndpoints+'</td></tr>';}).join('')||'<tr><td colspan=\"5\" class=\"muted\">אין ממשקי USB זמינים</td></tr>';var body='<div class=\"modal-head\"><h3>אבחון מדפסת USB</h3><button class=\"modal-close\" onclick=\"closeModal()\">✕</button></div><div class=\"modal-body\"><div class=\"grid2\"><div><label class=\"flabel\">מדפסת</label><b>'+String(p.name||'')+'</b></div><div><label class=\"flabel\">סטטוס</label><b>'+((d.connected)?'מחוברת':'לא מחוברת')+'</b></div><div><label class=\"flabel\">הרשאת USB</label><b>'+((d.authorized)?'אושרה':'לא אושרה')+'</b></div><div><label class=\"flabel\">Vendor / Product</label><span dir=\"ltr\">'+(d.vendorId==null?'—':d.vendorId)+' / '+(d.productId==null?'—':d.productId)+'</span></div></div><div style=\"margin-top:16px\"><table class=\"tbl\"><thead><tr><th>#</th><th>Class</th><th>Subclass</th><th>Protocol</th><th>Bulk OUT</th></tr></thead><tbody>'+interfaces+'</tbody></table></div></div><div class=\"modal-foot\">'+(d.connected?'<button class=\"btn btn-primary\" onclick=\"mfixAuthorizeAndTestPrinter(\\\''+String(p.id).replace(/'/g,'')+'\\\')\">'+(d.authorized?'בדיקת הדפסה':'הרשאה + בדיקה')+'</button>':'')+'<button class=\"btn btn-ghost\" onclick=\"closeModal()\">סגור</button></div>';if(window.openModal)window.openModal(body,{wide:true});};" +
        "var originalTest=window.testDefaultPrinter;window.testDefaultPrinter=async function(){var id=(document.getElementById('st_defaultprinter')||{}).value||((window.STATE.settings||{}).defaultPrinterId);var p=((window.STATE.settings&&window.STATE.settings.printers)||[]).find(function(x){return x.id===id;});if(p&&String(p.type).toUpperCase()==='USB'&&window.AndroidPrinter&&typeof window.AndroidPrinter.getPrinterCapabilities==='function'){var c=caps(p.address);if(!c||!c.connected){if(window.toast)window.toast('המדפסת שנבחרה אינה מחוברת','err');return;}}return originalTest.apply(this,arguments);};" +
        "console.log('[MFIX] printer management patch active');" +
        "}" +
        "install();" +
        "})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup) findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) {
            WebView web = (WebView) root;
            web.postDelayed(() -> {
                web.evaluateJavascript(CART_DISCOUNT_PATCH, null);
                web.evaluateJavascript(PRINTER_MANAGEMENT_PATCH, null);
            }, 700);
        }
    }
}
