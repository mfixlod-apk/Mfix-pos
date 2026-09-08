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


def require(text: str, needle: str, label: str, errors: list[str]) -> None:
    if needle not in text:
        errors.append(f"Missing invariant: {label} ({needle!r})")


def main() -> int:
    errors: list[str] = []
    for path in (INDEX, MANIFEST, PATCHED, RUNTIME, YESH, MAIN):
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

    require(html, "'inventoryHistory'", "inventory history is part of persisted misc data", errors)
    require(html, "inventoryHistory:[]", "inventory history exists in application state", errors)
    require(html, "imei", "IMEI support remains present in the POS source", errors)
    require(html, "serial", "serial-number support remains present in the POS source", errors)

    require(html, "async function finalizeSale()", "checkout finalization remains present", errors)
    require(runtime, "CHECKOUT_GUARD_PATCH", "runtime checkout guard remains installed", errors)
    require(runtime, "originalFinalize=window.finalizeSale", "checkout guard wraps the real finalization flow", errors)
    require(runtime, "המכירה כבר בתהליך", "duplicate checkout feedback remains present", errors)

    require(html, "paymentRows[${idx}].reference=this.value", "payment reference input remains available", errors)
    require(html, "reference:['bit','check','transfer'].includes(r.method)", "payment reference is persisted on the sale", errors)
    require(html, "יש להזין מספר צ׳ק", "check reference validation remains present", errors)
    require(html, "יש להזין מספר אסמכתא להעברה בנקאית", "bank transfer reference validation remains present", errors)

    require(runtime, "REPORTS_PATCH", "runtime sales reports patch remains installed", errors)
    require(runtime, "window.mfixOpenSalesReport", "sales report modal entry point remains present", errors)
    require(runtime, "window.mfixExportSalesReport", "sales report CSV export remains present", errors)
    require(runtime, "10 מוצרים מובילים", "top-products report remains present", errors)
    require(runtime, "אמצעי תשלום", "payment-method report breakdown remains present", errors)

    launcher_ok = any(name in manifest for name in (
        'android:name=".PatchedMainActivity"',
        'android:name=".RuntimeSafetyPatchActivity"',
        'android:name=".YeshInvoicePatchActivity"',
    ))
    if not launcher_ok:
        errors.append("Missing invariant: manifest launches a supported patched activity")
    require(patched, "extends MainActivity", "patched activity keeps the native printer bridge", errors)
    require(patched, "CART_DISCOUNT_PATCH", "checkout discount patch remains installed", errors)
    require(patched, "PRINTER_MANAGEMENT_PATCH", "printer management patch remains installed", errors)
    require(runtime, "extends PatchedMainActivity", "runtime safety wrapper preserves printer patch chain", errors)
    require(yesh, "extends BackupRestorePatchActivity", "Yesh Invoice layer preserves previous runtime chain", errors)
    require(yesh, "mfixOpenYeshInvoiceSettings", "Yesh Invoice settings entry point remains present", errors)

    for needle, label in (
        ("listUsbPrinters", "USB printer discovery"),
        ("getPrinterCapabilities", "printer capability diagnostics"),
        ("getUsbPrinterDiagnostics", "USB printer diagnostics"),
        ("requestUsbPrinterTest", "USB permission/test flow"),
        ("printEscPosToDevice", "ESC/POS printing"),
        ("openCashDrawer", "cash drawer pulse"),
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
