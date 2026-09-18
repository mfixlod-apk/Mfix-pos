package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds a read-only inventory integrity audit on top of product management. */
public class InventoryAuditPatchActivity extends InventoryManagementPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixInventoryAuditV1)return;window.__mfixInventoryAuditV1=true;"+
        "function esc(s){return String(s==null?'':s).replace(/[&<>\\\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[c];});}"+
        "function audit(){var ps=Array.isArray(window.STATE&&STATE.products)?STATE.products:[],neg=[],low=[],dups={},missing=[];ps.forEach(function(p){var stock=Number(p.stock||0),key=String(p.imei||p.serial||'').trim();if(stock<0)neg.push(p);if(stock>=0&&stock<=Number(p.minStock||0)&&stock>0)low.push(p);if(key){dups[key]=dups[key]||[];dups[key].push(p);}if(!String(p.sku||p.barcode||'').trim())missing.push(p);});var dupKeys=Object.keys(dups).filter(function(k){return dups[k].length>1;});var html='<div class=\\\"modal wide\\\"><div class=\\\"modal-head\\\"><h3>בדיקת תקינות מלאי</h3><button class=\\\"modal-close\\\" onclick=\\\"closeModal()\\\">×</button></div><div class=\\\"modal-body\\\"><div class=\\\"grid2\\\"><div class=\\\"card\\\"><b>מוצרים</b><div>'+ps.length+'</div></div><div class=\\\"card\\\"><b>מלאי שלילי</b><div>'+neg.length+'</div></div><div class=\\\"card\\\"><b>מלאי נמוך</b><div>'+low.length+'</div></div><div class=\\\"card\\\"><b>IMEI/Serial כפול</b><div>'+dupKeys.length+'</div></div></div>';
+        "html+='<h4>חריגות</h4>';
+        "function list(title,arr,extra){html+='<div style=\\\"margin:12px 0\\\"><b>'+title+'</b>'+(arr.length?'<ul>'+arr.slice(0,30).map(function(p){return '<li>'+esc(p.name||'ללא שם')+' — '+extra(p)+'</li>';}).join('')+'</ul>':'<div class=\\\"empty-state\\\">אין חריגות</div>')+'</div>';}
+        "list('מלאי שלילי',neg,function(p){return 'מלאי '+Number(p.stock||0);});list('מלאי נמוך',low,function(p){return 'מלאי '+Number(p.stock||0)+' / מינימום '+Number(p.minStock||0);});
+        "html+='<div style=\\\"margin:12px 0\\\"><b>IMEI / Serial כפולים</b>'+(dupKeys.length?'<ul>'+dupKeys.slice(0,30).map(function(k){return '<li>'+esc(k)+' — '+dups[k].map(function(p){return esc(p.name||p.id);}).join(', ')+'</li>';}).join('')+'</ul>':'<div class=\\\"empty-state\\\">אין כפילויות</div>')+'</div>';
+        "list('מוצרים ללא SKU או ברקוד',missing,function(){return 'חסר מזהה';});html+='</div></div>';openModal(html);}"
+        "function panel(){var v=document.getElementById('view-inventory');if(!v)return false;var box=document.getElementById('mfixInventoryAudit');if(box)return true;box=document.createElement('div');box.id='mfixInventoryAudit';box.className='card';box.style.marginBottom='12px';box.innerHTML='<div style=\\\"display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap\\\"><div><div class=\\\"section-title\\\">🔎 בדיקת תקינות מלאי</div><div style=\\\"font-size:12px;color:var(--gray-500)\\\">איתור מלאי שלילי, מלאי נמוך, IMEI/Serial כפולים ומוצרים ללא SKU/ברקוד.</div></div><button id=\\\"mfixInventoryAuditBtn\\\" class=\\\"btn btn-outline\\\">בדוק עכשיו</button></div>';v.insertBefore(box,v.firstChild);document.getElementById('mfixInventoryAuditBtn').onclick=audit;return true;}var tries=0,t=setInterval(function(){tries++;if(panel()||tries>=30)clearInterval(t);},500);})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),4800);
    }
}
