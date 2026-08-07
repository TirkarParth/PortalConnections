# PortalConnections

3D relational visualization of people connecting to an online portal from different countries, devices, time zones, and internet speeds.

## What you see

- **Country spheres** — larger when that country has more connection volume
- **Relation lines** — links between countries based on `related_country` in the CSV
- **Portal hub** — center node representing the online portal
- **Hover** — country name, connection count, average Mbps, devices, timezone

## Data

Synthetic CSV at `portal-connections-app/src/data/portal_connections.csv`:

| Column | Description |
|--------|-------------|
| `connection_id` | Unique session id |
| `user_id` | User identifier |
| `country` / `country_name` / `city` | Origin location |
| `timezone` | IANA timezone |
| `device` | `desktop`, `mobile`, or `tablet` |
| `internet_speed_mbps` | Measured speed |
| `connected_at` | ISO timestamp |
| `related_country` | Related country for the relational graph edge |

## Stack

| Area | Tech |
|------|------|
| UI | React + TypeScript |
| Build | Vite |
| 3D | Three.js |
| Deploy | GitHub Pages |

## Local start

```bash
cd portal-connections-app
npm install
npm run dev
```

## GitHub Pages

On every push to `main`, `.github/workflows/deploy.yml` builds and deploys the app.

After enabling **Settings → Pages → Source: GitHub Actions**, the site will be available at:

`https://<your-username>.github.io/PortalConnections/`
