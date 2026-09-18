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
window.__MFIX_ANDROID_RUNTIME_DISPATCH=function(msg){var answer=null;listeners.forEach(function(fn){try{fn(msg,null,function(r){answer=r;});}catch(_){}});return answer;};
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
window.chrome.printing.getPrinters=function(){return Promise.resolve([]);};
window.chrome.printing.getPrinterInfo=function(){return Promise.resolve({status:'AVAILABLE',capabilities:{printer:{}}});};
window.chrome.printing.submitJob=function(){return Promise.reject(new Error('Android native PDF printing bridge not installed yet'));};
})();