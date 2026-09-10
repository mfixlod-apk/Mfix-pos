#!/usr/bin/env python3
"""Fail CI when the embedded MFIX POS JavaScript is syntactically invalid."""
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "app/src/main/assets/index.html"


def main() -> int:
    html = INDEX.read_text(encoding="utf-8")
    scripts = re.findall(r"<script>(.*?)</script>", html, flags=re.DOTALL)
    if not scripts:
        print("No application script block found")
        return 1
    source = scripts[-1]
    with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as f:
        f.write(source)
        path = f.name
    try:
        result = subprocess.run(["node", "--check", path], text=True, capture_output=True)
        if result.returncode:
            print(result.stdout)
            print(result.stderr)
            return result.returncode
        print("MFIX embedded JavaScript syntax: OK")
        return 0
    finally:
        Path(path).unlink(missing_ok=True)


if __name__ == "__main__":
    raise SystemExit(main())
