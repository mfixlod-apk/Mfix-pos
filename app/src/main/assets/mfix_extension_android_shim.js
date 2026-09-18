(function(){if(window.__MFIX_ANDROID_CHROME_SHIM)return;window.__MFIX_ANDROID_CHROME_SHIM=true;
function key(k){return String(k||'');}
function get(keys,cb){var out={};try{if(keys==null){Object.keys(localStorage).forEach(function(k){try{out[k]=JSON.parse(localStorage.getItem(k));}catch(_){out[k]=localStorage.getItem(k);}});}
else if(typeof keys==='string'){var v=localStorage.getItem(keys);out[keys]=v==null?undefined:JSON.parse(v);}
else if(Array.isArray(keys)){keys.forEach(function(k){var v=localStorage.getItem(k);out[k]=v==null?undefined:JSON.parse(v);});}
else Object.keys(keys).forEach(function(k){var v=localStorage.getItem(k);out[k]=v==null?keys[k]:JSON.parse(v);});}catch(_){}
if(cb)cb(out);return Promise.resolve(out);}
function set(obj,cb){try{Object.keys(obj||{}).forEach(function(k){localStorage.setItem(k,JSON.stringify(obj[k]));});}catch(_){}
if(cb)cb();return Promise.resolve();}
function remove(keys,cb){try{(Array.isArray(keys)?keys:[keys]).forEach(function(k){localStorage.removeItem(k);});}catch(_){}
if(cb)cb();return Promise.resolve();}
var listeners=[];
window.__MFIX_ANDROID_RUNTIME_DISPATCH=function(msg){return new Promise(function(resolve){var done=false;listeners.forEach(function(fn){try{fn(msg,null,function(r){if(!done){done=true;resolve(r);}});}catch(_){}});setTimeout(function(){if(!done){done=true;resolve(undefined);}},15000);});};
window.chrome=window.chrome||{};
window.chrome.storage=window.chrome.storage||{};
window.chrome.storage.local={get:get,set:set,remove:remove};
window.chrome.runtime=window.chrome.runtime||{};
window.chrome.runtime.onMessage={addListener:function(fn){listeners.push(fn);}};
window.chrome.runtime.lastError=null;
window.chrome.runtime.getURL=function(path){return 'file:///android_asset/'+String(path||'');};
window.chrome.runtime.sendMessage=function(msg,cb){var done=false;function finish(r){if(done)return;done=true;if(cb)cb(r);}
try{var r=window.__MFIX_ANDROID_RUNTIME_DISPATCH(msg);if(r&&typeof r.then==='function')r.then(finish).catch(function(e){finish({ok:false,error:String(e)});});else if(r!==undefined)finish(r);else finish({ok:false,error:'Android runtime handler not installed'});}catch(e){finish({ok:false,error:String(e)});}
return true;};
window.chrome.printing=window.chrome.printing||{};
window.chrome.printing.getPrinters=function(){try{if(window.AndroidPrinter&&AndroidPrinter.listUsbPrinters){var v=AndroidPrinter.listUsbPrinters();return Promise.resolve(JSON.parse(v||'[]').map(function(p){return {id:p.id,name:p.name,description:p.name,status:p.authorized===false?'OFFLINE':'AVAILABLE'};}));}}catch(e){}return Promise.resolve([]);};
window.chrome.printing.getPrinterInfo=function(id){try{if(window.AndroidPrinter&&AndroidPrinter.getPrinterCapabilities){var v=AndroidPrinter.getPrinterCapabilities(id);var p=JSON.parse(v||'{}');return Promise.resolve({status:p.connected?(p.authorized?'AVAILABLE':'OFFLINE'):'OFFLINE',capabilities:{printer:p}});}}catch(e){}return Promise.resolve({status:'OFFLINE',capabilities:{printer:{}}});};
function defaultPrinterId(){try{var id=localStorage.getItem('mfix_default_printer_v1');if(id)return String(id);var s=JSON.parse(localStorage.getItem('mfix_printer_settings_v1')||'{}');return s&&s.device?String(s.device):'';}catch(e){return '';}}
function paperMode(job){try{var s=JSON.parse(localStorage.getItem('mfix_printer_settings_v1')||'{}');var configured=String(s&&s.paperMode||'').toUpperCase();if(configured==='58MM'||configured==='80MM')return configured;}catch(e){}var title=job&&job.job&&job.job.title||'';return /58mm/i.test(title)?'58MM':'80MM';}
window.chrome.printing.submitJob=function(job){return new Promise(function(resolve,reject){try{if(!window.AndroidPrinter||!AndroidPrinter.submitPdfJob)throw new Error('Android PDF printing bridge unavailable');var doc=job&&job.job&&job.job.document;if(!doc)throw new Error('PDF document missing');if(typeof doc.arrayBuffer==='function'){doc.arrayBuffer().then(function(ab){var bytes=new Uint8Array(ab),bin='';for(var i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));var b64=btoa(bin);var id=job.job.printerId||defaultPrinterId();if(!id)throw new Error('לא הוגדרה מדפסת ברירת מחדל');var mode=paperMode(job);var title=job.job.title||'';var r=AndroidPrinter.submitPdfJob(id,b64,mode);resolve({status:'OK',nativeResult:r||'',printerId:id,paperMode:mode});}).catch(reject);}else throw new Error('Unsupported PDF document');}catch(e){reject(e);}});};
})();
