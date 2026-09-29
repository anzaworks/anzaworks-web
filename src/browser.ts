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
  if (location.pathname === "/") {
    const anchors = ["featured", "about", "capabilities", "contact"];
    const active = anchors.find(id => {
      const rect = document.getElementById(id)?.getBoundingClientRect();
      return rect && rect.top <= window.innerHeight * .36 && rect.bottom > window.innerHeight * .36;
    });
    document.querySelectorAll<HTMLAnchorElement>('.desktop-nav a[href^="#"], .mobile-nav a[href^="#"]').forEach(link => {
      if (link.hash === `#${active}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
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
const heroVisual = hero?.querySelector<HTMLElement>(".hero-visual");
const heroAmbient = hero?.querySelector<HTMLElement>(".hero-ambient");
const heroVideo = hero?.querySelector<HTMLVideoElement>(".hero-video");
if (heroVideo && reduced) heroVideo.pause();
if (hero && !reduced) {
  if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
    hero.addEventListener("pointermove", event => {
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      heroVisual?.style.setProperty("--pointer-x", `${-x * 12}px`);
      heroVisual?.style.setProperty("--pointer-y", `${-y * 8}px`);
      heroAmbient?.style.setProperty("--ambient-x", `${x * 15}px`);
      heroAmbient?.style.setProperty("--ambient-y", `${y * 10}px`);
    }, { passive: true });
    hero.addEventListener("pointerleave", () => {
      heroVisual?.style.removeProperty("--pointer-x");
      heroVisual?.style.removeProperty("--pointer-y");
      heroAmbient?.style.removeProperty("--ambient-x");
      heroAmbient?.style.removeProperty("--ambient-y");
    });
  }
  let scheduled = false;
  const scrollHero = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      const progress = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / hero.offsetHeight));
      hero.style.setProperty("--hero-shift", `${-progress * 28}px`);
      hero.style.setProperty("--hero-scale", String(1.015 - progress * .025));
      hero.style.setProperty("--hero-opacity", String(Math.max(0, 1 - progress * 1.6)));
      scheduled = false;
    });
  };
  window.addEventListener("scroll", scrollHero, { passive: true });
  scrollHero();
}

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
