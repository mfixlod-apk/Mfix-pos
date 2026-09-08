package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/**
 * Runtime safety layer for business-logic fixes that must be applied
 * without duplicating the embedded single-page POS application.
 */
public class RuntimeSafetyPatchActivity extends PatchedMainActivity {
    private static final String RETURN_AND_IMPORT_PATCH =
        "(function(){" +
        "if(window.__mfixReturnImportSafetyPatch)return;window.__mfixReturnImportSafetyPatch=true;" +
        "function install(){" +
        "if(!window.STATE||typeof window.processReturn!=='function'||typeof window.commitInventoryImport!=='function'){setTimeout(install,250);return;}" +
        "window.returnedQty=function(saleId,itemIndex){var sale=(window.findSale&&window.findSale(saleId));var item=sale&&sale.items&&sale.items[itemIndex];if(!item)return 0;return (window.STATE.returns||[]).filter(function(r){return r.originalSaleId===saleId;}).reduce(function(sum,r){return sum+(r.items||[]).filter(function(it){return it.productId===item.productId&&String(it.imei||'')===String(item.imei||'');}).reduce(function(a,it){return a+(Number(it.qty)||0);},0);},0);};" +
        "var originalImport=window.commitInventoryImport;" +
        "window.commitInventoryImport=async function(){var before={};(window.STATE.products||[]).forEach(function(p){before[p.id]={qty:(p.trackSerial?(p.imeis||[]).filter(function(i){return i.status==='available';}).length:Number(p.stock)||0),name:p.name};});var result=await originalImport.apply(this,arguments);if(typeof window.addInventoryHistory==='function'){for(var i=0;i<(window.STATE.products||[]).length;i++){var p=window.STATE.products[i],after=p.trackSerial?(p.imeis||[]).filter(function(x){return x.status==='available';}).length:Number(p.stock)||0,b=before[p.id];if(!b&&after>0){await window.addInventoryHistory(p.id,'ייבוא מלאי',after,0,after,'ייבוא קובץ מלאי');}else if(b&&after!==b.qty){await window.addInventoryHistory(p.id,'ייבוא מלאי',after-b.qty,b.qty,after,'ייבוא קובץ מלאי');}}}return result;};" +
        "console.log('[MFIX] return and import safety patch active');" +
        "}" +
        "install();" +
        "})();";

    private static final String CHECKOUT_GUARD_PATCH =
        "(function(){" +
        "if(window.__mfixCheckoutGuardPatch)return;window.__mfixCheckoutGuardPatch=true;" +
        "function install(){" +
        "if(typeof window.finalizeSale!=='function'){setTimeout(install,250);return;}" +
        "var originalFinalize=window.finalizeSale,inFlight=false;" +
        "window.finalizeSale=async function(){" +
        "if(inFlight){if(typeof window.toast==='function')window.toast('המכירה כבר בתהליך. נא להמתין לסיום הפעולה','err');return;}" +
        "inFlight=true;var buttons=Array.prototype.slice.call(document.querySelectorAll('[onclick=\\\"finalizeSale()\\\"]'));buttons.forEach(function(b){b.disabled=true;});" +
        "try{return await originalFinalize.apply(this,arguments);}" +
        "finally{inFlight=false;buttons.forEach(function(b){b.disabled=false;});}" +
        "};" +
        "console.log('[MFIX] checkout duplicate-submit guard active');" +
        "}" +
        "install();" +
        "})();";

