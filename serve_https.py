#!/usr/bin/env python3
"""Local HTTPS server for Focus PWA — accessible from other devices on LAN."""

import http.server
import os
import ssl
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8443
CERT = os.path.join(os.path.dirname(__file__), "server.crt")
KEY = os.path.join(os.path.dirname(__file__), "server.key")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Quiet minimal logging
        pass


if __name__ == "__main__":
    os.chdir(os.path.dirname(__file__) or ".")

    httpd = http.server.HTTPServer(("0.0.0.0", PORT), QuietHandler)

    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(CERT, KEY)
    httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)

    print(f"HTTPS server running on https://0.0.0.0:{PORT}")
    print(f"  → Local:   https://localhost:{PORT}")
    print(f"  → LAN:     https://192.168.1.2:{PORT}")
    print("  (self-signed cert — browser will show a warning, click Advanced → Proceed)")
    httpd.serve_forever()
