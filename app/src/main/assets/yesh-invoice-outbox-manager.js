(()=>{
  if(window.__MFIX_YI_OUTBOX_MANAGER_1__) return;
  window.__MFIX_YI_OUTBOX_MANAGER_1__=1;
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const api=()=>window.mfixYeshInvoiceOutbox;
  function show(){
    const q=api();
    if(!q||typeof q.list!=='function') return;
    const items=q.list();
    const ov=document.getElementById('modalOverlay');
    if(!ov) return;
    const rows=items.length?items.map(x=>{
      const p=x&&x.payload||{};
      const total=Number(p.total||0).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2});
      return '<div style="padding:10px 0;border-bottom:1px solid #e5e7eb">'+
        '<div style="font-weight:800">'+esc(p.customerName||'לקוח ללא שם')+' · '+total+' ₪</div>'+
        '<div class="muted" style="font-size:11px">'+esc(x.createdAt||'')+' · ניסיונות: '+Number(x.attempts||0)+'</div>'+ 
        (x.lastError?'<div style="color:#dc2626;font-size:11px;margin-top:3px">'+esc(x.lastError)+'</div>':'')+
        '<div style="display:flex;gap:6px;margin-top:7px"><button type="button" class="btn btn-outline mfix-yi-copy" data-id="'+esc(x.id)+'">העתק JSON</button><button type="button" class="btn btn-red mfix-yi-remove" data-id="'+esc(x.id)+'">הסר</button></div>'+
      '</div>';
    }).join(''):'<div class="empty-state"><div class="ic">🧾</div>אין מסמכים ממתינים</div>';
    ov.innerHTML='<div class="modal wide"><div class="modal-head"><h3>🧾 תור יש חשבונית</h3><button class="modal-close" type="button" id="mfixYiOutboxClose">✕</button></div><div class="modal-body"><div class="muted" style="margin-bottom:10px">המסמכים כאן נשמרו מקומית וממתינים למחבר API מאושר. לא מתבצעת שליחה אוטומטית מתוך המסך הזה.</div>'+rows+'</div><div class="modal-foot"><button type="button" class="btn btn-ghost" id="mfixYiOutboxClose2">סגור</button></div></div>';
    ov.classList.add('active');
    const close=()=>ov.classList.remove('active');
    document.getElementById('mfixYiOutboxClose')?.addEventListener('click',close);
    document.getElementById('mfixYiOutboxClose2')?.addEventListener('click',close);
    ov.querySelectorAll('.mfix-yi-remove').forEach(b=>b.addEventListener('click',()=>{q.remove(b.dataset.id);show();}));
    ov.querySelectorAll('.mfix-yi-copy').forEach(b=>b.addEventListener('click',async()=>{
      const item=q.list().find(x=>x&&x.id===b.dataset.id); if(!item)return;
      const text=JSON.stringify(item.payload,null,2);
      try{await navigator.clipboard.writeText(text);if(typeof toast==='function')toast('ה־payload הועתק','ok');}
      catch(_){window.prompt('העתק את ה־payload',text);}
    }));
  }
  function addButton(){
    const anchor=document.getElementById('mfixYeshInvoiceButton');
    if(!anchor||document.getElementById('mfixYiOutboxButton')) return;
    const b=document.createElement('button');
    b.id='mfixYiOutboxButton'; b.type='button'; b.className='btn btn-outline';
    b.textContent='🧾 תור יש חשבונית'; b.onclick=show;
    anchor.parentNode?.insertBefore(b,anchor.nextSibling);
  }
  addButton();
  setInterval(addButton,1000);
})();
