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

The form validates locally and opens a draft in the visitor's email app. No enquiry is stored or sent to a server. The verified public contacts are Ansafbisthamy@gmail.com and +94 76 618 3838 (tel:+94766183838). WhatsApp is also approved at https://wa.me/94766183838; its button appears only on Contact and as a compact footer link. Both open safely in a new tab. The form reads its recipient from its mailto action; name, email, project type and a message of at least 15 characters are required. Canonicals, sitemap and social metadata temporarily use https://anzaworks-web.vercel.app. Once the custom domain is connected, change only `site.origin` in `src/content.ts` back to https://anzaworks.lk.

Nothing in this repository has been deployed.

## Hero media and profiles

The supplied hero clip is a muted H.264 MP4; the source audio is omitted. The opening frame supplies an immediate WebP poster that matches the first video frame. The film runs once and holds its final frame because its end does not loop seamlessly. Add a WebM source in the hero markup if one is approved later. On reduced-motion devices the poster replaces playback. Desktop pointer movement shifts the film by at most 6 px horizontally and 4 px vertically; scroll eases the film upward and fades the editorial copy. Mobile disables pointer movement.

Verified social profile URLs may be entered in `site.social` in `src/content.ts`. Null entries do not render.

## Dot Cursor

Desktop mouse movement activates a single fixed Canvas 2D cursor across the public site. A 12 px warm-white head (`#F1F1F1`) carries an 11-sample tapered deep-red (`#C91422`) ribbon, up to 6.8 px thick. Links and buttons transition to a 30 px hollow red ring and shorten the trail. `data-cursor="hide"` restores the native cursor over designated areas. No cursor label or automatic CTA underline is used.

The native cursor is hidden only after real mouse movement and restored on exit, blur, hidden areas, or failure. The feature is disabled below 900 px and with reduced motion, without relying on fine-pointer media queries. DPR is capped at 1.75; frames stop when the head and trail settle, pause in hidden tabs, and all listeners and observers are released on teardown. The canvas does not intercept input. The mobile navigation remains a body-level fixed overlay with scroll locking and keyboard handling.

## Work layout and image framing

The archive formerly reused `.project-caption` with a 32 px number column. The legacy selector `.project-card:not(.project-large) .project-num` has greater specificity than `.real-project-grid .project-num`, so its `grid-column: 1 / -1` survived. The number occupied the whole first row; automatic grid placement then put the content wrapper into the 32 px first track. This caused word-per-line descriptions and links.

Archive cards now use their own stacked `.work-card-body`: image, number/category row, title, description and actions. Description measure is 50ch on desktop, with 16–18 px type and 1.65 line height. Actions are inline flex with non-wrapping labels. The archive uses two columns from 1024 px, and one below that breakpoint; row/column gaps are 48/32 px on desktop.

Screenshot frames use 16:10 with cover/top-center placement. Prism Jury's former 1280×476 capture was too shallow for that frame; it is now a focused 762×476 crop of the actual public hero. Dispute Dock was recaptured and framed at 960×600, excluding the example payout and demo agreement data. The other five captures use their existing local assets with the corrected cover fit. Hero media is untouched.

The Home Selected Work slider is the final project slider. Its design, motion, project order, wheel/drag behavior and mobile swipe fallback are preserved.


## Social sharing

Normal pages use `/brand/anza-social-preview.png`: a dedicated 1200×630 PNG with the existing AW mark, ANZA WORKS wordmark and Creative Digital Studio subtitle on #050505 with #C91422 accents. The logo asset is composed without redesign. Open Graph and Twitter images use absolute URLs from `site.origin`, with image alt text and appropriate MIME type/dimensions. Project case studies retain their real local WebP screenshots and corresponding dimensions/alt text. Favicon and Apple touch icon remain `/brand/anza-icon.png`.

The pushed source and live metadata were inspected before this change. The live page pointed social image/canonical URLs to the future custom domain and omitted Twitter image metadata. This source fix has not been deployed; sharing previews can be cached by platforms and are only eligible to update after these files are published.

## Integrated glass logo

About, Services and Work use the local AW artwork as a rounded liquid-glass extrusion. About has the largest visual; Services and Work use progressively smaller stages in their introductions. The original red swoosh is extracted from the artwork's RGB/alpha and mapped in object space, while the white AW body retains neutral translucent glass. Source logo assets are unchanged.

Only these three routes load the small lazy loader and scoped stylesheet. The WebGL module is imported when the stage intersects the viewport. Settings remain depth 30, size 60, speed 20, clockwise, chromatic 10, frost 14. Desktop from 900px with reduced motion off has slow rotation, pointer tilt and bounded mouse drag. Mobile and reduced motion render a static pose, without a continuous RAF or touch capture. The normal logo is the fallback for failed WebGL, shader/image loading or context loss.

The alpha distance field and red mask are baked once on image load, with local reusable reflection/light textures. DPR is capped at 1.5 desktop / 1 mobile; render dimensions at 780px. Hidden/offscreen rendering pauses. Destroy releases RAF, observers, listeners, textures, shaders, program and buffer. The visual is decorative, cannot receive keyboard focus, and allows natural vertical touch scrolling.

Validation: lint, typecheck, all 29 tests and production build pass. The integrated GLSL compiled, linked and rendered using an offline Mesa EGL ES2 studio-light approximation; the red source mask is visibly preserved. This is a shader check, not a browser screenshot. Responsive CSS was logically checked at 1440×900, 1024×768, 768×1024, 390×844 and 320×720; rendered browser QA remains unverified. All original public assets and protected interaction modules are byte-identical to the approved preview source. Home and Contact generated HTML are also unchanged.

## Transparent glass compositing fix

The original stage CSS painted #050505, and the WebGL framebuffer cleared to opaque #050505. The stage and canvas now have transparent CSS backgrounds. WebGL uses alpha:true and premultipliedAlpha:true, clears to RGBA(0,0,0,0), and outputs premultiplied RGB with ONE / ONE_MINUS_SRC_ALPHA blending. Rays missing the actual logo are discarded. The local studio-light plate remains only a material/refraction texture sampled on the object; there is no visible background pass.

Placement, dimensions, motion, geometry, page backgrounds, source artwork and fallback image are unchanged. Mobile/static rendering uses the same transparent compositing. Fallback remains the original transparent AW PNG without a wrapper surface.

Validation: all four required commands pass, including 29 tests. Actual GLSL was compiled, linked and rendered in an offline EGL ES2 framebuffer: every tested outside corner is RGBA(0,0,0,0), with 338,332 transparent pixels and 5,162 branded red pixels in a 600×600 sample. This is not browser visual verification. The required browser check was attempted but local preview access was blocked with ERR_BLOCKED_BY_CLIENT by the cloud browser's URL security policy. Browser visual verification at 1440×900, 1024×768, 768×1024, 390×844 and 320×720 remains incomplete.
