package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds read-only settings diagnostics and a non-destructive data-integrity scan. */
public class SettingsDiagnosticsPatchActivity extends ReleaseScopePatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixSettingsDiagnostics)return;window.__mfixSettingsDiagnostics=true;"+
        "function esc(s){return String(s==null?'':s).replace(/[&<>\\\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[c];});}"+
        "function countIssues(){var issues=[],products=Array.isArray(STATE.products)?STATE.products:[],sales=Array.isArray(STATE.sales)?STATE.sales:[];var ids={};products.forEach(function(p){ids[String(p.id)]=true;var stock=p.trackSerial?((p.imeis||[]).filter(function(i){return i.status==='available';}).length):Number(p.stock||0);if(stock<0)issues.push('מלאי שלילי: '+(p.name||p.id));});var barcodes={};products.forEach(function(p){var b=String(p.barcode||'').trim();if(!b)return;if(barcodes[b])issues.push('ברקוד כפול: '+b);else barcodes[b]=p.id;});sales.forEach(function(s){(s.items||[]).forEach(function(i){if(i.productId&&i.productId!=='manual'&&i.productId.indexOf('manual_')!==0&&i.productId.indexOf('giftcard_')!==0&&i.productId.indexOf('preorder_')!==0&&!ids[String(i.productId)])issues.push('מכירה #'+s.number+' מפנה למוצר חסר: '+i.name);});});products.forEach(function(p){(p.imeis||[]).forEach(function(i){if(i.status==='sold'&&!i.saleId)issues.push('IMEI נמכר ללא מסמך מכירה: '+(i.imei1||i.serial||p.name));});});return issues;}"+
        "function nativePrinters(){try{return window.AndroidPrinter&&typeof AndroidPrinter.listUsbPrinters==='function'?JSON.parse(AndroidPrinter.listUsbPrinters()||'[]'):[];}catch(e){return [];}}"+
        "function scan(){var issues=countIssues(),ps=nativePrinters(),storage='localStorage';try{localStorage.setItem('__mfix_diag__','1');localStorage.removeItem('__mfix_diag__');}catch(e){storage='לא זמין';}var msg=issues.length?'נמצאו '+issues.length+' נקודות לבדיקה:\\n\\n• '+issues.slice(0,20).join('\\n• ')+(issues.length>20?'\\n• ועוד '+(issues.length-20):''):'לא נמצאו אי-התאמויות בסיסיות במידע.';msg+='\\n\\nמוצרים: '+(STATE.products||[]).length+' | מכירות: '+(STATE.sales||[]).length+' | מדפסות USB מזוהות: '+ps.length+' | אחסון: '+storage;alert(msg);}"+
        "function draw(){var v=document.getElementById('view-settings');if(!v)return false;var old=document.getElementById('mfixSettingsDiagnostics');if(old)old.remove();var box=document.createElement('div');box.id='mfixSettingsDiagnostics';box.className='card';box.style.marginBottom='14px';var ps=nativePrinters();var printerText=ps.length?ps.map(function(p){return String(p.name||p.id)+' · '+(p.authorized?'מורשית':'נדרשת הרשאה');}).join('<br>'):'לא זוהתה מדפסת USB דרך הגשר native כרגע';box.innerHTML='<div class=\\\"section-title\\\">🛡️ אבחון ותקינות מערכת</div><div class=\\\"muted\\\" style=\\\"font-size:12px;margin-bottom:10px\\\">בדיקה לא-משנה: מזהה הפניות למוצרים חסרים, ברקודים כפולים, מלאי שלילי ויחידות IMEI שסומנו כנמכרות ללא מסמך מכירה. הבדיקה אינה מוחקת או משנה נתונים.</div><div style=\\\"display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:12px\\\"><div class=\\\"pill gray\\\">מוצרים: '+((STATE.products||[]).length)+'</div><div class=\\\"pill gray\\\">מכירות: '+((STATE.sales||[]).length)+'</div><div class=\\\"pill '+(ps.length?'green':'gray')+'\\\">USB: '+ps.length+'</div></div><div style=\\\"margin-top:8px;font-size:11.5px;color:var(--gray-500)\\\">'+printerText+'</div><div style=\\\"display:flex;gap:8px;flex-wrap:wrap;margin-top:10px\\\"><button id=\\\"mfixRunDataScan\\\" class=\\\"btn btn-outline\\\">🔎 הרץ בדיקת נתונים</button><button id=\\\"mfixDiagRefresh\\\" class=\\\"btn btn-ghost\\\">🔄 רענן אבחון</button></div>';v.insertBefore(box,v.firstChild);document.getElementById('mfixRunDataScan').onclick=scan;document.getElementById('mfixDiagRefresh').onclick=draw;return true;}var n=0,t=setInterval(function(){if(draw()||++n>=30)clearInterval(t);},500);console.log('[MFIX] settings diagnostics patch active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),7000);
    }
}
