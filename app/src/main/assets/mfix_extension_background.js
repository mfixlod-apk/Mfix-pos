
const norm=u=>u?.startsWith('//')?'https:'+u:u||'';
const safeHeaders=h=>{
 let o={};
 for(const[k,v]of Object.entries(h||{})){
   if(/^(host|origin|referer|content-length|cookie|connection)$/i.test(k)||/^sec-/i.test(k))continue;
   o[k]=String(v);
 }
 if(!Object.keys(o).some(k=>k.toLowerCase()==='content-type'))o['Content-Type']='application/json';
 return o;
};
const parse=v=>{for(let i=0;i<3&&typeof v==='string';i++){try{v=JSON.parse(v)}catch(_){break}}return v};

const largestProductArray=(raw)=>{
 let root=parse(raw), best=[];
 const walk=(v,d=0)=>{
  if(d>9||v==null)return;
  if(Array.isArray(v)){
   if(v.some(x=>x&&typeof x==='object'&&('ID'in x||'Name'in x||'Barcode'in x))) {
    if(v.length>best.length)best=v;
   }
   v.forEach(x=>walk(x,d+1));
  }else if(typeof v==='object')Object.values(v).forEach(x=>walk(x,d+1));
 };
 walk(root); return best;
};

const fetchJsonText=async(url,method,headers,body)=>{
 const r=await fetch(norm(url),{
  method:method||'POST',
  headers:safeHeaders(headers),
  body:body==null?undefined:body,
  credentials:'include'
 });
 const text=await r.text();
 return {ok:r.ok,status:r.status,text};
};

const detailProduct=async(id,userId,t)=>{
 const base='https://api.yeshinvoice.co.il/api4/invoice/getProductDataItem';
 return fetchJsonText(`${base}?id=${encodeURIComponent(id)}&userid=${encodeURIComponent(userId)}`,
   'POST',t.headers,'');
};

const extractDetail=(text)=>{
 const root=parse(text);
 const rv=root?.ReturnValue||root?.returnValue||root?.Data||root?.data||root;
 return {
  product:rv?.product||rv?.Product||null,
  serials:Array.isArray(rv?.serials)?rv.serials:(Array.isArray(rv?.Serials)?rv.Serials:[])
 };
};

async function buildSerialIndex(t){
 let body=parse(t.body);
 if(!body||typeof body!=='object')throw new Error('bad template');
 const userId=body.UserID||body.userid||body.userId;
 if(!userId)throw new Error('missing userid');

 const products=[], seen=new Set();
 for(let page=1;page<=80;page++){
  const b={...body,PageNumber:page,PageSize:100,Search:''};
  const r=await fetchJsonText(t.url,t.method||'POST',t.headers,JSON.stringify(b));
  if(!r.ok)break;
  const arr=largestProductArray(r.text);
  if(!arr.length)break;
  let fresh=0;
  for(const x of arr){
   const id=Number(x?.ID??x?.Id??x?.id);
   if(id&& !seen.has(id)){seen.add(id);products.push(x);fresh++}
  }
  if(arr.length<100||fresh===0)break;
 }

 const exposesFlag=products.some(x=>Object.prototype.hasOwnProperty.call(x||{},'allowSerial'));
 const candidates=exposesFlag ? products.filter(x=>x?.allowSerial===true) : products;

 const serialMap={};
 let cursor=0;
 const workers=Array.from({length:6},async()=>{
  while(cursor<candidates.length){
   const x=candidates[cursor++];
   const id=Number(x?.ID??x?.Id??x?.id);
   if(!id)continue;
   try{
    const r=await detailProduct(id,userId,t);
    if(!r.ok)continue;
    const d=extractDetail(r.text);
    if(!d.serials.length)continue;
    const prod={...x,...(d.product||{})};
    for(const sr of d.serials){
     const serial=String(sr?.name??sr?.Name??sr?.serial??sr?.Serial??'').trim();
     if(!serial)continue;
     serialMap[serial]={
      product:prod,
      serial,
      serialId:sr?.id??sr?.ID??null,
      serialData:sr
     };
    }
   }catch(_){}
  }
 });
 await Promise.all(workers);
 return {serialMap,productCount:products.length,checkedCount:candidates.length,builtAt:Date.now()};
}

