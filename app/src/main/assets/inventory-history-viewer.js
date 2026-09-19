/* MFIX inventory stock-history viewer. Read-only UI over STATE.inventoryHistory. */
(function(){
  'use strict';
  const ID='mfix-inventory-history-viewer-v1';
  const state=()=>window.STATE||{};
  const products=()=>Array.isArray(state().products)?state().products:[];
  const history=()=>Array.isArray(state().inventoryHistory)?state().inventoryHistory:[];
  const productName=id=>{const p=products().find(x=>String(x?.id??x?.ID??'')===String(id));return p?.name||p?.Name||String(id||'');};
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function open(){
    document.getElementById(ID)?.remove();
    const rows=history().slice().sort((a,b)=>new Date(b?.at||0)-new Date(a?.at||0));
    const d=document.createElement('div'); d.id=ID; d.dir='rtl';
    d.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#0008;display:flex;align-items:center;justify-content:center;padding:14px;font:14px Arial';
    const trs=rows.map(h=>`<tr><td>${esc(h?.at?new Date(h.at).toLocaleString('he-IL'):'')}</td><td>${esc(productName(h?.productId))}</td><td>${esc(h?.type||'')}</td><td>${esc(h?.qty??'')}</td><td>${esc(h?.before??'')}</td><td>${esc(h?.after??'')}</td><td>${esc(h?.reason||'')}</td></tr>`).join('');
    d.innerHTML=`<div style="width:min(1100px,98vw);max-height:92vh;background:#fff;border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px #0008"><div style="padding:15px 18px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between"><div><div style="font-size:19px;font-weight:900">📋 היסטוריית מלאי</div><div style="font-size:12px;color:#667085;margin-top:3px">${rows.length} תנועות מלאי</div></div><button id="${ID}-close" class="btn btn-outline">סגור</button></div><div style="overflow:auto;padding:10px 14px"><table class="tbl" style="min-width:780px"><thead><tr><th>תאריך</th><th>מוצר</th><th>סוג פעולה</th><th>כמות</th><th>לפני</th><th>אחרי</th><th>סיבה</th></tr></thead><tbody>${trs||'<tr><td colspan="7" style="text-align:center;padding:30px">אין תנועות מלאי להצגה</td></tr>'}</tbody></table></div></div>`;
    document.documentElement.appendChild(d); d.querySelector('#'+ID+'-close').onclick=()=>d.remove();
  }
  function install(){
    const active=document.querySelector('.view.active');
    if(!active || !/מלאי|מוצרים/.test(active.innerText||'')) return;
    if(active.querySelector('[data-mfix-history-viewer]')) return;
    const btn=document.createElement('button'); btn.type='button'; btn.className='btn btn-outline'; btn.dataset.mfixHistoryViewer='1'; btn.textContent='📋 היסטוריית מלאי'; btn.onclick=open;
    const exportBtn=active.querySelector('[data-mfix-inventory-export="1"]');
    if(exportBtn?.parentElement) exportBtn.parentElement.appendChild(btn); else active.insertBefore(btn,active.firstChild);
  }
  setInterval(install,700);
  window.mfixInventoryHistoryViewer={open};
})();
