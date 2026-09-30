/** Native progressive enhancement: real links and touch scrolling work without JS. */
export function initSmoothWorkSlider(root: HTMLElement): { destroy(): void } {
  const viewport = root.querySelector<HTMLElement>(".work-slider-viewport")!;
  const track = root.querySelector<HTMLElement>(".work-slider-track")!;
  const originals = Array.from(track.children) as HTMLElement[];
  const previous = root.querySelector<HTMLButtonElement>("[data-slider-prev]")!;
  const next = root.querySelector<HTMLButtonElement>("[data-slider-next]")!;
  const status = root.querySelector<HTMLElement>(".work-slider-status")!;
  const width = matchMedia("(min-width: 900px)");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const controller = new AbortController();
  const { signal } = controller;
  let loop = false, period = 0, step = 0, target = 0, raf = 0;
  let active = 0, visible = true, destroyed = false;
  let drag: { id: number; x: number; scroll: number; moved: boolean } | null = null;
  let suppressClick = false;
  const cards = () => Array.from(track.children) as HTMLElement[];
  const normalize = () => {
    if (!loop || !period) return;
    const delta = viewport.scrollLeft < period * .5 ? period : viewport.scrollLeft > period * 1.5 ? -period : 0;
    if (delta) {
      viewport.scrollLeft += delta;
      target += delta;
      if (drag) drag.scroll += delta;
    }
  };
  const paint = () => {
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let distance = Infinity, current = active;
    for (const card of cards()) {
      const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      const proximity = Math.max(0, 1 - d / (step || 1));
      card.style.setProperty("--slide-scale", String(motion.matches ? 1 : .94 + proximity * .06));
      card.style.setProperty("--slide-opacity", String(.66 + proximity * .34));
      if (d < distance) { distance = d; current = Number(card.dataset.slideIndex); }
    }
    if (current !== active) { active = current; status.textContent = `${active + 1} / ${originals.length}`; }
  };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  const animate = () => {
    raf = 0;
    if (destroyed || document.hidden || !visible) return;
    const delta = target - viewport.scrollLeft;
    viewport.scrollLeft += delta * .16;
    normalize(); paint();
    if (Math.abs(delta) > .6) raf = requestAnimationFrame(animate);
    else { viewport.scrollLeft = target; paint(); }
  };
  const move = (delta: number) => {
    if (!loop) {
      const max = viewport.scrollWidth - viewport.clientWidth;
      target = Math.max(0, Math.min(max, viewport.scrollLeft + delta));
      viewport.scrollTo({ left: target, behavior: motion.matches ? "instant" : "smooth" });
      return;
    }
    target += Math.max(-step * 2, Math.min(step * 2, delta));
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(animate);
  };
  const setup = () => {
    stop(); drag = null;
    track.querySelectorAll("[data-slider-clone]").forEach(node => node.remove());
    loop = width.matches && !motion.matches;
    root.classList.toggle("slider-loop", loop);
    if (loop) {
      for (const side of ["before", "after"]) {
        const fragment = document.createDocumentFragment();
        for (const original of originals) {
          const clone = original.cloneNode(true) as HTMLElement;
          clone.dataset.sliderClone = "true"; clone.setAttribute("aria-hidden", "true");
          clone.querySelectorAll<HTMLElement>("a").forEach(link => { link.tabIndex = -1; });
          fragment.append(clone);
        }
        if (side === "before") track.prepend(fragment); else track.append(fragment);
      }
    }
    const first = originals[0]!;
    step = (originals[1]?.offsetLeft ?? first.offsetLeft + first.offsetWidth) - first.offsetLeft;
    period = step * originals.length;
    viewport.scrollLeft = first.offsetLeft - (viewport.clientWidth - first.offsetWidth) / 2;
    target = viewport.scrollLeft; paint();
  };
  viewport.addEventListener("wheel", event => {
    if (!loop || event.ctrlKey || document.body.classList.contains("menu-open")) return;
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    move(delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientWidth : 1));
  }, { passive: false, signal });
  viewport.addEventListener("scroll", () => { if (!raf && !drag) target = viewport.scrollLeft; normalize(); paint(); }, { passive: true, signal });
  viewport.addEventListener("pointerdown", event => {
    if (!loop || event.pointerType !== "mouse" || event.button !== 0) return;
    stop(); target = viewport.scrollLeft; suppressClick = false;
    drag = { id: event.pointerId, x: event.clientX, scroll: viewport.scrollLeft, moved: false };
  }, { signal });
  viewport.addEventListener("pointermove", event => {
    if (!drag || event.pointerId !== drag.id) return;
    const delta = drag.x - event.clientX;
    if (!drag.moved && Math.abs(delta) > 6) {
      drag.moved = true; viewport.setPointerCapture(event.pointerId); root.classList.add("slider-dragging");
    }
    if (drag.moved) { viewport.scrollLeft = drag.scroll + delta; target = viewport.scrollLeft; normalize(); paint(); }
  }, { signal });
  const release = () => {
    if (!drag) return;
    suppressClick = drag.moved;
    if (viewport.hasPointerCapture(drag.id)) viewport.releasePointerCapture(drag.id);
    drag = null; root.classList.remove("slider-dragging");
  };
  viewport.addEventListener("pointerup", release, { signal });
  viewport.addEventListener("pointercancel", release, { signal });
  viewport.addEventListener("lostpointercapture", release, { signal });
  viewport.addEventListener("pointerleave", () => { if (drag && !drag.moved) drag = null; }, { signal });
  viewport.addEventListener("click", event => { if (suppressClick) { event.preventDefault(); suppressClick = false; } }, { capture: true, signal });
  viewport.addEventListener("dragstart", event => event.preventDefault(), { signal });
  viewport.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -step : step); }
  }, { signal });
  previous.addEventListener("click", () => move(-step), { signal });
  next.addEventListener("click", () => move(step), { signal });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { stop(); target = viewport.scrollLeft; } }, { signal });
  const observer = new ResizeObserver(setup); observer.observe(viewport);
  const intersection = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? false;
    if (!visible) { stop(); target = viewport.scrollLeft; }
  }); intersection.observe(root);
  width.addEventListener("change", setup, { signal }); motion.addEventListener("change", setup, { signal });
  setup();
  return { destroy() {
    destroyed = true; stop(); controller.abort(); observer.disconnect(); intersection.disconnect();
    track.querySelectorAll("[data-slider-clone]").forEach(node => node.remove());
    originals.forEach(card => { card.style.removeProperty("--slide-scale"); card.style.removeProperty("--slide-opacity"); });
    root.classList.remove("slider-loop", "slider-dragging");
  } };
}
