package com.mfix.pos;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/** Runtime backup/restore layer. Restore validates the file and persists through the app's real storage API. */
public class BackupRestorePatchActivity extends ReportsExportPatchActivity {
    private static final String PATCH =
        "(function(){if(window.__mfixBackupNativeBridgeV4)return;window.__mfixBackupNativeBridgeV4=true;"+
        "function bytesFromB64(b64){var bin=atob(String(b64||'')),bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return bytes;}"+
        "function makeFile(b64,name){var bytes=bytesFromB64(b64),blob=new Blob([bytes],{type:'application/json'});try{return new File([blob],name||'mfix-pos-backup.json',{type:'application/json'});}catch(e){blob.name=name||'mfix-pos-backup.json';blob.lastModified=Date.now();return blob;}}"+
        "window.mfixReceiveNativeBackup=function(b64,name){try{if(typeof window.importBackup!=='function')throw new Error('מנגנון שחזור הגיבוי אינו זמין');var file=makeFile(b64,name);window.importBackup({target:{files:[file],value:''}});}catch(e){console.error('[MFIX BACKUP RESTORE]',e);toast('השחזור נכשל: '+(e&&e.message?e.message:'קובץ גיבוי לא תקין'),'err');}}"+
        "function bind(){var input=document.getElementById('importFile');if(!input||input.__mfixNativeBound)return;input.__mfixNativeBound=true;input.addEventListener('click',function(e){if(window.AndroidBackup&&typeof AndroidBackup.pickBackupFile==='function'){e.preventDefault();e.stopPropagation();AndroidBackup.pickBackupFile();}},true);}"+
        "bind();setInterval(bind,1000);})();";
    @Override protected void onCreate(Bundle savedInstanceState){super.onCreate(savedInstanceState);View root=((ViewGroup)findViewById(android.R.id.content)).getChildAt(0);if(root instanceof WebView)((WebView)root).postDelayed(()->((WebView)root).evaluateJavascript(PATCH,null),1800);}
}
