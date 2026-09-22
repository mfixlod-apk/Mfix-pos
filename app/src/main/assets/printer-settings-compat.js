(()=>{
  if(window.__MFIX_PRINTER_SETTINGS_COMPAT_1__)return;
  window.__MFIX_PRINTER_SETTINGS_COMPAT_1__=1;

  function readJson(key,fallback){
    try{
      const v=JSON.parse(localStorage.getItem(key)||'null');
      return v&&typeof v==='object'?v:fallback;
    }catch(_){return fallback;}
  }
  function same(a,b){try{return JSON.stringify(a)===JSON.stringify(b)}catch(_){return false}}
  function sync(){
    try{
      const s=window.STATE&&window.STATE.settings;
      if(!s||typeof s!=='object')return;

      const legacy=readJson('mfix_printer_settings_v1',{});
      const next=Object.assign({},legacy);

      if(typeof s.printerAutoPrint==='boolean') next.auto=s.printerAutoPrint;
      if(s.defaultPrinterId!==undefined&&s.defaultPrinterId!==null){
        const id=String(s.defaultPrinterId);
        next.device=id;
        localStorage.setItem('mfix_default_printer_v1',id);
      }
      if(Array.isArray(s.printers)){
        const id=String(s.defaultPrinterId||'');
        const p=s.printers.find(x=>String(x&&x.id||'')===id||String(x&&x.address||'')===id);
        if(p){
          if(p.name&&next.storePrinterName!==p.name)next.storePrinterName=String(p.name);
          if(p.address&&String(next.device||'')===id)next.device=String(p.address);
        }
      }

      if(!same(legacy,next))localStorage.setItem('mfix_printer_settings_v1',JSON.stringify(next));
    }catch(_){/* compatibility layer must never block POS */}
  }

  sync();
  setInterval(sync,1000);
})();
