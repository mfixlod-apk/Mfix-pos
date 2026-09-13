package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds a read-only inventory stock history ledger. */
public class StockHistoryPatchActivity extends ReleaseScopePatchActivity {
    private static final String PATCH = "(function(){if(window.__mfixStockHistory)return;window.__mfixStockHistory=true;function esc(s){return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}function draw(){var v=document.getElementById('view-inventory');if(!v)return false;var old=document.getElementById('mfixStockHistory');if(old)old.remove();if(!Array.isArray(STATE.inventoryHistory))STATE.inventoryHistory=[];var ps=Array.isArray(STATE.products)?STATE.products:[],names={};ps.forEach(function(p){names[String(p.id)]=p.name||p.sku||p.id;});var rows=STATE.inventoryHistory.slice(0,100).map(function(h){var d=h.type==='sale'?-Number(h.qty||0):Number(h.qty||0);var sign=d>0?'+':'';return '<tr><td>'+esc(names[String(h.productId)]||h.productId)+'</td><td>'+sign+d+'</td><td>'+esc(String(h.before))+' → '+esc(String(h.after))+'</td><td>'+esc(h.reason||h.type||'')+'</td><td dir=\"ltr\">'+esc(h.at?new Date(h.at).toLocaleString('he-IL'):'')+'</td></tr>';}).join('');var box=document.createElement('div');box.id='mfixStockHistory';box.className='card';box.style.marginTop='12px';box.innerHTML='<div class=\"section-title\">📋 היסטוריית מלאי</div><div class=\"muted\" style=\"font-size:12px;margin-bottom:10px\">יומן תנועות מלאי אחרונות. הצגה בלבד.</div>'+(rows?'<div style=\"overflow:auto\"><table class=\"tbl\"><thead><tr><th>מוצר</th><th>שינוי</th><th>מלאי</th><th>סיבה</th><th>מועד</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<div class=\"empty-state\">אין עדיין תנועות מלאי מתועדות</div>');v.appendChild(box);return true;}var n=0,t=setInterval(function(){if(draw()||++n>=30)clearInterval(t);},500);console.log('[MFIX] stock history patch active');})();";
    @Override protected void onCreate(Bundle savedInstanceState){super.onCreate(savedInstanceState);View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),7600);}
}
