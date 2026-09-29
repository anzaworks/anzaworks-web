const header = document.querySelector<HTMLElement>("#header");
const menuButton = document.querySelector<HTMLButtonElement>(".menu-button");
const menu = document.querySelector<HTMLElement>("#mobile-nav");
const progress = document.querySelector<HTMLElement>(".scroll-progress");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function toggleMenu(open: boolean): void {
  if (!menu || !menuButton) return;
  menu.classList.toggle("open", open);
  menu.inert = !open;
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  document.body.classList.toggle("menu-open", open);
  if (open) menu.querySelector<HTMLAnchorElement>("a")?.focus();
  else menuButton.focus();
}
menuButton?.addEventListener("click", () => toggleMenu(menuButton.getAttribute("aria-expanded") !== "true"));
menu?.addEventListener("click", event => {
  if ((event.target as Element).closest("a")) toggleMenu(false);
});
document.addEventListener("keydown", event => {
  if (!menu || !menuButton || menuButton.getAttribute("aria-expanded") !== "true") return;
  if (event.key === "Escape") toggleMenu(false);
  if (event.key === "Tab") {
    const links = [...menu.querySelectorAll<HTMLAnchorElement>("a")];
    const first = links[0];
    const last = links.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 860 && menuButton?.getAttribute("aria-expanded") === "true") toggleMenu(false);
});
document.querySelectorAll<HTMLAnchorElement>(".desktop-nav a, .mobile-nav a").forEach(link => {
  if (link.getAttribute("href") === location.pathname) link.setAttribute("aria-current", "page");
});
function updateScroll(): void {
  header?.classList.toggle("scrolled", window.scrollY > 18);
  if (progress) {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (height > 0 ? Math.min(1, window.scrollY / height) : 0) + ")";
  }
}
window.addEventListener("scroll", updateScroll, { passive: true });
updateScroll();

if (!reduced && "IntersectionObserver" in window) {
  document.documentElement.classList.add("motion-ready");
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.04, rootMargin: "0px 0px 70px 0px" });
  document.querySelectorAll(".reveal").forEach(node => observer.observe(node));
}

if (!reduced && location.pathname === "/" && !sessionStorage.getItem("anza-intro")) {
  const intro = document.createElement("div");
  intro.className = "intro";
  intro.setAttribute("aria-hidden", "true");
  intro.innerHTML = '<span class="intro-mark">AW</span><span class="intro-name">ANZA WORKS</span>';
  document.body.append(intro);
  intro.addEventListener("animationend", event => {
    if (event.target === intro) intro.remove();
  });
  sessionStorage.setItem("anza-intro", "1");
}

const hero = document.querySelector<HTMLElement>(".hero");
const heroImage = document.querySelector<HTMLElement>(".hero-image");
if (hero && heroImage && !reduced && matchMedia("(hover:hover) and (pointer:fine)").matches) {
  hero.addEventListener("pointermove", event => {
    const x = (event.clientX / window.innerWidth - 0.5) * -12;
    const y = (event.clientY / window.innerHeight - 0.5) * -8;
    heroImage.style.transform = 'scale(1.035) translate(' + x + 'px,' + y + 'px)';
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { heroImage.style.transform = ""; });
}
const modeButtons = document.querySelectorAll<HTMLButtonElement>(".mode-button");
modeButtons.forEach(button => button.addEventListener("click", () => {
  modeButtons.forEach(item => {
    const active = item === button;
    item.classList.toggle("selected", active);
    item.setAttribute("aria-pressed", String(active));
  });
  hero?.setAttribute("data-mode", button.dataset.mode ?? "creator");
}));

document.querySelectorAll<HTMLElement>(".video-frame").forEach(frame => {
  const button = frame.querySelector<HTMLButtonElement>(".video-start");
  const video = frame.querySelector<HTMLVideoElement>("video");
  button?.addEventListener("click", () => {
    if (!video) return;
    video.querySelectorAll<HTMLSourceElement>("source[data-src]").forEach(source => {
      source.src = source.dataset.src ?? "";
      source.removeAttribute("data-src");
    });
    button.hidden = true;
    video.load();
    video.play().catch(() => { video.controls = true; });
  }, { once: true });
});

const form = document.querySelector<HTMLFormElement>("#enquiry");
form?.addEventListener("submit", event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const body = [...data].map(([key, value]) => key + ": " + (String(value).trim() || "—")).join("\n");
  const subject = "Anza Works project enquiry — " + String(data.get("Name") ?? "New project");
  const url = "mailto:hello@anzaworks.lk?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  const status = document.querySelector<HTMLElement>("#form-status");
  if (status) status.textContent = "Your email app should open a draft. Check the address and send it there.";
  location.href = url;
});
