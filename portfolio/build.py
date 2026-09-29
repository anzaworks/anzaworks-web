"""Build the public, static portfolio. No admin modules or private records are imported."""
from pathlib import Path
from html import escape as h
import json
from data import root, media, projects, services

BASE = "https://anzaworks.lk"
def e(value):
    return h(str(value), quote=True)
def link(path, label, cls=""):
    return f'<a href="{path}" class="{cls}">{label}</a>'
def section(eyebrow, title, content, id="", cls=""):
    return f'<section class="section {cls}" {f"id={chr(34)+id+chr(34)}" if id else ""}><div class="wrap"><div class="section-heading reveal"><p class="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{content}</div></section>'
def artwork(p, large=False):
    slug, title, category = p[:3]
    return f'''<div class="project-art art-{e(slug)}" role="img" aria-label="Original abstract presentation for the {e(title)} concept">
      <div class="art-orbit"></div><div class="art-window"><div class="window-bar"><span></span><span></span><span></span><i>{e(title.lower().replace(" ",""))}.concept</i></div>
      <div class="window-content"><small>{e(category)} / concept</small><strong>{e(title)}</strong><em>Designed for clarity. Built for impact.</em><span class="window-button">Explore concept ↗</span></div></div></div>'''
def project_card(p, number, feature=False):
    slug,title,category,short=p[:4]
    return f'''<article class="project-card {'project-feature' if feature else ''} reveal">
       <a class="project-cover" href="/work/{e(slug)}/" aria-label="View {e(title)} concept case study">{artwork(p,feature)}</a>
       <div class="project-info"><span class="project-index">{number:02d} / Concept study</span><div><p class="eyebrow">{e(category)}</p><h3>{link('/work/'+slug+'/',e(title))}</h3><p>{e(short)}</p></div>{link('/work/'+slug+'/', 'View case study <span aria-hidden="true">↗</span>', 'text-link')}</div>
    </article>'''
def metadata(path,title,desc,kind="website"):
    canonical=BASE+path
    ld={"@context":"https://schema.org","@type":"ProfessionalService","name":"Anza Works","url":BASE,"description":"Independent digital studio for websites and software."}
    return f'''<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#05070d">
<title>{e(title)} | Anza Works</title><meta name="description" content="{e(desc)}"><link rel="canonical" href="{canonical}">
<meta property="og:type" content="{kind}"><meta property="og:site_name" content="Anza Works"><meta property="og:title" content="{e(title)} | Anza Works"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{BASE}/public/media/anza-creator.webp">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(title)} | Anza Works"><meta name="twitter:description" content="{e(desc)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css">
{f'<link rel="preload" href="/public/media/anza-creator.webp" as="image" type="image/webp" fetchpriority="high">' if path == "/" else ""}
<script type="application/ld+json">{json.dumps(ld,separators=(',',':'))}</script>'''
nav=''.join(f'<a href="/{x}/">{x.title()}</a>' for x in ('work','services','about','process','contact'))
header=f'''<a class="skip" href="#main">Skip to content</a>
<header class="site-header" id="site-header"><div class="wrap nav-shell">
<a href="/" class="brand" aria-label="Anza Works home"><span class="brand-mark">AW</span><span>ANZA<span class="brand-muted">WORKS</span></span></a>
<nav class="desktop-nav" aria-label="Main navigation"><a href="/">Home</a>{nav}</nav>
<a class="nav-cta" href="/contact/">Start a project <span aria-hidden="true">↗</span></a>
<button class="menu-toggle" type="button" aria-label="Open menu" aria-controls="mobile-menu" aria-expanded="false"><span></span><span></span></button>
</div><nav class="mobile-nav" id="mobile-menu" aria-label="Mobile navigation" inert><a href="/">Home</a>{nav}<a class="mobile-action" href="/contact/">Start a project ↗</a></nav></header>'''
footer='''<footer class="site-footer"><div class="wrap"><div class="footer-top"><div><a href="/" class="footer-wordmark">ANZA<br>WORKS<span>.</span></a><p>Digital experiences with design and engineering in equal measure.</p></div><div><p class="eyebrow">Explore</p><a href="/work/">Work</a><a href="/services/">Services</a><a href="/about/">About</a><a href="/process/">Process</a><a href="/contact/">Contact</a></div><div><p class="eyebrow">Connect</p><a href="mailto:hello@anzaworks.lk">hello@anzaworks.lk</a><p class="footer-note">Social channels will be linked when verified.</p></div></div><div class="footer-bottom"><span>© 2026 Anza Works</span><span>Independent digital studio</span><a href="#main">Back to top ↑</a></div></div></footer>'''
def write(path,title,desc,body,extra=""):
    dest=root/path.lstrip("/")
    dest.parent.mkdir(parents=True,exist_ok=True)
    canonical="/" if path=="index.html" else "/"+str(dest.parent.relative_to(root)).replace("\\","/")+"/"
    dest.write_text(f'''<!doctype html><html lang="en"><head>{metadata(canonical,title,desc)}{extra}<script src="/site.js" defer></script></head><body>{header}<main id="main">{body}</main>{footer}</body></html>''')
