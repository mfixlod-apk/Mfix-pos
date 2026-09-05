package com.mfix.pos;

import android.app.*;
import android.content.*;
import android.hardware.usb.*;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.*;
import android.widget.Toast;

import java.util.*;

public class MainActivity extends Activity {
    private static final String ACTION_USB_PERMISSION = "com.mfix.pos.USB_PERMISSION";
    private UsbManager usbManager;
    private byte[] pendingRaster;
    private int pendingBytesPerLine;
    private int pendingHeight;

    private final BroadcastReceiver usbReceiver = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) {
            if (!ACTION_USB_PERMISSION.equals(intent.getAction())) return;
            UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
            boolean granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false);
            if (granted && device != null) {
                new Thread(() -> printToDevice(device, pendingRaster, pendingBytesPerLine, pendingHeight)).start();
            } else {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "לא ניתנה הרשאה למדפסת USB", Toast.LENGTH_LONG).show());
            }
        }
    };

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        usbManager = (UsbManager) getSystemService(Context.USB_SERVICE);

        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        if (android.os.Build.VERSION.SDK_INT >= 33) registerReceiver(usbReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        else registerReceiver(usbReceiver, filter);

        WebView web = new WebView(this);
        setContentView(web);
        WebSettings st = web.getSettings();
        st.setJavaScriptEnabled(true);
        st.setDomStorageEnabled(true);
        st.setAllowFileAccess(true);
        st.setAllowContentAccess(true);
        st.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new PrinterBridge(), "AndroidPrinter");
        web.loadUrl("file:///android_asset/index.html");
    }

    @Override protected void onDestroy() {
        try { unregisterReceiver(usbReceiver); } catch (Exception ignored) {}
        super.onDestroy();
    }

    public class PrinterBridge {
        @JavascriptInterface public void printRaster(String base64Raster, int bytesPerLine, int height) {
            byte[] raster;
            try { raster = Base64.decode(base64Raster, Base64.DEFAULT); }
            catch (Exception e) { toast("שגיאה בהכנת נתוני ההדפסה"); return; }

            UsbDevice printer = findPrinter();
            if (printer == null) { toast("לא נמצאה מדפסת USB מחוברת"); return; }

            if (!usbManager.hasPermission(printer)) {
                pendingRaster = raster;
                pendingBytesPerLine = bytesPerLine;
                pendingHeight = height;
                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (android.os.Build.VERSION.SDK_INT >= 31) flags |= PendingIntent.FLAG_MUTABLE;
                PendingIntent pi = PendingIntent.getBroadcast(MainActivity.this, 0, new Intent(ACTION_USB_PERMISSION).setPackage(getPackageName()), flags);
                usbManager.requestPermission(printer, pi);
                return;
            }
            new Thread(() -> printToDevice(printer, raster, bytesPerLine, height)).start();
        }
    }

    private UsbDevice findPrinter() {
        for (UsbDevice d : usbManager.getDeviceList().values()) {
            for (int i=0;i<d.getInterfaceCount();i++) {
                UsbInterface intf=d.getInterface(i);
                for (int e=0;e<intf.getEndpointCount();e++) {
                    UsbEndpoint ep=intf.getEndpoint(e);
                    if (ep.getDirection()==UsbConstants.USB_DIR_OUT && ep.getType()==UsbConstants.USB_ENDPOINT_XFER_BULK) return d;
                }
            }
        }
        return null;
    }

    private void printToDevice(UsbDevice device, byte[] raster, int bytesPerLine, int height) {
        UsbDeviceConnection conn = usbManager.openDevice(device);
        if (conn == null) { toast("לא ניתן לפתוח את מדפסת ה-USB"); return; }
        UsbInterface chosen=null; UsbEndpoint out=null;
        try {
            outer: for (int i=0;i<device.getInterfaceCount();i++) {
                UsbInterface intf=device.getInterface(i);
                for (int e=0;e<intf.getEndpointCount();e++) {
                    UsbEndpoint ep=intf.getEndpoint(e);
                    if (ep.getDirection()==UsbConstants.USB_DIR_OUT && ep.getType()==UsbConstants.USB_ENDPOINT_XFER_BULK) { chosen=intf; out=ep; break outer; }
                }
            }
            if (chosen==null || out==null || !conn.claimInterface(chosen,true)) { toast("לא נמצאה יציאת הדפסה USB"); return; }

            write(conn,out,new byte[]{0x1b,0x40,0x1b,0x61,0x00,0x1b,0x32});
            int xL=bytesPerLine & 255, xH=(bytesPerLine>>8)&255;
            final int MAX_ROWS=180;
            for (int row=0; row<height; row+=MAX_ROWS) {
                int rows=Math.min(MAX_ROWS,height-row);
                int yL=rows&255, yH=(rows>>8)&255;
                byte[] packet=new byte[8 + rows*bytesPerLine];
                packet[0]=0x1d; packet[1]=0x76; packet[2]=0x30; packet[3]=0x00;
                packet[4]=(byte)xL; packet[5]=(byte)xH; packet[6]=(byte)yL; packet[7]=(byte)yH;
                System.arraycopy(raster,row*bytesPerLine,packet,8,rows*bytesPerLine);
                write(conn,out,packet);
            }
            write(conn,out,new byte[]{0x1b,0x64,0x03,0x1d,0x56,0x42,0x00});
            toast("ההדפסה נשלחה למדפסת");
        } catch (Exception e) {
            toast("שגיאת הדפסה: "+e.getMessage());
        } finally {
            if (chosen!=null) try { conn.releaseInterface(chosen); } catch(Exception ignored) {}
            conn.close();
        }
    }

    private void write(UsbDeviceConnection conn, UsbEndpoint ep, byte[] data) throws Exception {
        int sent = conn.bulkTransfer(ep, data, data.length, 15000);
        if (sent != data.length) throw new Exception("USB נשלחו "+sent+" מתוך "+data.length+" בתים");
    }

    private void toast(String msg) { runOnUiThread(() -> Toast.makeText(this,msg,Toast.LENGTH_LONG).show()); }
}
