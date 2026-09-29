import { mkdirSync, writeFileSync, copyFileSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { projects, services, process as phases, faqs, site, type Project } from "./content.js";

const root = process.cwd();
const out = join(root, "site");
const esc = (value: unknown): string => String(value).replace(/[&<>"']/g, character =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
const attr = esc;
const navItems = [["/work/", "Work"], ["/about/", "About"], ["/services/", "Services"], ["/contact/", "Contact"]] as const;

function page(path: string, title: string, description: string, body: string, options: { noindex?: boolean; type?: string } = {}): void {
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
    '<meta property="og:image" content="' + site.origin + '/assets/hero-desktop.webp">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + attr(title + " | Anza Works") + '">',
    '<meta name="twitter:description" content="' + attr(description) + '">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="stylesheet" href="/style.css">',
    path === "/" ? '<link rel="preload" href="/media/hero/anza-hero-poster.webp" as="image" type="image/webp" fetchpriority="high">' : "",
    '<script type="application/ld+json">' + JSON.stringify(jsonLd).replace(/</g, "\\u003c") + '</script>',
    '<script type="module" src="/browser.js"></script>'
  ].join("");
  const pageNavItems = path === "/" ? [["#featured", "Work"], ["#about", "About"], ["#capabilities", "Services"], ["#contact", "Contact"]] as const : navItems;
  const header = '<a class="skip-link" href="#main">Skip to content</a><header class="site-header" id="header"><div class="shell nav-shell">' +
    '<a class="wordmark" href="/" aria-label="Anza Works home"><span class="mark" aria-hidden="true">AW</span><span>ANZA <i>WORKS</i></span></a>' +
    '<nav class="desktop-nav" aria-label="Primary">' + pageNavItems.map(([href, label]) => '<a href="' + href + '">' + label + '</a>').join("") + '</nav>' +
    '<button class="menu-button" type="button" aria-label="Open menu" aria-controls="mobile-nav" aria-expanded="false"><span></span><span></span></button></div>' +
    '<nav class="mobile-nav" id="mobile-nav" aria-label="Mobile" inert>' +
    pageNavItems.map(([href, label], index) => '<a href="' + href + '"><small>0' + (index + 1) + '</small>' + label + '<span aria-hidden="true">↗</span></a>').join("") +
    '<a class="mobile-contact" href="/contact/">Start a project ↗</a></nav></header>';
  const socialLinks = Object.entries(site.social).filter(([, url]) => url).map(([label, url]) => '<a href="' + attr(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + ' ↗</a>').join("");
  const footer = '<footer class="footer"><div class="shell"><div class="footer-grid"><div><a href="/" class="footer-brand">ANZA<br>WORKS<span>.</span></a><p>Visual craft. Useful engineering.<br>Made to work together.</p></div>' +
    '<div><p class="eyebrow">Explore</p><a href="/work/">Work</a><a href="/services/">Services</a><a href="/about/">About</a><a href="/process/">Process</a><a href="/contact/">Contact</a></div>' +
    '<div><p class="eyebrow">Say hello</p><a href="mailto:' + site.email + '">' + site.email + '</a>' + (socialLinks || '<p class="footer-muted">Social profiles to be added.</p>') + '</div></div>' +
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

function art(project: Project): string {
  return '<div class="project-art theme-' + attr(project.theme) + '" role="img" aria-label="Abstract concept presentation for ' + attr(project.title) + '">' +
    '<div class="art-disc"></div><div class="art-device"><div class="device-bar"><i></i><i></i><i></i><span>' + esc(project.title.toLowerCase().replace(/\W+/g, "")) +
    '.concept</span></div><div class="device-content"><small>' + esc(project.industry) + ' / concept</small><strong>' + esc(project.title) +
    '</strong><em>' + esc(project.subtitle) + '</em><b>Explore the idea ↗</b></div></div></div>';
}
function projectCard(project: Project, index: number, large = false): string {
  return '<article class="project-card ' + (large ? 'project-large ' : '') + 'reveal"><a class="project-cover" href="/work/' + attr(project.slug) +
    '/" aria-label="View ' + attr(project.title) + ' concept case study">' + art(project) + '</a><div class="project-caption"><span class="project-num">' +
    String(index).padStart(2, "0") + ' / CONCEPT</span><div><p class="eyebrow">' + esc(project.category) + '</p><h3><a href="/work/' + attr(project.slug) +
    '/">' + esc(project.title) + '</a></h3><p>' + esc(project.description) + '</p></div><a class="case-link" href="/work/' + attr(project.slug) +
    '/">View case study ↗</a></div></article>';
}
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
  '<section class="statement" id="statement"><div class="shell"><p class="eyebrow reveal">A different perspective</p><h2 class="reveal">DESIGN PEOPLE <em>NOTICE.</em><br>SYSTEMS PEOPLE <em>USE.</em></h2><p class="reveal">Both sides of the experience deserve attention.</p></div></section>' +
  section("featured", "01", "Selected work", "SELECTED<br>WORK.", '<div class="project-grid">' +
    projectCard(projects[0]!, 1, true) + projectCard(projects[1]!, 2, true) + projectCard(projects[3]!, 3, true) +
    '</div><div class="section-action">' + button("/work/", "Explore all work", "outline") + '</div>', "featured") +
  section("capabilities", "02", "Services", "WHAT I<br>BUILD.", '<div class="service-list">' +
    services.filter((_, i) => [0, 1, 3, 5, 6, 7, 9, 10].includes(i)).map((s, i) => '<a class="service-line reveal" href="/services/"><span class="service-index">' +
      String(i + 1).padStart(2, "0") + '</span><h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) +
      '</p><span class="service-arrow" aria-hidden="true">↗</span></a>').join("") + '</div>') +
  section("approach", "03", "Approach", "DESIGN.<br>CODE. SYSTEMS.", '<div class="value-grid">' +
    [["01", "Made for the brief", "Start with the business goal and the people the product needs to serve."],
     ["02", "Craft and code", "Make the visual idea and the underlying system work as one."],
     ["03", "Room to grow", "Choose clear structure that can adapt as needs change."]]
      .map(([n, t, c]) => '<article class="value-card reveal"><span>' + n + '</span><h3>' + t + '</h3><p>' + c + '</p></article>').join("") +
    '</div>', "approach") +
  section("about", "04", "Studio", "ABOUT<br>ANZA WORKS.", '<div class="about-split"><div class="about-monogram" role="img" aria-label="Abstract AW visual, portrait placeholder">' +
    '<div class="monogram-rings"></div><span>AW</span></div><div class="about-text reveal"><p>Anza Works connects visual ambition with the engineering that makes it usable. The result is work with a clear purpose and a distinct point of view.</p>' +
    '<p>Independent by design. Focused on the details that last.</p>' + button("/about/", "About the studio", "outline") + '</div></div>') +
  section("process", "05", "Process", "FROM QUESTION<br>TO RELEASE.", '<div class="process-track">' +
    phases.map((step, i) => '<div class="process-stop reveal"><span>' + String(i + 1).padStart(2, "0") +
    '</span><strong>' + esc(step[0]) + '</strong></div>').join("") + '</div><div class="section-action">' +
    button("/process/", "See the process", "outline") + '</div>') +
  section("faq", "06", "FAQ", "GOOD QUESTIONS<br>COME FIRST.", '<div class="faq-list">' +
    faqs.map(([q, a]) => '<details class="faq-item"><summary>' + esc(q) + '<span aria-hidden="true">+</span></summary><p>' + esc(a) + '</p></details>').join("") +
    '</div>') + endCta;
page("/", "Creative digital studio", site.description, home);

const work = pageHero("Work / 01", "SELECTED<br>EXPLORATIONS.", "Concepts for hospitality, commerce and business software. They show an approach, not commissioned client work.") +
  section("projects", "01", "Concept studies", "MADE TO<br>MOVE PEOPLE.", '<div class="project-grid">' +
    projects.map((p, i) => projectCard(p, i + 1, i === 0)).join("") + '</div>') + endCta;
page("/work/", "Selected work", "Explore Anza Works concept studies in websites, commerce and software.", work);

projects.forEach((project, index) => {
  const next = projects[(index + 1) % projects.length]!;
  const hero = '<section class="case-hero"><div class="shell"><p class="eyebrow">Concept study / ' + String(index + 1).padStart(2, "0") +
    ' — ' + esc(project.category) + '</p><h1>' + esc(project.title) + '</h1><p class="lead">' + esc(project.subtitle) +
    '</p><div class="case-facts"><span>INDUSTRY / ' + esc(project.industry) + '</span><span>STATUS / CONCEPT</span>' +
    '<span>CLIENT / NOT COMMISSIONED</span></div>' + art(project) + '</div></section>';
  const overview = section("overview", "01", "Overview", "THE IDEA.", '<div class="case-columns"><p class="lead">' + esc(project.description) +
    '</p><div><h3>Challenge</h3><p>' + esc(project.challenge) + '</p><h3>Solution</h3><p>' + esc(project.solution) + '</p></div></div>');
  const features = section("features", "02", "Experience", "WHAT IT<br>NEEDS TO DO.", '<div class="feature-rows">' +
    project.features.map((f, i) => '<div class="feature-row reveal"><span>' + String(i + 1).padStart(2, "0") +
      '</span><h3>' + esc(f) + '</h3></div>').join("") + '</div>');
  const design = section("design", "03", "Design", "FORM FOLLOWS<br>THE TASK.", '<div class="case-columns"><p class="lead">' + esc(project.design) +
    '</p><p>This abstract presentation explores the direction. Final product screens will be shown only when approved assets exist.</p></div>');
  const technology = section("technology", "04", "Technology", "BUILT WITH<br>CARE.", '<div class="chip-row">' +
    project.technologies.map(t => '<span>' + esc(t) + '</span>').join("") +
    '</div><p class="case-note">These describe the concept approach, not a claim that a client product was delivered.</p>');
  const video = project.video;
  const videoBlock = video && (video.mp4 || video.webm)
    ? '<div class="video-frame"><div class="video-bar"><i></i><i></i><i></i><span>' + esc(project.title) +
      ' / film</span></div><div class="video-stage"><video playsinline controls preload="none"' +
      (video.poster ? ' poster="' + attr(video.poster) + '"' : "") +
      ' aria-label="' + attr(project.title) + ' project video">' +
      (video.webm ? '<source data-src="' + attr(video.webm) + '" type="video/webm">' : "") +
      (video.mp4 ? '<source data-src="' + attr(video.mp4) + '" type="video/mp4">' : "") +
      'Your browser does not support video.</video><button type="button" class="video-start">Play project film ▶</button></div></div>'
    : '<div class="media-slot"><span aria-hidden="true">◎</span><p>Approved screens and project film will appear here.</p></div>';
  const gallery = project.gallery.length
    ? '<div class="gallery">' + project.gallery.map((src, i) => '<img loading="lazy" src="' + attr(src) +
      '" alt="' + attr(project.title) + ' project view ' + (i + 1) + '">').join("") + '</div>' : "";
  const media = section("media", "05", "Screens & motion", "A CLOSER LOOK.", gallery + videoBlock);
  const result = section("result", "06", "Result", "WHAT THIS<br>EXPLORES.", '<p class="lead">' + esc(project.result) + '</p>');
  const nextBlock = '<section class="next-work"><div class="shell"><p class="eyebrow">Next concept</p><a href="/work/' +
    attr(next.slug) + '/">' + esc(next.title) + '<span aria-hidden="true">↗</span></a></div></section>';
  page("/work/" + project.slug + "/", project.title, project.description,
    hero + overview + features + design + technology + media + result + nextBlock, { type: "case" });
});

const servicesPage = pageHero("Services / 02", "WHAT I HELP<br>YOU BUILD.", "Focused websites, considered products and tools that support real work.") +
  section("services", "01", "Capabilities", "RIGHT TOOL.<br>RIGHT REASON.", '<div class="services-grid">' +
    services.map((s, i) => '<article class="service-tile reveal"><div class="tile-top"><span>' +
      String(i + 1).padStart(2, "0") + '</span><small>' + esc(s[2]) + '</small></div><h3>' + esc(s[0]) +
      '</h3><p>' + esc(s[1]) + '</p><a href="/contact/" aria-label="Enquire about ' + attr(s[0]) +
      '">Discuss this service ↗</a></article>').join("") + '</div>') +
  section("service-scope", "02", "Working together", "DEFINE THE<br>RIGHT SCOPE.", '<div class="case-columns"><p class="lead">Start with the problem, then decide what the project actually needs.</p><div><p>We can map content, features, review points and the route to launch together.</p>' +
    button("/contact/", "Discuss a project", "outline") + '</div></div>') + endCta;
page("/services/", "Services", "Websites, hospitality experiences, e-commerce, dashboards and custom software services.", servicesPage);

const aboutPage = pageHero("About / 03", "DESIGN THE SURFACE.<br>BUILD THE SYSTEM.", "A studio for projects that need visual confidence and practical engineering.") +
  section("studio", "01", "The studio", "INDEPENDENT<br>BY DESIGN.", '<div class="about-split"><div class="about-monogram portrait-slot" role="img" aria-label="Abstract portrait placeholder">' +
    '<div class="monogram-rings"></div><span>AW</span><small>FOUNDER PORTRAIT / TO BE PROVIDED</small></div><div class="about-text"><p>Anza Works brings design, code and product thinking into the same conversation.</p>' +
    '<p>The work begins with a clear task. Then every visual and technical decision has a reason to be there.</p></div></div>') +
  section("principles", "02", "Principles", "MAKE IT CLEAR.<br>MAKE IT LAST.", '<div class="value-grid">' +
    [["01", "Listen closely", "Understand the business context and the people using the result."],
     ["02", "Care about detail", "Type, interaction, accessibility and speed all shape trust."],
     ["03", "Build for change", "Use maintainable systems and leave space for the next idea."]]
      .map(([n, t, c]) => '<article class="value-card reveal"><span>' + n + '</span><h3>' + t + '</h3><p>' + c + '</p></article>').join("") + '</div>') +
  section("tools", "03", "Tools", "A RESTRAINED<br>TOOLKIT.", '<p class="lead">The right tools depend on the product. This site itself uses semantic HTML, CSS, TypeScript and a small static build.</p>' +
    '<div class="chip-row"><span>HTML</span><span>CSS</span><span>TypeScript</span><span>Node.js</span><span>Git</span></div>') + endCta;
page("/about/", "About", "Learn about the approach behind Anza Works, an independent digital studio.", aboutPage);

const processPage = pageHero("Process / 04", "A CLEAR PATH<br>THROUGH THE WORK.", "A deliberate sequence keeps the important decisions visible.") +
  section("timeline", "01", "The journey", "SEVEN STEPS.<br>ONE DIRECTION.", '<div class="timeline">' +
    phases.map(([title, copy], i) => '<article class="timeline-step reveal"><span>' +
      String(i + 1).padStart(2, "0") + '</span><div><h3>' + esc(title) + '</h3><p>' + esc(copy) +
      '</p></div></article>').join("") + '</div>') + endCta;
page("/process/", "Process", "The Anza Works process from discovery and design through development, launch and support.", processPage);

const contactPage = pageHero("Contact / 05", "LET’S START<br>WITH THE IDEA.", "Share what you are planning. This form opens an email draft; nothing is stored on the site.") +
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
page("/contact/", "Contact", "Start a project enquiry with Anza Works.", contactPage);

page("/404/", "Page not found", "The requested page could not be found.",
  pageHero("404 / Missing page", "THIS PAGE<br>WANDERED OFF.", "The address may have changed. The studio is one step away.") +
  '<div class="shell utility-action">' + button("/", "Back to home") + '</div>', { noindex: true });
page("/error/", "Something went wrong", "An error occurred.",
  pageHero("Error / Try again", "A SMALL<br>DETOUR.", "Head back to the studio and try again.") +
  '<div class="shell utility-action">' + button("/", "Back to home") + '</div>', { noindex: true });
copyFileSync(join(out, "404", "index.html"), join(out, "404.html"));
copyFileSync(join(out, "error", "index.html"), join(out, "error.html"));

const sitemapPaths = ["/", "/work/", ...projects.map(p => "/work/" + p.slug + "/"),
  "/services/", "/about/", "/process/", "/contact/"];
writeFileSync(join(out, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
  sitemapPaths.map(path => '<url><loc>' + site.origin + path + '</loc></url>').join("") + '</urlset>');
writeFileSync(join(out, "robots.txt"), 'User-agent: *\nAllow: /\nSitemap: ' + site.origin + '/sitemap.xml\n');
writeFileSync(join(out, "projects.json"), JSON.stringify(projects, null, 2));
writeFileSync(join(out, "favicon.svg"),
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#050505"/><text x="6" y="43" fill="#D71920" font-family="Arial,sans-serif" font-size="28" font-weight="bold">AW</text></svg>');
copyFileSync(join(root, "src", "style.css"), join(out, "style.css"));
copyFileSync(join(root, "build", "browser.js"), join(out, "browser.js"));
cpSync(join(root, "public", "media"), join(out, "media"), { recursive: true });
cpSync(join(root, "assets"), join(out, "assets"), { recursive: true });
cpSync(join(root, "public", "brand"), join(out, "brand"), { recursive: true });
console.log("Built " + sitemapPaths.length + " public routes and utility pages.");
