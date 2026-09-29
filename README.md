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

The concept cards use original code-based presentation art. They are not screenshots or commissioned client projects. The homepage uses the approved cinematic hero video at public/media/hero/anza-hero.mp4 and its poster frame. The poster also supplies the social preview image. The supplied flat AW mark appears in the header and footer, with a compact version as the public favicon. The glossy app icon is reserved for future Admin/PWA use.

## Adding approved project media

For a project in src/content.ts, set cover, gallery and video fields to public asset paths. For example:

    video: { mp4: "/media/projects/project.mp4", webm: "/media/projects/project.webm", poster: "/media/projects/project.webp" }

Place those files in public/media/projects/. Build again. The video component delays adding sources until the visitor presses Play. Do not publish unapproved imagery, invented results, fake testimonials, or unverified social links.

## Contact and publishing

The form validates locally and opens a draft in the visitor's email app. No enquiry is stored or sent to a server. Confirm that hello@anzaworks.lk is the correct destination before publishing. Canonicals, sitemap and social metadata use the future domain https://anzaworks.lk; edit the central site configuration in src/content.ts if it changes.

Nothing in this repository has been deployed.

## Hero media and profiles

The supplied hero clip is a muted H.264 MP4; the source audio is omitted. The opening frame supplies an immediate WebP poster that matches the first video frame. The film runs once and holds its final frame because its end does not loop seamlessly. Add a WebM source in the hero markup if one is approved later. On reduced-motion devices the poster replaces playback. Desktop pointer movement shifts the film by at most 6 px horizontally and 4 px vertically; scroll eases the film upward and fades the editorial copy. Mobile disables pointer movement.

Verified social profile URLs may be entered in `site.social` in `src/content.ts`. Null entries do not render. Confirm `hello@anzaworks.lk` and replace the concept studies with approved client material before publishing.

## Dot Cursor

Desktop mouse movement activates a single fixed Canvas 2D cursor across the public site. A 12 px warm-white head (`#F1F1F1`) carries an 11-sample tapered deep-red (`#C91422`) ribbon, up to 6.8 px thick. Links and buttons transition to a 30 px hollow red ring and shorten the trail. `data-cursor="hide"` restores the native cursor over designated areas. No cursor label or automatic CTA underline is used.

The native cursor is hidden only after real mouse movement and restored on exit, blur, hidden areas, or failure. The feature is disabled below 900 px and with reduced motion, without relying on fine-pointer media queries. DPR is capped at 1.75; frames stop when the head and trail settle, pause in hidden tabs, and all listeners and observers are released on teardown. The canvas does not intercept input. The mobile navigation remains a body-level fixed overlay with scroll locking and keyboard handling.
