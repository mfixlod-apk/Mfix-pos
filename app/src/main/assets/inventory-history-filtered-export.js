/* MFIX filtered inventory-history export. Read-only export of the active history filters. */
(function(){
'use strict';
if(window.__mfixInventoryFilteredExport)return;
window.__mfixInventoryFilteredExport=true;
const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
const state=()=>window.STATE||{};
const products=()=>Array.isArray(state().products)?state().products:[];
const history=()=>Array.isArray(state().inventoryHistory)?state().inventoryHistory:[];
const productName=id=>{const key=String(id??'').trim(),p=products().find(x=>[x?.id,x?.ID,x?.Id,x?.barcode,x?.Barcode,x?.sku,x?.CatalogNumber].some(v=>String(v??'').trim()===key));return p?.name||p?.Name||p?.ProductName||p?.Description||key};
const day=d=>{const x=new Date(d);if(Number.isNaN(x.getTime()))return '';const p=n=>String(n).padStart(2,'0');return x.getFullYear()+'-'+p(x.getMonth()+1)+'-'+p(x.getDate())};
function exportFiltered(){
 const modal=document.getElementById('mfix-inventory-history-viewer-v3');
 if(!modal){if(window.toast)window.toast('פתח קודם את היסטוריית המלאי','err');return;}
 const product=modal.querySelector('#mfix-inventory-history-viewer-v3-product')?.value||'';
 const type=modal.querySelector('#mfix-inventory-history-viewer-v3-type')?.value||'';
 const from=modal.querySelector('#mfix-inventory-history-viewer-v3-from')?.value||'';
 const to=modal.querySelector('#mfix-inventory-history-viewer-v3-to')?.value||'';
 const rows=history().filter(h=>{const n=productName(h?.productId),t=String(h?.type||'').trim(),d=day(h?.at);return(!product||n===product)&&(!type||t===type)&&(!from||d>=from)&&(!to||d<=to)});
 const out=[['תאריך','מוצר','סוג פעולה','כמות','לפני','אחרי','סיבה'],...rows.map(h=>[h?.at?new Date(h.at).toLocaleString('he-IL'):'',productName(h?.productId),h?.type||'',h?.qty??'',h?.before??'',h?.after??'',h?.reason||''])];
 const csv='\ufeff'+out.map(r=>r.map(esc).join(',')).join('\r\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='mfix-inventory-history-filtered-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200);if(window.toast)window.toast('הייצוא כלל '+rows.length+' תנועות','ok');
}
function install(){const modal=document.getElementById('mfix-inventory-history-viewer-v3');if(!modal||modal.querySelector('[data-mfix-filtered-history-export]'))return;const close=modal.querySelector('#mfix-inventory-history-viewer-v3-close');const b=document.createElement('button');b.type='button';b.dataset.mfixFilteredHistoryExport='1';b.className='btn btn-outline';b.textContent='⬇️ ייצוא לפי סינון';b.onclick=exportFiltered;if(close?.parentElement)close.parentElement.insertBefore(b,close);else modal.querySelector('div')?.appendChild(b)}
setInterval(install,700);window.mfixExportFilteredInventoryHistory=exportFiltered;
})();