async function getSerialIndex(t,force=false){
 const key='mfixSerialIndex454';
 if(!force){
  const st=await chrome.storage.local.get(key);
  const idx=st[key];
  if(idx?.serialMap && Date.now()-(idx.builtAt||0)<30*60*1000)return idx;
 }
 const idx=await buildSerialIndex(t);
 await chrome.storage.local.set({[key]:idx});
 return idx;
}

chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(m?.type==='MFIX_SEARCH'){
  (async()=>{
   try{
    const st=await chrome.storage.local.get('mfixTemplate43');
    const t=st.mfixTemplate43;
    if(!t){reply({ok:false,setup:true});return}
    let b=parse(t.body);
    if(!b||typeof b!=='object'){reply({ok:false,body:true});return}
    b={...b,PageNumber:1,PageSize:30,Search:String(m.q||'')};
    const r=await fetchJsonText(t.url,t.method||'POST',t.headers,JSON.stringify(b));
    reply({ok:r.ok,status:r.status,text:r.text.slice(0,300000)});
   }catch(e){reply({ok:false,error:String(e)})}
  })();
  return true;
 }

 if(m?.type==='MFIX_PRODUCT_DETAIL_509'){
  (async()=>{
   try{
    const id=Number(m.id);
    if(!id){reply({ok:false,error:'bad id'});return}
    const st=await chrome.storage.local.get('mfixTemplate43');
    const t=st.mfixTemplate43;
    if(!t){reply({ok:false,setup:true});return}
    const body=parse(t.body);
    const userId=body?.UserID||body?.userid||body?.userId;
    if(!userId){reply({ok:false,error:'missing userid'});return}

    const r=await detailProduct(id,userId,t);
    if(!r.ok){reply({ok:false,status:r.status});return}
    const d=extractDetail(r.text);
    reply({ok:true,product:d.product||null});
   }catch(e){reply({ok:false,error:String(e)})}
  })();
  return true;
 }

 if(m?.type==='MFIX_SERIAL_SEARCH'){
  (async()=>{
   try{
    const q=String(m.q||'').trim();
    if(q.length<5){reply({ok:true,match:null});return}
    const st=await chrome.storage.local.get('mfixTemplate43');
    const t=st.mfixTemplate43;
    if(!t){reply({ok:false,setup:true});return}
    const idx=await getSerialIndex(t,!!m.force);
    let hit=idx.serialMap?.[q]||null;
    if(!hit){
     const k=Object.keys(idx.serialMap||{}).find(k=>k.toLowerCase()===q.toLowerCase());
     if(k)hit=idx.serialMap[k];
    }
    reply({
     ok:true,
     match:hit,
     stats:{productCount:idx.productCount,checkedCount:idx.checkedCount,builtAt:idx.builtAt}
    });
   }catch(e){reply({ok:false,error:String(e)})}
  })();
  return true;
 }

 if(m?.type==='MFIX_SERIAL_REBUILD'){
  (async()=>{
   try{
    const st=await chrome.storage.local.get('mfixTemplate43');
    const t=st.mfixTemplate43;
    if(!t){reply({ok:false,setup:true});return}
    const idx=await getSerialIndex(t,true);
    reply({ok:true,count:Object.keys(idx.serialMap||{}).length});
   }catch(e){reply({ok:false,error:String(e)})}
  })();
  return true;
 }
});

