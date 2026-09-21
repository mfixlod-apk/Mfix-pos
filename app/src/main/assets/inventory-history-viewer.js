/* MFIX inventory stock-history viewer. Read-only UI over STATE.inventoryHistory. */
(function(){
  'use strict';
  const ID='mfix-inventory-history-viewer-v2';
  const state=()=>window.STATE||{};
  const products=()=>Array.isArray(state().products)?state().products:[];
  const history=()=>Array.isArray(state().inventoryHistory)?state().inventoryHistory:[];
  const productName=id=>{const p=products().find(x=>String(x?.id??x?.ID??'')===String(id));return p?.name||p?.Name||String(id||'');};
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  // Use the device's local calendar date for filtering. ISO/UTC conversion can
  // move a late-night local transaction into the adjacent calendar day.
  const dateKey=d=>{const x=new Date(d);if(Number.isNaN(x.getTime()))return '';const p=n=>String(n).padStart(2,'0');return x.getFullYear()+'-'+p(x.getMonth()+1)+'-'+p(x.getDate());};
  function open(){
    document.getElementById(ID)?.remove();
    const all=history().slice().sort((a,b)=>new Date(b?.at||0)-new Date(a?.at||0));
    const productOptions=[...new Set(all.map(h=>productName(h?.productId)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'he')).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
    const typeOptions=[...new Set(all.map(h=>String(h?.type||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'he')).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
    const d=document.createElement('div'); d.id=ID; d.dir='rtl';
    d.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#0008;display:flex;align-items:center;justify-content:center;padding:14px;font:14px Arial';
    d.innerHTML=`<div style="width:min(1100px,98vw);max-height:92vh;background:#fff;border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px #0008"><div style="padding:15px 18px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between"><div><div style="font-size:19px;font-weight:900">📋 היסטוריית מלאי</div><div id="${ID}-count" style="font-size:12px;color:#667085;margin-top:3px"></div></div><button id="${ID}-close" class="btn btn-outline">סגור</button></div><div style="padding:10px 14px;border-bottom:1px solid #e5e7eb;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px"><label>מוצר<select id="${ID}-product" class="input" style="width:100%"><option value="">כל המוצרים</option>${productOptions}</select></label><label>סוג פעולה<select id="${ID}-type" class="input" style="width:100%"><option value="">כל הסוגים</option>${typeOptions}</select></label><label>מתאריך<input id="${ID}-from" class="input" type="date" style="width:100%"></label><label>עד תאריך<input id="${ID}-to" class="input" type="date" style="width:100%"></label></div><div style="overflow:auto;padding:10px 14px"><table class="tbl" style="min-width:780px"><thead><tr><th>תאריך</th><th>מוצר</th><th>סוג פעולה</th><th>כמות</th><th>לפני</th><th>אחרי</th><th>סיבה</th></tr></thead><tbody id="${ID}-tbody"></tbody></table></div></div>`;
    document.documentElement.appendChild(d);
    const render=()=>{
      const product=d.querySelector('#'+ID+'-product').value;
      const type=d.querySelector('#'+ID+'-type').value;
      const from=d.querySelector('#'+ID+'-from').value;
      const to=d.querySelector('#'+ID+'-to').value;
      const rows=all.filter(h=>{const n=productName(h?.productId),t=String(h?.type||'').trim(),day=dateKey(h?.at);return (!product||n===product)&&(!type||t===type)&&(!from||day>=from)&&(!to||day<=to);});
      d.querySelector('#'+ID+'-count').textContent=`${rows.length} מתוך ${all.length} תנועות מלאי`;
      d.querySelector('#'+ID+'-tbody').innerHTML=rows.map(h=>`<tr><td>${esc(h?.at?new Date(h.at).toLocaleString('he-IL'):'')}</td><td>${esc(productName(h?.productId))}</td><td>${esc(h?.type||'')}</td><td>${esc(h?.qty??'')}</td><td>${esc(h?.before??'')}</td><td>${esc(h?.after??'')}</td><td>${esc(h?.reason||'')}</td></tr>`).join('')||'<tr><td colspan="7" style="text-align:center;padding:30px">אין תנועות התואמות לסינון</td></tr>';
    };
    d.querySelector('#'+ID+'-close').onclick=()=>d.remove();
    d.querySelectorAll('select,input').forEach(el=>el.addEventListener('change',render));
    render();
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
