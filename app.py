import hashlib
import json
import logging
import os
import sqlite3
import time
import uuid
from contextlib import closing
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(
    os.environ.get("VISITOR_DATA_DIR", ROOT.parent / f".{ROOT.name}-data")
).expanduser()
DATABASE_PATH = DATA_DIR / "visitors.sqlite3"
ONLINE_WINDOW_SECONDS = 120
MAX_REQUEST_BYTES = 1024


def connect_database():
    connection = sqlite3.connect(DATABASE_PATH, timeout=5)
    connection.execute("PRAGMA busy_timeout = 5000")
    return connection


def initialize_database():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with closing(connect_database()) as connection:
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS visits (
                visit_id TEXT PRIMARY KEY,
                first_seen INTEGER NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS active_visitors (
                visitor_id TEXT PRIMARY KEY,
                last_seen INTEGER NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_active_visitors_last_seen
            ON active_visitors (last_seen)
            """
        )
        connection.commit()


def get_counts(connection, now):
    cutoff = now - ONLINE_WINDOW_SECONDS
    connection.execute(
        "DELETE FROM active_visitors WHERE last_seen < ?", (cutoff,)
    )
    visits = connection.execute("SELECT COUNT(*) FROM visits").fetchone()[0]
    here_now = connection.execute(
        "SELECT COUNT(*) FROM active_visitors WHERE last_seen >= ?", (cutoff,)
    ).fetchone()[0]
    return {"visits": visits, "hereNow": here_now}


def normalize_id(value):
    if not isinstance(value, str):
        return None
    try:
        return hashlib.sha256(str(uuid.UUID(value)).encode("ascii")).hexdigest()
    except ValueError:
        return None


class PortfolioHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        translated = Path(super().translate_path(path)).resolve()
        try:
            relative_path = translated.relative_to(ROOT)
        except ValueError:
            return str(ROOT / "__not_found__")
        if any(part.startswith(".") for part in relative_path.parts):
            return str(ROOT / "__not_found__")
        return str(translated)

    def log_message(self, format_string, *args):
        return

    def send_json(self, status, payload):
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def send_empty(self, status):
        self.send_response(status)
        self.send_header("Content-Length", "0")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()

    def do_HEAD(self):
        path = urlsplit(self.path).path
        if path == "/api/status":
            try:
                now = int(time.time())
                with closing(connect_database()) as connection:
                    with connection:
                        get_counts(connection, now)
                self.send_empty(200)
            except sqlite3.Error:
                logging.exception("Could not check visitor database")
                self.send_empty(503)
            return
        if path.startswith("/api/"):
            self.send_empty(404)
            return
        super().do_HEAD()

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/api/status":
            try:
                now = int(time.time())
                with closing(connect_database()) as connection:
                    with connection:
                        counts = get_counts(connection, now)
                self.send_json(200, {"ok": True, **counts})
            except sqlite3.Error:
                logging.exception("Could not read visitor counts")
                self.send_json(503, {"error": "Visitor counts are unavailable"})
            return
        if path.startswith("/api/"):
            self.send_json(404, {"error": "API endpoint not found"})
            return
        super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path != "/api/heartbeat":
            self.send_json(404, {"error": "API endpoint not found"})
            return

        content_length = self.headers.get("Content-Length")
        if content_length is None:
            self.send_json(411, {"error": "Content-Length is required"})
            return
        try:
            request_size = int(content_length)
        except ValueError:
            self.send_json(400, {"error": "Invalid Content-Length"})
            return
        if request_size < 0 or request_size > MAX_REQUEST_BYTES:
            self.send_json(413, {"error": "Request is too large"})
            return
        content_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        if content_type != "application/json":
            self.send_json(415, {"error": "JSON content is required"})
            return

        try:
            payload = json.loads(self.rfile.read(request_size))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {"error": "Invalid JSON"})
            return
        if not isinstance(payload, dict):
            self.send_json(400, {"error": "A JSON object is required"})
            return

        visitor_id = normalize_id(payload.get("visitorId"))
        visit_id = normalize_id(payload.get("visitId"))
        if visitor_id is None or visit_id is None:
            self.send_json(400, {"error": "Valid visitor and visit IDs are required"})
            return

        now = int(time.time())
        try:
            with closing(connect_database()) as connection:
                with connection:
                    connection.execute(
                        """
                        INSERT INTO visits (visit_id, first_seen)
                        VALUES (?, ?)
                        ON CONFLICT(visit_id) DO NOTHING
                        """,
                        (visit_id, now),
                    )
                    connection.execute(
                        """
                        INSERT INTO active_visitors (visitor_id, last_seen)
                        VALUES (?, ?)
                        ON CONFLICT(visitor_id) DO UPDATE SET last_seen = excluded.last_seen
                        """,
                        (visitor_id, now),
                    )
                    counts = get_counts(connection, now)
            self.send_json(200, counts)
        except sqlite3.Error:
            logging.exception("Could not update visitor counts")
            self.send_json(503, {"error": "Visitor counts are unavailable"})


def main():
    initialize_database()
    port = int(os.environ.get("PORT", "4173"))
    server = ThreadingHTTPServer(("0.0.0.0", port), PortfolioHandler)
    logging.info("Portfolio server listening on port %s", port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    main()
