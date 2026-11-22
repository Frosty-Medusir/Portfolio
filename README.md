# Joseph Otieno — Portfolio

A minimal multi-page portfolio for Joseph Otieno, a Nairobi-based Cloud Data Engineer and product builder.

Pages: home, About, Projects, Experience, and Contact. The About page uses the
provided portrait; the Projects page includes a simple X Topic Tracker pipeline
overview.

Footer icons are from Hugeicons and were supplied for this portfolio.
The custom red/yellow brand mark is an SVG in `assets/brand.svg`.
The home page shows a greeting and clock based on the visitor's browser time
zone, Nairobi time, and shared visit counts from a small SQLite-backed API.
The visitor location label is an estimate based on the browser time zone, not
GPS.

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
- Set `FRONTEND_ORIGIN=https://josephotieno1.netlify.app` on Render to allow the
  Netlify frontend to send visitor-count requests. If you use a custom domain,
  set this to that site's exact origin instead.

The Netlify site serves the frontend, and the Render service hosts the API.
Connect Netlify to this repository and publish the repository root; pushes to
its configured branch redeploy the frontend. Visits count once per browser tab
session. Random IDs are stored locally in the browser, and only their hashes
are stored by the server. Keep this SQLite-backed service at one instance.
Render persistent disks are available on paid services and keep the database
across deploys; without one, the counts can reset when Render restarts the
service.
