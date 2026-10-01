// Included only on About, Services and Work.
const stages = document.querySelectorAll<HTMLElement>("[data-glass-logo]");
let disposed = false;
const effects: { destroy(): void }[] = [];
const pending = new Set<HTMLElement>();
const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
        const host = entry.target as HTMLElement;
        if (!entry.isIntersecting || pending.has(host)) continue;
        pending.add(host); observer.unobserve(host);
        void import("./glass-logo.js").then(({ initGlassLogo }) => {
            if (!disposed) effects.push(initGlassLogo(host));
        }).catch(() => { /* Keep the approved static logo visible. */ });
    }
}, { rootMargin: "80px" });
stages.forEach(host => observer.observe(host));
window.addEventListener("pagehide", event => {
    if (event.persisted) return;
    disposed = true; observer.disconnect(); effects.forEach(effect => effect.destroy());
});
