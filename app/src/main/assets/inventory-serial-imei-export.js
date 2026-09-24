/* MFIX inventory serial/IMEI export. Read-only export of serialized inventory. */
(function(){
  'use strict';
  const ID='mfix-serial-imei-export-v2', KEY='mfix_inventory_product_overrides_v1';
  const esc=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(_){return {}}};
  const pid=p=>String(p?.id??p?.ID??p?.Id??p?.barcode??p?.Barcode??p?.sku??p?.CatalogNumber??'').trim();
  const pname=(p,o)=>String(o?.name!==undefined?o.name:(p?.name??p?.Name??p?.ProductName??p?.Description??'')).trim();
  function baseItems(p){
    const out=[];
    if(Array.isArray(p?.imeis))out.push(...p.imeis.map(x=>({type:'IMEI',value:typeof x==='string'?x:(x?.value||x?.imei||''),status:typeof x==='string'?'available':(x?.status||'available')})));
    if(Array.isArray(p?.serials))out.push(...p.serials.map(x=>({type:'Serial',value:typeof x==='string'?x:(x?.value||x?.serial||''),status:typeof x==='string'?'available':(x?.status||'available')})));
    return out;
  }
  function rows(){
    const state=window.STATE,ov=read();
    if(!state||!Array.isArray(state.products))return null;
    const rows=[['מוצר','מק״ט','סוג','IMEI/Serial','סטטוס']];
    state.products.forEach(p=>{
      if(!p||!p.trackSerial)return;
      const id=pid(p),o=ov[id]||{},items=baseItems(p).concat(Array.isArray(o.serializedItems)?o.serializedItems:[]).filter(x=>String(x?.value||'').trim());
      if(!items.length)rows.push([pname(p,o),p.sku||id,'IMEI/Serial','','אין רשומות']);
      items.forEach(x=>rows.push([pname(p,o),p.sku||id,String(x.type||'IMEI/Serial'),String(x.value).trim(),String(x.status||'available')]));
    });
    return rows;
  }
  function download(){
    const data=rows();
    if(!data){if(typeof window.toast==='function')window.toast('המלאי אינו זמין','err');return;}
    if(data.length===1){if(typeof window.toast==='function')window.toast('לא נמצאו מוצרים סריאליים/IMEI','err');return;}
    const csv='\ufeff'+data.map(r=>r.map(esc).join(',')).join('\r\n'),blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='mfix-serial-imei-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    if(typeof window.toast==='function')window.toast(`רשימת IMEI/Serial יוצאה ל-CSV (${data.length-1} רשומות)`,`ok`);
  }
  function install(){
    const active=document.querySelector('.view.active');
    if(!active||!/מלאי|מוצרים/.test(active.innerText||''))return;
    if(active.querySelector('[data-mfix-serial-imei-export]'))return;
    const btn=document.createElement('button');btn.type='button';btn.dataset.mfixSerialImeiExport='1';btn.className='btn btn-outline';btn.textContent='📱 ייצוא IMEI / Serial';btn.onclick=download;
    const anchor=[...active.querySelectorAll('button')].find(b=>/היסטוריה|ייצוא|ייבוא/.test(b.textContent||''));
    if(anchor?.parentElement)anchor.parentElement.appendChild(btn);else active.insertBefore(btn,active.firstChild);
  }
  setInterval(install,800);window.mfixExportSerialImei=download;
})();
