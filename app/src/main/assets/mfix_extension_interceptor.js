(()=>{
 if(window.__MFIX43I)return;window.__MFIX43I=1;
 try{if(/CrOS/i.test(navigator.userAgent||'')){Object.defineProperty(window,'print',{configurable:true,value:function(){}});}}catch(_){}
 const emit=p=>{try{window.postMessage({source:'MFIX43',type:'TEMPLATE',payload:p},'*')}catch(_){}};
 const emitPdf=p=>{try{window.postMessage({source:'MFIX_RAWBT_464',type:'PDF',payload:p},'*')}catch(_){}};
 const emitProductCapture=p=>{try{window.postMessage({source:'MFIX_CAPTURE_609',type:'PRODUCT_RESPONSE',payload:p},'*')}catch(_){}};
 const O=XMLHttpRequest.prototype.open,H=XMLHttpRequest.prototype.setRequestHeader,S=XMLHttpRequest.prototype.send;
 XMLHttpRequest.prototype.open=function(m,u){this.__m={method:String(m||'POST'),url:String(u||''),headers:{}};return O.apply(this,arguments)};
 XMLHttpRequest.prototype.setRequestHeader=function(n,v){try{if(this.__m)this.__m.headers[String(n)]=String(v)}catch(_){}return H.apply(this,arguments)};
 XMLHttpRequest.prototype.send=function(b){
  try{
   const capUrl=String(this.__m?.url||'');
   if(/product|item|catalog|serial|storage/i.test(capUrl)){this.addEventListener('load',()=>{try{let txt='';if(this.responseType===''||this.responseType==='text')txt=String(this.responseText||'');else if(this.responseType==='json')txt=JSON.stringify(this.response||null);if(txt)emitProductCapture({kind:'xhr',url:capUrl,method:this.__m?.method||'',body:String(b||''),status:this.status,text:txt.slice(0,150000)});}catch(_){}},{once:true})}
   if(this.__m?.url.includes('getAllProductsByPaging')&&typeof b==='string')emit({url:this.__m.url,method:this.__m.method,headers:this.__m.headers,body:b});
   else if(/product|catalog|item/i.test(String(this.__m?.url||''))&&typeof b==='string'&&/userid|userID|UserID/i.test(b))emit({url:this.__m.url,method:this.__m.method,headers:this.__m.headers,body:b});
   if(this.__m?.url.includes('DownloadInvoicePrint')){this.addEventListener('load',()=>{try{const ct=String(this.getResponseHeader('content-type')||'');if(!ct.includes('application/pdf'))return;let blob=null;if(this.response instanceof Blob)blob=this.response;else if(this.response instanceof ArrayBuffer)blob=new Blob([this.response],{type:'application/pdf'});else if(this.responseType===''||this.responseType==='text')return;if(!blob)return;const fr=new FileReader();fr.onload=()=>{const s=String(fr.result||'');const i=s.indexOf(',');if(i<0)return;emitPdf({base64:s.slice(i+1),size:blob.size,type:blob.type||'application/pdf'});};fr.readAsDataURL(blob);}catch(_){}},{once:true})}
  }catch(_){} return S.apply(this,arguments)
 };
})();
(()=>{
 const origFetch=window.fetch;
 if(!window.__MFIX14_FETCH_HOOK){window.__MFIX14_FETCH_HOOK=1;window.fetch=function(input,init={}){
  const url=typeof input==='string'?input:(input?.url||'');const method=(init?.method||input?.method||'GET').toUpperCase();const body=init?.body;
  const looks=/product|catalog|item/i.test(String(url))&&method==='POST'&&typeof body==='string'&&/userid|userID|UserID/i.test(body);
  if(looks){try{window.postMessage({source:'MFIX43',type:'TEMPLATE',payload:{url:String(url),method,headers:{'Content-Type':'application/json'},body}},'*')}catch(_){}}
  return origFetch.apply(this,arguments);
 };}
})();