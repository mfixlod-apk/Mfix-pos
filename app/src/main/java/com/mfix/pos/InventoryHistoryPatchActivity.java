package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds a manager-visible stock movement history for inventory. */
public class InventoryHistoryPatchActivity extends KeyboardShortcutPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixInventoryHistoryPatch)return;window.__mfixInventoryHistoryPatch=true;"+
        "function esc(s){return String(s==null?'':s).replace(/[&<>\\\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[c];});}"+
        "function money(n){return '₪'+Number(n||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});}"+
        "function productName(id){var p=(window.STATE&&Array.isArray(window.STATE.products)?window.STATE.products:[]).find(function(x){return String(x.id)===String(id);});return p?(p.name||p.sku||p.barcode||p.id):id;}"+
        "function typeLabel(t){return ({sale:'מכירה',purchase:'קבלת מלאי',adjustment:'התאמת מלאי',return:'החזרה',repair:'תיקון'})[t]||t||'תנועה';}"+
        "function openHistory(){"+
        "var h=(window.STATE&&Array.isArray(window.STATE.inventoryHistory)?window.STATE.inventoryHistory:[]).slice();"+
        "h.sort(function(a,b){return new Date(b.at||0)-new Date(a.at||0);});"+
        "var rows=h.slice(0,200).map(function(x){var delta=Number(x.after||0)-Number(x.before||0),cls=delta>0?'green':(delta<0?'red':'gray');var serials=Array.isArray(x.serials)?x.serials.filter(Boolean).join(', '):'';return '<tr><td>'+esc(new Date(x.at||Date.now()).toLocaleString('he-IL'))+'</td><td>'+esc(productName(x.productId))+'</td><td><span class=\"pill blue\">'+esc(typeLabel(x.type))+'</span></td><td>'+Number(x.before||0)+'</td><td>'+Number(x.qty||0)+'</td><td>'+Number(x.after||0)+'</td><td><span class=\"pill '+cls+'\">'+(delta>0?'+':'')+delta+'</span></td><td>'+esc(x.reason||'')+(serials?'<div class=\"muted\" style=\"font-size:10px\">IMEI: '+esc(serials)+'</div>':'')+'</td></tr>';}).join('');"+
        "var html='<div class=\"modal-head\"><h3>📦 היסטוריית תנועות מלאי</h3><button class=\"modal-close\" onclick=\"closeModal()\">✕</button></div><div class=\"modal-body\"><div class=\"card\" style=\"margin-bottom:12px;background:var(--gray-50)\"><b>'+h.length+'</b> תנועות נשמרו · מוצגות עד 200 האחרונות<div class=\"muted\" style=\"font-size:11px;margin-top:4px\">התנועות נרשמות בעת עדכון מלאי, כולל מכירות עם IMEI/מספר סידורי.</div></div><div style=\"overflow:auto;max-height:60vh\"><table class=\"tbl\"><thead><tr><th>תאריך</th><th>מוצר</th><th>סוג</th><th>לפני</th><th>כמות</th><th>אחרי</th><th>שינוי</th><th>סיבה / IMEI</th></tr></thead><tbody>'+(rows||'<tr><td colspan=\"8\" class=\"muted\">אין עדיין תנועות מלאי</td></tr>')+'</tbody></table></div></div><div class=\"modal-foot\"><button class=\"btn btn-ghost\" onclick=\"closeModal()\">סגור</button></div>';"+
        "if(window.openModal)window.openModal(html,{wide:true});"+
        "}"+
        "function install(){var v=document.getElementById('view-inventory');if(!v){setTimeout(install,600);return;}var old=document.getElementById('mfixInventoryHistoryCard');if(old)old.remove();var box=document.createElement('div');box.id='mfixInventoryHistoryCard';box.className='card';box.style.marginBottom='12px';box.innerHTML='<div class=\"section-title\">📦 היסטוריית מלאי</div><div class=\"muted\" style=\"font-size:12px;margin-bottom:10px\">צפייה בכל שינויי המלאי שנרשמו במערכת, כולל מכירות ויחידות IMEI/סידורי.</div><button type=\"button\" class=\"btn btn-outline\" id=\"mfixOpenInventoryHistory\">📋 הצג היסטוריה</button>';v.insertBefore(box,v.firstChild);box.querySelector('#mfixOpenInventoryHistory').onclick=openHistory;}"+
        "var tries=0;function loop(){tries++;install();if(tries<80)setTimeout(loop,750);}loop();console.log('[MFIX] inventory history patch active');"+
        "})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) {
            ((WebView) root).postDelayed(() -> ((WebView) root).evaluateJavascript(PATCH, null), 6000);
        }
    }
}
