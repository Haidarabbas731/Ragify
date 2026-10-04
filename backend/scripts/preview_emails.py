"""Render the three emails to HTML files you can open in a browser.

Usage: uv run python scripts/preview_emails.py [output_dir]
The inline logo (cid:) is swapped for a data URI so it shows outside a mail client.
"""

import base64
import sys
from pathlib import Path

from app.services.email_service import LOGO_CID, LOGO_PATH, render_email

out_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "email-preview")
out_dir.mkdir(parents=True, exist_ok=True)

logo_uri = "data:image/png;base64," + base64.b64encode(LOGO_PATH.read_bytes()).decode()
samples = {
    "reset_password": {
        "to_email": "alex@example.com",
        "reset_url": "http://localhost:5173/reset-password?token=Zq3mV8xYk2LpR7nTbW4cHdA1sGfJ9eUo6iXyNvB5tQw",
        "expiry_minutes": 15,
    },
    "verification_code": {
        "to_email": "alex@example.com",
        "code": "482913",
        "code_spaced": "482 913",
        "expiry_minutes": 10,
    },
    "welcome": {"to_email": "alex@example.com"},
}

for name, context in samples.items():
    html, text = render_email(name, **context)
    (out_dir / f"{name}.html").write_text(html.replace(f"cid:{LOGO_CID}", logo_uri))
    (out_dir / f"{name}.txt").write_text(text)
    print(out_dir / f"{name}.html")
