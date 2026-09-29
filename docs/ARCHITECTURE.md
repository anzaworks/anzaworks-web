# Architecture

`portfolio` is public and statically generated into HTML from `build.py`. It never imports from `admin`. `admin` loads domain functions, a local repository implementation (`LocalRepository`), a PDF module, and an encrypted backup module. IndexedDB version 1 creates ten object stores; later schema changes must increment `VERSION` and migrate within `onupgradeneeded`. IDs are UUIDs; records carry creation and update timestamps.

The public case study source lives in `portfolio/data.py`; `portfolio/build.py` renders it into HTML and a generated `projects.json` with optional approved media and client fields. Optional video and poster paths are declared in `portfolio/media.json`; the reusable video loader defers sources until interaction. Future publishing must use explicit public-safe fields and a separate approval flow. The admin's private data must never be copied wholesale into the public app.

The apps use different localhost ports, hence distinct browser origins and storage. Production should use distinct origins and access control. The `shared` directory is intentionally empty until a safe public-only type contract exists.
