import { mkdirSync, writeFileSync, copyFileSync, cpSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { projects, services, process as phases, privateSystems, site, type Project } from "./content.js";

const root = process.cwd();
const out = join(root, "site");
rmSync(out, { recursive: true, force: true });
const esc = (value: unknown): string => String(value).replace(/[&<>"']/g, character =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
const attr = esc;
const navItems = [["/", "Home"], ["/work/", "Work"], ["/services/", "Services"], ["/about/", "About"], ["/contact/", "Contact"]] as const;

function page(path: string, title: string, description: string, body: string, options: { noindex?: boolean; type?: string; image?: string } = {}): void {
  const url = site.origin + path;
  const jsonLd = options.type === "case"
    ? { "@context": "https://schema.org", "@type": "CreativeWork", name: title, description, creator: { "@type": "Organization", name: site.name }, url }
    : { "@context": "https://schema.org", "@type": "Organization", name: site.name, url: site.origin, description: site.description };
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="theme-color" content="#050505">',
    options.noindex ? '<meta name="robots" content="noindex">' : "",
    '<title>' + esc(title) + ' | Anza Works</title>',
    '<meta name="description" content="' + attr(description) + '">',
    '<link rel="canonical" href="' + attr(url) + '">',
    '<meta property="og:site_name" content="Anza Works">',
    '<meta property="og:type" content="' + (options.type === "case" ? "article" : "website") + '">',
    '<meta property="og:title" content="' + attr(title + " | Anza Works") + '">',
    '<meta property="og:description" content="' + attr(description) + '">',
    '<meta property="og:url" content="' + attr(url) + '">',
    '<meta property="og:image" content="' + site.origin + attr(options.image ?? '/media/hero/anza-hero-poster.webp') + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + attr(title + " | Anza Works") + '">',
    '<meta name="twitter:description" content="' + attr(description) + '">',
    '<link rel="icon" href="/brand/anza-icon.png" type="image/png">',
    '<link rel="apple-touch-icon" href="/brand/anza-icon.png">',
    '<link rel="stylesheet" href="/style.css">',
    path === "/" ? '<link rel="preload" href="/media/hero/anza-hero-poster.webp" as="image" type="image/webp" fetchpriority="high">' : "",
    '<script type="application/ld+json">' + JSON.stringify(jsonLd).replace(/</g, "\\u003c") + '</script>',
    '<script type="module" src="/browser.js"></script>'
  ].join("");
  const pageNavItems = navItems;
  const header = '<a class="skip-link" href="#main">Skip to content</a><header class="site-header" id="header"><div class="shell nav-shell">' +
    '<a class="wordmark" href="/" aria-label="Anza Works home"><img class="brand-logo brand-logo-header" src="/brand/anza-logo-main.png" alt="" width="68" height="48"><span>ANZA <i>WORKS</i></span></a>' +
    '<nav class="desktop-nav" aria-label="Primary">' + pageNavItems.map(([href, label]) => '<a href="' + href + '">' + label + '</a>').join("") + '</nav>' +
    '<button class="menu-button" type="button" aria-label="Open menu" aria-controls="mobile-nav" aria-expanded="false"><span></span><span></span></button></div></header>' +
    '<nav class="mobile-nav" id="mobile-nav" aria-label="Mobile" inert>' +
    pageNavItems.map(([href, label], index) => '<a href="' + href + '"><small>0' + (index + 1) + '</small>' + label + '<span aria-hidden="true">↗</span></a>').join("") +
    '<a class="mobile-contact" href="/contact/">Start a project ↗</a></nav>';
  const socialLinks = Object.entries(site.social).filter(([, url]) => url).map(([label, url]) => '<a href="' + attr(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + ' ↗</a>').join("");
  const footer = '<footer class="footer"><div class="shell"><div class="footer-grid"><div><a href="/" class="footer-brand" aria-label="Anza Works home"><img class="brand-logo brand-logo-footer" src="/brand/anza-logo-main.png" alt="" width="120" height="86"><span>ANZA WORKS</span></a><p>Visual craft. Useful engineering.<br>Made to work together.</p></div>' +
    '<div><p class="eyebrow">Explore</p><a href="/work/">Work</a><a href="/services/">Services</a><a href="/about/">About</a><a href="/contact/">Contact</a></div>' +
    '<div><p class="eyebrow">Say hello</p><a href="mailto:' + site.email + '">' + site.email + '</a>' + socialLinks + '</div></div>' +
    '<div class="footer-base"><span>© 2026 Anza Works</span><span>Independent digital studio</span><a href="#main">Back to top ↑</a></div></div></footer>';
  const html = '<!doctype html><html lang="en"><head>' + head + '</head><body>' +
    '<div class="scroll-progress" aria-hidden="true"></div>' + header + '<main id="main">' + body + '</main>' + footer + '</body></html>';
  const file = join(out, path === "/" ? "index.html" : path.replace(/^\/|\/$/g, "") + "/index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

const arrow = '<span aria-hidden="true">↗</span>';
const button = (href: string, label: string, kind = "primary"): string =>
  '<a class="button button-' + kind + '" href="' + href + '"><span>' + label + '</span>' + arrow + '</a>';
const section = (id: string, index: string, label: string, title: string, content: string, extra = ""): string =>
  '<section id="' + id + '" class="section ' + extra + '"><div class="shell"><div class="section-top reveal"><p class="eyebrow">' + index + ' / ' + label +
  '</p><h2>' + title + '</h2></div>' + content + '</div></section>';
const pageHero = (label: string, title: string, copy: string): string =>
  '<section class="page-hero"><div class="shell"><p class="eyebrow reveal">' + label +
  '</p><h1 class="reveal">' + title + '</h1><p class="lead reveal">' + copy +
  '</p></div><div class="page-orbit" aria-hidden="true"></div></section>';

const projectImage = (project: Project, className = ""): string =>
  '<img class="' + className + '" src="' + attr(project.cover) + '" alt="' + attr(project.coverAlt) + '" width="' + project.coverWidth + '" height="' + project.coverHeight + '" loading="lazy" decoding="async">';
const liveLink = (project: Project): string => '<a class="case-link" href="' + attr(project.liveUrl) + '" target="_blank" rel="noopener noreferrer" aria-label="View ' + attr(project.title) + ' live (opens in a new tab)">View Live ↗</a>';
function projectCard(project: Project, index: number): string {
  return '<article class="project-card work-archive-card reveal"><a class="project-cover real-project-cover" href="/work/' + attr(project.slug) + '/" aria-label="View ' + attr(project.title) + ' case study">' + projectImage(project) + '</a>' +
    '<div class="work-card-body"><div class="work-card-meta"><span class="work-card-number">' + String(index).padStart(2, "0") + '</span><p class="eyebrow">' + esc(project.category) + '</p></div><h3><a href="/work/' + attr(project.slug) + '/">' + esc(project.title) + '</a></h3><p class="work-card-description">' + esc(project.summary) + '</p><div class="work-card-actions"><a class="case-link" href="/work/' + attr(project.slug) + '/">View Case Study ↗</a>' + liveLink(project) + '</div></div></article>';
}
const processContent = '<div class="value-grid">' + phases.map(([title, copy], i) => '<article class="value-card reveal"><span>0' + (i + 1) + '</span><h3>' + esc(title) + '</h3><p>' + esc(copy) + '</p></article>').join("") + '</div>';
const featuredOrder = ["hotel-bonavista", "source-seal", "proof-halt", "prism-jury", "archive-relay"];
const featured = featuredOrder.map(slug => projects.find(p => p.slug === slug)!);
const slider = '<div class="smooth-work-slider" data-work-slider role="region" aria-label="Selected work" aria-roledescription="carousel"><div class="work-slider-viewport" tabindex="0" aria-label="Project slides. Use left and right arrow keys, swipe or drag."><div class="work-slider-track">' +
  featured.map((project, i) => '<article class="work-slide" data-slide-index="' + i + '" aria-label="' + (i + 1) + ' of ' + featured.length + ': ' + attr(project.title) + '"><a href="/work/' + attr(project.slug) + '/" draggable="false" aria-label="View ' + attr(project.title) + ' case study"><div class="work-slide-image">' + projectImage(project) + '</div><div class="work-slide-caption"><div><p class="eyebrow">' + esc(project.category) + '</p><h3>' + esc(project.title) + '</h3></div><span>View project ↗</span></div></a></article>').join("") +
  '</div></div><div class="work-slider-controls"><p>Scroll sideways · drag to explore</p><span class="work-slider-status" aria-live="polite" aria-atomic="true">1 / 5</span><button type="button" data-slider-prev aria-label="Previous project">←</button><button type="button" data-slider-next aria-label="Next project">→</button></div></div>';
const endCta = '<section id="contact" class="end-cta"><div class="shell"><p class="eyebrow">The next project starts here</p><h2>LET’S BUILD<br>SOMETHING<br><em>WORTH REMEMBERING.</em></h2><div class="cta-links">' +
  button("/contact/", "Start a project") + button("mailto:" + site.email, "Email directly", "outline") + '</div></div></section>';

function socialLinksForHero(): string {
  return Object.entries(site.social).filter(([, url]) => url).map(([label, url]) => '<a href="' + attr(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a>').join("");
}
const home = '<section class="hero" id="hero"><div class="hero-ambient" aria-hidden="true"></div>' +
  '<div class="hero-visual" aria-hidden="true"><video class="hero-video" autoplay muted playsinline preload="metadata" poster="/media/hero/anza-hero-poster.webp" disablepictureinpicture><source src="/media/hero/anza-hero.mp4" type="video/mp4"></video></div>' +
  '<div class="hero-vignette" aria-hidden="true"></div><div class="shell hero-shell"><div class="hero-copy"><p class="eyebrow">ANZA WORKS / INDEPENDENT DIGITAL STUDIO</p>' +
  '<h1>DIGITAL<br>EXPERIENCES<br><span>BUILT DIFFERENTLY.</span></h1><p class="hero-lead">I design and build websites, software and digital systems for businesses that want something beyond the ordinary.</p></div>' +
  '<a class="hero-work" href="#featured">VIEW WORK <span aria-hidden="true">↗</span></a>' +
  '<div class="hero-bottom"><div class="hero-social">' + socialLinksForHero() + '</div><span>© 2026 ANZA WORKS</span></div>' +
  '<a class="scroll-hint" href="#featured" aria-label="Scroll to selected work">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a></div></section>' +
  section("featured", "01", "Selected work", "SELECTED<br>WORK.", slider, "featured") +
  section("capabilities", "02", "Services", "WHAT I<br>BUILD.", '<div class="service-list">' + services.slice(0, 4).map((s, i) => '<a class="service-line reveal" href="/services/"><span class="service-index">0' + (i + 1) + '</span><h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) + '</p><span class="service-arrow" aria-hidden="true">↗</span></a>').join("") + '</div>') +
  section("about", "03", "Anza Works", "DESIGN.<br>CODE. PURPOSE.", '<div class="case-columns"><p class="lead">I build websites, web applications and business systems through Anza Works.</p><div><p>The starting point is practical: what should this help someone do? Content, visual design and development follow that task, with care for the details that make it easy to use.</p>' + button("/about/", "Meet Anza Works", "outline") + '</div></div>') +
  section("process", "04", "Process", "FROM BRIEF<br>TO WORKING PRODUCT.", processContent) +
  section("more-work", "05", "Portfolio archive", "THERE’S MORE<br>TO EXPLORE.", '<p class="lead">Seven public projects, from hospitality to evidence-driven applications, plus private business systems in progress.</p><div class="section-action">' + button("/work/", "Explore all work", "outline") + '</div>') + endCta;
page("/", "Creative digital studio", site.description, home);

const work = pageHero("Work / 01", "WORK WITH<br>A CLEAR PURPOSE.", "Public websites and applications, built around real tasks. Explore the interfaces and the thinking behind them.") +
  section("projects", "01", "Public projects", "THE PORTFOLIO.", '<div class="project-grid real-project-grid">' + projects.map((p, i) => projectCard(p, i + 1)).join("") + '</div>') +
  section("private-systems", "02", "Private systems / In progress", "BEHIND<br>THE SCENES.", '<div class="private-system-grid">' + privateSystems.map(system => '<article class="private-system-card"><p class="eyebrow">' + esc(system.status) + '</p><h3>' + esc(system.title) + '</h3><p class="private-category">' + esc(system.category) + '</p><p>' + esc(system.description) + '</p></article>').join("") + '</div>') + endCta;
page("/work/", "Work", "Seven public projects from Anza Works: hospitality websites, evidence applications and security governance interfaces.", work);

projects.forEach((project, index) => {
  const next = projects[(index + 1) % projects.length]!;
  const hero = '<section class="case-hero"><div class="shell"><p class="eyebrow">Public project / ' + esc(project.category) + '</p><h1>' + esc(project.title) + '</h1><p class="lead">' + esc(project.subtitle) + '</p><div class="case-facts">' + liveLink(project) + '</div><figure class="case-screenshot">' + projectImage(project) + '<figcaption>' + esc(project.title) + ' — public website capture</figcaption></figure></div></section>';
  const overview = section("overview", "01", "Overview", "THE PROJECT.", '<div class="case-columns"><p class="lead">' + esc(project.description) + '</p><div><h3>Visual direction</h3><p>' + esc(project.design) + '</p>' + (project.platform ? '<p class="eyebrow">Platform shown on the public site</p><p>' + esc(project.platform) + '</p>' : '') + '</div></div>');
  const features = section("features", "02", "Visible functionality", "A CLOSER LOOK.", '<div class="feature-rows">' + project.features.map((feature, i) => '<div class="feature-row"><span>0' + (i + 1) + '</span><h3>' + esc(feature) + '</h3></div>').join("") + '</div>');
  const gallery = project.gallery.length ? section("gallery", "03", "Visual gallery", "MORE OF<br>THE EXPERIENCE.", '<div class="project-gallery">' + project.gallery.map(image => '<figure><img loading="lazy" decoding="async" src="' + attr(image.src) + '" alt="' + attr(image.alt) + '" width="1280" height="880"><figcaption>' + esc(image.alt) + '</figcaption></figure>').join("") + '</div>') : '';
  const nextBlock = '<section class="next-work"><div class="shell"><p class="eyebrow">Next public project</p><a href="/work/' + attr(next.slug) + '/">' + esc(next.title) + '<span aria-hidden="true">↗</span></a></div></section>';
  page("/work/" + project.slug + "/", project.title, project.summary, hero + overview + features + gallery + '<div class="shell project-live-action">' + liveLink(project) + '</div>' + nextBlock, { type: "case", image: project.cover });
});

const servicesPage = pageHero("Services / 02", "WHAT I<br>BUILD.", "Websites, custom applications and internal tools, shaped around how people actually use them.") +
  section("services", "01", "Capabilities", "RIGHT TOOL.<br>RIGHT REASON.", '<div class="services-grid">' + services.map((s, i) => '<article class="service-tile reveal"><div class="tile-top"><span>0' + (i + 1) + '</span><small>' + esc(s[2]) + '</small></div><h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) + '</p><a href="/contact/" aria-label="Enquire about ' + attr(s[0]) + '">Discuss this service ↗</a></article>').join("") + '</div>') +
  section("examples", "02", "In practice", "SEE THE<br>WORK.", '<div class="case-columns"><p class="lead">Hotel Bonavista brings rooms and place together. Source Seal and Prism Jury organize complex evidence workflows into focused interfaces.</p><div>' + button("/work/", "View the portfolio", "outline") + '</div></div>') +
  section("process", "03", "Working together", "A CLEAR PATH<br>THROUGH THE WORK.", processContent) + endCta;
page("/services/", "Services", "Web design, business and hospitality websites, custom applications, admin dashboards and POS systems from Anza Works.", servicesPage);

const aboutPage = pageHero("About / 03", "DESIGN THE SURFACE.<br>BUILD THE SYSTEM.", "Anza Works is my independent practice for websites, web applications and practical business tools.") +
  section("studio", "01", "Who / Anza Works", "A PRACTICAL<br>POINT OF VIEW.", '<div class="case-columns"><p class="lead">I bring design and development into the same conversation.</p><div><p>A hospitality website needs to help someone imagine a stay. An application needs to make a demanding task easier to follow. An internal tool needs to fit the working day.</p><p>Those needs guide the content, the interface and the way the system is built.</p></div></div>') +
  section("approach", "02", "Approach", "MAKE IT CLEAR.<br>MAKE IT USEFUL.", processContent) +
  section("tools", "03", "Tools & capabilities", "A FOCUSED<br>TOOLKIT.", '<p class="lead">Responsive interfaces, accessible navigation and maintainable structure. This portfolio uses semantic HTML, CSS, TypeScript and a small Node.js static build.</p><div class="chip-row"><span>HTML</span><span>CSS</span><span>TypeScript</span><span>Node.js</span></div><div class="section-action">' + button("/work/", "Selected work", "outline") + '</div>') + endCta;
page("/about/", "About", "Meet Anza Works: an independent design and development practice focused on websites, web applications and business systems.", aboutPage);

page("/process/", "Process", "The Anza Works process now lives alongside our services.", pageHero("Process", "THE WAY<br>WE WORK.", "Understand the task, design and build, then review and hand over. The full approach is now part of Services.") + '<div class="shell utility-action">' + button("/services/#process", "Explore services & process") + '</div>', { noindex: true });

const contactPage = pageHero("Contact / 05", "HAVE A PROJECT IN MIND?<br>LET’S BUILD IT.", "Share what you are planning. This form opens an email draft; nothing is stored on the site.") +
  '<section class="section contact-section"><div class="shell contact-grid"><div><p class="eyebrow">Project enquiry</p><h2>TELL ME<br>THE SHAPE<br>OF IT.</h2><p>What are you building, and where do you need help?</p><a class="mail-link" href="mailto:' +
    site.email + '">' + site.email + ' ↗</a></div>' +
  '<form class="contact-form" id="enquiry" action="mailto:' + site.email + '" method="post" enctype="text/plain">' +
  '<div class="field"><label for="name">Name <b>*</b></label><input id="name" name="Name" required maxlength="100" autocomplete="name"></div>' +
  '<div class="field"><label for="business">Business name</label><input id="business" name="Business name" maxlength="120" autocomplete="organization"></div>' +
  '<div class="field"><label for="email">Email <b>*</b></label><input id="email" name="Email" type="email" required autocomplete="email"></div>' +
  '<div class="field"><label for="phone">Phone / WhatsApp</label><input id="phone" name="Phone or WhatsApp" type="tel" autocomplete="tel"></div>' +
  '<div class="field"><label for="project-type">Project type <b>*</b></label><select id="project-type" name="Project type" required><option value="">Select a type</option><option>Website</option><option>Online shop</option><option>Software / app</option><option>Other</option></select></div>' +
  '<div class="field"><label for="budget">Budget range</label><select id="budget" name="Budget range"><option value="">Prefer to discuss</option><option>Under LKR 250,000</option><option>LKR 250,000–500,000</option><option>LKR 500,000–1,000,000</option><option>Over LKR 1,000,000</option></select></div>' +
  '<div class="field"><label for="target-date">Target date</label><input id="target-date" name="Target date" type="date"></div>' +
  '<div class="field full"><label for="message">Project message <b>*</b></label><textarea id="message" name="Message" required minlength="15" maxlength="3000" placeholder="What would you like to build?"></textarea></div>' +
  '<div class="field full">' + '<button type="submit" class="button button-primary"><span>Open email draft</span><span aria-hidden="true">↗</span></button>' +
  '<p id="form-status" role="status" aria-live="polite">Your email app will handle sending.</p></div></form></div></section>';
page("/contact/", "Contact", "Have a project in mind? Discuss a website, application or business system with Anza Works.", contactPage);

page("/404/", "Page not found", "The requested page could not be found.",
  pageHero("404 / Missing page", "THIS PAGE<br>WANDERED OFF.", "The address may have changed. The studio is one step away.") +
  '<div class="shell utility-action">' + button("/", "Back to home") + '</div>', { noindex: true });
page("/error/", "Something went wrong", "An error occurred.",
  pageHero("Error / Try again", "A SMALL<br>DETOUR.", "Head back to the studio and try again.") +
  '<div class="shell utility-action">' + button("/", "Back to home") + '</div>', { noindex: true });
copyFileSync(join(out, "404", "index.html"), join(out, "404.html"));
copyFileSync(join(out, "error", "index.html"), join(out, "error.html"));

const sitemapPaths = ["/", "/work/", ...projects.map(p => "/work/" + p.slug + "/"),
  "/services/", "/about/", "/contact/"];
writeFileSync(join(out, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
  sitemapPaths.map(path => '<url><loc>' + site.origin + path + '</loc></url>').join("") + '</urlset>');
writeFileSync(join(out, "robots.txt"), 'User-agent: *\nAllow: /\nSitemap: ' + site.origin + '/sitemap.xml\n');
writeFileSync(join(out, "projects.json"), JSON.stringify(projects, null, 2));
copyFileSync(join(root, "src", "style.css"), join(out, "style.css"));
copyFileSync(join(root, "build", "browser.js"), join(out, "browser.js"));
copyFileSync(join(root, "build", "dot-cursor.js"), join(out, "dot-cursor.js"));
copyFileSync(join(root, "build", "smooth-work-slider.js"), join(out, "smooth-work-slider.js"));
writeFileSync(join(out, "private-systems.json"), JSON.stringify(privateSystems, null, 2));
cpSync(join(root, "public", "projects"), join(out, "projects"), { recursive: true });
cpSync(join(root, "public", "media"), join(out, "media"), { recursive: true });
cpSync(join(root, "public", "brand"), join(out, "brand"), { recursive: true });
console.log("Built " + sitemapPaths.length + " public routes and utility pages.");