def page_hero(kicker,title,copy):
    return f'<section class="page-hero"><div class="wrap"><p class="eyebrow reveal">{kicker}</p><h1 class="reveal">{title}</h1><p class="lead reveal">{copy}</p></div><div class="page-hero-ring" aria-hidden="true"></div></section>'
home='''<section class="hero" id="hero"><div class="hero-image" aria-hidden="true"></div><div class="hero-grid" aria-hidden="true"></div>
<div class="hero-ring" aria-hidden="true"></div><div class="wrap hero-inner"><div class="hero-content">
<p class="eyebrow hero-label">Digital studio / Web · Software · Design</p>
<h1>Build beyond<br><span>ordinary.</span></h1><p class="hero-copy">Websites, software and digital experiences made to move ambitious businesses forward.</p>
<div class="actions"><a class="button button-primary" href="/work/">Explore work <span aria-hidden="true">↗</span></a><a class="button button-quiet" href="/contact/">Start a project <span aria-hidden="true">↗</span></a></div>
</div><div class="hero-aside" aria-label="Studio disciplines"><span>01 / Creator</span><span>02 / Developer</span><span>03 / Designer</span><span>04 / Builder</span></div>
<a class="scroll-cue" href="#statement">Scroll to explore <span aria-hidden="true">↓</span></a></div></section>'''
home+='''<section class="statement" id="statement"><div class="wrap"><p class="eyebrow reveal">The approach</p><h2 class="reveal">More than a screen.<br><span>An experience that works.</span></h2><p class="reveal">Distinctive on the surface. Considered underneath.</p></div></section>'''
home+=section('01 / Selected work','Ideas with a purpose.',f'<div class="project-list">{project_card(projects[0],1,True)}<div class="project-pair">{project_card(projects[1],2)}{project_card(projects[3],3)}</div></div><div class="section-end">{link("/work/","Explore all work ↗","button button-outline")}</div>',"work-preview")
home+=section('02 / Capabilities','What I help you build.','<div class="service-editorial">'+''.join(f'<a href="/services/" class="service-row reveal"><span>{i:02d}</span><h3>{e(s[0])}</h3><p>{e(s[1])}</p><b aria-hidden="true">↗</b></a>' for i,s in enumerate(services[:7],1))+'</div>',"services-preview")
home+=section('03 / Why Anza Works','Built with intent.','<div class="value-grid">'+''.join(f'<article class="value reveal"><span class="value-icon">{icon}</span><h3>{heading}</h3><p>{copy}</p></article>' for icon,heading,copy in [('◈','Made for your business','The work starts with your goals, your audience and the task that matters.'),('⌘','Design meets engineering','The interface and the system behind it are considered together.'),('↗','Ready to evolve','Clear structure and maintainable code make room for the next step.')])+'</div>',"why")
home+=section('04 / Process','From first idea to live product.','<div class="process-line">'+''.join(f'<div class="process-mini reveal"><span>{i:02d}</span><h3>{x}</h3></div>' for i,x in enumerate(['Discovery','Strategy','Design','Development','Review','Launch','Support'],1))+'</div><p><a class="text-link" href="/process/">Explore the process ↗</a></p>',"process-preview")
home+=section('05 / Studio','A single vision across design and code.','<div class="about-feature"><div class="about-visual" role="img" aria-label="Abstract blue studio monogram placeholder for a future portrait"><span>AW</span></div><div class="about-copy reveal"><p>Anza Works is an independent digital studio bringing visual craft and practical engineering together. The goal is simple: make the useful feel exceptional.</p><a class="button button-outline" href="/about/">About the studio ↗</a></div></div>',"about-preview")
home+=section('06 / Questions','Before we begin.','<div class="faq">'+''.join(f'<details class="faq-item"><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>' for q,a in [
('How much does a website cost?','It depends on the scope, content and functionality. Share your requirements for a tailored proposal.'),
('How long does a project take?','The timeline depends on the scope and the readiness of content and feedback. We can define milestones together.'),
('Can you redesign an existing website?','Yes. A review of the current site can help define what to retain and what to improve.'),
('Can I update my website myself?','A content editing workflow can be planned as part of the project.'),
('Do you build custom business systems?','Yes. Dashboards, web applications and operational tools can be scoped around specific workflows.'),
('Do you work with clients outside Sri Lanka?','Remote collaboration is possible; project scope and communication can be agreed before work begins.')])+'</div>',"faq-preview")
cta='''<section class="final-cta"><div class="wrap"><p class="eyebrow">Have something in mind?</p><h2>Let's build<br><em>what's next.</em></h2><div class="actions"><a class="button button-primary" href="/contact/">Start a project ↗</a><a class="button button-quiet" href="mailto:hello@anzaworks.lk">Email directly ↗</a></div></div></section>'''
home+=cta
write("index.html","Creative digital studio","Anza Works designs and builds modern websites, software and digital experiences for ambitious businesses.",home)
work=page_hero('Selected work / 01','Purpose, made visible.','Explorations in hospitality, commerce and business software. These are concept studies, not commissioned client projects.')
work+='<section class="section"><div class="wrap"><div class="project-list">'+''.join(project_card(p,i,i==1) for i,p in enumerate(projects,1))+'</div></div></section>'+cta
write("work/index.html","Selected work","Explore the concept case studies from Anza Works.",work)
for i,p in enumerate(projects):
    slug,title,category,short,full,challenge,solution,features,tech=p
    nextp=projects[(i+1)%len(projects)]
    body=f'''<section class="case-hero"><div class="wrap"><p class="eyebrow">Concept study / {i+1:02d} — {e(category)}</p><h1>{e(title)}</h1><p class="lead">{e(short)}</p><div class="case-meta"><span>Type / {e(category)}</span><span>Status / Concept</span><span>Year / 2026</span></div>{artwork(p,True)}</div></section>'''
    body+=section('The brief','Designed around a real task.',f'<div class="case-overview"><p class="lead">{e(full)}</p><div><h3>Challenge</h3><p>{e(challenge)}</p><h3>Approach</h3><p>{e(solution)}</p></div></div>',"overview")
    body+=section('Experience','Features & design.','<div class="feature-list">'+''.join(f'<div class="feature-item reveal"><span>{j:02d}</span><h3>{e(f)}</h3></div>' for j,f in enumerate(features,1))+'</div><p class="case-note">The interface direction is conceptual. Final screens will be shown when approved assets are available.</p>',"features")
    body+=section('Design','A visual direction for the task.',f'<p class="lead">A distinct presentation gives {e(title)} its own character while keeping the primary actions clear and easy to find.</p><p class="case-note">The abstract project artwork is an Anza Works concept presentation, not a screenshot of a completed product.</p>',"design")
    body+=section('Build','Technology & thinking.','<div class="tech-list">'+''.join(f'<span>{e(t)}</span>' for t in tech)+'</div><p class="case-note">These terms describe the concept approach; this is not a claim of a delivered client build.</p>',"technology")
    asset=media.get(slug)
    if asset:
        sources=''.join(f'<source data-src="{e(asset[k])}" type="video/{k}">' for k in ('webm','mp4') if asset.get(k))
        poster=f' poster="{e(asset["poster"])}"' if asset.get('poster') else ''
        body+=section('Motion','Project film.',f'<div class="device-frame"><div class="device-top"><i></i><i></i><i></i><span>{e(title)} / Preview</span></div><video class="project-video" controls playsinline preload="none"{poster} aria-label="{e(title)} concept video">{sources}Your browser does not support video.</video></div><p class="case-note">Video loads only when you press play.</p>',"project-film")
    else:
        body+=section('Media','Screens & motion.','<div class="media-pending"><span>◌</span><p>Project screens and video will appear here when approved assets are available.</p></div>',"project-film")
    body+=section('Outcome','What this explores.','<p class="lead">A clear path through the essential tasks, with a visual identity suited to the project.</p><p class="case-note">No client results or business metrics are claimed for this concept.</p>',"result")
    body+=f'<section class="next-project"><div class="wrap"><p class="eyebrow">Next concept</p><a href="/work/{e(nextp[0])}/">{e(nextp[1])}<span aria-hidden="true">↗</span></a></div></section>'
    write(f'work/{slug}/index.html',title,short,body)