    private static final String REPORTS_PATCH =
        "(function(){" +
        "if(window.__mfixReportsPatch)return;window.__mfixReportsPatch=true;" +
        "function esc(v){return String(v==null?'':v).replace(/[&<>\\\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;'}[c]||c;});}" +
        "function dayStart(v){var d=v?new Date(v+'T00:00:00'):new Date('2000-01-01T00:00:00');return d.getTime();}" +
        "function dayEnd(v){var d=v?new Date(v+'T23:59:59.999'):new Date();return d.getTime();}" +
        "function report(from,to){var sales=(window.STATE&&STATE.sales||[]).filter(function(s){var t=new Date(s.date||0).getTime();return t>=dayStart(from)&&t<=dayEnd(to);});var gross=sales.reduce(function(a,s){return a+(Number(s.total)||0);},0),returns=(window.STATE&&STATE.returns||[]).filter(function(r){var t=new Date(r.date||r.createdAt||0).getTime();return t>=dayStart(from)&&t<=dayEnd(to);}).reduce(function(a,r){return a+(Number(r.total)||Number(r.refundTotal)||0);},0);var pay={},products={};sales.forEach(function(s){(s.payments||[]).forEach(function(p){pay[p.method||'other']=(pay[p.method||'other']||0)+(Number(p.amount)||0);});(s.items||[]).forEach(function(i){var k=i.name||i.productId||'מוצר';if(!products[k])products[k]={qty:0,total:0};products[k].qty+=Number(i.qty)||0;products[k].total+=(Number(i.qty)||0)*(Number(i.unitPrice)||0);});});return {sales:sales,gross:gross,returns:returns,net:gross-returns,pay:pay,products:products};}" +
        "window.mfixOpenSalesReport=function(){if(!window.STATE||typeof window.openModal!=='function'){return;}var now=new Date(),first=new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10),today=now.toISOString().slice(0,10);var html='<div class=\\\"modal wide\\\"><div class=\\\"modal-head\\\"><h3>📊 דוח מכירות</h3><button class=\\\"modal-close\\\" onclick=\\\"closeModal()\\\">✕</button></div><div class=\\\"modal-body\\\"><div class=\\\"grid2\\\"><div class=\\\"field\\\"><label class=\\\"flabel\\\">מתאריך</label><input id=\\\"mfixReportFrom\\\" class=\\\"input\\\" type=\\\"date\\\" value=\\\"'+first+'\\\"></div><div class=\\\"field\\\"><label class=\\\"flabel\\\">עד תאריך</label><input id=\\\"mfixReportTo\\\" class=\\\"input\\\" type=\\\"date\\\" value=\\\"'+today+'\\\"></div></div><div id=\\\"mfixReportBody\\\"></div></div><div class=\\\"modal-foot\\\"><button class=\\\"btn btn-outline\\\" onclick=\\\"mfixExportSalesReport()\\\">CSV ייצוא</button><button class=\\\"btn btn-primary\\\" onclick=\\\"mfixRefreshSalesReport()\\\">רענון דוח</button></div></div>';openModal(html,{wide:true});window.mfixRefreshSalesReport();};" +
        "window.mfixRefreshSalesReport=function(){var f=document.getElementById('mfixReportFrom').value,t=document.getElementById('mfixReportTo').value,r=report(f,t),fmt=function(n){return typeof window.money==='function'?window.money(n):'₪'+Number(n||0).toFixed(2);},payRows=Object.keys(r.pay).map(function(k){return '<tr><td>'+esc(k)+'</td><td>'+fmt(r.pay[k])+'</td></tr>';}).join('')||'<tr><td colspan=2>אין נתונים</td></tr>',tops=Object.keys(r.products).map(function(k){return {name:k,qty:r.products[k].qty,total:r.products[k].total};}).sort(function(a,b){return b.total-a.total;}).slice(0,10).map(function(x){return '<tr><td>'+esc(x.name)+'</td><td>'+x.qty+'</td><td>'+fmt(x.total)+'</td></tr>';}).join('')||'<tr><td colspan=3>אין נתונים</td></tr>';document.getElementById('mfixReportBody').innerHTML='<div class=\\\"grid3\\\"><div class=\\\"card\\\"><div class=\\\"muted\\\">מכירות ברוטו</div><div class=\\\"section-title\\\">'+fmt(r.gross)+'</div></div><div class=\\\"card\\\"><div class=\\\"muted\\\">החזרות</div><div class=\\\"section-title\\\">'+fmt(r.returns)+'</div></div><div class=\\\"card\\\"><div class=\\\"muted\\\">נטו / עסקאות / ממוצע</div><div class=\\\"section-title\\\">'+fmt(r.net)+'</div><div class=\\\"muted\\\">'+r.sales.length+' עסקאות | '+fmt(r.sales.length?r.gross/r.sales.length:0)+'</div></div></div><div class=\\\"grid2\\\" style=\\\"margin-top:16px\\\"><div class=\\\"card\\\"><h3 class=\\\"section-title\\\">אמצעי תשלום</h3><table class=\\\"tbl\\\"><thead><tr><th>אמצעי</th><th>סכום</th></tr></thead><tbody>'+payRows+'</tbody></table></div><div class=\\\"card\\\"><h3 class=\\\"section-title\\\">10 מוצרים מובילים</h3><table class=\\\"tbl\\\"><thead><tr><th>מוצר</th><th>כמות</th><th>מכירות</th></tr></thead><tbody>'+tops+'</tbody></table></div></div>';};" +
        "window.mfixExportSalesReport=function(){var f=document.getElementById('mfixReportFrom').value,t=document.getElementById('mfixReportTo').value,r=report(f,t),rows=[['מספר','תאריך','לקוח','סהכ','אמצעי תשלום']];r.sales.forEach(function(s){rows.push([s.number||'',s.date||'',s.manualCustomerName||s.customerName||'',Number(s.total)||0,(s.payments||[]).map(function(p){return (p.method||'')+':'+(Number(p.amount)||0);}).join(' | ')]);});var csv='\\uFEFF'+rows.map(function(row){return row.map(function(v){return '\\\"'+String(v).replace(/\\\"/g,'\\\\\\\"\\\\\\\"')+'\\\"';}).join(',');}).join('\\n'),blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mfix-sales-'+f+'-'+t+'.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);};" +
        "function inject(){var active=document.querySelector('.navtab.active'),label=(active&&active.textContent||'')+' '+((window.STATE&&STATE.activeTab)||'');var existing=document.getElementById('mfixReportsButton');if(/דוח|report/i.test(label)){if(!existing){var host=document.querySelector('.topbar-right');if(host){var b=document.createElement('button');b.id='mfixReportsButton';b.className='btn btn-outline';b.textContent='📊 דוח מכירות';b.onclick=window.mfixOpenSalesReport;host.insertBefore(b,host.firstChild);}}}else if(existing){existing.remove();}}" +
        "document.addEventListener('click',function(){setTimeout(inject,50);});setInterval(inject,700);console.log('[MFIX] sales reports patch active');" +
        "})();";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = ((ViewGroup) findViewById(android.R.id.content)).getChildAt(0);
        if (root instanceof WebView) {
            WebView web = (WebView) root;
            web.postDelayed(() -> {
                web.evaluateJavascript(RETURN_AND_IMPORT_PATCH, null);
                web.evaluateJavascript(CHECKOUT_GUARD_PATCH, null);
                web.evaluateJavascript(REPORTS_PATCH, null);
            }, 1100);
        }
    }
}