const MFIX_INV_META='mfixInventory14Meta';
const MFIX_INV_PREFIX='mfixInventory14Chunk_';
const invNorm=x=>({ID:x?.ID??x?.Id??x?.id,Body:x?.Body??x?.body??x?.ProductName??x?.Description??'',Name:x?.Name??x?.name??'',Barcode:x?.Barcode??x?.barcode??'',CatalogNumber:x?.CatalogNumber??x?.catalogNumber??'',Price:Number(x?.Price??x?.price??0),Quantity:x?.Quantity??x?.allQuantity??x?.AllQuantity??x?.AvailableQuantity??null,allQuantity:x?.allQuantity??x?.AllQuantity??x?.Quantity??x?.AvailableQuantity??null,raw:x});
async function clearInventory14(){const all=await chrome.storage.local.get(null);const keys=Object.keys(all).filter(k=>k.startsWith(MFIX_INV_PREFIX)||k===MFIX_INV_META);if(keys.length)await chrome.storage.local.remove(keys)}
async function readInventory14(){const st=await chrome.storage.local.get(null), meta=st[MFIX_INV_META];if(!meta?.chunks)return null;let a=[];for(let i=0;i<meta.chunks;i++)a.push(...(st[MFIX_INV_PREFIX+i]||[]));return {meta,items:a}}
async function saveInventory14(items){await clearInventory14();const chunks=[];for(let i=0;i<items.length;i+=350)chunks.push(items.slice(i,i+350));const o={[MFIX_INV_META]:{count:items.length,chunks:chunks.length,builtAt:Date.now(),version:1}};chunks.forEach((c,i)=>o[MFIX_INV_PREFIX+i]=c);await chrome.storage.local.set(o);return o[MFIX_INV_META]}
async function bootstrapInventory14(force=false){const cached=await readInventory14();if(!force&&cached?.items?.length&&Date.now()-(cached.meta.builtAt||0)<6*60*60*1000)return {ok:true,cached:true,count:cached.items.length,meta:cached.meta};const st=await chrome.storage.local.get('mfixTemplate43');const t=st.mfixTemplate43;if(!t?.url||!t?.body)return {ok:false,setup:true};let body=parse(t.body);if(!body||typeof body!=='object')return {ok:false,error:'bad template'};let products=[],seen=new Set();for(let page=1;page<=120;page++){const b={...body,PageNumber:page,PageSize:100,Search:''};const r=await fetchJsonText(t.url,t.method||'POST',t.headers,JSON.stringify(b));if(!r.ok)break;const arr=largestProductArray(r.text);if(!arr.length)break;let fresh=0;for(const x of arr){const p=invNorm(x);const key=String(p.ID||p.Barcode||p.CatalogNumber||p.Name);if(key&&!seen.has(key)){seen.add(key);products.push(p);fresh++}}if(arr.length<100||fresh===0)break}if(!products.length)return {ok:false,error:'no products'};const meta=await saveInventory14(products);return {ok:true,cached:false,count:products.length,meta}}
function score14(p,q){const n=String(q||'').trim().toLowerCase();if(!n)return 99;const vals=[p.Barcode,p.CatalogNumber,p.Name,p.Body,p.ID].map(v=>String(v||'').toLowerCase());if(vals.some(v=>v===n))return 0;if(vals.some(v=>v.startsWith(n)))return 1;if(vals.some(v=>v.includes(n)))return 2;return 99}
async function searchInventory14(q,limit=50){const inv=await readInventory14();if(!inv?.items?.length)return null;return inv.items.map(p=>[score14(p,q),p]).filter(x=>x[0]<99).sort((a,b)=>a[0]-b[0]).slice(0,limit).map(x=>x[1])}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(m?.type==='MFIX_INVENTORY_BOOTSTRAP_14'){(async()=>{try{reply(await bootstrapInventory14(!!m.force))}catch(e){reply({ok:false,error:String(e)})}})();return true}
 if(m?.type==='MFIX_INVENTORY_STATUS_14'){(async()=>{const x=await readInventory14();reply({ok:!!x,count:x?.items?.length||0,meta:x?.meta||null})})();return true}
 if(m?.type==='MFIX_SEARCH_LOCAL_14'){(async()=>{try{const items=await searchInventory14(m.q,m.limit||50);reply({ok:!!items,items:items||[]})}catch(e){reply({ok:false,items:[],error:String(e)})}})();return true}
});

