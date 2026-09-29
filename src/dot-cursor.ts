export type DotCursor = { destroy(): void };

type Point = { x: number; y: number; time: number };

const HEAD_RADIUS = 6;
const RING_RADIUS = 15;
const TRAIL_HALF_WIDTH = 3.4;
const TRAIL_LENGTH = 11;
const TRAIL_AGE = 420;
const TRAIL_COLOR = "#C91422";
const HEAD_COLOR = "#F1F1F1";

export function initDotCursor(): DotCursor | null {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return null;
  canvas.className = "dot-cursor-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);

  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;
  let previousFrame = 0;
  let lastSample = 0;
  let tracking = false;
  let seeded = false;
  let overControl = false;
  let destroyed = false;
  let headAlpha = 0;
  let ringMix = 0;
  const pointer = { x: 0, y: 0 };
  const head = { x: 0, y: 0 };
  const points: Point[] = [];

  function nativeCursor(): void {
    document.documentElement.classList.toggle("dot-cursor-active", tracking && !document.hidden && !document.body.classList.contains("menu-open"));
  }

  function resize(): void {
    const nextWidth = window.innerWidth;
    const nextHeight = window.innerHeight;
    const nextDpr = Math.min(1.75, window.devicePixelRatio || 1);
    if (width === nextWidth && height === nextHeight && dpr === nextDpr) return;
    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    points.length = 0;
    lastSample = 0;
    if (seeded) { head.x = pointer.x; head.y = pointer.y; }
    schedule();
  }

  function leave(): void {
    tracking = false;
    nativeCursor();
    schedule();
  }

  function onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== "mouse" || document.hidden) return;
    if (event.clientX < 0 || event.clientY < 0 || event.clientX >= width || event.clientY >= height) {
      leave();
      return;
    }
    const element = event.target instanceof Element ? event.target : document.elementFromPoint(event.clientX, event.clientY);
    if (element?.closest('[data-cursor="hide"]') || document.body.classList.contains("menu-open")) {
      leave();
      return;
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    overControl = !!element?.closest('a,button,[role="button"]');
    if (!tracking) {
      head.x = pointer.x;
      head.y = pointer.y;
      points.length = 0;
      lastSample = 0;
      seeded = true;
    }
    tracking = true;
    nativeCursor();
    schedule();
  }

  function drawTrail(now: number): void {
    if (points.length < 2) return;
    const ribbon: Point[] = [{ x: head.x, y: head.y, time: now }, ...points];
    const edgesLeft: { x: number; y: number }[] = [];
    const edgesRight: { x: number; y: number }[] = [];
    ribbon.forEach((point, index) => {
      const before = ribbon[Math.max(0, index - 1)]!;
      const after = ribbon[Math.min(ribbon.length - 1, index + 1)]!;
      const dx = before.x - after.x;
      const dy = before.y - after.y;
      const length = Math.hypot(dx, dy) || 1;
      const taper = Math.pow(1 - index / (ribbon.length - 1), 1.3);
      const age = Math.max(0, 1 - (now - point.time) / TRAIL_AGE);
      const halfWidth = TRAIL_HALF_WIDTH * taper * age * (overControl ? .55 : 1);
      const normalX = -dy / length * halfWidth;
      const normalY = dx / length * halfWidth;
      edgesLeft.push({ x: point.x + normalX, y: point.y + normalY });
      edgesRight.push({ x: point.x - normalX, y: point.y - normalY });
    });
    const tail = ribbon[ribbon.length - 1]!;
    if (Math.hypot(head.x - tail.x, head.y - tail.y) < 2) return;
    const gradient = context!.createLinearGradient(head.x, head.y, tail.x, tail.y);
    gradient.addColorStop(0, "rgba(201,20,34,.83)");
    gradient.addColorStop(1, "rgba(201,20,34,0)");
    context!.beginPath();
    context!.moveTo(edgesLeft[0]!.x, edgesLeft[0]!.y);
    for (const edge of edgesLeft.slice(1)) context!.lineTo(edge.x, edge.y);
    for (const edge of edgesRight.reverse()) context!.lineTo(edge.x, edge.y);
    context!.closePath();
    context!.fillStyle = gradient;
    context!.fill();
  }

  function draw(now: number): void {
    frame = 0;
    if (destroyed || document.hidden) return;
    const delta = Math.min(64, Math.max(1, now - (previousFrame || now - 16)));
    previousFrame = now;
    const follow = 1 - Math.exp(-delta / 32);
    const transition = 1 - Math.exp(-delta / 85);
    if (tracking) {
      head.x += (pointer.x - head.x) * follow;
      head.y += (pointer.y - head.y) * follow;
    }
    headAlpha += ((tracking ? 1 : 0) - headAlpha) * transition;
    ringMix += ((tracking && overControl ? 1 : 0) - ringMix) * transition;
    if (tracking && (now - lastSample > 18) &&
        (!points.length || Math.hypot(head.x - points[0]!.x, head.y - points[0]!.y) > 1.6)) {
      points.unshift({ x: head.x, y: head.y, time: now });
      points.length = Math.min(points.length, TRAIL_LENGTH);
      lastSample = now;
    }
    while (points.length && now - points[points.length - 1]!.time > TRAIL_AGE) points.pop();

    context!.setTransform(dpr, 0, 0, dpr, 0, 0);
    context!.clearRect(0, 0, width, height);
    drawTrail(now);
    if (headAlpha > .01) {
      context!.globalAlpha = headAlpha * (1 - ringMix);
      context!.fillStyle = HEAD_COLOR;
      context!.beginPath();
      context!.arc(head.x, head.y, HEAD_RADIUS, 0, Math.PI * 2);
      context!.fill();
      context!.globalAlpha = headAlpha * ringMix;
      context!.strokeStyle = TRAIL_COLOR;
      context!.lineWidth = 1.8;
      context!.beginPath();
      context!.arc(head.x, head.y, HEAD_RADIUS + (RING_RADIUS - HEAD_RADIUS) * ringMix, 0, Math.PI * 2);
      context!.stroke();
      context!.globalAlpha = 1;
    }
    const moving = tracking && Math.hypot(head.x - pointer.x, head.y - pointer.y) > .2;
    const transitioning = Math.abs(headAlpha - (tracking ? 1 : 0)) > .01 ||
      Math.abs(ringMix - (tracking && overControl ? 1 : 0)) > .01;
    if (moving || transitioning || points.length) schedule();
  }

  function schedule(): void {
    if (!frame && !document.hidden && !destroyed) frame = requestAnimationFrame(draw);
  }

  function onPointerOut(event: PointerEvent): void {
    if (event.pointerType === "mouse" && !event.relatedTarget) leave();
  }
  function onTouch(event: PointerEvent): void {
    if (event.pointerType !== "mouse") leave();
  }
  function onVisibility(): void {
    if (document.hidden) {
      tracking = false;
      points.length = 0;
      cancelAnimationFrame(frame);
      frame = 0;
      context!.clearRect(0, 0, canvas.width, canvas.height);
    }
    nativeCursor();
  }
  const menuObserver = new MutationObserver(() => {
    if (document.body.classList.contains("menu-open")) leave();
    nativeCursor();
  });
  menuObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(document.documentElement);
  window.addEventListener("resize", resize);
  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerout", onPointerOut, { passive: true });
  document.addEventListener("pointerdown", onTouch, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("blur", leave);
  const onPageHide = () => api.destroy();
  window.addEventListener("pagehide", onPageHide, { once: true });
  resize();

  const api: DotCursor = {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      tracking = false;
      nativeCursor();
      cancelAnimationFrame(frame);
      menuObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("blur", leave);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("pointerdown", onTouch);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.remove();
    }
  };
  return api;
}
