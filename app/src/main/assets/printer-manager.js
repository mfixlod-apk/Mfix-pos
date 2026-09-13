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
  function open(){
    var a=api();
    if(!a){ alert('הדפסת USB אינה זמינה בגרסת המכשיר הזו'); return; }
    var printers=list();
    var rows=printers.length?printers.map(function(p){
      return '<div style="border:1px solid #e2e7ef;border-radius:10px;padding:10px;margin:7px 0">'
        +'<div style="font-weight:800">'+esc(p.name||p.id)+'</div>'
        +'<div style="font-size:12px;color:#6b7686;margin:4px 0">VID '+p.vendorId+' · PID '+p.productId+' · '+esc(p.transport||'USB')+'</div>'
        +'<div style="display:flex;gap:7px;flex-wrap:wrap">'
        +'<button data-mfix-action="diag" data-id="'+esc(p.id)+'" class="btn btn-ghost">אבחון</button>'
        +'<button data-mfix-action="test" data-id="'+esc(p.id)+'" class="btn btn-primary">הדפסת ניסיון</button>'
        +'<button data-mfix-action="drawer" data-id="'+esc(p.id)+'" class="btn btn-amber">פתיחת מגירה</button>'
        +'</div></div>';
    }).join('') : '<div style="padding:18px;text-align:center;color:#6b7686">לא נמצאה כרגע מדפסת USB מתאימה.</div>';
    var html='<div style="position:fixed;inset:0;background:rgba(11,18,32,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px" id="mfixPrinterOverlay">'
      +'<div style="background:#fff;border-radius:16px;width:min(680px,96vw);max-height:90vh;overflow:auto;box-shadow:0 12px 30px rgba(15,23,42,.16);padding:18px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">ניהול מדפסות</h3><button id="mfixPrinterClose" style="border:0;background:none;font-size:22px">×</button></div>'
      +'<div style="margin:10px 0 14px;color:#6b7686;font-size:13px">מדפסות USB שהתגלו על ידי MFIX. ניתן לבצע אבחון, הדפסת ניסיון ופתיחת מגירה.</div>'
      +'<div id="mfixPrinterRows">'+rows+'</div>'
      +'</div></div>';
    document.body.insertAdjacentHTML('beforeend',html);
    document.getElementById('mfixPrinterClose').onclick=function(){document.getElementById('mfixPrinterOverlay').remove();};
    document.getElementById('mfixPrinterOverlay').onclick=function(e){if(e.target===this)this.remove();};
    document.querySelectorAll('[data-mfix-action]').forEach(function(btn){btn.onclick=function(){
      var id=btn.getAttribute('data-id'), action=btn.getAttribute('data-mfix-action');
      try{
        if(action==='test'){ a.printEscPosToDevice(id,testData()); }
        else if(action==='drawer'){ a.openCashDrawer(id); }
        else if(action==='diag'){ var d=JSON.parse(a.getUsbPrinterDiagnostics(id)||'{}'); alert(JSON.stringify(d,null,2)); }
      }catch(e){ alert('פעולת המדפסת נכשלה: '+e.message); }
    };});
  }
  function install(){
    if(!document.body) return;
    var b=document.createElement('button'); b.id='mfixPrinterManagerButton'; b.textContent='🖨️';
    b.title='ניהול מדפסות';
    b.style.cssText='position:fixed;left:16px;bottom:16px;z-index:9000;width:48px;height:48px;border:0;border-radius:50%;background:#2158cf;color:#fff;font-size:22px;box-shadow:0 6px 18px rgba(0,0,0,.2);cursor:pointer';
    b.onclick=open; document.body.appendChild(b);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
