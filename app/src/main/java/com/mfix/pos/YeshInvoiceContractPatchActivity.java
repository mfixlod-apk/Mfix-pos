package com.mfix.pos;

import android.app.AlertDialog;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.view.View;
import android.view.ViewGroup;

public class YeshInvoiceContractPatchActivity extends GranularPermissionsActivePatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixYeshLauncher)return;window.__mfixYeshLauncher=true;" +
        "function add(){if(document.getElementById('mfixYeshOpenButton'))return;var host=document.querySelector('#topRight')||document.querySelector('.topbar-right')||document.querySelector('.topbar');" +
        "if(!host)return;var b=document.createElement('button');b.id='mfixYeshOpenButton';b.type='button';b.className='badge green';b.style.cssText='border:none;cursor:pointer;font-weight:800';b.textContent='🧾 יש חשבונית';" +
        "b.onclick=function(){try{var payload={cart:Array.isArray(window.STATE&&STATE.cart)?STATE.cart:[],customerName:window.STATE&&STATE.docCustomerName||'',customerPhone:window.STATE&&STATE.docCustomerPhone||''};window.AndroidYeshLauncher.openWithSale(JSON.stringify(payload));}catch(e){try{window.AndroidYeshLauncher.open();}catch(_){alert('פתיחת יש חשבונית נכשלה: '+e.message);}}};host.appendChild(b);}" +
        "function addInventoryAudit(){var v=document.getElementById('view-inventory');if(!v||document.getElementById('mfixInventoryAudit'))return false;var box=document.createElement('div');box.id='mfixInventoryAudit';box.className='card';box.style.marginBottom='12px';box.innerHTML='<div style=\"display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap\"><div><div class=\"section-title\">🔎 בדיקת תקינות מלאי</div><div style=\"font-size:12px;color:var(--gray-500)\">איתור מלאי שלילי, מלאי נמוך, IMEI/Serial כפולים ומוצרים ללא SKU/ברקוד.</div></div><button id=\"mfixInventoryAuditBtn\" class=\"btn btn-outline\">בדוק עכשיו</button></div>';v.insertBefore(box,v.firstChild);document.getElementById('mfixInventoryAuditBtn').onclick=function(){var ps=Array.isArray(window.STATE&&STATE.products)?STATE.products:[],neg=[],low=[],dups={},missing=[];ps.forEach(function(p){var stock=Number(p.stock||0),key=String(p.imei||p.serial||'').trim();if(stock<0)neg.push(p);if(stock>0&&stock<=Number(p.minStock||0))low.push(p);if(key){dups[key]=dups[key]||[];dups[key].push(p);}if(!String(p.sku||p.barcode||'').trim())missing.push(p);});var dupKeys=Object.keys(dups).filter(function(k){return dups[k].length>1;});var esc=function(s){return String(s==null?'':s).replace(/[&<>\\\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[c];});};var list=function(title,arr,extra){return '<div style=\"margin:12px 0\"><b>'+title+'</b>'+(arr.length?'<ul>'+arr.slice(0,30).map(function(p){return '<li>'+esc(p.name||'ללא שם')+' — '+extra(p)+'</li>';}).join('')+'</ul>':'<div class=\"empty-state\">אין חריגות</div>')+'</div>';};var html='<div class=\"modal wide\"><div class=\"modal-head\"><h3>בדיקת תקינות מלאי</h3><button class=\"modal-close\" onclick=\"closeModal()\">×</button></div><div class=\"modal-body\"><div class=\"grid2\"><div class=\"card\"><b>מוצרים</b><div>'+ps.length+'</div></div><div class=\"card\"><b>מלאי שלילי</b><div>'+neg.length+'</div></div><div class=\"card\"><b>מלאי נמוך</b><div>'+low.length+'</div></div><div class=\"card\"><b>IMEI/Serial כפול</b><div>'+dupKeys.length+'</div></div></div>'+list('מלאי שלילי',neg,function(p){return 'מלאי '+Number(p.stock||0);})+list('מלאי נמוך',low,function(p){return 'מלאי '+Number(p.stock||0)+' / מינימום '+Number(p.minStock||0);})+'<div style=\"margin:12px 0\"><b>IMEI / Serial כפולים</b>'+(dupKeys.length?'<ul>'+dupKeys.slice(0,30).map(function(k){return '<li>'+esc(k)+' — '+dups[k].map(function(p){return esc(p.name||p.id);}).join(', ')+'</li>';}).join('')+'</ul>':'<div class=\"empty-state\">אין כפילויות</div>')+'</div>'+list('מוצרים ללא SKU או ברקוד',missing,function(){return 'חסר מזהה';})+'</div></div>';openModal(html);};return true;}" +
        "add();addInventoryAudit();setInterval(function(){add();addInventoryAudit();},1000);})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView){
            WebView webView=(WebView)root;
            webView.getSettings().setJavaScriptEnabled(true);
            webView.addJavascriptInterface(new LauncherBridge(), "AndroidYeshLauncher");
            webView.postDelayed(()->webView.evaluateJavascript(PATCH,null),4000);
        }
    }

    private final class LauncherBridge {
        @JavascriptInterface public void open(){ openWithSale("{}"); }
        @JavascriptInterface public void openWithSale(String payload){
            final String safePayload = payload==null?"{}":payload;
            runOnUiThread(()->new AlertDialog.Builder(YeshInvoiceContractPatchActivity.this)
                .setTitle("פתיחת יש חשבונית")
                .setMessage("העגלה הנוכחית תועבר ליש חשבונית לצורך הפקת המסמך. האם לפתוח עכשיו?")
                .setNegativeButton("ביטול", null)
                .setPositiveButton("פתח", (dialog, which)->{
                    android.content.Intent i=new android.content.Intent(YeshInvoiceContractPatchActivity.this, YeshInvoiceWebActivity.class);
                    i.putExtra("mfix_sale_payload", safePayload);
                    startActivity(i);
                }).show());
        }
    }
}
