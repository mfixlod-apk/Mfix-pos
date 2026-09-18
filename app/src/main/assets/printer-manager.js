(function(){
  'use strict';
  if(window.__mfixPrinterManagerLoaded) return;
  window.__mfixPrinterManagerLoaded = true;

  function esc(s){ return String(s==null?'':s).replace(/[&<>\"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];}); }
  function b64(bytes){ var s=''; for(var i=0;i<bytes.length;i++) s+=String.fromCharCode(bytes[i]); return btoa(s); }
  function testData(){
    return b64([0x1b,0x40,0x1b,0x61,0x01].concat(Array.from(new TextEncoder().encode('MFIX PRINTER TEST\n----------------\nUSB ESC/POS OK\n\n')), [0x1b,0x61,0x00,0x0a,0x1d,0x56,0x00]));
  }
  function api(){ return window.AndroidPrinter || null; }
  function list(){
    try { var a=JSON.parse(api().listUsbPrinters()||'[]'); return Array.isArray(a)?a:[]; }
    catch(e){ return []; }
  }
  function printerSettings(){
    try { return JSON.parse(localStorage.getItem('mfix_printer_settings_v1')||'{}') || {}; }
    catch(e){ return {}; }
  }
  function defaultPrinterId(){
    var s=printerSettings();
    var stateDefault='';
    try { stateDefault=window.STATE && window.STATE.settings ? String(window.STATE.settings.defaultPrinterId||'') : ''; } catch(_){}
    return String(localStorage.getItem('mfix_default_printer_v1')||stateDefault||s.device||'');
  }
  function setDefaultPrinter(p){
    if(!p || !p.id) return false;
    var id=String(p.id);
    localStorage.setItem('mfix_default_printer_v1', id);
    var s=printerSettings(); s.device=id; s.enabled=true;
    localStorage.setItem('mfix_printer_settings_v1', JSON.stringify(s));
    // Keep MFIX's application settings in sync with the printer-manager selection.
    // This matters because direct Android raster printing reads STATE.settings.printers/defaultPrinterId.
    try {
      if(window.STATE && window.STATE.settings){
        window.STATE.settings.defaultPrinterId=id;
        var printers=Array.isArray(window.STATE.settings.printers)?window.STATE.settings.printers:[];
        var exists=printers.some(function(x){return String(x.id)===id;});
        if(!exists) printers.push({id:id,name:String(p.name||id),type:'USB',address:id});
        window.STATE.settings.printers=printers;
        if(typeof window.persist==='function') window.persist('settings');
      }
    } catch(e){ console.error('[MFIX PRINTER DEFAULT SYNC]',e); }
    return true;
  }
  function selectedPrinter(ps){
    var id=defaultPrinterId();
    return ps.find(function(x){return id && (x.id===id || x.name===id);}) || ps[0] || null;
  }
  function open(){
    var a=api();
    if(!a){ alert('הדפסת USB אינה זמינה בגרסת המכשיר הזו'); return; }
    var printers=list();
    var currentId=defaultPrinterId();
    var rows=printers.length?printers.map(function(p){
      var isDefault=String(p.id||'')===currentId || String(p.name||'')===currentId;
      return '<div style="border:1px solid #e2e7ef;border-radius:10px;padding:10px;margin:7px 0">'
        +'<div style="font-weight:800">'+esc(p.name||p.id)+'</div>'
        +'<div style="font-size:12px;color:#6b7686;margin:4px 0">VID '+p.vendorId+' · PID '+p.productId+' · '+esc(p.transport||'USB')+'</div>'
        +'<div style="font-size:12px;margin:4px 0;color:'+(p.authorized?'#16a34a':'#946200')+'">'+(p.authorized?'✔ הרשאת USB קיימת':'⚠ נדרשת הרשאת USB')+'</div>'
        +'<div style="font-size:12px;margin:4px 0;color:#2158cf;font-weight:700">'+(isDefault?'⭐ מדפסת ברירת מחדל':'')+'</div>'
        +'<div style="display:flex;gap:7px;flex-wrap:wrap">'
        +'<button data-mfix-action="select" data-id="'+esc(p.id)+'" class="btn '+(isDefault?'btn-amber':'btn-ghost')+'">'+(isDefault?'✓ נבחרה':'בחר כברירת מחדל')+'</button>'
        +'<button data-mfix-action="diag" data-id="'+esc(p.id)+'" class="btn btn-ghost">אבחון</button>'
        +'<button data-mfix-action="test" data-id="'+esc(p.id)+'" class="btn btn-primary">הדפסת ניסיון</button>'
        +'<button data-mfix-action="drawer" data-id="'+esc(p.id)+'" class="btn btn-amber">פתיחת מגירה</button>'
        +'</div></div>';
    }).join('') : '<div style="padding:18px;text-align:center;color:#6b7686">לא נמצאה כרגע מדפסת USB מתאימה.</div>';
    var selected=selectedPrinter(printers);
    var summary=selected ? '<div style="padding:9px 11px;border-radius:9px;background:#f1f5ff;margin-bottom:10px;font-size:13px">מדפסת פעילה: <b>'+esc(selected.name||selected.id)+'</b></div>' : '';
    var html='<div style="position:fixed;inset:0;background:rgba(11,18,32,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px" id="mfixPrinterOverlay">'
      +'<div style="background:#fff;border-radius:16px;width:min(680px,96vw);max-height:90vh;overflow:auto;box-shadow:0 12px 30px rgba(15,23,42,.16);padding:18px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">ניהול מדפסות</h3><button id="mfixPrinterClose" style="border:0;background:none;font-size:22px">×</button></div>'
      +'<div style="margin:10px 0 14px;color:#6b7686;font-size:13px">מדפסות USB שהתגלו על ידי MFIX. בחר מדפסת ברירת מחדל לפני הדפסת קבלות אוטומטית.</div>'
      +'<div id="mfixPrinterSummary">'+summary+'</div>'
      +'<div id="mfixPrinterRows">'+rows+'</div>'
      +'</div></div>';
    document.body.insertAdjacentHTML('beforeend',html);
    document.getElementById('mfixPrinterClose').onclick=function(){document.getElementById('mfixPrinterOverlay').remove();};
    document.getElementById('mfixPrinterOverlay').onclick=function(e){if(e.target===this)this.remove();};
    document.querySelectorAll('[data-mfix-action]').forEach(function(btn){btn.onclick=function(){
      var id=btn.getAttribute('data-id'), action=btn.getAttribute('data-mfix-action');
      try{
        if(action==='select'){
          var p=list().find(function(x){return String(x.id)===String(id);});
          if(!p){ alert('המדפסת כבר אינה מחוברת'); return; }
          setDefaultPrinter(p);
          alert('המדפסת נבחרה כברירת מחדל: '+(p.name||p.id));
          document.getElementById('mfixPrinterOverlay').remove();
          open();
        } else if(action==='test'){ a.printEscPosToDevice(id,testData()); }
        else if(action==='drawer'){ a.openCashDrawer(id); }
        else if(action==='diag'){ var d=JSON.parse(a.getUsbPrinterDiagnostics(id)||'{}'); alert(JSON.stringify(d,null,2)); }
      }catch(e){ alert('פעולת המדפסת נכשלה: '+e.message); }
    };});
  }

  // Checkout integration: after a completed cash sale, open the drawer only when
  // the explicit drawer setting is enabled. This calls only the existing native
  // USB bridge and does not claim support for Bluetooth/Wi-Fi drawers.
  function installCheckoutDrawerHook(){
    if(typeof window.finalizeSale!=='function' || window.__mfixCheckoutDrawerHooked) return;
    window.__mfixCheckoutDrawerHooked=true;
    var original=window.finalizeSale;
    window.finalizeSale=async function(){
      var beforeCount=(window.STATE && Array.isArray(window.STATE.sales)) ? window.STATE.sales.length : -1;
      var result=await original.apply(this,arguments);
      try{
        var s=printerSettings();
        if(s.drawer!==true) return result;
        var st=window.STATE;
        if(!st || !Array.isArray(st.sales) || st.sales.length<=beforeCount) return result;
        var sale=st.sales[st.sales.length-1];
        var hasCash=Array.isArray(sale.payments) && sale.payments.some(function(p){return p.method==='cash' && Number(p.amount)>0;});
        if(!hasCash) return result;
        var bridge=api();
        if(!bridge || typeof bridge.openCashDrawer!=='function') return result;
        var printers=list(), p=selectedPrinter(printers);
        if(p && p.id) bridge.openCashDrawer(p.id);
      }catch(e){ console.error('[MFIX CASH DRAWER]',e); }
      return result;
    };
  }

  function install(){
    if(!document.body) return;
    var old=document.getElementById('mfixPrinterManagerButton');
    if(old) old.remove();
    var b=document.createElement('button'); b.id='mfixPrinterManagerButton'; b.textContent='🖨️';
    b.title='ניהול מדפסות';
    b.style.cssText='position:fixed;left:16px;bottom:16px;z-index:9000;width:48px;height:48px;border:0;border-radius:50%;background:#2158cf;color:#fff;font-size:22px;box-shadow:0 6px 18px rgba(0,0,0,.2);cursor:pointer';
    b.onclick=open; document.body.appendChild(b);
    installCheckoutDrawerHook();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
