package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds split-payment support while preserving the existing checkout and payment flow. */
public class SplitPaymentPatchActivity extends SuspendedSalesPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixSplitPaymentPatch)return;window.__mfixSplitPaymentPatch=true;"+
        "function money(n){return '₪'+Number(n||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});}"+
        "function total(){try{if(typeof window.computeCartCalc==='function'){var c=window.computeCartCalc();return Number(c.totalIncl||c.total||0);}}catch(e){}var c=window.STATE&&Array.isArray(window.STATE.cart)?window.STATE.cart:[];return c.reduce(function(s,x){return s+Number(x.lineTotal||x.total||((Number(x.price)||Number(x.unitPrice)||0)*(Number(x.qty)||1)));},0);}"+
        "function close(){if(window.closeModal)window.closeModal();}"+
        "function openSplit(){var t=total();if(t<=0){if(window.toast)toast('הסל ריק — אין סכום לתשלום','err');return;}"+
        "var html='<div class=\"modal-head\"><h3>💳 פיצול תשלום</h3><button class=\"modal-close\" id=\"mfixSplitClose\">✕</button></div>'+"+
        "'<div class=\"modal-body\"><div class=\"card\" style=\"background:var(--gray-50);margin-bottom:12px\"><div class=\"muted\">סה\"כ</div><div style=\"font-size:28px;font-weight:900\">'+money(t)+'</div><div id=\"mfixSplitRemaining\" class=\"muted\"></div></div><div id=\"mfixSplitRows\"></div><button class=\"btn btn-outline\" id=\"mfixSplitAdd\">➕ הוסף אמצעי תשלום</button></div>'+"+
        "'<div class=\"modal-foot\"><button class=\"btn btn-ghost\" id=\"mfixSplitCancel\">ביטול</button><button class=\"btn btn-green\" id=\"mfixSplitApply\">אישור תשלום</button></div>';"+
        "openModal(html);setTimeout(function(){var rows=document.getElementById('mfixSplitRows'),rem=document.getElementById('mfixSplitRemaining');function add(method,amount){var d=document.createElement('div');d.className='grid2';d.style.marginBottom='8px';d.innerHTML='<select class=\"input mfix-split-method\"><option value=\"cash\">מזומן</option><option value=\"card\">אשראי</option><option value=\"transfer\">העברה בנקאית</option><option value=\"other\">אחר</option></select><input class=\"input mfix-split-amount\" type=\"number\" min=\"0\" step=\"0.01\" value=\"'+(amount||0).toFixed(2)+'\">';rows.appendChild(d);d.querySelector('select').value=method||'cash';d.querySelector('input').oninput=refresh;}function refresh(){var sum=0;document.querySelectorAll('.mfix-split-amount').forEach(function(x){sum+=Math.max(0,Number(x.value)||0);});var r=t-sum;if(rem)rem.textContent=r>0?'יתרה לתשלום: '+money(r):r<0?'עודף: '+money(-r):'התשלום מכסה את מלוא הסכום';}add('cash',t);var addBtn=document.getElementById('mfixSplitAdd');if(addBtn)addBtn.onclick=function(){add('card',0);refresh();};var c=document.getElementById('mfixSplitCancel'),x=document.getElementById('mfixSplitClose');if(c)c.onclick=close;if(x)x.onclick=close;var ok=document.getElementById('mfixSplitApply');if(ok)ok.onclick=function(){var parts=[],sum=0;document.querySelectorAll('.mfix-split-amount').forEach(function(el,i){var a=Math.round(Math.max(0,Number(el.value)||0)*100)/100;if(a>0){var m=document.querySelectorAll('.mfix-split-method')[i].value;parts.push({method:m,amount:a});sum+=a;}});if(Math.abs(sum-t)>0.009){if(window.toast)toast(sum<t?'חסר תשלום: '+money(t-sum):'הסכום גבוה מהעסקה: '+money(sum-t),'err');return;}window.STATE.currentPayment={method:'split',paid:Math.round(sum*100)/100,total:Math.round(t*100)/100,change:0,remaining:0,parts:parts,at:new Date().toISOString()};try{localStorage.setItem('mfix_current_payment_v1',JSON.stringify(window.STATE.currentPayment));}catch(e){}close();if(window.toast)toast('פיצול התשלום נשמר','ok');};refresh();},0);}"+
        "function install(){var v=document.getElementById('view-pos');if(!v){setTimeout(install,500);return;}if(v.querySelector('.mfix-split-payment-entry'))return;var host=v.querySelector('#cartTotals')||v;var b=document.createElement('button');b.type='button';b.className='btn btn-outline mfix-split-payment-entry';b.textContent='💳 פצל תשלום';b.style.margin='0 0 10px 10px';b.onclick=openSplit;host.insertBefore(b,host.firstChild);}"+
        "install();console.log('[MFIX] split payment patch active');})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup) findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) {
            ((WebView) root).postDelayed(() -> ((WebView) root).evaluateJavascript(PATCH, null), 2800);
        }
    }
}
