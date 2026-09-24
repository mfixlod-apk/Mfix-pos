/* MFIX inventory serial/IMEI editor: local, validated overrides for serialized stock. */
(function(){
  'use strict';
  const ID='mfix-serial-imei-editor-v2', KEY='mfix_inventory_product_overrides_v1';
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(_){return {}}};
  const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v));return true}catch(_){return false}};
  const products=()=>Array.isArray(window.STATE?.products)?window.STATE.products:[];
  const pid=p=>String(p?.id??p?.ID??p?.Id??p?.barcode??p?.Barcode??p?.sku??p?.CatalogNumber??'').trim();
  const name=(p,o)=>String(o?.name!==undefined?o.name:(p?.name??p?.Name??p?.ProductName??p?.Description??'')).trim();
  const validImei=v=>{
    const s=String(v||'').replace(/\s+/g,'');
    if(!/^\d{15}$/.test(s))return false;
    let sum=0;
    for(let i=0;i<15;i++){
      let n=Number(s[i]);
      if(i%2===1){n*=2;if(n>9)n-=9;}
      sum+=n;
    }
    return sum%10===0;
  };
  const validateIdentifier=(type,value)=>{
    const v=String(value||'').trim();
    if(!v)return 'יש להזין IMEI / Serial';
    if(String(type||'').toUpperCase()==='IMEI' && !validImei(v))return 'IMEI חייב להכיל 15 ספרות ולעבור בדיקת ספרת ביקורת';
    return '';
  };
  function items(p,o){
    const base=[];
    if(Array.isArray(p?.imeis)) base.push(...p.imeis.map(x=>({type:'IMEI',value:typeof x==='string'?x:(x?.value||x?.imei||''),status:typeof x==='string'?'available':(x?.status||'available')})));
    if(Array.isArray(p?.serials)) base.push(...p.serials.map(x=>({type:'Serial',value:typeof x==='string'?x:(x?.value||x?.serial||''),status:typeof x==='string'?'available':(x?.status||'available')})));
    const extra=Array.isArray(o?.serializedItems)?o.serializedItems:[];
    return base.concat(extra).filter(x=>String(x?.value||'').trim()).map(x=>({type:String(x.type||'IMEI/Serial'),value:String(x.value).trim(),status:String(x.status||'available')}));
  }
  function allRows(){const ov=read(),rows=[];for(const p of products()){const id=pid(p),o=ov[id]||{};if(!id||!p?.trackSerial)continue;items(p,o).forEach((x,i)=>rows.push({p,id,name:name(p,o),index:i,...x}));}return rows}
  function duplicate(value,ignore){const q=String(value||'').trim().toLowerCase();if(!q)return false;return allRows().some(r=>r.value.toLowerCase()===q && !(r.id===ignore.id&&r.index===ignore.index));}
  function save(row,value,status){
    const v=String(value||'').trim();
    const validation=validateIdentifier(row.type,v);
    if(validation){alert(validation);return false}
    if(duplicate(v,row)){alert('ה־IMEI / Serial כבר קיים במלאי');return false}
    const ov=read(),o=ov[row.id]||{};
    let arr=Array.isArray(o.serializedItems)?o.serializedItems:[];
    const baseCount=(Array.isArray(row.p.imeis)?row.p.imeis.length:0)+(Array.isArray(row.p.serials)?row.p.serials.length:0);
    if(row.index<baseCount){
      const base=[]; if(Array.isArray(row.p.imeis)) base.push(...row.p.imeis.map(x=>typeof x==='string'?{type:'IMEI',value:x,status:'available'}:{type:'IMEI',value:x?.value||x?.imei||'',status:x?.status||'available'})); if(Array.isArray(row.p.serials)) base.push(...row.p.serials.map(x=>typeof x==='string'?{type:'Serial',value:x,status:'available'}:{type:'Serial',value:x?.value||x?.serial||'',status:x?.status||'available'}));
      base[row.index]={type:row.type,value:v,status}; o.serializedItems=base.concat(arr);
    } else {const j=row.index-baseCount;arr=[...arr];arr[j]={type:row.type,value:v,status};o.serializedItems=arr;}
    ov[row.id]=o;return write(ov);
  }
  function open(){
    const rows=allRows(); document.getElementById(ID)?.remove();
    const wrap=document.createElement('div');wrap.id=ID;wrap.dir='rtl';wrap.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0008;display:flex;align-items:center;justify-content:center;padding:16px;font:14px Arial';
    const box=document.createElement('div');box.style.cssText='background:#fff;color:#111;width:min(900px,96vw);max-height:90vh;overflow:auto;border-radius:16px;padding:18px';
    box.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><div><b style="font-size:19px">✏️ עריכת IMEI / Serial</b><div style="font-size:12px;color:#667085;margin-top:4px">השינויים נשמרים מקומית במכשיר. כפילויות נחסמות; IMEI נבדק לפי ספרת הביקורת.</div></div><button id="mfix-se-close" type="button">✕</button></div><div id="mfix-se-body" style="margin-top:14px"></div>';
    wrap.appendChild(box);document.body.appendChild(wrap);
    const body=box.querySelector('#mfix-se-body');
    if(!rows.length){body.innerHTML='<div style="padding:24px;text-align:center">אין כרגע פריטי IMEI / Serial לעריכה.</div>';return}
    body.innerHTML='<table style="width:100%;border-collapse:collapse"><thead><tr><th>מוצר</th><th>סוג</th><th>IMEI / Serial</th><th>סטטוס</th><th></th></tr></thead><tbody>'+rows.map((r,i)=>`<tr data-i="${i}"><td>${String(r.name).replace(/[&<>]/g,'')}</td><td>${r.type}</td><td><input data-value style="width:100%;box-sizing:border-box" value="${String(r.value).replace(/[&<>\"]/g,'')}"></td><td><select data-status><option value="available" ${r.status==='available'?'selected':''}>available</option><option value="sold" ${r.status==='sold'?'selected':''}>sold</option><option value="reserved" ${r.status==='reserved'?'selected':''}>reserved</option><option value="repair" ${r.status==='repair'?'selected':''}>repair</option></select></td><td><button data-save type="button">💾</button></td></tr>`).join('')+'</tbody></table>';
    body.querySelectorAll('[data-save]').forEach(btn=>btn.onclick=()=>{const tr=btn.closest('tr'),r=rows[Number(tr.dataset.i)],v=tr.querySelector('[data-value]').value,s=tr.querySelector('[data-status]').value;if(save(r,v,s)){r.value=v;r.status=s;if(typeof window.toast==='function')window.toast('IMEI / Serial עודכן ✓',1800)}});
    box.querySelector('#mfix-se-close').onclick=()=>wrap.remove();wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.remove()});
  }
  function install(){const active=document.querySelector('.view.active');if(!active||!/מלאי|מוצרים/.test(active.innerText||''))return;if(active.querySelector('[data-mfix-serial-editor]'))return;const b=document.createElement('button');b.type='button';b.dataset.mfixSerialEditor='1';b.className='btn btn-outline';b.textContent='✏️ עריכת IMEI / Serial';b.onclick=open;const anchor=[...active.querySelectorAll('button')].find(x=>/IMEI|Serial/.test(x.textContent||''));if(anchor?.parentElement)anchor.parentElement.appendChild(b);else active.insertBefore(b,active.firstChild)}
  setInterval(install,900);window.mfixEditSerialImei=open;
})();
