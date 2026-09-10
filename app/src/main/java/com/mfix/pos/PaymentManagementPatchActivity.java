package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds a practical multi-method payment dialog to the existing POS WebView. */
public class PaymentManagementPatchActivity extends ReportsExportPatchActivity {
    private static final String PATCH =
        "(function(){" +
        "if(window.__mfixPaymentManagementPatch)return;window.__mfixPaymentManagementPatch=true;" +
        "function money(n){return '₪'+Number(n||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});}" +
        "function calcTotal(){try{if(typeof window.computeCartCalc==='function'){var c=window.computeCartCalc();return Number(c.totalIncl||c.total||0);} }catch(e){} return (window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:[]).reduce(function(s,x){return s+Number(x.lineTotal||x.total||((Number(x.price)||Number(x.unitPrice)||0)*(Number(x.qty)||1))||0);},0);}" +
        "function close(){if(window.closeModal)window.closeModal();}" +
        "function openPayment(){" +
        "var total=calcTotal();if(total<=0){if(window.toast)window.toast('הסל ריק — אין סכום לתשלום','err');return;}" +
        "var existing=(window.STATE&&window.STATE.currentPayment)||null;var paid=existing?Number(existing.paid||0):0;" +
        "var html='<div class=\"modal-head\"><h3>💳 תשלום</h3><button class=\"modal-close\" type=\"button\" id=\"mfixPayClose\">✕</button></div>'+" +
        "'<div class=\"modal-body\"><div class=\"card\" style=\"background:var(--gray-50);margin-bottom:14px\"><div class=\"muted\">סה\"כ לתשלום</div><div id=\"mfixPayTotal\" style=\"font-size:28px;font-weight:900\">'+money(total)+'</div><div id=\"mfixPayRemaining\" class=\"muted\" style=\"margin-top:4px\"></div></div>'+" +
        "'<div class=\"grid2\"><div class=\"field\"><label class=\"flabel\">אמצעי תשלום</label><select class=\"input\" id=\"mfixPayMethod\"><option value=\"cash\">מזומן</option><option value=\"card\">אשראי</option><option value=\"transfer\">העברה בנקאית</option><option value=\"other\">אחר</option></select></div><div class=\"field\"><label class=\"flabel\">סכום ששולם</label><input class=\"input\" id=\"mfixPayAmount\" type=\"number\" min=\"0\" step=\"0.01\" value=\"'+(paid?paid:total).toFixed(2)+'\"></div></div>'+" +
        "'<div id=\"mfixPayChange\" class=\"pill green\" style=\"font-size:14px;margin-top:4px\"></div>'+" +
        "'<div style=\"margin-top:14px\" class=\"muted\">אפשר לעדכן את הסכום או אמצעי התשלום לפני אישור. המידע נשמר בסל הנוכחי.</div></div>'+" +
        "'<div class=\"modal-foot\"><button class=\"btn btn-ghost\" type=\"button\" id=\"mfixPayCancel\">ביטול</button><button class=\"btn btn-green\" type=\"button\" id=\"mfixPayApply\">אישור תשלום</button></div>';" +
        "if(window.openModal)window.openModal(html,{wide:false});" +
        "setTimeout(function(){var amount=document.getElementById('mfixPayAmount'),method=document.getElementById('mfixPayMethod'),change=document.getElementById('mfixPayChange'),remaining=document.getElementById('mfixPayRemaining');" +
        "function refresh(){var a=Math.max(0,Number(amount&&amount.value)||0),r=Math.max(0,total-a),ch=Math.max(0,a-total);if(remaining)remaining.textContent=r>0?'יתרה לתשלום: '+money(r):'התשלום מכסה את מלוא הסכום';if(change){change.textContent=ch>0?'עודף: '+money(ch):'אין עודף';change.className='pill '+(ch>0?'blue':'green');}}" +
        "if(amount)amount.oninput=refresh;refresh();" +
        "var cancel=document.getElementById('mfixPayCancel'),x=document.getElementById('mfixPayClose');if(cancel)cancel.onclick=close;if(x)x.onclick=close;" +
        "var apply=document.getElementById('mfixPayApply');if(apply)apply.onclick=function(){var a=Math.max(0,Number(amount&&amount.value)||0),m=(method&&method.value)||'cash';if(a<=0){if(window.toast)window.toast('יש להזין סכום תשלום','err');return;}window.STATE.currentPayment={method:m,paid:Math.round(a*100)/100,total:Math.round(total*100)/100,change:Math.round(Math.max(0,a-total)*100)/100,remaining:Math.round(Math.max(0,total-a)*100)/100,at:new Date().toISOString()};try{localStorage.setItem('mfix_current_payment_v1',JSON.stringify(window.STATE.currentPayment));}catch(e){}close();if(window.toast)window.toast('התשלום נשמר: '+money(a)+' · '+(m==='cash'?'מזומן':m==='card'?'אשראי':m==='transfer'?'העברה':'אחר'),'ok');};" +
        "},0);" +
        "}" +
        "function install(){var v=document.getElementById('view-pos');if(!v){setTimeout(install,400);return;}if(v.querySelector('.mfix-payment-entry'))return;var b=document.createElement('button');b.type='button';b.className='btn btn-green btn-lg mfix-payment-entry';b.textContent='💳 תשלום';b.style.margin='0 0 10px 10px';b.onclick=openPayment;var host=v.querySelector('#cartTotals')||v;host.insertBefore(b,host.firstChild);console.log('[MFIX] payment management patch active');}" +
        "install();" +
        "})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup) findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) {
            ((WebView) root).postDelayed(() -> ((WebView) root).evaluateJavascript(PATCH, null), 1300);
        }
    }
}
