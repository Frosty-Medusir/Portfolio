# Joseph Otieno — Portfolio

A minimal multi-page portfolio for Joseph Otieno, a Nairobi-based Cloud Data Engineer and product builder.

Pages: home, About, Projects, Experience, and Contact. The About page uses the
provided portrait; the Projects page includes a simple X Topic Tracker pipeline
overview.

Footer icons are from Hugeicons and were supplied for this portfolio.
The custom red/yellow brand mark is an SVG in `assets/brand.svg`.
The home page shows a timezone-based local greeting and clock, plus shared visit
and active-visitor counts from a small SQLite-backed API. Greetings use the
visitor's browser time zone; the location label is an estimate based on that
time zone, not GPS.

## Run locally

From the project directory:

```bash
python3 app.py
```

Then visit `http://localhost:4173`.

## Deploy on Render

Create a Python Web Service for this repository:

- Build command: `python3 -m compileall -q app.py`
- Start command: `python3 app.py`
- Health check path: `/api/status`
- Add a persistent disk mounted at `/var/data`, then set
  `VISITOR_DATA_DIR=/var/data` so counts survive service restarts.

The service serves both the portfolio and its same-origin API. Visits count
once per browser tab session; “here now” counts distinct browsers that sent a
heartbeat in the last two minutes. Random IDs are stored locally in the
browser, and only their hashes are stored by the server. Keep this SQLite-backed
service at one instance. Render persistent disks are available on paid services
and keep the database across deploys; without one, the counts can reset when
Render restarts the service.
