/* MFIX reports payment breakdown.
 * Reads the existing cp_sales dataset and adds a transparent payment-method
 * summary to the active Reports view. It never changes sale records or totals.
 */
(function(){
  'use strict';
  const ID='mfix-reports-payment-breakdown-180';
  const KEY='cp_sales';

  const esc=v=>String(v==null?'':v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const num=v=>{
    if(typeof v==='number'&&Number.isFinite(v))return v;
    const n=Number(String(v??'').replace(/[^0-9.-]/g,''));
    return Number.isFinite(n)?n:null;
  };
  const dateOf=s=>{
    const v=s?.date??s?.Date??s?.createdAt??s?.created_at??s?.created??s?.timestamp??s?.time??s?.soldAt??s?.saleDate;
    if(v==null)return null;
    const d=new Date(v);
    return Number.isNaN(d.getTime())?null:d;
  };
  const totalOf=s=>{
    const direct=[s?.total,s?.Total,s?.grandTotal,s?.grand_total,s?.amount,s?.Amount,s?.sum,s?.totalAmount,s?.total_amount];
    for(const v of direct){const n=num(v);if(n!=null)return n;}
    const items=s?.items||s?.products||s?.lines||s?.cart;
    if(Array.isArray(items)){
      let sum=0,found=false;
      for(const it of items){
        const q=num(it?.qty??it?.quantity??1);
        const p=num(it?.price??it?.unitPrice??it?.unit_price??it?.amount);
        if(q!=null&&p!=null){sum+=q*p;found=true;}
      }
      if(found)return sum;
    }
    return null;
  };
  const methodOf=s=>String(s?.paymentMethod??s?.payment_method??s?.payment??s?.method??s?.payMethod??s?.pay_method??s?.payments?.[0]?.method??'לא ידוע').trim()||'לא ידוע';
  const readSales=()=>{
    try{const raw=localStorage.getItem(KEY);const v=raw?JSON.parse(raw):[];return Array.isArray(v)?v.filter(x=>x&&typeof x==='object'):[];}catch(_){return []}
  };
  const parseDateInput=v=>{if(!v)return null;const d=new Date(v+'T00:00:00');return Number.isNaN(d.getTime())?null:d;};
  const findRange=active=>{
    const inputs=[...active.querySelectorAll('input[type="date"]')];
    if(inputs.length<2)return {from:null,to:null};
    const a=parseDateInput(inputs[0].value),b=parseDateInput(inputs[1].value);
    return {from:a,to:b};
  };
  const money=n=>Number(n||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₪';

  function render(){
    const active=document.querySelector('.view.active');
    if(!active || !/דוחות|דוח|reports/i.test(active.innerText||''))return false;
    let box=document.getElementById(ID);
    if(!box){
      box=document.createElement('div');box.id=ID;
      box.style.cssText='margin:12px 0;padding:12px;border:1px solid #dbe4f0;border-radius:12px;background:#f8fafc;direction:rtl';
      active.insertBefore(box,active.firstChild);
    }
    const sales=readSales();
    const range=findRange(active);
    const filtered=sales.filter(s=>{
      const d=dateOf(s);
      if(!d)return false;
      if(range.from && d<range.from)return false;
      if(range.to){const end=new Date(range.to);end.setHours(23,59,59,999);if(d>end)return false;}
      return true;
    });
    const source=filtered.length||range.from||range.to?filtered:sales;
    const by={};let grand=0,count=0,unknownTotal=0;
    for(const s of source){
      const total=totalOf(s);
      if(total==null){unknownTotal++;continue;}
      const method=methodOf(s);
      by[method]=(by[method]||0)+total;
      grand+=total;count++;
    }
    const rows=Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([m,v])=>'<tr><td style="padding:6px;border-bottom:1px solid #e5e7eb">'+esc(m)+'</td><td style="padding:6px;border-bottom:1px solid #e5e7eb;text-align:left;font-weight:800">'+money(v)+'</td></tr>').join('');
    box.innerHTML='<div style="font-weight:900;font-size:15px;margin-bottom:6px">💳 סיכום לפי אמצעי תשלום</div>'+
      '<div style="font-size:12px;color:#64748b;margin-bottom:8px">מבוסס על רשומות המכירה הקיימות ב-MFIX. לא מתבצעת כתיבה לנתוני המכירות.</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><span style="background:#fff;padding:6px 9px;border-radius:8px">עסקאות: <b>'+count+'</b></span><span style="background:#fff;padding:6px 9px;border-radius:8px">סה״כ: <b>'+money(grand)+'</b></span>'+(unknownTotal?'<span style="background:#fff7ed;padding:6px 9px;border-radius:8px">ללא סכום מזוהה: <b>'+unknownTotal+'</b></span>':'')+'</div>'+ 
      (rows?'<table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden"><thead><tr><th style="padding:6px;text-align:right">אמצעי תשלום</th><th style="padding:6px;text-align:left">סכום</th></tr></thead><tbody>'+rows+'</tbody></table>':'<div style="padding:10px;background:#fff;border-radius:8px;color:#64748b">לא נמצאו עסקאות עם סכום ותאריך שניתן לזהות.</div>');
    return true;
  }

  let timer=null;
  const install=()=>{if(render()){} if(!timer)timer=setTimeout(()=>{timer=null;install()},1200)};
  new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
  install();
  window.mfixRefreshPaymentBreakdown=render;
})();
