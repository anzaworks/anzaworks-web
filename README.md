# Anza Works — public portfolio

A fresh Stage 1 public portfolio. The private Admin app is **not** part of this build. No database, customer records, authentication, paid APIs or deployment are included.

## Local setup

Requires Node.js 20+ and Python 3:

    npm ci
    npm run build
    npm run dev

Open http://localhost:3000. The generated static site lives in the ignored site/ folder.

Checks:

    npm run lint
    npm run typecheck
    npm test
    npm run build

TypeScript is checked in strict mode. The build creates static HTML for every route, browser JavaScript, sitemap, robots.txt and public project JSON. It uses no runtime framework or animation library. The 404.html and error.html files are supplied for hosts that support custom error pages; configure the host to serve them for missing routes.

## Pages

Home, Work, five labeled concept case studies, Services, About, Process, Contact, and utility error pages. Content and project schema live in src/content.ts; HTML and SEO output in src/build.ts; interactions in src/browser.ts; styles in src/style.css.

The concept cards use original code-based presentation art. They are not screenshots or commissioned client projects. The homepage uses the approved cinematic hero video at public/media/hero/anza-hero.mp4 and its poster frame. The previous hero concept art remains in assets/ as source history and is no longer loaded. The typographic AW header/fav icon is a temporary fallback. Place the approved AW brand assets in public/brand/ and update the markup only when they are supplied.

## Adding approved project media

For a project in src/content.ts, set cover, gallery and video fields to public asset paths. For example:

    video: { mp4: "/assets/project.mp4", webm: "/assets/project.webm", poster: "/assets/project.webp" }

Place those files in assets/. Build again. The video component delays adding sources until the visitor presses Play. Do not publish unapproved imagery, invented results, fake testimonials, or unverified social links.

## Contact and publishing

The form validates locally and opens a draft in the visitor's email app. No enquiry is stored or sent to a server. Confirm that hello@anzaworks.lk is the correct destination before publishing. Canonicals, sitemap and social metadata use the future domain https://anzaworks.lk; edit the central site configuration in src/content.ts if it changes.

Nothing in this repository has been deployed.

## Hero media and profiles

The 10 second, 1280×720 supplied hero clip was encoded to a muted, fast-start H.264 MP4 (under 1 MB); the source audio is omitted. The opening frame supplies an immediate WebP poster that matches the first video frame. The film runs once and holds its final frame because its end does not loop seamlessly. Add a WebM source in the hero markup if one is approved later. On reduced-motion devices the poster replaces playback. Desktop pointer movement shifts the film by at most 6 px horizontally and 4 px vertically; scroll eases the film upward and fades the editorial copy. Mobile disables pointer movement.

Verified social profile URLs may be entered in `site.social` in `src/content.ts`. Null entries do not render. Confirm `hello@anzaworks.lk` and replace the concept studies with approved client material before publishing.
