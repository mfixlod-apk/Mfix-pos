package com.mfix.pos;

import android.app.*;
import android.content.*;
import android.hardware.usb.*;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.*;
import android.widget.Toast;

import java.nio.charset.StandardCharsets;
import java.util.*;

public class MainActivity extends Activity {
    private static final String ACTION_USB_PERMISSION = "com.mfix.pos.USB_PERMISSION";
    private UsbManager usbManager;
    private byte[] pendingRaster;
    private int pendingBytesPerLine;
    private int pendingHeight;
    private byte[] pendingRaw;
    private boolean pendingRawShowSuccess;
    private boolean pendingTest;

    private final BroadcastReceiver usbReceiver = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) {
            if (!ACTION_USB_PERMISSION.equals(intent.getAction())) return;
            UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
            boolean granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false);
            if (granted && device != null) {
                final byte[] raster = pendingRaster;
                final int bpl = pendingBytesPerLine;
                final int height = pendingHeight;
                final byte[] raw = pendingRaw;
                final boolean rawSuccess = pendingRawShowSuccess;
                final boolean test = pendingTest;
                clearPendingPrint();
                if (raster != null) new Thread(() -> printToDevice(device, raster, bpl, height)).start();
                else if (raw != null) new Thread(() -> sendRawToDevice(device, raw, rawSuccess)).start();
                else if (test) new Thread(() -> printTestToDevice(device)).start();
            } else {
                clearPendingPrint();
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
        web.setBackgroundColor(android.graphics.Color.WHITE);
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onConsoleMessage(ConsoleMessage m) {
                android.util.Log.e("MFIX_WEB", m.message() + " @" + m.lineNumber() + " " + m.sourceId());
                return false;
            }
        });
        web.addJavascriptInterface(new PrinterBridge(), "AndroidPrinter");
        web.loadUrl("file:///android_asset/index.html");
    }

    @Override protected void onDestroy() {
        try { unregisterReceiver(usbReceiver); } catch (Exception ignored) {}
        super.onDestroy();
    }

    public class PrinterBridge {
        @JavascriptInterface public void printRaster(String base64Raster, int bytesPerLine, int height) { printRasterToDevice("", base64Raster, bytesPerLine, height); }

        @JavascriptInterface public void printRasterToDevice(String deviceName, String base64Raster, int bytesPerLine, int height) {
            byte[] raster;
            try { raster = Base64.decode(base64Raster, Base64.DEFAULT); }
            catch (Exception e) { toast("שגיאה בהכנת נתוני ההדפסה"); return; }
            if (bytesPerLine <= 0 || height <= 0 || raster.length < bytesPerLine * height) { toast("נתוני ההדפסה אינם תקינים"); return; }
            UsbDevice printer = findPrinterByName(deviceName);
            if (printer == null) { toast(deviceName == null || deviceName.length() == 0 ? "לא נמצאה מדפסת USB מחוברת" : "המדפסת שנבחרה אינה מחוברת"); return; }
            clearPendingPrint(); pendingRaster = raster; pendingBytesPerLine = bytesPerLine; pendingHeight = height;
            if (!ensurePermission(printer)) return;
            clearPendingPrint(); new Thread(() -> printToDevice(printer, raster, bytesPerLine, height)).start();
        }

        @JavascriptInterface public void printEscPosToDevice(String deviceName, String base64Data) {
            byte[] data;
            try { data = Base64.decode(base64Data, Base64.DEFAULT); }
            catch (Exception e) { toast("נתוני ESC/POS אינם תקינים"); return; }
            UsbDevice printer = findPrinterByName(deviceName);
            if (printer == null) { toast("המדפסת שנבחרה אינה מחוברת"); return; }
            clearPendingPrint(); pendingRaw = data; pendingRawShowSuccess = true;
            if (!ensurePermission(printer)) return;
            clearPendingPrint(); new Thread(() -> sendRawToDevice(printer, data, true)).start();
        }

        @JavascriptInterface public void openCashDrawer(String deviceName) {
            UsbDevice printer = findPrinterByName(deviceName);
            if (printer == null) { toast("לא נמצאה מדפסת USB לפתיחת מגירה"); return; }
            byte[] pulse = new byte[]{0x1b,0x70,0x00,0x19,(byte)0xfa};
            clearPendingPrint(); pendingRaw = pulse; pendingRawShowSuccess = false;
            if (!ensurePermission(printer)) return;
            clearPendingPrint(); new Thread(() -> sendRawToDevice(printer, pulse, false)).start();
        }

        @JavascriptInterface public String listUsbPrinters() {
            StringBuilder out = new StringBuilder("["); boolean first = true;
            for (UsbDevice d : usbManager.getDeviceList().values()) {
                if (!isPrinterCandidate(d)) continue;
                if (!first) out.append(','); first = false;
                UsbInterface intf = preferredPrinterInterface(d);
                out.append("{\"id\":\"").append(escapeJson(d.getDeviceName())).append("\",")
                   .append("\"name\":\"").append(escapeJson(deviceDisplayName(d))).append("\",")
                   .append("\"vendorId\":").append(d.getVendorId()).append(',')
                   .append("\"productId\":").append(d.getProductId()).append(',')
                   .append("\"authorized\":").append(usbManager.hasPermission(d)).append(',')
                   .append("\"interfaceClass\":").append(intf == null ? -1 : intf.getInterfaceClass()).append(',')
                   .append("\"interfaceSubClass\":").append(intf == null ? -1 : intf.getInterfaceSubclass()).append(',')
                   .append("\"candidateType\":\"").append(printerCandidateType(d)).append("\",")
                   .append("\"transport\":\"usb-bulk\",\"escpos\":true,\"raster\":true,\"cashDrawerPulse\":true}");
            }
            return out.append(']').toString();
        }

        @JavascriptInterface public String getPrinterCapabilities(String deviceName) {
            UsbDevice d = findPrinterByName(deviceName);
            if (d == null) return "{\"connected\":false}";
            UsbInterface intf = preferredPrinterInterface(d);
            return "{\"connected\":true,\"authorized\":" + usbManager.hasPermission(d)
                + ",\"transport\":\"usb-bulk\",\"escpos\":true,\"raster\":true,\"cashDrawerPulse\":true"
                + ",\"interfaceClass\":" + (intf == null ? -1 : intf.getInterfaceClass())
                + ",\"interfaceSubClass\":" + (intf == null ? -1 : intf.getInterfaceSubclass())
                + ",\"candidateType\":\"" + printerCandidateType(d) + "\"}";
        }

        @JavascriptInterface public String getUsbPrinterDiagnostics(String deviceName) {
            UsbDevice d = findPrinterByName(deviceName);
            if (d == null) return "{\"connected\":false,\"message\":\"not-found\"}";
            StringBuilder out = new StringBuilder("{\"connected\":true");
            out.append(",\"deviceName\":\"").append(escapeJson(d.getDeviceName())).append("\"");
            out.append(",\"displayName\":\"").append(escapeJson(deviceDisplayName(d))).append("\"");
            out.append(",\"vendorId\":").append(d.getVendorId()); out.append(",\"productId\":").append(d.getProductId());
            out.append(",\"authorized\":").append(usbManager.hasPermission(d)); out.append(",\"candidateType\":\"").append(printerCandidateType(d)).append("\"");
            out.append(",\"interfaces\":[");
            for (int i=0;i<d.getInterfaceCount();i++) {
                if (i>0) out.append(','); UsbInterface intf=d.getInterface(i); int bulkOut=0;
                for (int e=0;e<intf.getEndpointCount();e++) { UsbEndpoint ep=intf.getEndpoint(e); if(ep.getDirection()==UsbConstants.USB_DIR_OUT && ep.getType()==UsbConstants.USB_ENDPOINT_XFER_BULK) bulkOut++; }
                out.append("{\"index\":").append(i).append(",\"class\":").append(intf.getInterfaceClass()).append(",\"subclass\":").append(intf.getInterfaceSubclass()).append(",\"protocol\":").append(intf.getInterfaceProtocol()).append(",\"bulkOutEndpoints\":").append(bulkOut).append('}');
            }
            return out.append("]}").toString();
        }

        @JavascriptInterface public void reportAppError(String message) { android.util.Log.e("MFIX_APP", message == null ? "Unknown app error" : message); }

        @JavascriptInterface public void requestUsbPrinterTest(String deviceName) {
            UsbDevice device = findPrinterByName(deviceName);
            if (device == null) { toast("המדפסת שנבחרה אינה מחוברת"); return; }
            clearPendingPrint(); pendingTest = true;
            if (!ensurePermission(device)) return;
            clearPendingPrint(); new Thread(() -> printTestToDevice(device)).start();
        }
    }

    private synchronized void clearPendingPrint() { pendingRaster = null; pendingBytesPerLine = 0; pendingHeight = 0; pendingRaw = null; pendingRawShowSuccess = false; pendingTest = false; }

    private boolean ensurePermission(UsbDevice printer) {
        if (usbManager.hasPermission(printer)) return true;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= 31) flags |= PendingIntent.FLAG_MUTABLE;
        PendingIntent pi = PendingIntent.getBroadcast(this, 0, new Intent(ACTION_USB_PERMISSION).setPackage(getPackageName()), flags);
        usbManager.requestPermission(printer, pi); return false;
    }

    private UsbDevice findPrinter() { for (UsbDevice d : usbManager.getDeviceList().values()) if (isPrinterCandidate(d)) return d; return null; }
    private UsbDevice findPrinterByName(String name) { if (name == null || name.length() == 0) return findPrinter(); for (UsbDevice d : usbManager.getDeviceList().values()) if (name.equals(d.getDeviceName()) && isPrinterCandidate(d)) return d; return null; }

    private UsbInterface preferredPrinterInterface(UsbDevice d) {
        UsbInterface fallback=null;
        for (int i=0;i<d.getInterfaceCount();i++) {
            UsbInterface intf=d.getInterface(i); boolean bulkOut=false;
            for (int e=0;e<intf.getEndpointCount();e++) { UsbEndpoint ep=intf.getEndpoint(e); if (ep.getDirection()==UsbConstants.USB_DIR_OUT && ep.getType()==UsbConstants.USB_ENDPOINT_XFER_BULK) { bulkOut=true; break; } }
            if (!bulkOut) continue;
            if (intf.getInterfaceClass()==UsbConstants.USB_CLASS_PRINTER) return intf;
            if (fallback==null) fallback=intf;
        }
        return fallback;
    }

    private boolean isPrinterCandidate(UsbDevice d) {
        UsbInterface intf=preferredPrinterInterface(d); if (intf==null) return false;
        if (intf.getInterfaceClass()==UsbConstants.USB_CLASS_PRINTER) return true;
        if (intf.getInterfaceClass()==UsbConstants.USB_CLASS_VENDOR_SPEC) return true;
        String label=(safe(d.getProductName())+" "+safe(d.getManufacturerName())+" "+safe(d.getDeviceName())).toLowerCase(Locale.US);
        return label.contains("printer") || label.contains("thermal") || label.contains("pos") || label.contains("xprinter") || label.contains("epson") || label.contains("bixolon") || label.contains("star") || label.contains("citizen") || label.contains("zjiang");
    }

    private String printerCandidateType(UsbDevice d) { UsbInterface intf=preferredPrinterInterface(d); if(intf==null) return "none"; if(intf.getInterfaceClass()==UsbConstants.USB_CLASS_PRINTER) return "usb-printer-class"; if(intf.getInterfaceClass()==UsbConstants.USB_CLASS_VENDOR_SPEC) return "vendor-bulk"; return "named-bulk"; }
    private String deviceDisplayName(UsbDevice d) { String p=safe(d.getProductName()); if(!p.isEmpty()) return p; String m=safe(d.getManufacturerName()); if(!m.isEmpty()) return m+" USB Printer"; return "USB Printer "+d.getVendorId()+":"+d.getProductId(); }
    private String safe(String value) { return value==null?"":value; }

    private void printTestToDevice(UsbDevice device) {
        byte[] text = "MFIX POS\nUSB PRINTER TEST\n\n".getBytes(StandardCharsets.UTF_8);
        byte[] init = new byte[]{0x1b,0x40,0x1b,0x61,0x01}; byte[] feedCut = new byte[]{0x1b,0x64,0x03,0x1d,0x56,0x42,0x00};
        byte[] all = new byte[init.length + text.length + feedCut.length];
        System.arraycopy(init,0,all,0,init.length); System.arraycopy(text,0,all,init.length,text.length); System.arraycopy(feedCut,0,all,init.length+text.length,feedCut.length);
        sendRawToDevice(device, all, true);
    }

    private void printToDevice(UsbDevice device, byte[] raster, int bytesPerLine, int height) {
        UsbDeviceConnection conn = usbManager.openDevice(device); if (conn == null) { toast("לא ניתן לפתוח את מדפסת ה-USB"); return; }
        UsbInterface chosen=null; UsbEndpoint out=null;
        try {
            UsbEndpoint[] pair = findBulkOutEndpoint(device); if (pair == null) { toast("לא נמצאה יציאת הדפסה USB"); return; }
            chosen = endpointInterface(device, pair[0]); out = pair[0]; if (chosen==null || !conn.claimInterface(chosen,true)) { toast("לא ניתן לתפוס את ממשק מדפסת ה-USB"); return; }
            writeAll(conn,out,new byte[]{0x1b,0x40,0x1b,0x61,0x00,0x1b,0x32}); int xL=bytesPerLine & 255, xH=(bytesPerLine>>8)&255;
            final int MAX_ROWS=180;
            for (int row=0; row<height; row+=MAX_ROWS) {
                int rows=Math.min(MAX_ROWS,height-row); int yL=rows&255, yH=(rows>>8)&255;
                byte[] packet=new byte[8 + rows*bytesPerLine]; packet[0]=0x1d; packet[1]=0x76; packet[2]=0x30; packet[3]=0x00; packet[4]=(byte)xL; packet[5]=(byte)xH; packet[6]=(byte)yL; packet[7]=(byte)yH;
                System.arraycopy(raster,row*bytesPerLine,packet,8,rows*bytesPerLine); writeAll(conn,out,packet);
            }
            writeAll(conn,out,new byte[]{0x1b,0x64,0x03,0x1d,0x56,0x42,0x00}); toast("ההדפסה נשלחה למדפסת");
        } catch (Exception e) { toast("שגיאת הדפסה: "+e.getMessage()); }
        finally { if (chosen!=null) try { conn.releaseInterface(chosen); } catch(Exception ignored) {} conn.close(); }
    }

    private void sendRawToDevice(UsbDevice device, byte[] data, boolean showSuccess) {
        UsbDeviceConnection conn = usbManager.openDevice(device); if (conn == null) { toast("לא ניתן לפתוח את מדפסת ה-USB"); return; }
        UsbInterface chosen=null;
        try {
            UsbEndpoint[] pair=findBulkOutEndpoint(device); if(pair==null){toast("לא נמצאה יציאת הדפסה USB");return;}
            chosen=endpointInterface(device,pair[0]); if(chosen==null || !conn.claimInterface(chosen,true)){toast("לא ניתן לתפוס את ממשק מדפסת ה-USB");return;}
            writeAll(conn,pair[0],data); if(showSuccess) toast("הפעולה נשלחה למדפסת");
        } catch(Exception e){toast("שגיאת USB: "+e.getMessage());}
        finally{if(chosen!=null)try{conn.releaseInterface(chosen);}catch(Exception ignored){} conn.close();}
    }

    private UsbEndpoint[] findBulkOutEndpoint(UsbDevice device) {
        UsbInterface preferred=preferredPrinterInterface(device);
        if(preferred!=null) for(int e=0;e<preferred.getEndpointCount();e++){ UsbEndpoint ep=preferred.getEndpoint(e); if(ep.getDirection()==UsbConstants.USB_DIR_OUT && ep.getType()==UsbConstants.USB_ENDPOINT_XFER_BULK) return new UsbEndpoint[]{ep}; }
        return null;
    }
    private UsbInterface endpointInterface(UsbDevice device, UsbEndpoint target){ for(int i=0;i<device.getInterfaceCount();i++){UsbInterface intf=device.getInterface(i);for(int e=0;e<intf.getEndpointCount();e++)if(intf.getEndpoint(e)==target)return intf;} return null; }

    private void writeAll(UsbDeviceConnection conn, UsbEndpoint ep, byte[] data) throws Exception {
        int offset=0; while(offset<data.length){ int len=Math.min(16384,data.length-offset); byte[] chunk=Arrays.copyOfRange(data,offset,offset+len); int sent=conn.bulkTransfer(ep,chunk,chunk.length,15000); if(sent<=0) throw new Exception("USB לא שלח נתונים"); offset+=sent; }
    }

    private String escapeJson(String s) { return s.replace("\\", "\\\\").replace("\"", "\\\""); }
    private void toast(String msg) { runOnUiThread(() -> Toast.makeText(this,msg,Toast.LENGTH_LONG).show()); }
}
