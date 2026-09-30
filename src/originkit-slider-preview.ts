/** Comparison-only depth geometry. Signed distance makes the left side larger. */
export const PREVIEW_MIN_SCALE = .35;
export const PREVIEW_MAX_SCALE = 1.85;
const centerScale = 1.08;
const slope = .6;
const leftLimit = (centerScale - PREVIEW_MAX_SCALE) / slope;
const rightLimit = (centerScale - PREVIEW_MIN_SCALE) / slope;
const integral = (phase: number): number => {
  const middle = (value: number) => centerScale * value - slope * value * value / 2;
  if (phase < leftLimit) return middle(leftLimit) + PREVIEW_MAX_SCALE * (phase - leftLimit);
  if (phase > rightLimit) return middle(rightLimit) + PREVIEW_MIN_SCALE * (phase - rightLimit);
  return middle(phase);
};
export function previewGeometry(phase: number, width: number, viewportWidth: number) {
  const scale = Math.max(PREVIEW_MIN_SCALE, Math.min(PREVIEW_MAX_SCALE, centerScale - slope * phase));
  return {
    scale,
    x: viewportWidth * .43 + (width + 28) * integral(phase),
    opacity: Math.max(.26, .98 - Math.abs(phase) * .18)
  };
}

export function initOriginkitSliderPreview(root: HTMLElement): { destroy(): void } {
  const viewport = root.querySelector<HTMLElement>(".preview-slider-viewport")!;
  const track = root.querySelector<HTMLElement>(".preview-slider-track")!;
  const originals = Array.from(track.children) as HTMLElement[];
  const status = root.querySelector<HTMLElement>("[data-preview-status]")!;
  const previous = root.querySelector<HTMLButtonElement>("[data-preview-prev]")!;
  const next = root.querySelector<HTMLButtonElement>("[data-preview-next]")!;
  const desktop = matchMedia("(min-width: 900px)");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const controller = new AbortController();
  const { signal } = controller;
  let enhanced = false, width = 700, step = 728, target = 0, current = 0;
  let frame = 0, visible = true, destroyed = false, lastTime = 0, active = -1;
  let drag: { id: number; x: number; start: number; moved: boolean } | null = null;
  let suppressClick = false;
  const cards = () => Array.from(track.children) as HTMLElement[];
  const stop = () => { cancelAnimationFrame(frame); frame = 0; lastTime = 0; };
  const paint = () => {
    viewport.scrollLeft = 0;
    const period = originals.length * step;
    const wrapped = ((current % period) + period) % period;
    const phaseNow = wrapped / step;
    for (const [index, card] of cards().entries()) {
      const phase = index - originals.length - phaseNow;
      const geometry = previewGeometry(phase, width, viewport.clientWidth);
      card.style.transform = `translate3d(${geometry.x}px, -50%, 0) translateX(-50%) scale(${geometry.scale})`;
      card.style.opacity = String(geometry.opacity);
      card.style.zIndex = String(Math.round(geometry.scale * 100));
    }
    const selected = Math.round(phaseNow) % originals.length;
    if (selected !== active) {
      active = selected;
      status.textContent = `${selected + 1} / ${originals.length} · ${originals[selected]?.dataset.previewTitle ?? ""}`;
    }
  };
  const animate = (time: number) => {
    frame = 0;
    if (destroyed || document.hidden || !visible || !enhanced) return;
    const elapsed = lastTime ? Math.min(64, time - lastTime) : 16.67;
    lastTime = time;
    current += (target - current) * (1 - Math.pow(.86, elapsed / 16.67));
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
    root.classList.remove("preview-dragging");
  };
  const setup = () => {
    stop(); endDrag(true);
    cards().filter(card => card.dataset.previewClone).forEach(card => card.remove());
    enhanced = desktop.matches && !motion.matches;
    root.classList.toggle("preview-enhanced", enhanced);
    originals.forEach(card => { card.style.transform = ""; card.style.opacity = ""; card.style.zIndex = ""; });
    width = Math.min(720, (viewport.clientWidth - 40) / PREVIEW_MAX_SCALE);
    step = width + 28;
    root.style.setProperty("--preview-card-width", `${width}px`);
    root.style.setProperty("--preview-native-width", `${Math.min(720, viewport.clientWidth - 2)}px`);
    root.style.setProperty("--preview-stage-height", `${(width * .625 + 58) * PREVIEW_MAX_SCALE + 32}px`);
    target = current = 0; active = -1;
    viewport.scrollLeft = 0;
    if (enhanced) {
      for (const side of ["before", "after"]) {
        const fragment = document.createDocumentFragment();
        for (const original of originals) {
          const clone = original.cloneNode(true) as HTMLElement;
          clone.dataset.previewClone = "true";
          clone.setAttribute("aria-hidden", "true");
          clone.querySelectorAll<HTMLElement>("a").forEach(link => { link.tabIndex = -1; });
          fragment.append(clone);
        }
        if (side === "before") track.prepend(fragment); else track.append(fragment);
      }
      paint();
    } else status.textContent = `1 / ${originals.length}`;
  };
  const shift = (direction: number) => {
    if (enhanced) { target += direction * step; wake(); }
    else viewport.scrollBy({ left: direction * (originals[0]!.offsetWidth + 16), behavior: motion.matches ? "instant" : "smooth" });
  };
  viewport.addEventListener("wheel", event => {
    if (!enhanced || event.ctrlKey || document.body.classList.contains("menu-open")) return;
    event.preventDefault();
    const amount = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientWidth : 1;
    target += Math.max(-step * 1.5, Math.min(step * 1.5, amount * unit));
    wake();
  }, { passive: false, signal });
  viewport.addEventListener("pointerdown", event => {
    if (!enhanced || event.button !== 0 || event.pointerType === "touch") return;
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
      root.classList.add("preview-dragging");
    }
    if (drag.moved) { target = drag.start + delta; wake(); }
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
    const card = (event.target as Element).closest<HTMLElement>(".preview-slide");
    if (!card || card.dataset.previewClone) return;
    target = Number(card.dataset.previewIndex) * step;
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
    cards().filter(card => card.dataset.previewClone).forEach(card => card.remove());
    originals.forEach(card => { card.style.transform = ""; card.style.opacity = ""; card.style.zIndex = ""; });
    root.classList.remove("preview-enhanced", "preview-dragging");
    root.style.removeProperty("--preview-card-width"); root.style.removeProperty("--preview-stage-height"); root.style.removeProperty("--preview-native-width");
  } };
}
