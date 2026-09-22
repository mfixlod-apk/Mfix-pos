/* MFIX printer diagnostics: expose only capabilities evidenced by the native Android bridge. */
(function(){
  'use strict';
  function esc(s){ return String(s==null?'':s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
  function selectedPrinter(){
    const s=window.STATE&&STATE.settings;
    if(!s) return null;
    const id=String(s.defaultPrinterId||'').trim();
    if(!id) return null;
    const printer=(s.printers||[]).find(p=>String(p?.id||'').trim()===id||String(p?.address||'').trim()===id)||null;
    if(!printer) return null;
    return { printer, configuredTarget:id };
  }
  function printerTarget(selection){
    if(!selection) return '';
    const p=selection.printer||selection;
    const configured=String(selection.configuredTarget||'').trim();
    if(configured && (String(p.id||'').trim()===configured || String(p.address||'').trim()===configured)) return configured;
    return String(p.id||p.address||p.name||'').trim();
  }
  function capabilityRows(d){
    const rows=[];
    if(d.authorized) rows.push('<span class="pill green">✔ הרשאת USB קיימת</span>');
    else rows.push('<span class="pill amber">⚠ נדרשת הרשאת USB</span>');
    const bulk=Number(d.bulkOutEndpoints||0);
    rows.push(bulk>0?'<span class="pill green">USB Bulk OUT ✔ ('+bulk+')</span>':'<span class="pill red">USB Bulk OUT ✖</span>');
    if(d.candidateType) rows.push('<span class="pill blue">'+esc(d.candidateType)+'</span>');
    rows.push('<span class="pill gray">ESC/POS / Raster: מצב הדפסה נתמך באפליקציה — לא אומת מול הדגם</span>');
    return rows;
  }
  function diagnostics(){
    const selection=selectedPrinter();
    const out=document.getElementById('mfixPrinterDiagnostics');
    if(!out) return;
    if(!selection){ out.innerHTML='<div class="muted" style="font-size:12px">לא נבחרה מדפסת ברירת מחדל.</div>'; return; }
    if(!window.AndroidPrinter || typeof AndroidPrinter.getUsbPrinterDiagnostics!=='function'){
      out.innerHTML='<div class="pill amber">אין גשר Android מלא — לא ניתן לאמת חיבור USB בפועל.</div>'; return;
    }
    const target=printerTarget(selection);
    if(!target){ out.innerHTML='<div class="pill red">למדפסת שנבחרה אין מזהה חיבור תקין.</div>'; return; }
    let raw='';
    try{ raw=AndroidPrinter.getUsbPrinterDiagnostics(target); }catch(e){ out.innerHTML='<div class="pill red">שגיאת בדיקה: '+esc(e.message||e)+'</div>'; return; }
    let d={}; try{ d=JSON.parse(raw||'{}'); }catch(e){ out.innerHTML='<div class="pill red">תשובת אבחון לא תקינה.</div>'; return; }
    if(!d.connected){ out.innerHTML='<div class="pill red">✖ המדפסת שנבחרה אינה מחוברת כרגע.</div>'; return; }
    const items=capabilityRows(d);
    const interfaces=Array.isArray(d.interfaces)?d.interfaces:[];
    const detail=interfaces.map(i=>'IF '+esc(i.index)+': class '+esc(i.class)+' / sub '+esc(i.subclass)+' / bulk OUT '+esc(i.bulkOutEndpoints)).join(' | ');
    out.innerHTML='<div style="display:flex;gap:6px;flex-wrap:wrap">'+items.join('')+'</div>'+
      '<div class="muted" style="font-size:11px;margin-top:6px;direction:ltr">'+esc(d.deviceName||target)+' | VID '+esc(d.vendorId)+' / PID '+esc(d.productId)+'</div>'+
      (detail?'<div class="muted" style="font-size:10.5px;margin-top:4px;direction:ltr">'+detail+'</div>':'');
  }
  function mount(){
    const cards=[...document.querySelectorAll('.card')];
    const card=cards.find(c=>c.querySelector('.section-title')?.textContent.includes('מנהל מדפסות'));
    if(!card || document.getElementById('mfixPrinterDiagnostics')) return;
    const host=document.createElement('div');
    host.style.cssText='margin-top:12px;padding:10px;border:1px solid var(--gray-200);border-radius:10px;background:var(--gray-50)';
    host.innerHTML='<div style="font-size:12.5px;font-weight:800;margin-bottom:7px">🔎 אבחון חיבור בפועל</div><div id="mfixPrinterDiagnostics"></div><button class="btn btn-ghost" style="margin-top:8px" id="mfixPrinterDiagnosticsBtn">בדוק עכשיו</button>';
    card.appendChild(host);
    document.getElementById('mfixPrinterDiagnosticsBtn').onclick=diagnostics;
    diagnostics();
  }
  const timer=setInterval(()=>{ if(window.STATE?.activeTab==='settings') mount(); },500);
  window.addEventListener('beforeunload',()=>clearInterval(timer));
})();
