/* MFIX payment attempt history CSV export. Local-only; exports the audit trail already kept by payment-attempt-history.js. */
(function(){
  'use strict';
  if(window.__mfixPaymentHistoryExportV1)return;
  window.__mfixPaymentHistoryExportV1=true;
  const KEY='mfix_payment_attempt_history_v1';
  const load=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(_){return[]}};
  const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const money=v=>Number(v||0).toFixed(2);
  function csv(){
    const rows=load();
    const out=[['סטטוס','אמצעי תשלום','סכום','התחלה','עדכון']];
    for(const r of rows) out.push([
      r.status||'',r.method||'',money(r.amount),r.startedAt||'',r.updatedAt||''
    ]);
    return '\uFEFF'+out.map(row=>row.map(esc).join(',')).join('\r\n');
  }
  function download(){
    const rows=load();
    if(!rows.length){try{if(typeof toast==='function')toast('אין היסטוריית תשלומים לייצוא','err')}catch(_){}return;}
    const blob=new Blob([csv()],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='mfix-payment-history-'+new Date().toISOString().slice(0,10)+'.csv';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    try{if(typeof toast==='function')toast('היסטוריית התשלומים יוצאה ל-CSV','ok')}catch(_){}
  }
  function install(){
    const root=document.getElementById('mfix-payment-history-modal');
    if(!root||root.querySelector('[data-mfix-payment-export]'))return;
    const host=root.querySelector('.modal-foot')||root.querySelector('div > div:last-child');
    if(!host)return;
    const b=document.createElement('button');
    b.type='button';b.className='btn btn-outline';b.dataset.mfixPaymentExport='1';
    b.textContent='⬇️ ייצוא CSV';b.onclick=download;
    host.prepend(b);
  }
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('[data-mfix-payment-history]'))setTimeout(install,40);
  });
  setInterval(()=>{try{install()}catch(_){ }},800);
  window.mfixPaymentHistoryExport={download,csv,load};
})();
