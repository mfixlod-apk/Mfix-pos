/* MFIX inventory low-stock filter. Adds a safe UI filter without changing core inventory logic. */
(function(){
  'use strict';
  const ID='mfix-low-stock-filter-v1';
  let enabled=false;

  function productNameFromRow(row){
    const cell=row && row.children && row.children[1];
    return cell ? String(cell.innerText||'').split('\n')[0].trim() : '';
  }

  function apply(){
    const active=document.querySelector('.view.active');
    if(!active || !/מלאי|מוצרים/.test(active.innerText||'')) return;
    const products=Array.isArray(window.STATE?.products)?window.STATE.products:[];
    const threshold=Number(window.STATE?.settings?.lowStockThreshold ?? 2);
    const byName=new Map(products.map(p=>[String(p.name||'').trim(),p]));
    const tbody=document.getElementById('invTbody');
    if(!tbody) return;
    const rows=[...tbody.children];
    rows.forEach(row=>{
      if(!row.children || row.children.length<8) return;
      const p=byName.get(productNameFromRow(row));
      const qty=p ? (p.trackSerial ? (p.imeis||[]).filter(i=>i.status==='available').length : Number(p.stock||0)) : null;
      row.style.display = enabled && (qty===null || qty>threshold) ? 'none' : '';
      const next=row.nextElementSibling;
      if(next && (!next.children || next.children.length<8) && row.style.display==='none') next.style.display='none';
    });
  }

  function install(){
    const active=document.querySelector('.view.active');
    if(!active || !/מלאי|מוצרים/.test(active.innerText||'')) return;
    if(document.getElementById(ID)) return;
    const buttons=[...active.querySelectorAll('button')];
    const btn=document.createElement('button');
    btn.id=ID;
    btn.className='btn btn-outline';
    btn.type='button';
    btn.textContent='⚠️ מלאי נמוך בלבד';
    btn.onclick=function(){
      enabled=!enabled;
      btn.classList.toggle('btn-amber',enabled);
      btn.classList.toggle('btn-outline',!enabled);
      btn.textContent=enabled?'⚠️ מציג מלאי נמוך':'⚠️ מלאי נמוך בלבד';
      apply();
    };
    const anchor=buttons.find(b=>/עדכון מלאי|ייבוא מלאי|ייצוא|מוצר חדש/.test(b.textContent||''));
    if(anchor && anchor.parentElement) anchor.parentElement.insertBefore(btn,anchor);
    else active.insertBefore(btn,active.firstChild);
  }

  setInterval(function(){ install(); if(enabled) apply(); },900);
  window.mfixInventoryLowStockFilter={apply};
})();
