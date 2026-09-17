package com.mfix.pos;

import android.webkit.WebView;

/** Adds a live low-stock summary to the existing inventory view without changing stock values. */
public final class LowStockDashboardPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixLowStockDashboardV1)return;window.__mfixLowStockDashboardV1=true;"+
        "function esc(s){return String(s==null?'':s).replace(/[&<>\\\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[c];});}"+
        "function draw(){var v=document.getElementById('view-inventory');if(!v||!window.STATE)return false;var old=document.getElementById('mfixLowStockCard');if(old)old.remove();var ps=Array.isArray(STATE.products)?STATE.products:[];var low=ps.filter(function(p){var min=Math.max(0,Number(p.minStock||0));var stock=Math.max(0,Number(p.stock||0));return min>0&&stock<=min;}).sort(function(a,b){return Number(a.stock||0)-Number(b.stock||0);});var box=document.createElement('div');box.id='mfixLowStockCard';box.className='card';box.style.marginBottom='12px';box.innerHTML='<div style=\"display:flex;align-items:center;justify-content:space-between;gap:8px\"><div><div class=\"section-title\">⚠️ מלאי נמוך</div><div class=\"muted\" style=\"font-size:12px\">מוצרים שהמלאי שלהם הגיע לסף שהוגדר.</div></div><span class=\"pill '+(low.length?'red':'green')+'\">'+low.length+' מוצרים</span></div>'+(low.length?'<div style=\"margin-top:10px\"><table class=\"tbl\"><thead><tr><th>מוצר</th><th>מלאי</th><th>סף</th></tr></thead><tbody>'+low.slice(0,30).map(function(p){return '<tr><td>'+esc(p.name||p.sku||p.id)+'</td><td>'+Math.max(0,Number(p.stock||0))+'</td><td>'+Math.max(0,Number(p.minStock||0))+'</td></tr>';}).join('')+'</tbody></table>'+(low.length>30?'<div class=\"muted\" style=\"font-size:11px;margin-top:8px\">מוצגים 30 מתוך '+low.length+' מוצרים.</div>':'')+'</div>':'<div class=\"empty-state\" style=\"padding:14px\">אין מוצרים מתחת לסף המלאי.</div>');v.insertBefore(box,v.firstChild);return true;}var tries=0,t=setInterval(function(){tries++;draw();if(tries>=30)clearInterval(t);},700);console.log('[MFIX] low-stock dashboard active');})();";

    public static void install(WebView webView){
        if(webView==null)return;
        webView.postDelayed(()->webView.evaluateJavascript(PATCH,null),3600);
    }
}
