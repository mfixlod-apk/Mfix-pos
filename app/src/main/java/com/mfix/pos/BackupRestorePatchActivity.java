package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Runtime backup/restore layer with native file selection and structural backup validation. */
public class BackupRestorePatchActivity extends ReportsExportPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixBackupNativeBridgeV5)return;window.__mfixBackupNativeBridgeV5=true;"+
        "function bytesFromB64(b64){var bin=atob(String(b64||'')),bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return bytes;}"+
        "function textFromB64(b64){var bytes=bytesFromB64(b64),out='',i=0;while(i<bytes.length){var c=bytes[i++];if(c<128){out+=String.fromCharCode(c);}else if(c<224){out+=String.fromCharCode(((c&31)<<6)|(bytes[i++]&63));}else if(c<240){out+=String.fromCharCode(((c&15)<<12)|((bytes[i++]&63)<<6)|(bytes[i++]&63));}else{var cp=((c&7)<<18)|((bytes[i++]&63)<<12)|((bytes[i++]&63)<<6)|(bytes[i++]&63);cp-=0x10000;out+=String.fromCharCode(0xD800+(cp>>10),0xDC00+(cp&1023));}}return out;}"+
        "function validateBackupText(text){var o;try{o=JSON.parse(text);}catch(e){return {ok:false,message:'קובץ הגיבוי אינו JSON תקין'};}if(!o||typeof o!=='object'||Array.isArray(o))return {ok:false,message:'מבנה הגיבוי אינו תקין'};var required=['settings','products','customers','sales','repairs'];var missing=required.filter(function(k){return !(k in o);});if(missing.length)return {ok:false,message:'חסרים נתוני ליבה: '+missing.join(', ')};var arrays=['products','customers','sales','repairs'];for(var i=0;i<arrays.length;i++){if(!Array.isArray(o[arrays[i]]))return {ok:false,message:'שדה '+arrays[i]+' אינו רשימה תקינה'};}return {ok:true,obj:o};}"+
        "function makeFile(b64,name){var bytes=bytesFromB64(b64),blob=new Blob([bytes],{type:'application/json'});try{return new File([blob],name||'mfix-pos-backup.json',{type:'application/json'});}catch(e){blob.name=name||'mfix-pos-backup.json';blob.lastModified=Date.now();return blob;}}"+
        "window.mfixReceiveNativeBackup=function(b64,name){try{var check=validateBackupText(textFromB64(b64));if(!check.ok)throw new Error(check.message);if(typeof window.importBackup!=='function')throw new Error('מנגנון שחזור הגיבוי אינו זמין');var file=makeFile(b64,name);window.importBackup({target:{files:[file],value:''}});}catch(e){console.error('[MFIX BACKUP RESTORE]',e);toast('השחזור נעצר: '+(e&&e.message?e.message:'קובץ גיבוי לא תקין'),'err');}}"+
        "function bind(){var input=document.getElementById('importFile');if(input&&!input.__mfixNativeBound){input.__mfixNativeBound=true;input.addEventListener('click',function(e){if(window.AndroidBackup&&typeof AndroidBackup.pickBackupFile==='function'){e.preventDefault();e.stopPropagation();AndroidBackup.pickBackupFile();}},true);}if(window.AndroidBackup&&typeof AndroidBackup.saveTextFile==='function'&&!window.__mfixSaveBackupWrapped){var oldSave=AndroidBackup.saveTextFile;AndroidBackup.saveTextFile=function(fileName,b64){try{var check=validateBackupText(textFromB64(b64));if(!check.ok){toast('הגיבוי לא נשמר: '+check.message,'err');return;}}catch(e){toast('הגיבוי לא נשמר: קובץ לא תקין','err');return;}return oldSave.apply(this,arguments);};window.__mfixSaveBackupWrapped=true;}}"+
        "bind();setInterval(bind,1000);})();";
    @Override protected void onCreate(Bundle savedInstanceState){super.onCreate(savedInstanceState);View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),1800);}
}
