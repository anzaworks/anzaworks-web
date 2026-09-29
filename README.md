# Anza Works

Two independent, local applications: a public multipage portfolio and a private offline admin. This build uses standards-based HTML, CSS, and JavaScript with no paid service or production database. It deliberately avoids a fake login. The existing static architecture has been retained so its working routes and offline data model remain intact; see **Known gaps** for the stack tradeoff.

## Run

Requires Python 3 and a modern browser. In two terminals from this directory:

```bash
npm run dev:portfolio
npm run dev:admin
```

Open `http://localhost:3000` and `http://localhost:3001`. Use separate origins so public pages cannot read admin IndexedDB. Run `npm ci`, then `npm test`, `npm run lint`, and `npm run build`. The apps themselves have no runtime npm dependencies. `build` regenerates portfolio HTML from `portfolio/build.py`.

## Structure

- `portfolio/` — static multipage public site; `build.py` holds typed-like concept data and generates case studies.
- `admin/` — independent offline PWA with IndexedDB repositories, domain calculations, and PDF export.
- `shared/` — reserved for public-safe shared contracts; no private admin data is shared.
- `docs/` — architecture, operations, security, and future plans.

Place your real logos at `portfolio/public/brand/` and `admin/public/brand/`. The current AW text and simple icon are fallbacks. The static site currently references its fallback directly; change the branding markup/icon paths after adding assets.

## Public routes

`/`, `/work/`, `/work/northline-hotel/`, `/work/saffron-table/`, `/work/form-and-found/`, `/work/counterpoint-pos/`, `/work/atlas-desk/`, `/services/`, `/about/`, `/process/`, `/contact/`. The project entries are clearly labeled concepts. The contact form opens an email draft addressed to `hello@anzaworks.lk`; replace with a verified inbox before publishing.

## Admin modules

Dashboard, Leads, Clients, Projects, Quotes, Invoices, Payments, Renewals, Expenses, Reports, Documents, Backup and Settings. Records are stored only in browser IndexedDB for the admin origin. Export an encrypted backup after entering real data. Save its password separately; it cannot be recovered. Restore replaces all records after confirmation.

## Known gaps

This is a functional local foundation, not a claim of complete production readiness. It does not include Next.js/React/TypeScript, native file attachments, cloud sync, server notifications, or a real authenticated multi-device deployment. The `typecheck` command currently checks JavaScript syntax and the Python generator; it is not a TypeScript check. The invoice PDF is a concise one-page offline document with ASCII transliteration and is unsuitable for long item lists; printing or a mature PDF library is the future upgrade. Browser notifications require permission and an open app. PWA installation varies by browser. See the docs for security boundaries and migration steps.

## Adding project video

Place approved, optimized MP4/WebM files and a poster in `portfolio/public/media/`, then add a slug entry to `portfolio/media.json`, for example `{"northline-hotel":{"mp4":"/public/media/northline.mp4","webm":"/public/media/northline.webm","poster":"/public/media/northline.jpg"}}`. Run `npm run build`. Video sources attach only after a visitor interacts with the player.
