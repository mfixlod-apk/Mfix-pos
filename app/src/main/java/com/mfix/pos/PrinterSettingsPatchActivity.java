package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Adds persistent printer preferences and an ESC/POS test action to Settings. */
public class PrinterSettingsPatchActivity extends PrinterDiagnosticsPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixPrinterSettingsPatch)return;window.__mfixPrinterSettingsPatch=true;"+
        "var KEY='mfix_printer_settings_v1';"+
        "function esc(s){return String(s==null?'':s).replace(/[&<>\\\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[c];});}"+
        "function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}"+
        "function save(){var x={device:document.getElementById('mfixPrinterDevice')?.value||'',paper:document.getElementById('mfixPrinterPaper')?.value||'80',auto:!!document.getElementById('mfixPrinterAuto')?.checked,drawer:!!document.getElementById('mfixPrinterDrawer')?.checked,copies:Math.max(1,Math.min(5,Number(document.getElementById('mfixPrinterCopies')?.value)||1))};localStorage.setItem(KEY,JSON.stringify(x));toast('הגדרות המדפסת נשמרו','ok');}"+
        "function b64(a){var s='';for(var i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s);}"+
        "function build(){var enc=new TextEncoder(),bytes=[];function add(s){var a=enc.encode(s);for(var i=0;i<a.length;i++)bytes.push(a[i]);}add('MFIX POS\\n');add('בדיקת הדפסה\\n');add('------------------------------\\n');add('USB ESC/POS OK\\n');add(new Date().toLocaleString('he-IL')+'\\n\\n');bytes.push(0x1b,0x64,0x03);return new Uint8Array(bytes);}"+
        "function test(){var s=load(),d=s.device||document.getElementById('mfixPrinterDevice')?.value||'';if(!d){toast('בחר מדפסת לפני בדיקת הדפסה','err');return;}var copies=Math.max(1,Math.min(5,Number(s.copies)||1));try{for(var i=0;i<copies;i++)AndroidPrinter.printEscPosToDevice(d,b64(build()));if(s.drawer&&typeof AndroidPrinter.openCashDrawer==='function')AndroidPrinter.openCashDrawer(d);toast('בדיקת ההדפסה נשלחה ('+copies+' עותק'+(copies===1?'':'ים')+')','ok');}catch(e){toast('שליחת בדיקת ההדפסה נכשלה: '+e,'err');}}"+
        "function refresh(){var s=load(),a=[];try{a=JSON.parse(AndroidPrinter.listUsbPrinters()||'[]')}catch(e){};var sel=document.getElementById('mfixPrinterDevice');if(!sel)return;var old=s.device||sel.value;sel.innerHTML='<option value=\"\">בחר מדפסת USB — בחירה ידנית</option>'+a.map(function(p){return '<option value=\"'+esc(p.id)+'\">'+esc(p.name||p.id)+' (VID '+p.vendorId+' / PID '+p.productId+')</option>';}).join('');if(a.some(function(p){return p.id===old}))sel.value=old;document.getElementById('mfixPrinterPaper').value=s.paper||'80';document.getElementById('mfixPrinterAuto').checked=!!s.auto;document.getElementById('mfixPrinterDrawer').checked=!!s.drawer;document.getElementById('mfixPrinterCopies').value=s.copies||1;}"+
        "function install(){var v=document.getElementById('view-settings');if(!v)return false;if(document.getElementById('mfixPrinterSettingsCard'))return true;var box=document.createElement('div');box.id='mfixPrinterSettingsCard';box.className='card';box.style.marginBottom='12px';box.innerHTML='<div class=\"section-title\">⚙️ הגדרות הדפסה</div><div class=\"grid2\"><div class=\"field\"><label class=\"flabel\">מדפסת ברירת מחדל</label><select class=\"input\" id=\"mfixPrinterDevice\"></select></div><div class=\"field\"><label class=\"flabel\">רוחב נייר</label><select class=\"input\" id=\"mfixPrinterPaper\"><option value=\"58\">58 מ״מ</option><option value=\"80\">80 מ״מ</option></select></div><div class=\"field\"><label class=\"flabel\">מספר עותקים</label><input class=\"input\" id=\"mfixPrinterCopies\" type=\"number\" min=\"1\" max=\"5\" value=\"1\"></div><div class=\"field\" style=\"padding-top:22px\"><label><input id=\"mfixPrinterAuto\" type=\"checkbox\"> הדפסה אוטומטית בסיום עסקה</label><br><label><input id=\"mfixPrinterDrawer\" type=\"checkbox\"> פתיחת מגירה לאחר הדפסה</label></div></div><div style=\"display:flex;gap:8px;flex-wrap:wrap\"><button type=\"button\" class=\"btn btn-primary\" onclick=\"window.__mfixPrinterSettingsSave()\">💾 שמור הגדרות</button><button type=\"button\" class=\"btn btn-outline\" onclick=\"window.__mfixPrinterSettingsRefresh()\">🔄 רענן מדפסות</button><button type=\"button\" class=\"btn btn-outline\" onclick=\"window.__mfixPrinterSettingsTest()\">🧾 הדפסת בדיקה ESC/POS</button></div><div class=\"muted\" style=\"font-size:11px;margin-top:9px\">העדפות נשמרות מקומית במכשיר. בחירת המדפסת נעשית ידנית כדי למנוע שליחה למדפסת לא מתוכננת. בדיקת ההדפסה משתמשת בנתיב ESC/POS USB הקיים באפליקציה; מספר העותקים ופתיחת המגירה מכובדים אם ה־bridge הנייטיב מספק את הפעולה.</div>';v.insertBefore(box,v.firstChild);window.__mfixPrinterSettingsSave=save;window.__mfixPrinterSettingsRefresh=refresh;window.__mfixPrinterSettingsTest=test;refresh();return true;}"+
        "var n=0;function loop(){if(install())return;if(++n<100)setTimeout(loop,700);}loop();})();";

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);
        if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),8200);
    }
}
