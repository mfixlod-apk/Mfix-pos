#!/usr/bin/env python3
"""Lightweight regression checks for the single-file MFIX POS application."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "app/src/main/assets/index.html"
MANIFEST = ROOT / "app/src/main/AndroidManifest.xml"
PATCHED = ROOT / "app/src/main/java/com/mfix/pos/PatchedMainActivity.java"
RUNTIME = ROOT / "app/src/main/java/com/mfix/pos/RuntimeSafetyPatchActivity.java"
YESH = ROOT / "app/src/main/java/com/mfix/pos/YeshInvoicePatchActivity.java"
MAIN = ROOT / "app/src/main/java/com/mfix/pos/MainActivity.java"
INVENTORY = ROOT / "app/src/main/java/com/mfix/pos/InventoryImportPatchActivity.java"
INVENTORY_MGMT = ROOT / "app/src/main/java/com/mfix/pos/InventoryManagementPatchActivity.java"


def require(text: str, needle: str, label: str, errors: list[str]) -> None:
    if needle not in text:
        errors.append(f"Missing invariant: {label} ({needle!r})")


def main() -> int:
    errors: list[str] = []
    for path in (INDEX, MANIFEST, PATCHED, RUNTIME, YESH, MAIN, INVENTORY, INVENTORY_MGMT):
        if not path.is_file():
            errors.append(f"Required source file missing: {path.relative_to(ROOT)}")
    if errors:
        print("\n".join(errors))
        return 1

    html = INDEX.read_text(encoding="utf-8")
    manifest = MANIFEST.read_text(encoding="utf-8")
    patched = PATCHED.read_text(encoding="utf-8")
    runtime = RUNTIME.read_text(encoding="utf-8")
    yesh = YESH.read_text(encoding="utf-8")
    bridge = MAIN.read_text(encoding="utf-8")
    inventory = INVENTORY.read_text(encoding="utf-8")
    inventory_mgmt = INVENTORY_MGMT.read_text(encoding="utf-8")

    require(html, "'inventoryHistory'", "inventory history is part of persisted misc data", errors)
    require(html, "inventoryHistory:[]", "inventory history exists in application state", errors)
    require(html, "imei", "IMEI support remains present in the POS source", errors)
    require(html, "serial", "serial-number support remains present in the POS source", errors)
    require(html, "async function finalizeSale()", "checkout finalization remains present", errors)
    require(runtime, "CHECKOUT_GUARD_PATCH", "runtime checkout guard remains installed", errors)
    require(runtime, "originalFinalize=window.finalizeSale", "checkout guard wraps the real finalization flow", errors)
    require(runtime, "המכירה כבר בתהליך", "duplicate checkout feedback remains present", errors)
    require(html, "function openManualSaleModal()", "manual sale entry modal remains available", errors)
    require(html, "isManual:true", "manual sale lines retain their explicit marker", errors)
    require(html, "if(l.isManual || l.isGiftCardSale || l.linkedPreorderId || l.isPart) continue;", "manual sale bypasses inventory lookup during checkout", errors)
    require(html, "function openCartDiscountModal()", "cart discount modal remains available", errors)
    require(html, "function applyCartDiscount()", "cart discount apply action remains available", errors)
    require(html, "manualRequested = Number(STATE.cartDiscount && STATE.cartDiscount.amount)", "manual cart discount is consumed by cart calculation", errors)
    require(html, "manualDiscount", "manual discount contributes to cart totals", errors)
    require(html, "totalDiscount = round2(promoDiscount + manualDiscount)", "promotion and manual discounts are combined exactly once", errors)
    require(html, "async function parkCurrentSale()", "park sale action remains available", errors)
    require(html, "await persistMisc();", "parked sales persist before clearing cart", errors)
    require(html, "STATE.preorders.unshift(parked);", "parked sale is staged for persistence", errors)
    require(html, "STATE.preorders=STATE.preorders.filter(x=>x.id!==parked.id);", "failed parked-sale persistence rolls back in-memory state", errors)
    require(html, "function resumeParkedSale(id)", "parked sales can be resumed", errors)
    require(html, "cartDiscount=p.cartDiscount", "parked-sale discount is restored", errors)
    require(html, "paymentRows.reduce((a,r)=>a+(Number(r.amount)||0),0)", "checkout totals are calculated from all payment rows", errors)
    require(html, "if(paid < calc.totalIncl - 0.01)", "checkout blocks underpayment", errors)
    require(html, "const cashPaid=round2(paymentRows.filter(r=>r.method==='cash')", "cash-only change is calculated separately from total paid", errors)
    require(html, "if(change>cashPaid+0.01)", "checkout blocks change funded by non-cash tenders", errors)
    require(html, "if(STATE.settings.creditClearingEnabled && !r.cleared)", "gateway credit rows require successful clearing", errors)
    require(html, "if(!STATE.settings.creditClearingEnabled && !(r.approvalCode||'').trim())", "manual credit rows require an approval code", errors)
    require(html, "const giftCardTotals={};", "split gift-card payments are aggregated before validation", errors)
    require(html, "card.balance - Number(r.amount)", "gift-card balance is reduced after successful payment", errors)
    require(html, "reference:['bit','check','transfer'].includes(r.method)", "non-card electronic payment references are persisted", errors)
    require(html, "payments: paymentRows.map(r=>({method:r.method", "payment rows are persisted with the sale", errors)
    require(html, "paymentRows[${idx}].reference=this.value", "payment reference input remains available", errors)
    require(html, "יש להזין מספר צ׳ק", "check reference validation remains present", errors)
    require(html, "יש להזין מספר אסמכתא להעברה בנקאית", "bank transfer reference validation remains present", errors)
    require(runtime, "REPORTS_PATCH", "runtime sales reports patch remains installed", errors)
    require(runtime, "window.mfixOpenSalesReport", "sales report modal entry point remains present", errors)
    require(runtime, "window.mfixExportSalesReport", "sales report CSV export remains present", errors)
    require(runtime, "10 מוצרים מובילים", "top-products report remains present", errors)
    require(runtime, "אמצעי תשלום", "payment-method report breakdown remains present", errors)
    require(html, "async function handleInventoryImportFile(file)", "inventory import reader is asynchronous", errors)
    require(html, "function commitInventoryImport()", "inventory import commit path remains present", errors)
    require(inventory, "mfixReceiveNativeInventory", "native inventory import receiver remains installed", errors)
    require(inventory, "AndroidPrinter.pickInventoryFile", "native inventory picker remains connected", errors)
    require(inventory, "OpenableColumns.DISPLAY_NAME", "native inventory import preserves the provider filename", errors)
    require(inventory, "resolveDisplayName", "native inventory import resolves the real file extension", errors)
    require(inventory_mgmt, "mfixInventoryTools", "inventory management tools remain installed", errors)
    require(inventory_mgmt, "היסטוריית מלאי", "inventory history UI remains installed", errors)
    require(inventory_mgmt, "IMEI / סידורי", "inventory serial/IMEI editing remains installed", errors)

    # The launcher is intentionally the newest patched activity in the runtime chain.
    launcher_ok = any(name in manifest for name in (
        'android:name=".ProductEditPatchActivity"',
        'android:name=".PatchedMainActivity"',
        'android:name=".RuntimeSafetyPatchActivity"',
        'android:name=".InventoryImportPatchActivity"',
        'android:name=".InventoryManagementPatchActivity"',
        'android:name=".CheckoutCompletionPatchActivity"',
    ))
    if not launcher_ok:
        errors.append("Missing invariant: manifest launches a supported patched activity")
    require(patched, "extends MainActivity", "patched activity keeps the native printer bridge", errors)
    require(patched, "CART_DISCOUNT_PATCH", "checkout discount patch remains installed", errors)
    require(patched, "PRINTER_MANAGEMENT_PATCH", "printer management patch remains installed", errors)
    require(patched, "ACTION_USB_DEVICE_ATTACHED", "USB attach events refresh printer status", errors)
    require(patched, "ACTION_USB_DEVICE_DETACHED", "USB detach events refresh printer status", errors)
    require(patched, "window.mfixRefreshPrinterConnections=refresh", "native USB events can trigger printer UI refresh", errors)
    require(inventory, "extends PatchedMainActivity", "inventory import preserves the native patched printer/runtime chain", errors)
    require(runtime, "extends ReportsExportPatchActivity", "runtime safety wrapper preserves the complete reports/printer chain", errors)
    # Yesh Invoice is deliberately not part of the current development target. Keep only a
    # lightweight presence check so the legacy file cannot break CI by changing its superclass.
    require(yesh, "class YeshInvoicePatchActivity", "legacy Yesh Invoice layer remains present", errors)
    require(yesh, "mfixOpenYeshInvoiceSettings", "legacy Yesh Invoice settings entry point remains present", errors)

    for needle, label in (
        ("listUsbPrinters", "USB printer discovery"),
        ("getPrinterCapabilities", "printer capability diagnostics"),
        ("getUsbPrinterDiagnostics", "USB printer diagnostics"),
        ("requestUsbPrinterTest", "USB permission/test flow"),
        ("printRasterToDevice", "selected-printer raster printing"),
        ("printEscPosToDevice", "ESC/POS printing"),
        ("openCashDrawer", "cash drawer pulse"),
        ("saveTextFile", "native Android backup file export"),
        ("onShowFileChooser", "native Android file chooser"),
    ):
        require(bridge, needle, label, errors)

    if errors:
        print("MFIX source invariant check failed:")
        print("\n".join(f"- {e}" for e in errors))
        return 1

    print("MFIX source invariant check passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
