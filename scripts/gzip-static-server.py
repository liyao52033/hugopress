#!/usr/bin/env python3
"""Static file server with gzip — closer to production CDN behavior for Lighthouse."""
from __future__ import annotations

import gzip
import mimetypes
import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class GzipHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **getattr(SimpleHTTPRequestHandler, "extensions_map", {}),
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".webp": "image/webp",
        ".avif": "image/avif",
        ".woff2": "font/woff2",
        ".svg": "image/svg+xml",
    }

    def end_headers(self) -> None:
        # fingerprinted assets are immutable in production
        if any(x in self.path for x in (".min.", "/scss/", "/js/", "/navbar.")):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            for index in ("index.html", "index.htm"):
                index = os.path.join(path, index)
                if os.path.exists(index):
                    path = index
                    break
            else:
                return super().send_head()

        if not os.path.exists(path) or os.path.isdir(path):
            self.send_error(404, "File not found")
            return None

        ctype = self.guess_type(path)
        try:
            raw = Path(path).read_bytes()
        except OSError:
            self.send_error(404, "File not found")
            return None

        accept = self.headers.get("Accept-Encoding", "")
        use_gzip = "gzip" in accept and ctype.startswith(
            ("text/", "application/javascript", "application/json", "image/svg+xml")
        )

        if use_gzip:
            data = gzip.compress(raw, compresslevel=6)
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Vary", "Accept-Encoding")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            return data  # type: ignore[return-value]

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        return raw  # type: ignore[return-value]

    def do_GET(self) -> None:
        result = self.send_head()
        if result is None:
            return
        if isinstance(result, (bytes, bytearray)):
            self.wfile.write(result)
        else:
            # fallback file object
            try:
                self.copyfile(result, self.wfile)
            finally:
                result.close()


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "dist").resolve()
    port = int(sys.argv[2] if len(sys.argv) > 2 else 8765)
    os.chdir(root)
    server = ThreadingHTTPServer(("127.0.0.1", port), partial(GzipHandler, directory=str(root)))
    print(f"Serving {root} on http://127.0.0.1:{port} (gzip enabled)", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