const MFIX15_HEALTH='mfix15Health';
async function mfix15Health(){
 const st=await chrome.storage.local.get([MFIX_INV_META,'mfixTemplate43']);
 const meta=st[MFIX_INV_META];
 return {ok:true,inventory:{ready:!!meta,count:meta?.count||0,builtAt:meta?.builtAt||0},template:!!st.mfixTemplate43,now:Date.now()};
}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(m?.type==='MFIX15_HEALTH'){mfix15Health().then(reply).catch(e=>reply({ok:false,error:String(e)}));return true}
 if(m?.type==='MFIX15_CLEAR_STALE_CACHE'){(async()=>{try{const x=await readInventory14();if(x?.meta&&Date.now()-(x.meta.builtAt||0)>7*24*60*60*1000){await clearInventory14();reply({ok:true,cleared:true});}else reply({ok:true,cleared:false});}catch(e){reply({ok:false,error:String(e)})}})();return true}
});

const MFIX_PRINT_DEFAULTS_1535={
  printerId:'',
  fit:'NONE',
  orientation:'PORTRAIT',
  copies:1,
  paperMode:'80MM',
  autoPrint:true,
  autoCut:true,
  rollHeightMm:200
};

async function mfixPrintSettings1535(){
  const x=await chrome.storage.local.get('mfixPrintSettings1535');
  return Object.assign({},MFIX_PRINT_DEFAULTS_1535,x.mfixPrintSettings1535||{});
}
async function mfixPrinters1535(){
  const printers=await chrome.printing.getPrinters();
  const out=[];
  for(const p of printers){
    let info={};
    try{info=await chrome.printing.getPrinterInfo(p.id)}catch(e){info={error:String(e)}}
    const vc=info?.capabilities?.printer?.vendor_capability||[];
    const supportsCut=vc.some(v=>/finishings|cut|trim/i.test(String(v.id||'')+' '+String(v.display_name||'')));
    out.push({printer:p,info,supportsCut});
  }
  return out;
}
function mfixB64Blob1535(b64){
  const bin=atob(b64), a=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);
  return new Blob([a],{type:'application/pdf'});
}
function mfixPickMedia165(opts,mode){
  if(!opts?.length)return null;
  const cont=opts.filter(x=>x.is_continuous_feed);
  const pool=cont.length?cont:opts;
  const target=mode==='58MM'?58000:mode==='80MM'?80000:0;
  if(target){
    return [...pool].sort((a,b)=>Math.abs((a.width_microns||0)-target)-Math.abs((b.width_microns||0)-target))[0]||null;
  }
  return opts.find(x=>x.is_default)||pool[0]||opts[0];
}
async function mfixSubmitPdf1535(base64, override={}){
  const settings=Object.assign(await mfixPrintSettings1535(),override||{});
  const printers=await chrome.printing.getPrinters();
  let printer=printers.find(p=>p.id===settings.printerId);
  if(!printer) printer=printers.find(p=>/xprinter/i.test((p.name||'')+' '+(p.description||''))) || printers[0];
  if(!printer) throw new Error('לא נמצאה מדפסת ChromeOS');

  const info=await chrome.printing.getPrinterInfo(printer.id);
  if(info.status && info.status!=='AVAILABLE') throw new Error('המדפסת אינה זמינה: '+info.status);
  const caps=info?.capabilities?.printer||{};
  const mediaOpts=caps.media_size?.option||[];
  const dpiOpts=caps.dpi?.option||[];
  const media=mfixPickMedia165(mediaOpts,settings.paperMode||'80MM');
  const dpi=dpiOpts.find(x=>x.is_default)||dpiOpts[0];

  const fit=['AUTO','AUTO_FIT','FIT','FILL','NONE'].includes(settings.fit)?settings.fit:'NONE';
  const print={
    color:{type:'STANDARD_MONOCHROME'},
    duplex:{type:'NO_DUPLEX'},
    page_orientation:{type:settings.orientation==='LANDSCAPE'?'LANDSCAPE':'PORTRAIT'},
    copies:{copies:Math.max(1,Math.min(9,Number(settings.copies)||1))},
    collate:{collate:false},
    fit_to_page:{type:fit}
  };
  if(dpi) print.dpi={horizontal_dpi:dpi.horizontal_dpi,vertical_dpi:dpi.vertical_dpi};
  if(media){
    let h=Math.max(50000,Math.min(500000,Math.round((Number(settings.rollHeightMm)||200)*1000)));
    if(media.is_continuous_feed){
      if(media.min_height_microns) h=Math.max(h,media.min_height_microns);
      if(media.max_height_microns) h=Math.min(h,media.max_height_microns);
    } else if(media.height_microns) h=media.height_microns;
    print.media_size={width_microns:media.width_microns||80000,height_microns:h};
  }
  if(settings.autoCut!==false){
    print.vendor_ticket_item=[{id:'finishings',value:'trim'}];
  }
  const request={job:{
    printerId:printer.id,
    title:'MFIX YesInvoice '+(settings.paperMode==='58MM'?'58mm':'80mm'),
    ticket:{version:'1.0',print},
    contentType:'application/pdf',
    document:mfixB64Blob1535(base64)
  }};
  let result;
  try{
    result=await chrome.printing.submitJob(request);
  }catch(err){
    if(request.job.ticket.print.vendor_ticket_item){
      delete request.job.ticket.print.vendor_ticket_item;
      result=await chrome.printing.submitJob(request);
    }else throw err;
  }
  return {result,printer:{id:printer.id,name:printer.name},settings,ticket:request.job.ticket,media};
}

