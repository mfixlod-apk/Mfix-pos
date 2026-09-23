/* MFIX reports: sales breakdown by cashier/user.
 * Uses existing cp_sales records only. It never changes sales data.
 */
(function(){
  'use strict';
  const ID='mfix-reports-cashier-breakdown-181';
  const KEY='cp_sales';
  const esc=v=>String(v==null?'':v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const num=v=>{const n=Number(String(v??'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:null};
  const dateOf=s=>{const v=s?.date??s?.Date??s?.createdAt??s?.created_at??s?.timestamp??s?.time??s?.soldAt??s?.saleDate;if(v==null)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d};
  const totalOf=s=>{
    for(const v of [s?.total,s?.Total,s?.grandTotal,s?.grand_total,s?.amount,s?.Amount,s?.sum,s?.totalAmount,s?.total_amount]){const n=num(v);if(n!=null)return n}
    const items=s?.items||s?.products||s?.lines||s?.cart;if(Array.isArray(items)){let sum=0,found=false;for(const it of items){const q=num(it?.qty??it?.quantity??1),p=num(it?.price??it?.unitPrice??it?.unit_price??it?.amount);if(q!=null&&p!=null){sum+=q*p;found=true}}if(found)return sum}return null
  };
  const cashierOf=s=>String(s?.cashierName??s?.cashier_name??s?.cashier??s?.userName??s?.username??s?.user?.name??s?.user?.username??s?.createdByName??s?.created_by_name??s?.createdBy??s?.user??'לא משויך').trim()||'לא משויך';
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x==='object'):[]}catch(_){return[]}};
  const range=active=>{const a=[...active.querySelectorAll('input[type="date"]')];if(a.length<2)return{from:null,to:null};const f=a[0].value?new Date(a[0].value+'T00:00:00'):null,t=a[1].value?new Date(a[1].value+'T00:00:00'):null;if(t)t.setHours(23,59,59,999);return{from:f,to:t}};
  const money=n=>Number(n||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₪';
  function render(){
    const active=document.querySelector('.view.active');if(!active||!/דוחות|דוח|reports/i.test(active.innerText||''))return;
    let box=document.getElementById(ID);if(!box){box=document.createElement('div');box.id=ID;box.style.cssText='margin:12px 0;padding:12px;border:1px solid #dbe4f0;border-radius:12px;background:#f8fafc;direction:rtl';active.appendChild(box)}
    const {from,to}=range(active), rows=read().filter(s=>{const d=dateOf(s);if(!d)return false;if(from&&d<from)return false;if(to&&d>to)return false;return true});
    const groups={};let unknown=0;for(const s of rows){const total=totalOf(s);if(total==null){unknown++;continue}const who=cashierOf(s);if(!groups[who])groups[who]={count:0,total:0};groups[who].count++;groups[who].total+=total}
    const data=Object.entries(groups).sort((a,b)=>b[1].total-a[1].total);const grand=data.reduce((n,[,v])=>n+v.total,0);const count=data.reduce((n,[,v])=>n+v.count,0);
    const body=data.map(([who,v])=>'<tr><td style="padding:7px;border-bottom:1px solid #e5e7eb">'+esc(who)+'</td><td style="padding:7px;text-align:center;border-bottom:1px solid #e5e7eb">'+v.count+'</td><td style="padding:7px;text-align:left;font-weight:800;border-bottom:1px solid #e5e7eb">'+money(v.total)+'</td></tr>').join('');
    box.innerHTML='<div style="font-weight:900;font-size:15px;margin-bottom:6px">👤 מכירות לפי קופאי</div><div style="font-size:12px;color:#64748b;margin-bottom:8px">מבוסס על שדות המשתמש שכבר נשמרו בכל מכירה. אם מכירה ישנה אינה מכילה משתמש, היא מסומנת כ״לא משויך״.</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><span style="background:#fff;padding:6px 9px;border-radius:8px">עסקאות: <b>'+count+'</b></span><span style="background:#fff;padding:6px 9px;border-radius:8px">סה״כ: <b>'+money(grand)+'</b></span>'+(unknown?'<span style="background:#fff7ed;padding:6px 9px;border-radius:8px">ללא סכום: <b>'+unknown+'</b></span>':'')+'</div>'+(body?'<table style="width:100%;border-collapse:collapse;background:#fff"><thead><tr><th style="padding:7px;text-align:right">קופאי</th><th style="padding:7px">עסקאות</th><th style="padding:7px;text-align:left">סה״כ</th></tr></thead><tbody>'+body+'</tbody></table>':'<div style="padding:10px;background:#fff;border-radius:8px;color:#64748b">לא נמצאו מכירות בטווח הנבחר.</div>');
  }
  setInterval(render,1000);render();
  window.mfixRefreshCashierBreakdown=render;
})();