services_body=page_hero('Services / 02','What I help you build.','From a focused business website to the system your team uses every day.')
services_body+=section('Capabilities','Designed for the work.','<div class="services-grid">'+''.join(f'<article class="service-tile reveal"><span class="tile-number">{i:02d} / {e(s[2])}</span><h3>{e(s[0])}</h3><p>{e(s[1])}</p><div class="tile-footer"><small>{e(s[3])}</small><a href="/contact/" aria-label="Enquire about {e(s[0])}">↗</a></div></article>' for i,s in enumerate(services,1))+'</div>',"services")
services_body+=section('Working together','The right scope for the task.','<div class="split"><p class="lead">A clear brief and a considered build make the difference. We can define the content, features, timeline and support that fit your business.</p><a class="button button-outline" href="/contact/">Discuss a project ↗</a></div>',"service-approach")+cta
write('services/index.html','Services','Website design, hospitality sites, shops, dashboards and custom software by Anza Works.',services_body)
about_body=page_hero('About / 03','Design the surface.<br>Build the system.','An independent digital studio where strong visual ideas meet dependable implementation.')
about_body+=section('The studio','Work that holds together.','<div class="about-feature"><div class="about-visual portrait-slot" role="img" aria-label="Placeholder for a future founder portrait or approved avatar"><span>AW</span><small>Portrait / avatar slot</small></div><div class="about-copy"><p>I bring design, code and product thinking into one process. Each decision should make the experience clearer for the person using it and more useful for the business behind it.</p><p>This is a place for thoughtful websites, practical software and a distinct visual point of view.</p></div></div>',"studio")
about_body+=section('Principles','How the work takes shape.','<div class="value-grid">'+''.join(f'<article class="value reveal"><span class="value-icon">{i:02d}</span><h3>{x}</h3><p>{y}</p></article>' for i,(x,y) in enumerate([('Listen first','Understand the problem and the people before choosing a solution.'),('Craft the details','Typography, interaction and performance all shape the result.'),('Build to last','Choose maintainable tools and leave a clear path for change.')],1))+'</div>',"principles")
about_body+=section('Tools','Chosen for the job.','<p class="lead">Accessible HTML, CSS and JavaScript are the foundation. Modern frameworks and data tools come in when the product calls for them.</p><div class="tech-list">'+''.join(f'<span>{t}</span>' for t in ['HTML & CSS','JavaScript','Python','Git'])+'</div>',"tools")+cta
write('about/index.html','About','Meet the thinking behind Anza Works, an independent digital studio.',about_body)
steps=[('Discovery','Understand the goals, audience and constraints.'),('Strategy','Decide what matters most and define the scope.'),('Design','Shape the structure, visuals and interactions.'),('Development','Build and test the working experience.'),('Review','Refine with feedback and check the details.'),('Launch','Prepare the release when the work is ready.'),('Support','Keep improving as needs change.')]
process_body=page_hero('Process / 04','A clear path from idea to impact.','A practical process that keeps decisions visible and the project moving.')
process_body+=section('The journey','Seven deliberate steps.','<div class="timeline">'+''.join(f'<article class="timeline-step reveal"><span>{i:02d}</span><div><h3>{x}</h3><p>{y}</p></div></article>' for i,(x,y) in enumerate(steps,1))+'</div>',"timeline-section")+cta
write('process/index.html','Process','A transparent process from discovery through design, development and support.',process_body)
contact_body=page_hero('Contact / 05',"Let's make it happen.",'Tell me what you are building. The form opens a draft in your email app; nothing is stored on this site.')
contact_body+='''<section class="section"><div class="wrap contact-layout"><div><p class="eyebrow">Project enquiry</p><h2>Start with a conversation.</h2><p>Give me the shape of the project and the best way to reach you.</p><a class="text-link" href="mailto:hello@anzaworks.lk">hello@anzaworks.lk ↗</a></div>
<form id="enquiry" class="form" action="mailto:hello@anzaworks.lk" method="post" enctype="text/plain">
<div class="field"><label for="name">Name <span>*</span></label><input id="name" name="name" required maxlength="100" autocomplete="name"></div>
<div class="field"><label for="business">Business name</label><input id="business" name="business" maxlength="120" autocomplete="organization"></div>
<div class="field"><label for="email">Email <span>*</span></label><input id="email" name="email" type="email" required autocomplete="email"></div>
<div class="field"><label for="phone">Phone / WhatsApp</label><input id="phone" name="phone" type="tel" autocomplete="tel"></div>
<div class="field"><label for="type">Project type <span>*</span></label><select id="type" name="type" required><option value="">Select a type</option><option>Website</option><option>Online shop</option><option>Software / app</option><option>Other</option></select></div>
<div class="field"><label for="budget">Budget range</label><select id="budget" name="budget"><option value="">Prefer to discuss</option><option>Under LKR 250,000</option><option>LKR 250,000–500,000</option><option>LKR 500,000–1,000,000</option><option>Over LKR 1,000,000</option></select></div>
<div class="field"><label for="date">Target date</label><input id="date" name="date" type="date"></div>
<div class="field wide"><label for="description">Project message <span>*</span></label><textarea id="description" name="description" required minlength="15" maxlength="3000" placeholder="What are you hoping to build?"></textarea></div>
<div class="field wide"><button class="button button-primary" type="submit">Open email draft ↗</button><p id="form-status" role="status" aria-live="polite">Your email app will handle sending.</p></div></form></div></section>'''
write('contact/index.html','Contact','Start a project enquiry with Anza Works.',contact_body,'<script src="/contact.js" defer></script>')
def project_record(p, index):
    record=dict(zip(['slug','title','category','shortDescription','fullDescription','challenge','solution','features','technologies'],p))
    record.update({
        'client': None, 'industry': p[2], 'cover': None, 'gallery': [],
        'video': media.get(p[0]), 'services': [], 'year': 2026,
        'liveUrl': None, 'githubUrl': None, 'featured': index < 3,
        'status': 'concept'
    })
    return record
