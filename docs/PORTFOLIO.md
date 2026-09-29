# Portfolio content and media

The portfolio remains a static, multipage public site. portfolio/data.py contains the source project concepts and services; portfolio/build.py produces the HTML and public projects.json. Do not import any Admin modules or records into these files.

All five cases are labeled concepts, with no invented client metrics. The projects.json schema includes optional client, cover, gallery, video, services and outbound URL fields for approved future work. Replace concept artwork and copy only with rights-cleared assets and verified facts. media.json allows MP4, WebM and poster paths; videos load on interaction.

The hero illustration is original concept art at portfolio/public/media/anza-creator.webp. It is not a founder portrait. The AW typographic mark and SVG favicon are existing fallbacks until the real logo is provided. The portrait slot is intentionally abstract.

The enquiry form uses mailto:. It validates in the browser and does not transmit to an Anza Works backend or save private enquiry data. Confirm the destination inbox before launch. Unverified testimonials and social links are absent from production pages.

Run npm run build after content changes. python3 portfolio/check.py checks generated routes, local assets, headings, canonicals and the public boundary. Canonicals and sitemap currently target https://anzaworks.lk.
