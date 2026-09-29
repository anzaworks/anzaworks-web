const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#mobile-menu');
const header = document.querySelector('#site-header');
function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.classList.toggle('is-open', open);
  menu.inert = !open;
  document.body.classList.toggle('menu-open', open);
  if (!open) menuButton.focus();
}
menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
menu?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') setMenu(false); });
window.addEventListener('resize', () => { if (innerWidth > 800 && menuButton?.getAttribute('aria-expanded') === 'true') setMenu(false); });
function onScroll() { header?.classList.toggle('scrolled', scrollY > 24); }
addEventListener('scroll', onScroll, {passive:true}); onScroll();
const pathname = location.pathname;
document.querySelectorAll('.desktop-nav a, .mobile-nav a').forEach(a => {
  if (a.getAttribute('href') === pathname) a.setAttribute('aria-current', 'page');
});
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduced && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('motion-ready');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), {rootMargin:'0px 0px 60px 0px',threshold:0.04});
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
if (!reduced && !sessionStorage.getItem('anza-intro-seen') && pathname === '/') {
  const overlay = document.createElement('div');
  overlay.className = 'intro-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = '<span>AW</span>';
  document.body.append(overlay);
  overlay.addEventListener('animationend', event => { if (event.target === overlay) overlay.remove(); });
  sessionStorage.setItem('anza-intro-seen', '1');
}
if (!reduced && matchMedia('(hover:hover) and (pointer:fine)').matches) {
  const hero = document.querySelector('.hero');
  const art = document.querySelector('.hero-image');
  hero?.addEventListener('pointermove', event => {
    const x = (event.clientX / innerWidth - .5) * -12;
    const y = (event.clientY / innerHeight - .5) * -8;
    art.style.transform = 'scale(1.035) translate(' + x + 'px,' + y + 'px)';
  }, {passive:true});
  hero?.addEventListener('pointerleave', () => { art.style.transform = ''; });
}
document.querySelectorAll('.project-video').forEach(video => {
  const load = () => {
    if (video.dataset.loaded) return;
    video.querySelectorAll('source[data-src]').forEach(source => {
      source.src = source.dataset.src;
      source.removeAttribute('data-src');
    });
    video.dataset.loaded = 'true';
    video.load();
  };
  video.addEventListener('pointerdown', load, {once:true});
  video.addEventListener('keydown', load, {once:true});
  video.addEventListener('play', load, {once:true});
});