(root/'projects.json').write_text(json.dumps([project_record(p,i) for i,p in enumerate(projects)],indent=2))
urls=['/','/work/','/services/','/about/','/process/','/contact/']+[f'/work/{p[0]}/' for p in projects]
(root/'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n')
(root/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{BASE}{u}</loc></url>' for u in urls)+'</urlset>')
(root/'manifest.webmanifest').write_text(json.dumps({'name':'Anza Works','short_name':'Anza','start_url':'/','display':'browser','theme_color':'#05070d','background_color':'#05070d','icons':[{'src':'/favicon.svg','sizes':'any','type':'image/svg+xml'}]}))
(root/'404.html').write_text('<!doctype html><html lang="en"><head>'+metadata('/404.html','Page not found','The requested page was not found.')+'<meta name="robots" content="noindex">'+'<script src="/site.js" defer></script></head><body>'+header+'<main id="main">'+page_hero('404 / Not found','This page took a different path.','The address may have changed. Head back to the studio.')+'<div class="wrap"><a class="button button-primary" href="/">Back to home ↗</a></div></main>'+footer+'</body></html>')
(root/'error.html').write_text('<!doctype html><html lang="en"><head>'+metadata('/error.html','Something went wrong','An error occurred.')+'<meta name="robots" content="noindex">'+'</head><body><main class="wrap page-hero"><h1>Something went wrong.</h1><a class="button button-primary" href="/">Back to home ↗</a></main></body></html>')