chrome.runtime.onMessage.addListener((msg,sender,sendResponse)=>{
  if(!msg || !String(msg.type||'').startsWith('MFIX_PRINT_1535_')) return;
  (async()=>{
    if(msg.type==='MFIX_PRINT_1535_LIST'){
      sendResponse({ok:true,printers:await mfixPrinters1535(),settings:await mfixPrintSettings1535()}); return;
    }
    if(msg.type==='MFIX_PRINT_1535_SAVE'){
      const cur=await mfixPrintSettings1535();
      const next=Object.assign(cur,msg.settings||{});
      await chrome.storage.local.set({mfixPrintSettings1535:next});
      sendResponse({ok:true,settings:next}); return;
    }
    if(msg.type==='MFIX_PRINT_1535_PDF'){
      sendResponse({ok:true,...await mfixSubmitPdf1535(msg.base64||'',msg.override||{})}); return;
    }
    if(msg.type==='MFIX_PRINT_1535_TEST'){
      const url=chrome.runtime.getURL('mfix-print-test.pdf');
      const buf=await (await fetch(url)).arrayBuffer();
      const bytes=new Uint8Array(buf);
      let bin=''; for(let i=0;i<bytes.length;i+=0x8000) bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
      sendResponse({ok:true,...await mfixSubmitPdf1535(btoa(bin),msg.override||{})}); return;
    }
  })().catch(e=>sendResponse({ok:false,error:String(e?.message||e)}));
  return true;
});

let MFIX_PRINT_LAST_1536={hash:'',ts:0};
function mfixHash1536(s){
  s=String(s||'');
  return s.length+':'+s.slice(0,64)+':'+s.slice(-64);
}
const __mfixOldSubmitPdf1535=mfixSubmitPdf1535;
mfixSubmitPdf1535=async function(base64,override={}){
  const h=mfixHash1536(base64);
  const now=Date.now();
  if(MFIX_PRINT_LAST_1536.hash===h && now-MFIX_PRINT_LAST_1536.ts<5000){
    return {result:{status:'SKIPPED_DUPLICATE'},printer:{id:'',name:''},settings:await mfixPrintSettings1535(),ticket:null};
  }
  MFIX_PRINT_LAST_1536={hash:h,ts:now};
  return __mfixOldSubmitPdf1535(base64,override);
};
