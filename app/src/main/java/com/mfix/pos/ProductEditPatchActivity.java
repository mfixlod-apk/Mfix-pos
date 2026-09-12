package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds manager-only product editing without changing stock quantities. */
public class ProductEditPatchActivity extends ProductSerialManagementPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixProductEditPatch)return;window.__mfixProductEditPatch=true;"+
        "function esc(s){return String(s==null?'':s).replace(/[&<>\\\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[c];});}"+
        "function persist(){try{if(typeof saveKey==='function')saveKey('products',STATE.products);else localStorage.setItem('cp_products',JSON.stringify(STATE.products));}catch(e){if(window.toast)window.toast('שמירת המוצר נכשלה','err');throw e;}}"+
        "function refresh(){try{if(typeof render==='function')render();}catch(e){console.error(e);}}"+
        "function openEditor(p){"+
        "var html='<div class=\\\"modal-head\\\"><h3>✏️ עריכת מוצר</h3><button class=\\\"modal-close\\\" type=\\\"button\\\" id=\\\"mfixProdClose\\\">✕</button></div>'+"+
        "'<div class=\\\"modal-body\\\"><div class=\\\"grid2\\\">'+"+
        "'<div class=\\\"field\\\"><label class=\\\"flabel\\\">שם מוצר</label><input id=\\\"mfixProdName\\\" class=\\\"input\\\" value=\\\"'+esc(p.name||'')+'\\\"></div>'+"+
        "'<div class=\\\"field\\\"><label class=\\\"flabel\\\">מק״ט / SKU</label><input id=\\\"mfixProdSku\\\" class=\\\"input\\\" value=\\\"'+esc(p.sku||'')+'\\\"></div>'+"+
        "'<div class=\\\"field\\\"><label class=\\\"flabel\\\">ברקוד</label><input id=\\\"mfixProdBarcode\\\" class=\\\"input\\\" value=\\\"'+esc(p.barcode||p.code||'')+'\\\"></div>'+"+
        "'<div class=\\\"field\\\"><label class=\\\"flabel\\\">קטגוריה</label><input id=\\\"mfixProdCategory\\\" class=\\\"input\\\" value=\\\"'+esc(p.category||'')+'\\\"></div>'+"+
        "'<div class=\\\"field\\\"><label class=\\\"flabel\\\">מחיר מכירה</label><input id=\\\"mfixProdPrice\\\" class=\\\"input\\\" type=\\\"number\\\" min=\\\"0\\\" step=\\\"0.01\\\" value=\\\"'+Number(p.price||p.sellPrice||0).toFixed(2)+'\\\"></div>'+"+
        "'<div class=\\\"field\\\"><label class=\\\"flabel\\\">מחיר עלות</label><input id=\\\"mfixProdCost\\\" class=\\\"input\\\" type=\\\"number\\\" min=\\\"0\\\" step=\\\"0.01\\\" value=\\\"'+Number(p.cost||p.costPrice||0).toFixed(2)+'\\\"></div>'+"+
        "'<div class=\\\"field\\\"><label class=\\\"flabel\\\">סף מלאי נמוך</label><input id=\\\"mfixProdMin\\\" class=\\\"input\\\" type=\\\"number\\\" min=\\\"0\\\" step=\\\"1\\\" value=\\\"'+Math.max(0,Number(p.minStock||0))+'\\\"></div>'+"+
        "'<div class=\\\"field\\\"><label class=\\\"flabel\\\">מלאי נוכחי</label><input class=\\\"input\\\" value=\\\"'+Math.max(0,Number(p.stock||0))+'\\\" disabled><div class=\\\"muted\\\" style=\\\"font-size:11px;margin-top:4px\\\">כמות המלאי משתנה רק דרך בקרת מלאי.</div></div>'+"+
        "'</div></div><div class=\\\"modal-foot\\\"><button class=\\\"btn btn-ghost\\\" type=\\\"button\\\" id=\\\"mfixProdCancel\\\">ביטול</button><button class=\\\"btn btn-primary\\\" type=\\\"button\\\" id=\\\"mfixProdSave\\\">שמור שינויים</button></div>';"+
        "if(window.openModal)window.openModal(html,{wide:false});"+
        "setTimeout(function(){var close=function(){if(window.closeModal)window.closeModal();};var x=document.getElementById('mfixProdClose'),c=document.getElementById('mfixProdCancel');if(x)x.onclick=close;if(c)c.onclick=close;var save=document.getElementById('mfixProdSave');if(save)save.onclick=function(){var name=document.getElementById('mfixProdName').value.trim(),sku=document.getElementById('mfixProdSku').value.trim(),barcode=document.getElementById('mfixProdBarcode').value.trim(),category=document.getElementById('mfixProdCategory').value.trim(),price=Math.max(0,Number(document.getElementById('mfixProdPrice').value)||0),cost=Math.max(0,Number(document.getElementById('mfixProdCost').value)||0),minStock=Math.max(0,Math.floor(Number(document.getElementById('mfixProdMin').value)||0));if(!name){if(window.toast)window.toast('יש להזין שם מוצר','err');return;}var duplicateSku=sku&&STATE.products.some(function(x){return x!==p&&String(x.sku||'').trim().toLowerCase()===sku.toLowerCase();});var duplicateBarcode=barcode&&STATE.products.some(function(x){return x!==p&&String(x.barcode||x.code||'').trim()===barcode;});if(duplicateSku){if(window.toast)window.toast('המק״ט כבר קיים במוצר אחר','err');return;}if(duplicateBarcode){if(window.toast)window.toast('הברקוד כבר קיים במוצר אחר','err');return;}p.name=name;p.sku=sku;p.barcode=barcode;p.category=category;p.price=Math.round(price*100)/100;p.cost=Math.round(cost*100)/100;p.minStock=minStock;p.updatedAt=new Date().toISOString();persist();close();refresh();if(window.toast)window.toast('המוצר עודכן בהצלחה','ok');};},0);"+
        "}"+
        "function draw(){var v=document.getElementById('view-inventory');if(!v)return false;var old=document.getElementById('mfixProductEditTools');if(old)old.remove();if(window.STATE&&window.STATE.currentRole&&window.STATE.currentRole!=='manager')return true;var box=document.createElement('div');box.id='mfixProductEditTools';box.className='card';box.style.marginBottom='12px';var ps=Array.isArray(STATE.products)?STATE.products:[];box.innerHTML='<div class=\\\"section-title\\\">✏️ עריכת מוצרים</div><div class=\\\"muted\\\" style=\\\"font-size:12px;margin-bottom:10px\\\">עריכת פרטי מוצר בלי לשנות את הכמות במלאי.</div><div style=\\\"display:flex;gap:8px;flex-wrap:wrap;align-items:center\\\"><select id=\\\"mfixProductEditSelect\\\" class=\\\"input\\\" style=\\\"max-width:420px\\\"><option value=\\\"\\\">בחר מוצר לעריכה</option>'+ps.map(function(p){return '<option value=\\\"'+esc(p.id)+'\\\">'+esc((p.name||p.sku||p.id)+' · '+(p.sku||'ללא מק״ט'))+'</option>';}).join('')+'</select><button id=\\\"mfixProductEditBtn\\\" class=\\\"btn btn-primary\\\" type=\\\"button\\\">✏️ ערוך</button></div>';v.insertBefore(box,v.firstChild);var sel=document.getElementById('mfixProductEditSelect'),btn=document.getElementById('mfixProductEditBtn');btn.onclick=function(){var p=ps.find(function(x){return String(x.id)===String(sel.value);});if(!p){if(window.toast)window.toast('בחר מוצר לעריכה','err');return;}openEditor(p);};return true;}var tries=0,t=setInterval(function(){tries++;if(draw()||tries>=30)clearInterval(t);},500);console.log('[MFIX] product edit patch active');})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),5500);
    }
}
