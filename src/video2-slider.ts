/** Native port of Originkit's signed-distance scale and right-side push.
 * Comparison route only: no React, autoplay, stock images or Home changes. */
export const VIDEO2_MIN_SCALE = .35;
export const VIDEO2_MAX_SCALE = 2.2;
export const VIDEO2_GAP = 120;
const wrap = (value: number, span: number) => ((value % span) + span) % span;
export function video2Geometry(x: number, width: number, viewportWidth: number) {
  const distance = x + width / 2 - viewportWidth / 2;
  const scale = Math.max(VIDEO2_MIN_SCALE, Math.min(VIDEO2_MAX_SCALE, 1 + distance / viewportWidth));
  const push = distance > 0 ? (scale - 1) * width * .75 : 0;
  return {
    left: x + push,
    scale,
    brightness: scale < 1 ? 1 - ((1 - scale) / (1 - VIDEO2_MIN_SCALE)) * .65 : 1
  };
}

export function initVideo2Slider(root: HTMLElement): { destroy(): void } {
  const viewport = root.querySelector<HTMLElement>(".video2-slider-viewport")!;
  const track = root.querySelector<HTMLElement>(".video2-slider-track")!;
  const originals = Array.from(track.children) as HTMLElement[];
  const status = root.querySelector<HTMLElement>("[data-video2-status]")!;
  const previous = root.querySelector<HTMLButtonElement>("[data-video2-prev]")!;
  const next = root.querySelector<HTMLButtonElement>("[data-video2-next]")!;
  const desktop = matchMedia("(min-width: 900px)");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const controller = new AbortController();
  const { signal } = controller;
  let enhanced = false, width = 400, step = 520, target = 0, current = 0;
  let frame = 0, visible = true, destroyed = false, lastTime = 0, active = -1;
  let drag: { id: number; x: number; start: number; moved: boolean } | null = null;
  let suppressClick = false;
  const stop = () => { cancelAnimationFrame(frame); frame = 0; lastTime = 0; };
  const paint = () => {
    viewport.scrollLeft = 0;
    const period = originals.length * step;
    // Keep target/current bounded together without changing their eased difference.
    if (Math.abs(current) > period) {
      const shift = Math.trunc(current / period) * period;
      current -= shift; target -= shift;
    }
    const phaseNow = wrap(current, period) / step;
    for (const [index, card] of originals.entries()) {
      const raw = index * step - current + (viewport.clientWidth - width) / 2;
      const x = wrap(raw + step, period) - step;
      const geometry = video2Geometry(x, width, viewport.clientWidth);
      card.style.transform = `translate3d(${geometry.left}px, -50%, 0) scale(${geometry.scale})`;
      card.style.filter = `brightness(${geometry.brightness})`;
    }
    const selected = Math.round(phaseNow) % originals.length;
    if (selected !== active) {
      active = selected;
      status.textContent = `${selected + 1} / ${originals.length} · ${originals[selected]?.dataset.video2Title ?? ""}`;
    }
  };
  const animate = (time: number) => {
    frame = 0;
    if (destroyed || document.hidden || !visible || !enhanced) return;
    const elapsed = lastTime ? Math.min(64, time - lastTime) : 16.67;
    lastTime = time;
    current += (target - current) * (1 - Math.pow(drag?.moved ? .8 : .95, elapsed / 16.67));
    paint();
    if (Math.abs(target - current) > .25) frame = requestAnimationFrame(animate);
    else { current = target; paint(); lastTime = 0; }
  };
  const wake = () => {
    if (!frame && enhanced && visible && !document.hidden) frame = requestAnimationFrame(animate);
  };
  const endDrag = (cancelled = false) => {
    if (!drag) return;
    const pointer = drag.id;
    suppressClick = !cancelled && drag.moved;
    drag = null;
    if (viewport.hasPointerCapture(pointer)) viewport.releasePointerCapture(pointer);
    viewport.removeAttribute("data-cursor");
    root.classList.remove("video2-dragging");
  };
  const setup = () => {
    stop(); endDrag(true);
    enhanced = desktop.matches && !motion.matches;
    root.classList.toggle("video2-enhanced", enhanced);
    originals.forEach(card => { card.style.transform = ""; card.style.filter = ""; });
    width = Math.max(300, Math.min(400, viewport.clientWidth * .28));
    step = width + VIDEO2_GAP;
    root.style.setProperty("--video2-card-width", `${width}px`);
    root.style.setProperty("--video2-native-width", `${Math.min(400, viewport.clientWidth * .82)}px`);
    target = current = enhanced ? step * .8 : 0; active = -1;
    viewport.scrollLeft = 0;
    if (enhanced) {
      paint();
    } else status.textContent = `1 / ${originals.length}`;
  };
  const shift = (direction: number) => {
    if (enhanced) { target += direction * step; wake(); }
    else viewport.scrollBy({ left: direction * (originals[0]!.offsetWidth + 16), behavior: motion.matches ? "instant" : "smooth" });
  };
  viewport.addEventListener("wheel", event => {
    if (!enhanced || !visible || document.hidden || event.ctrlKey || document.body.classList.contains("menu-open")) return;
    event.preventDefault();
    const amount = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientWidth : 1;
    target += Math.max(-step * 1.5, Math.min(step * 1.5, amount * unit));
    wake();
  }, { passive: false, signal });
  viewport.addEventListener("pointerdown", event => {
    if (!enhanced || drag || event.button !== 0 || event.pointerType === "touch") return;
    suppressClick = false;
    drag = { id: event.pointerId, x: event.clientX, start: target, moved: false };
  }, { signal });
  viewport.addEventListener("pointermove", event => {
    if (!drag || drag.id !== event.pointerId) return;
    const delta = drag.x - event.clientX;
    if (!drag.moved && Math.abs(delta) > 6) {
      drag.moved = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.setAttribute("data-cursor", "hide");
      root.classList.add("video2-dragging");
    }
    if (drag.moved) { target = drag.start + delta * 1.5; wake(); }
  }, { signal });
  viewport.addEventListener("pointerup", () => endDrag(), { signal });
  viewport.addEventListener("pointercancel", () => endDrag(true), { signal });
  viewport.addEventListener("lostpointercapture", () => endDrag(true), { signal });
  viewport.addEventListener("pointerleave", () => { if (drag && !drag.moved) endDrag(true); }, { signal });
  viewport.addEventListener("click", event => { if (suppressClick) { event.preventDefault(); suppressClick = false; } }, { capture: true, signal });
  viewport.addEventListener("dragstart", event => event.preventDefault(), { signal });
  viewport.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); shift(event.key === "ArrowLeft" ? -1 : 1); }
  }, { signal });
  viewport.addEventListener("focusin", event => {
    if (!enhanced) return;
    const card = (event.target as Element).closest<HTMLElement>(".video2-slide");
    if (!card) return;
    target = Number(card.dataset.video2Index) * step;
    wake();
  }, { signal });
  viewport.addEventListener("scroll", () => {
    if (enhanced) return;
    const index = Math.round(viewport.scrollLeft / (originals[0]!.offsetWidth + 16));
    status.textContent = `${Math.min(originals.length, index + 1)} / ${originals.length}`;
  }, { passive: true, signal });
  previous.addEventListener("click", () => shift(-1), { signal });
  next.addEventListener("click", () => shift(1), { signal });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { stop(); endDrag(true); target = current; }
  }, { signal });
  const resize = new ResizeObserver(setup); resize.observe(viewport);
  const intersection = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? false;
    if (!visible) { stop(); endDrag(true); target = current; }
  }); intersection.observe(root);
  desktop.addEventListener("change", setup, { signal }); motion.addEventListener("change", setup, { signal });
  setup();
  return { destroy() {
    destroyed = true; stop(); endDrag(true); controller.abort(); resize.disconnect(); intersection.disconnect();
    originals.forEach(card => { card.style.transform = ""; card.style.filter = ""; });
    root.classList.remove("video2-enhanced", "video2-dragging");
    root.style.removeProperty("--video2-card-width"); root.style.removeProperty("--video2-native-width");
  } };
}
