/* MFIX reports: gross profit estimate from recorded sales and product cost data.
 * Only calculates profit for lines with a known product cost; unknown-cost lines are reported separately.
 * It never changes sales or product data.
 */
(function(){
  'use strict';
  const ID='mfix-reports-gross-profit-001';
  const SALES_KEY='cp_sales';
  const OVERRIDE_KEY='mfix_inventory_product_overrides_v1';
  const esc=v=>String(v==null?'':v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const num=v=>{const n=Number(String(v??'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:null};
  const dateOf=s=>{const v=s?.date??s?.Date??s?.createdAt??s?.created_at??s?.timestamp??s?.time??s?.soldAt??s?.saleDate;if(v==null)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d};
  const totalOf=s=>{
    for(const v of [s?.total,s?.Total,s?.grandTotal,s?.grand_total,s?.amount,s?.Amount,s?.sum,s?.totalAmount,s?.total_amount]){const n=num(v);if(n!=null)return n}
    const items=s?.items||s?.products||s?.lines||s?.cart;if(Array.isArray(items)){let sum=0,found=false;for(const it of items){const q=num(it?.qty??it?.quantity??1),p=num(it?.price??it?.unitPrice??it?.unit_price??it?.amount);if(q!=null&&p!=null){sum+=q*p;found=true}}if(found)return sum}return null
  };
  const readSales=()=>{try{const v=JSON.parse(localStorage.getItem(SALES_KEY)||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x==='object'):[]}catch(_){return[]}};
  const readOverrides=()=>{try{const v=JSON.parse(localStorage.getItem(OVERRIDE_KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(_){return{}}};
  const products=()=>Array.isArray(window.STATE?.products)?window.STATE.products:[];
  const pid=p=>String(p?.id??p?.ID??p?.Id??p?.barcode??p?.Barcode??p?.sku??p?.CatalogNumber??'').trim();
  const productFor=it=>{const id=String(it?.productId??it?.id??it?.product?.id??'').trim(),bar=String(it?.barcode??it?.Barcode??it?.product?.barcode??'').trim();return products().find(p=>{const x=pid(p),b=String(p?.barcode??p?.Barcode??'').trim();return(id&&x===id)||(bar&&b===bar)})||null};
  const costFor=(it,p,ov)=>{const id=p?pid(p):String(it?.productId??it?.id??'').trim();const o=id?ov[id]:null;for(const v of [it?.cost,it?.purchaseCost,it?.unitCost,it?.costPrice,o?.cost,p?.cost,p?.Cost,p?.purchaseCost,p?.PurchaseCost]){const n=num(v);if(n!=null&&n>=0)return n}return null};
  const priceFor=it=>{for(const v of [it?.price,it?.unitPrice,it?.unit_price,it?.amount]){const n=num(v);if(n!=null)return n}return null};
  const qtyFor=it=>{const n=num(it?.qty??it?.quantity??1);return n!=null&&n>0?n:1};
  const itemsOf=s=>{const v=s?.items||s?.products||s?.lines||s?.cart;return Array.isArray(v)?v:[]};
  const range=active=>{const a=[...active.querySelectorAll('input[type="date"]')];if(a.length<2)return{from:null,to:null};const f=a[0].value?new Date(a[0].value+'T00:00:00'):null,t=a[1].value?new Date(a[1].value+'T00:00:00'):null;if(t)t.setHours(23,59,59,999);return{from:f,to:t}};
  const money=n=>Number(n||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₪';
  function render(){
    const active=document.querySelector('.view.active');if(!active||!/דוחות|דוח|reports/i.test(active.innerText||''))return;
    let box=document.getElementById(ID);if(!box){box=document.createElement('div');box.id=ID;box.style.cssText='margin:12px 0;padding:12px;border:1px solid #dbe4f0;border-radius:12px;background:#f8fafc;direction:rtl';active.appendChild(box)}
    const {from,to}=range(active),ov=readOverrides();let revenue=0,cost=0,known=0,unknown=0,profitLines=0;
    const rows=readSales().filter(s=>{const d=dateOf(s);if(!d)return false;if(from&&d<from)return false;if(to&&d>to)return false;return true});
    for(const s of rows){const its=itemsOf(s);if(!its.length){const t=totalOf(s);if(t!=null)revenue+=t;continue}for(const it of its){const q=qtyFor(it),price=priceFor(it),p=productFor(it),c=costFor(it,p,ov);if(price!=null)revenue+=price*q;if(c==null||price==null){unknown+=q;continue}cost+=c*q;known+=q;profitLines++;}}
    const gross=revenue-cost,margin=revenue>0?(gross/revenue)*100:0;
    box.innerHTML=`<div style="font-weight:900;font-size:15px;margin-bottom:6px">📈 רווח גולמי משוער</div><div style="font-size:12px;color:#64748b;margin-bottom:8px">החישוב משתמש רק במכירות שנשמרו ובמחירי עלות שנמצאו בנתוני המוצר/override המקומי. הוא אינו כולל עמלות סליקה, מסים, שכירות או הוצאות אחרות.</div><div style="display:flex;gap:8px;flex-wrap:wrap"><span style="background:#fff;padding:7px 10px;border-radius:8px">מחזור: <b>${money(revenue)}</b></span><span style="background:#fff;padding:7px 10px;border-radius:8px">עלות ידועה: <b>${money(cost)}</b></span><span style="background:#fff;padding:7px 10px;border-radius:8px">רווח גולמי: <b>${money(gross)}</b></span><span style="background:#fff;padding:7px 10px;border-radius:8px">שיעור רווח: <b>${margin.toFixed(1)}%</b></span><span style="background:#fff;padding:7px 10px;border-radius:8px">שורות עם עלות: <b>${profitLines}</b></span>${unknown?`<span style="background:#fff7ed;padding:7px 10px;border-radius:8px">כמות ללא עלות: <b>${unknown}</b></span>`:''}</div>`;
  }
  setInterval(render,1000);render();
  window.mfixRefreshGrossProfit=render;
})();
