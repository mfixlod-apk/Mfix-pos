from pathlib import Path

root = Path('app/src/main/assets')
html = (root / 'index.html').read_text(encoding='utf-8')
printer = (root / 'printer-manager.js').read_text(encoding='utf-8')
main = Path('app/src/main/java/com/mfix/pos/MainActivity.java').read_text(encoding='utf-8')

checks = {
    # The native bridge is the source of truth for Android file picking.  The
    # HTML page may use the WebView file chooser path, so do not require a
    # specific callback function to be embedded in the monolithic page.
    'native inventory bridge': 'pickInventoryFile' in main and 'REQUEST_IMPORT_INVENTORY' in main,
    'native backup restore bridge': 'pickBackupFile' in main and 'REQUEST_RESTORE_BACKUP' in main,
    'printer manager': '__mfixPrinterManagerLoaded' in printer and 'listUsbPrinters' in printer,
    'explicit default printer': 'mfix_default_printer_v1' in printer and 'בחר כברירת מחדל' in printer,
    'paper width setting': 'paperMode' in printer and '58MM' in printer and '80MM' in printer,
    'cash drawer setting': 'printerAutoDrawer' in printer and 'openCashDrawer' in printer,
}

missing = [name for name, ok in checks.items() if not ok]
if missing:
    raise SystemExit('Missing MFIX release invariants: ' + ', '.join(missing))

# The Android runtime must load the embedded POS page directly.
if 'file:///android_asset/index.html' not in main:
    raise SystemExit('Android runtime entrypoint changed unexpectedly')

print('MFIX release invariants: PASS')
for name in checks:
    print(' -', name)
