package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds a practical multi-method payment dialog to the existing POS WebView. */
public class PaymentManagementPatchActivity extends UsersPermissionsPatchActivity {
    private static final String PATCH =
        "(function(){" +
        "if(window.__mfixPaymentManagementPatch)return;window.__mfixPaymentManagementPatch=true;" +
        "function money(n){return '₪'+Number(n||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});}" +
        "function calcTotal(){try{if(typeof window.computeCartCalc==='function'){var c=window.computeCartCalc();return Number(c.totalIncl||c.total||0);} }catch(e){} return (window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:[]).reduce(function(s,x){return s+Number(x.lineTotal||x.total||((Number(x.price)||Number(x.unitPrice)||0)*(Number(x.qty)||1))||0);},0);}" +
        "function close(){if(window.closeModal)window.closeModal();}" +
        "function label(m){return m==='cash'?'מזומן':m==='card'?'אשראי':m==='transfer'?'העברה':m==='check'?'צ׳ק':'אחר';}" +
        "function row(method,amount){return '<div class=\"mfixPayRow\" style=\"display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-top:8px;align-items:center\"><select class=\"input mfixPayMethod\"><option value=\"cash\" '+(method==='cash'?'selected':'')+'>מזומן</option><option value=\"card\" '+(method==='card'?'selected':'')+'>אשראי</option><option value=\"transfer\" '+(method==='transfer'?'selected':'')+'>העברה בנקאית</option><option value=\"check\" '+(method==='check'?'selected':'')+'>צ׳ק</option><option value=\"other\" '+(method==='other'?'selected':'')+'>אחר</option></select><input class=\"input mfixPayAmount\" type=\"number\" min=\"0\" step=\"0.01\" value=\"'+Number(amount||0).toFixed(2)+'\"><button class=\"btn btn-ghost mfixPayRemove\" type=\"button\">✕</button></div>'; }" +
        "function openPayment(){" +
        "var total=calcTotal();if(total<=0){if(window.toast)window.toast('הסל ריק — אין סכום לתשלום','err');return;}" +
        "var existing=(window.STATE&&window.STATE.currentPayment)||null;var parts=existing&&Array.isArray(existing.parts)&&existing.parts.length?existing.parts:[{method:existing&&existing.method||'cash',amount:existing?Number(existing.paid||0):total}];" +
        "var html='<div class=\"modal-head\"><h3>💳 תשלום</h3><button class=\"modal-close\" type=\"button\" id=\"mfixPayClose\">✕</button></div>'+" +
        "'<div class=\"modal-body\"><div class=\"card\" style=\"background:var(--gray-50);margin-bottom:14px\"><div class=\"muted\">סה\"כ לתשלום</div><div id=\"mfixPayTotal\" style=\"font-size:28px;font-weight:900\">'+money(total)+'</div><div id=\"mfixPayRemaining\" class=\"muted\" style=\"margin-top:4px\"></div></div>'+" +
        "'<div style=\"font-weight:800\">אמצעי תשלום</div><div id=\"mfixPayRows\">'+parts.map(function(p){return row(String(p.method||'cash'),Number(p.amount||0));}).join('')+'</div>'+" +
        "'<button class=\"btn btn-ghost\" type=\"button\" id=\"mfixPayAdd\" style=\"margin-top:10px\">＋ הוסף אמצעי תשלום</button>'+" +
        "'<div id=\"mfixPaySummary\" class=\"pill green\" style=\"font-size:14px;margin-top:12px\"></div>'+" +
        "'<div style=\"margin-top:10px\" class=\"muted\">אפשר לפצל את התשלום בין כמה אמצעים. הסיום יתאפשר רק כאשר מלוא הסכום מכוסה.</div></div>'+" +
        "'<div class=\"modal-foot\"><button class=\"btn btn-ghost\" type=\"button\" id=\"mfixPayCancel\">ביטול</button><button class=\"btn btn-green\" type=\"button\" id=\"mfixPayApply\">אישור תשלום</button></div>';" +
        "if(window.openModal)window.openModal(html,{wide:false});" +
        "setTimeout(function(){var rows=document.getElementById('mfixPayRows'),summary=document.getElementById('mfixPaySummary'),remaining=document.getElementById('mfixPayRemaining');" +
        "function refresh(){var sum=0;Array.prototype.forEach.call(document.querySelectorAll('#mfixPayRows .mfixPayAmount'),function(x){sum+=Math.max(0,Number(x.value)||0);});var r=Math.max(0,total-sum),ch=Math.max(0,sum-total);if(remaining)remaining.textContent=r>0?'יתרה לתשלום: '+money(r):'התשלום מכסה את מלוא הסכום';if(summary){summary.textContent=ch>0?'עודף: '+money(ch):'שולם: '+money(sum)+(r>0?' · חסר: '+money(r):' · אין יתרה');summary.className='pill '+(r>0?'blue':'green');}}" +
        "function bind(){Array.prototype.forEach.call(document.querySelectorAll('#mfixPayRows .mfixPayAmount'),function(x){x.oninput=refresh;});Array.prototype.forEach.call(document.querySelectorAll('#mfixPayRows .mfixPayRemove'),function(x){x.onclick=function(){var all=document.querySelectorAll('#mfixPayRows .mfixPayRow');if(all.length>1)x.parentNode.remove();else{var a=x.parentNode.querySelector('.mfixPayAmount');if(a)a.value='0';}refresh();};});}" +
        "bind();refresh();" +
        "var add=document.getElementById('mfixPayAdd');if(add)add.onclick=function(){rows.insertAdjacentHTML('beforeend',row('cash',0));bind();refresh();};" +
        "var cancel=document.getElementById('mfixPayCancel'),x=document.getElementById('mfixPayClose');if(cancel)cancel.onclick=close;if(x)x.onclick=close;" +
        "var apply=document.getElementById('mfixPayApply');if(apply)apply.onclick=function(){var list=[],sum=0;Array.prototype.forEach.call(document.querySelectorAll('#mfixPayRows .mfixPayRow'),function(r){var m=r.querySelector('.mfixPayMethod'),a=r.querySelector('.mfixPayAmount'),amt=Math.max(0,Number(a&&a.value)||0);if(amt>0){list.push({method:(m&&m.value)||'cash',amount:Math.round(amt*100)/100});sum+=amt;}});sum=Math.round(sum*100)/100;var remainingAmount=Math.round(Math.max(0,total-sum)*100)/100;if(!list.length){if(window.toast)window.toast('יש להזין סכום תשלום','err');return;}if(remainingAmount>0.009){if(window.toast)window.toast('חסרים '+money(remainingAmount)+' לתשלום','err');return;}var change=Math.round(Math.max(0,sum-total)*100)/100;window.STATE.currentPayment={method:list.length===1?list[0].method:'split',paid:sum,total:Math.round(total*100)/100,change:change,remaining:0,parts:list,at:new Date().toISOString()};try{localStorage.setItem('mfix_current_payment_v1',JSON.stringify(window.STATE.currentPayment));}catch(e){}close();if(window.toast)window.toast('התשלום נשמר: '+money(sum)+(list.length>1?' · '+list.length+' אמצעים':' · '+label(list[0].method)),'ok');};" +
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
