(()=>{
  if(window.__MFIX_YI_OUTBOX_EXPORT_1__) return;
  window.__MFIX_YI_OUTBOX_EXPORT_1__=1;

  const download=(name,text,type='application/json;charset=utf-8')=>{
    const blob=new Blob([text],{type});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=name;a.style.display='none';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  const api=()=>window.mfixYeshInvoiceOutbox;
  const stamp=()=>new Date().toISOString().replace(/[:.]/g,'-');

  function exportAll(){
    const q=api();
    if(!q||typeof q.list!=='function') return;
    const items=q.list();
    if(!items.length){
      if(typeof window.toast==='function') window.toast('אין מסמכים ממתינים לייצוא','err');
      return;
    }
    const payload={
      source:'MFIX POS',
      exportedAt:new Date().toISOString(),
      count:items.length,
      items:items.map(x=>({
        id:x?.id||'',createdAt:x?.createdAt||'',status:x?.status||'pending',
        attempts:Number(x?.attempts||0),lastAttemptAt:x?.lastAttemptAt||'',
        lastError:x?.lastError||'',payload:x?.payload||null
      }))
    };
    download(`mfix-yesh-invoice-outbox-${stamp()}.json`,JSON.stringify(payload,null,2));
    if(typeof window.toast==='function') window.toast(`יוצאו ${items.length} מסמכים לתיקיית ההורדות`,'ok');
  }

  function inject(){
    const ov=document.getElementById('modalOverlay');
    if(!ov||!ov.classList.contains('active')) return;
    const modal=ov.querySelector('.modal');
    if(!modal||modal.querySelector('#mfixYiOutboxExportAll')) return;
    const foot=modal.querySelector('.modal-foot');
    if(!foot) return;
    const b=document.createElement('button');
    b.id='mfixYiOutboxExportAll';b.type='button';b.className='btn btn-outline';
    b.textContent='ייצא תור JSON';b.title='ייצוא מקומי של כל המסמכים הממתינים ליש חשבונית';
    b.addEventListener('click',exportAll);
    foot.insertBefore(b,foot.firstChild);
  }

  new MutationObserver(inject).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(inject,1000);
})();
