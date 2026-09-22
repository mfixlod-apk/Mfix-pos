/* MFIX printer diagnostics: expose only capabilities reported by the native Android bridge. */
(function(){
  'use strict';
  function esc(s){ return String(s==null?'':s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
  function selectedPrinter(){
    const s=window.STATE&&STATE.settings;
    if(!s) return null;
    const id=String(s.defaultPrinterId||'').trim();
    if(!id) return null;
    return (s.printers||[]).find(p=>String(p?.id||'').trim()===id||String(p?.address||'').trim()===id)||null;
  }
  function printerTarget(p){
    if(!p) return '';
    return String(p.id||p.address||p.name||'').trim();
  }
  function diagnostics(){
    const p=selectedPrinter();
    const out=document.getElementById('mfixPrinterDiagnostics');
    if(!out) return;
    if(!p){ out.innerHTML='<div class="muted" style="font-size:12px">לא נבחרה מדפסת ברירת מחדל.</div>'; return; }
    if(!window.AndroidPrinter || typeof AndroidPrinter.getPrinterCapabilities!=='function'){
      out.innerHTML='<div class="pill amber">אין גשר Android פעיל — לא ניתן לאמת חיבור פיזי.</div>'; return;
    }
    const target=printerTarget(p);
    if(!target){ out.innerHTML='<div class="pill red">למדפסת שנבחרה אין מזהה חיבור תקין.</div>'; return; }
    let raw='';
    try{ raw=AndroidPrinter.getPrinterCapabilities(target); }catch(e){ out.innerHTML='<div class="pill red">שגיאת בדיקה: '+esc(e.message||e)+'</div>'; return; }
    let d={}; try{ d=JSON.parse(raw||'{}'); }catch(e){ out.innerHTML='<div class="pill red">תשובת אבחון לא תקינה.</div>'; return; }
    if(!d.connected){ out.innerHTML='<div class="pill red">✖ המדפסת שנבחרה אינה מחוברת כרגע.</div>'; return; }
    const items=[];
    items.push(d.authorized?'<span class="pill green">✔ הרשאת USB קיימת</span>':'<span class="pill amber">⚠ נדרשת הרשאת USB</span>');
    if(d.transport) items.push('<span class="pill blue">'+esc(d.transport)+'</span>');
    items.push(d.raster?'<span class="pill green">Raster ✔</span>':'<span class="pill red">Raster ✖</span>');
    items.push(d.escpos?'<span class="pill green">ESC/POS ✔</span>':'<span class="pill red">ESC/POS ✖</span>');
    items.push(d.cashDrawerPulse?'<span class="pill green">מגירת מזומן ✔</span>':'<span class="pill red">מגירת מזומן ✖</span>');
    out.innerHTML='<div style="display:flex;gap:6px;flex-wrap:wrap">'+items.join('')+'</div>'+
      '<div class="muted" style="font-size:11px;margin-top:6px;direction:ltr">'+esc(d.deviceName||target)+' | VID '+esc(d.vendorId)+' / PID '+esc(d.productId)+'</div>';
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
