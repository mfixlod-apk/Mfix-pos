/* MFIX payment attempt history: local audit trail for payment safety states. */
(function(){
  'use strict';
  if(window.__mfixPaymentAttemptHistoryV1)return;
  window.__mfixPaymentAttemptHistoryV1=true;
  const KEY='mfix_payment_attempt_history_v1', MAX=100;
  const load=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(_){return[]}};
  const save=v=>{try{localStorage.setItem(KEY,JSON.stringify(v.slice(0,MAX)));return true}catch(_){return false}};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>Number(v||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});
  const label=s=>({started:'בתהליך',stale:'דורש בדיקה','native-success-signal-observed':'אישור זוהה','native-failure-signal-observed':'כשל/ביטול זוהה'}[s]||String(s||''));
  let last='';
  function capture(){
    const api=window.MFIXPaymentSafety;if(!api||typeof api.getAttempt!=='function')return;
    let d=null;try{d=api.getAttempt()}catch(_){}
    if(!d||!d.status)return;
    const key=[d.startedAt||'',d.updatedAt||'',d.status,d.method,d.amount].join('|');
    if(key===last)return;last=key;
    const rows=load();
    if(rows[0]&&rows[0].key===key)return;
    rows.unshift({key,status:d.status,method:d.method||'',amount:Number(d.amount||0),startedAt:d.startedAt||null,updatedAt:d.updatedAt||new Date().toISOString()});
    save(rows);
  }
  function open(){
    const rows=load();
    const body=rows.length?rows.map(r=>`<div style="padding:9px 0;border-bottom:1px solid #e5e7eb"><b>${esc(label(r.status))}</b> · ${esc(r.method||'—')} · ${money(r.amount)} ₪<div style="font-size:11px;color:#6b7280;margin-top:3px">${r.updatedAt?new Date(r.updatedAt).toLocaleString('he-IL'):''}</div></div>`).join(''):'<div style="padding:18px;text-align:center;color:#6b7280">אין היסטוריית ניסיונות תשלום.</div>';
    const wrap=document.createElement('div');wrap.id='mfix-payment-history-modal';wrap.dir='rtl';wrap.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0008;display:flex;align-items:center;justify-content:center;padding:16px;font:14px Arial';
    wrap.innerHTML=`<div style="width:min(520px,96vw);max-height:85vh;overflow:auto;background:#fff;border-radius:16px;padding:18px"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">היסטוריית ניסיונות תשלום</h3><button class="btn btn-ghost" data-close>×</button></div><div style="margin-top:10px">${body}</div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn btn-outline" data-clear>נקה היסטוריה</button></div></div>`;
    wrap.querySelector('[data-close]').onclick=()=>wrap.remove();
    wrap.querySelector('[data-clear]').onclick=()=>{save([]);wrap.remove();open()};
    wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};
    document.body.appendChild(wrap);
  }
  function installButton(){
    const root=document.getElementById('mfix-pos-800');if(!root)return;
    if(root.querySelector('[data-mfix-payment-history]'))return;
    const host=root.querySelector('#mfix-pos-total-800')?.parentElement||root;
    const b=document.createElement('button');b.type='button';b.className='btn btn-ghost';b.dataset.mfixPaymentHistory='1';b.textContent='🧾 היסטוריית תשלומים';b.style.cssText='margin:0 0 8px;padding:6px 9px;font-size:11px';b.onclick=open;host.prepend(b);
  }
  setInterval(()=>{try{capture();installButton()}catch(_){ }},1000);
  window.mfixPaymentAttemptHistory={load,clear:()=>save([]),open};
})();
