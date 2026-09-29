export type GlyphWallOptions = {
  size?: number;
  reach?: number;
  trail?: number;
  glyphColor?: string;
  accent?: string;
};

export type GlyphWall = {
  move(x: number, y: number): void;
  leave(): void;
  destroy(): void;
};

const COUNT = 16;
const vertexSource = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;
const fragmentSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform float uCell;
uniform float uReach;
uniform vec3 uGlyphColor;
uniform vec3 uAccent;
uniform sampler2D uAtlas;
uniform vec4 uTrail[16];
uniform int uTrailCount;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 cell = floor(p / uCell);
  vec2 local = fract(p / uCell);
  float random = hash(cell);
  float index = floor(random * 16.0);
  vec2 tile = vec2(mod(index, 4.0), floor(index / 4.0));
  local.x = mix(local.x, 1.0 - local.x, step(0.6, hash(cell + 17.0)));
  vec2 atlasUV = (tile + local) * 0.25;
  float glyph = texture2D(uAtlas, atlasUV).a;
  float blank = step(0.12, hash(cell + 4.0));
  float light = 0.0;
  vec2 centre = (cell + 0.5) * uCell;
  for (int i = 0; i < 16; i++) {
    if (i >= uTrailCount) break;
    float radius = uReach * (0.85 + 0.3 * hash(cell + 9.0));
    float influence = 1.0 - smoothstep(radius * 0.25, radius, distance(centre, uTrail[i].xy));
    light = max(light, influence * uTrail[i].z);
  }
  float lit = smoothstep(0.18 + random * 0.17, 0.42 + random * 0.15, light);
  float groove = 0.7 + 0.3 * smoothstep(0.0, 1.0, local.x);
  vec3 color = mix(uGlyphColor, uAccent, lit) * groove;
  float alpha = glyph * blank * (0.58 + lit * 0.38);
  gl_FragColor = vec4(color, alpha);
}
`;

// Abstract strokes are drawn into a small texture once; no Unicode font is required.
const paths = [
  "M17 12 L10 12 L10 52 L17 52 M47 12 L54 12 L54 52 L47 52",
  "M13 44 L32 17 L51 44 M20 44 L44 44",
  "M17 30 Q32 9 47 30 Q32 54 17 30 Z",
  "M12 32 L52 32 M32 12 L32 52",
  "M15 45 L48 17 M18 17 L47 45",
  "M15 16 L42 16 L49 23 L49 48 L22 48 L15 41 Z",
  "M13 21 Q32 4 51 21 M13 43 Q32 60 51 43 M32 15 L32 49",
  "M13 15 L27 15 L27 29 L41 29 L41 49 L52 49",
  "M18 14 Q8 32 18 50 M46 14 Q56 32 46 50",
  "M12 32 L25 19 M12 32 L25 45 M52 32 L39 19 M52 32 L39 45",
  "M30 15 L43 15 M30 15 L19 48 M19 48 L43 48",
  "M15 25 L25 15 L39 15 L49 25 L49 39 L39 49 L25 49 L15 39 Z",
  "M18 17 L46 17 M18 32 L39 32 M18 47 L46 47",
  "M13 43 L26 21 L34 39 L46 17 L52 43",
  "M20 12 L20 52 M20 32 L44 12 M20 32 L44 52",
  "M14 19 L49 19 M14 32 L40 32 M14 45 L49 45"
];

function color(hex: string): Float32Array {
  const value = hex.replace("#", "");
  return new Float32Array([0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16) / 255));
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function initGlyphWall(element: HTMLElement, options: GlyphWallOptions = {}): GlyphWall | null {
  const canvas = document.createElement("canvas");
  let gl: WebGLRenderingContext | null;
  try { gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: false, premultipliedAlpha: false }); }
  catch { return null; }
  if (!gl) return null;
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) { if (vertex) gl.deleteShader(vertex); if (fragment) gl.deleteShader(fragment); return null; }
  const program = gl.createProgram();
  if (!program) { gl.deleteShader(vertex); gl.deleteShader(fragment); return null; }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return null; }

  const atlas = document.createElement("canvas");
  atlas.width = atlas.height = 256;
  const ctx = atlas.getContext("2d");
  const texture = gl.createTexture();
  const buffer = gl.createBuffer();
  if (!ctx || !texture || !buffer) {
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    return null;
  }
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2.3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  paths.forEach((path, index) => {
    ctx.save();
    ctx.translate((index % 4) * 64, Math.floor(index / 4) * 64);
    ctx.stroke(new Path2D(path));
    ctx.restore();
  });
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.useProgram(program);
  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.uniform1i(gl.getUniformLocation(program, "uAtlas"), 0);
  gl.uniform3fv(gl.getUniformLocation(program, "uGlyphColor"), color(options.glyphColor ?? "#404040"));
  gl.uniform3fv(gl.getUniformLocation(program, "uAccent"), color(options.accent ?? "#C91422"));
  const cellSize = gl.getUniformLocation(program, "uCell");
  const reach = gl.getUniformLocation(program, "uReach");
  const trailUniform = gl.getUniformLocation(program, "uTrail[0]");
  const countUniform = gl.getUniformLocation(program, "uTrailCount");
  const points = new Float32Array(COUNT * 4);
  const stamps = new Float64Array(COUNT);
  let count = 0;
  let next = 0;
  let lastSample = 0;
  let frame = 0;
  let visible = false;
  let destroyed = false;
  let dpr = 1;
  let width = 0;
  let height = 0;
  const duration = options.trail ?? 900;

  canvas.className = "glyph-wall-canvas";
  canvas.setAttribute("aria-hidden", "true");
  element.append(canvas);

  function resize(): void {
    const rect = element.getBoundingClientRect();
    const nextDpr = Math.min(1.25, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(rect.width * nextDpr));
    const h = Math.max(1, Math.round(rect.height * nextDpr));
    if (w === canvas.width && h === canvas.height) return;
    dpr = nextDpr;
    width = w;
    height = h;
    canvas.width = w;
    canvas.height = h;
    gl!.viewport(0, 0, w, h);
    gl!.uniform1f(cellSize, (options.size ?? 66) * dpr);
    gl!.uniform1f(reach, (options.reach ?? 220) * dpr);
    cancelAnimationFrame(frame);
    frame = 0;
    schedule();
  }

  function render(now: number): void {
    if (destroyed || !visible || document.hidden) return;
    let active = 0;
    for (let i = 0; i < count; i++) {
      const offset = i * 4;
      const strength = Math.max(0, 1 - (now - stamps[i]!) / duration);
      points[offset + 2] = strength;
      if (strength > 0) active++;
    }
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.uniform1i(countUniform, count);
    gl!.uniform4fv(trailUniform, points);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    if (active) frame = requestAnimationFrame(render);
    else frame = 0;
  }

  function schedule(): void {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(element);
  const intersection = new IntersectionObserver(entries => {
    visible = !!entries[0]?.isIntersecting;
    if (visible) { resize(); schedule(); }
    else { cancelAnimationFrame(frame); frame = 0; }
  });
  intersection.observe(element);
  const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else schedule(); };
  document.addEventListener("visibilitychange", visibility);
  const cleanup = () => api.destroy();
  window.addEventListener("pagehide", cleanup, { once: true });
  const contextLost = (event: Event) => { event.preventDefault(); api.destroy(); };
  canvas.addEventListener("webglcontextlost", contextLost);

  const api: GlyphWall = {
    move(x, y) {
      if (destroyed || !visible || !width || !height) return;
      const now = performance.now();
      if (count && now - lastSample < 45) {
        const current = (next + COUNT - 1) % COUNT;
        points[current * 4] = x * dpr;
        points[current * 4 + 1] = height - y * dpr;
        stamps[current] = now;
        schedule();
        return;
      }
      const index = next;
      points[index * 4] = x * dpr;
      points[index * 4 + 1] = height - y * dpr;
      points[index * 4 + 2] = 1;
      stamps[index] = now;
      lastSample = now;
      next = (next + 1) % COUNT;
      count = Math.min(count + 1, COUNT);
      schedule();
    },
    leave() { schedule(); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", cleanup);
      canvas.removeEventListener("webglcontextlost", contextLost);
      gl!.deleteBuffer(buffer);
      gl!.deleteTexture(texture);
      gl!.deleteProgram(program);
      canvas.remove();
    }
  };
  return api;
}
