export type AsciiRevealOptions = {
  image: string;
  fit?: "cover" | "contain";
  focusY?: number;
  columns?: number;
  ramp?: string;
  invert?: boolean;
  contrast?: number;
  inkColor?: string;
  reveal?: boolean;
  revealSize?: number;
  revealSoftness?: number;
};

export type AsciiReveal = {
  move(x: number, y: number): void;
  leave(): void;
  destroy(): void;
};

const BLOB_COUNT = 5;
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

type Blob = { x: number; y: number };

export function initAsciiReveal(root: HTMLElement, options: AsciiRevealOptions): AsciiReveal | null {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: true });
  const ascii = document.createElement("canvas");
  const asciiContext = ascii.getContext("2d");
  const sample = document.createElement("canvas");
  const sampleContext = sample.getContext("2d", { willReadFrequently: true });
  const poster = document.createElement("canvas");
  const posterContext = poster.getContext("2d");
  const mask = document.createElement("canvas");
  const maskContext = mask.getContext("2d");
  const revealed = document.createElement("canvas");
  const revealedContext = revealed.getContext("2d");
  if (!context || !asciiContext || !sampleContext || !posterContext || !maskContext || !revealedContext) return null;

  canvas.className = "ascii-reveal-canvas";
  canvas.setAttribute("aria-hidden", "true");
  root.append(canvas);

  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;
  let previousFrame = 0;
  let lastMove = 0;
  let active = false;
  let visible = true;
  let ready = false;
  let destroyed = false;
  const target: Blob = { x: 0, y: 0 };
  const blobs: Blob[] = Array.from({ length: BLOB_COUNT }, () => ({ x: 0, y: 0 }));
  const source = new Image();
  source.decoding = "async";

  function drawPlaced(ctx: CanvasRenderingContext2D, targetWidth: number, targetHeight: number): void {
    const imageRatio = source.naturalWidth / source.naturalHeight;
    const targetRatio = targetWidth / targetHeight;
    const cover = (options.fit ?? "cover") === "cover";
    const drawWidth = (cover ? Math.max : Math.min)(targetWidth, targetHeight * imageRatio);
    const drawHeight = drawWidth / imageRatio;
    const y = (targetHeight - drawHeight) * clamp(options.focusY ?? .5, 0, 1);
    ctx.drawImage(source, (targetWidth - drawWidth) / 2, y, drawWidth, drawHeight);
  }

  function rebuild(): void {
    if (!ready || !width || !height) return;
    const columns = clamp(Math.round(options.columns ?? 150), 30, 220);
    const cellWidth = width / columns;
    const cellHeight = cellWidth * 1.6;
    const rows = Math.ceil(height / cellHeight);
    posterContext!.setTransform(dpr, 0, 0, dpr, 0, 0);
    posterContext!.clearRect(0, 0, width, height);
    drawPlaced(posterContext!, width, height);
    sample.width = columns;
    sample.height = rows;
    sampleContext!.drawImage(poster, 0, 0, columns, rows);
    const pixels = sampleContext!.getImageData(0, 0, columns, rows).data;
    const luminances = new Float32Array(columns * rows);
    for (let i = 0; i < luminances.length; i++) {
      const offset = i * 4;
      luminances[i] = (pixels[offset]! * .2126 + pixels[offset + 1]! * .7152 + pixels[offset + 2]! * .0722) / 255;
    }
    const sorted = Array.from(luminances).sort((a, b) => a - b);
    const low = sorted[Math.floor(sorted.length * .05)] ?? 0;
    const high = sorted[Math.floor(sorted.length * .98)] ?? 1;

    asciiContext!.setTransform(dpr, 0, 0, dpr, 0, 0);
    asciiContext!.clearRect(0, 0, width, height);
    asciiContext!.fillStyle = options.inkColor ?? "#444444";
    asciiContext!.font = `${Math.max(7, cellHeight * .94)}px ui-monospace, SFMono-Regular, Consolas, monospace`;
    asciiContext!.textAlign = "center";
    asciiContext!.textBaseline = "middle";
    const ramp = options.ramp || " .:-=+*#%@";
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const luminance = luminances[row * columns + column]!;
        const normalized = clamp((luminance - low) / Math.max(.01, high - low), 0, 1);
        const value = clamp((normalized - .5) * (options.contrast ?? 1.15) + .5, 0, 1);
        const level = options.invert ? 1 - value : value;
        const character = ramp[Math.min(ramp.length - 1, Math.floor(level * ramp.length))];
        if (character && character !== " ") asciiContext!.fillText(character, (column + .5) * cellWidth, (row + .5) * cellHeight);
      }
    }
    renderBase();
  }

  function renderBase(): void {
    context!.setTransform(1, 0, 0, 1, 0, 0);
    context!.clearRect(0, 0, canvas.width, canvas.height);
    if (ready) context!.drawImage(ascii, 0, 0);
  }

  function resize(): void {
    const bounds = root.getBoundingClientRect();
    const nextWidth = Math.round(bounds.width);
    const nextHeight = Math.round(bounds.height);
    const nextDpr = Math.min(1.5, window.devicePixelRatio || 1);
    if (!nextWidth || !nextHeight || (width === nextWidth && height === nextHeight && dpr === nextDpr)) return;
    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    for (const surface of [canvas, ascii, poster, mask, revealed]) {
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
    }
    rebuild();
  }

  function draw(now: number): void {
    frame = 0;
    if (destroyed || !visible || document.hidden || !ready) return;
    const elapsed = now - lastMove;
    const strength = clamp(1 - Math.max(0, elapsed - 450) / 950, 0, 1);
    if (!strength) { active = false; renderBase(); return; }
    const delta = Math.min(64, Math.max(0, now - (previousFrame || now)));
    previousFrame = now;
    blobs.forEach((blob, index) => {
      const follow = index === 0 ? target : blobs[index - 1]!;
      const ease = 1 - Math.exp(-delta / (index === 0 ? 28 : 54 + index * 20));
      blob.x += (follow.x - blob.x) * ease;
      blob.y += (follow.y - blob.y) * ease;
    });

    renderBase();
    const size = options.revealSize ?? 112;
    const softness = options.revealSoftness ?? 24;
    maskContext!.setTransform(dpr, 0, 0, dpr, 0, 0);
    maskContext!.clearRect(0, 0, width, height);
    context!.setTransform(dpr, 0, 0, dpr, 0, 0);
    blobs.forEach((blob, index) => {
      const weight = strength * (1 - index * .14);
      const radius = size + softness;
      const gradient = maskContext!.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, radius);
      gradient.addColorStop(0, `rgba(255,255,255,${weight})`);
      gradient.addColorStop(clamp((size - softness) / radius, 0, 1), `rgba(255,255,255,${weight * .9})`);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      maskContext!.fillStyle = gradient;
      maskContext!.fillRect(blob.x - radius, blob.y - radius, radius * 2, radius * 2);
      const glow = context!.createRadialGradient(blob.x, blob.y, size * .25, blob.x, blob.y, radius * 1.3);
      glow.addColorStop(0, `rgba(201,20,34,${weight * .14})`);
      glow.addColorStop(1, "rgba(201,20,34,0)");
      context!.fillStyle = glow;
      context!.fillRect(blob.x - radius * 1.3, blob.y - radius * 1.3, radius * 2.6, radius * 2.6);
    });
    revealedContext!.setTransform(1, 0, 0, 1, 0, 0);
    revealedContext!.globalCompositeOperation = "source-over";
    revealedContext!.clearRect(0, 0, revealed.width, revealed.height);
    revealedContext!.drawImage(poster, 0, 0);
    revealedContext!.globalCompositeOperation = "destination-in";
    revealedContext!.drawImage(mask, 0, 0);
    revealedContext!.globalCompositeOperation = "source-over";
    context!.setTransform(1, 0, 0, 1, 0, 0);
    context!.drawImage(revealed, 0, 0);
    frame = requestAnimationFrame(draw);
  }

  function schedule(): void {
    if (!frame && active && ready && visible && !document.hidden) frame = requestAnimationFrame(draw);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
  const intersectionObserver = new IntersectionObserver(entries => {
    visible = !!entries[0]?.isIntersecting;
    if (!visible) { cancelAnimationFrame(frame); frame = 0; }
    else { resize(); schedule(); }
  });
  intersectionObserver.observe(root);
  const onVisibility = () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else schedule();
  };
  document.addEventListener("visibilitychange", onVisibility);
  const onPageHide = () => api.destroy();
  window.addEventListener("pagehide", onPageHide, { once: true });
  source.onload = () => { if (!destroyed) { ready = true; rebuild(); } };
  source.onerror = () => { /* An unavailable poster leaves the hero video untouched. */ };
  source.src = options.image;
  resize();

  const api: AsciiReveal = {
    move(x, y) {
      if (destroyed || !ready || !width || !height || options.reveal === false) return;
      target.x = clamp(x, 0, width);
      target.y = clamp(y, 0, height);
      if (!active) blobs.forEach(blob => { blob.x = target.x; blob.y = target.y; });
      active = true;
      lastMove = performance.now();
      schedule();
    },
    leave() { if (active) lastMove = Math.min(lastMove, performance.now() - 450); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      source.onload = null;
      source.onerror = null;
      source.src = "";
      canvas.remove();
    }
  };
  return api;
}
