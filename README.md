# Anza Works — public portfolio

The current Anza Works public portfolio. The private Admin app is **not** part of this build. No database, customer records, authentication, paid APIs or deployment are included.

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

Home, Work, seven public project case studies, Services, About and Contact. `/process/` is a small compatibility route pointing to Services. Main navigation is Home / Work / Services / About / Contact.

Content lives in `src/content.ts`, static HTML/SEO in `src/build.ts`, interactions in `src/browser.ts`, and styles in `src/style.css`. Private systems are text-only entries in the Work archive: Mr Apple.lk POS and Hotel Bonavista Admin. Neither has a public URL or invented product screen.

## Real project imagery and content

Local WebP captures live in `public/projects/<slug>/`. The seven supplied public websites were inspected on 30 September 2026. Summaries describe their visible interfaces; no wallet transactions, revenue, testimonials, delivery role or unknown implementation technology is claimed. GenLayer Studionet is named only where the public site identifies it. Demo records are excluded from the saved crops. Bonavista has an additional room-overview capture. Booking is described as an enquiry entry point because the website labels online booking as coming soon.

Capture provenance and limits are recorded in `public/projects/README.md`. For new projects, add actual local captures, useful alt text, dimensions, verified features and the exact live URL to `src/content.ts`. No external screenshot hotlinks are used.

## Selected Work slider

`src/smooth-work-slider.ts` enhances a native horizontal list. Desktop (900 px and above, reduced motion off) uses three repeated sets for looping, eased wheel movement, mouse drag, arrow buttons and keyboard arrows. Scale stays between 0.94 and 1.00; surrounding cards dim gently. Narrow screens and reduced motion retain native scroll snap and controls, with no wheel interception or loop clones. Without JavaScript the real case-study links and swipeable list remain usable.

Animation runs only while easing, stops offscreen/in hidden tabs, and observers/listeners/clones are released by `destroy()`. No React or animation library is required.

The approved hero film, AW logos, Dot Cursor implementation and body-level mobile-menu architecture are preserved.

## Contact and publishing

The form validates locally and opens a draft in the visitor's email app. No enquiry is stored or sent to a server. Confirm that hello@anzaworks.lk is the correct destination before publishing. Canonicals, sitemap and social metadata use the future domain https://anzaworks.lk; edit the central site configuration in src/content.ts if it changes.

Nothing in this repository has been deployed.

## Hero media and profiles

The supplied hero clip is a muted H.264 MP4; the source audio is omitted. The opening frame supplies an immediate WebP poster that matches the first video frame. The film runs once and holds its final frame because its end does not loop seamlessly. Add a WebM source in the hero markup if one is approved later. On reduced-motion devices the poster replaces playback. Desktop pointer movement shifts the film by at most 6 px horizontally and 4 px vertically; scroll eases the film upward and fades the editorial copy. Mobile disables pointer movement.

Verified social profile URLs may be entered in `site.social` in `src/content.ts`. Null entries do not render. Confirm `hello@anzaworks.lk` before publishing.

## Dot Cursor

Desktop mouse movement activates a single fixed Canvas 2D cursor across the public site. A 12 px warm-white head (`#F1F1F1`) carries an 11-sample tapered deep-red (`#C91422`) ribbon, up to 6.8 px thick. Links and buttons transition to a 30 px hollow red ring and shorten the trail. `data-cursor="hide"` restores the native cursor over designated areas. No cursor label or automatic CTA underline is used.

The native cursor is hidden only after real mouse movement and restored on exit, blur, hidden areas, or failure. The feature is disabled below 900 px and with reduced motion, without relying on fine-pointer media queries. DPR is capped at 1.75; frames stop when the head and trail settle, pause in hidden tabs, and all listeners and observers are released on teardown. The canvas does not intercept input. The mobile navigation remains a body-level fixed overlay with scroll locking and keyboard handling.

## Work layout and image framing

The archive formerly reused `.project-caption` with a 32 px number column. The legacy selector `.project-card:not(.project-large) .project-num` has greater specificity than `.real-project-grid .project-num`, so its `grid-column: 1 / -1` survived. The number occupied the whole first row; automatic grid placement then put the content wrapper into the 32 px first track. This caused word-per-line descriptions and links.

Archive cards now use their own stacked `.work-card-body`: image, number/category row, title, description and actions. Description measure is 50ch on desktop, with 16–18 px type and 1.65 line height. Actions are inline flex with non-wrapping labels. The archive uses two columns from 1024 px, and one below that breakpoint; row/column gaps are 48/32 px on desktop.

Screenshot frames use 16:10 with cover/top-center placement. Prism Jury's former 1280×476 capture was too shallow for that frame; it is now a focused 762×476 crop of the actual public hero. Dispute Dock was recaptured and framed at 960×600, excluding the example payout and demo agreement data. The other five captures use their existing local assets with the corrected cover fit. Hero media is untouched.

The Home Selected Work slider is the final project slider. Its design, motion, project order, wheel/drag behavior and mobile swipe fallback are preserved.
