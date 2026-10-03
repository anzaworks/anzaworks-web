/** Native Logo-only port of the supplied Glass Icon — Originkit.
 * Alpha SDF, rounded extrusion, ray marching, reflection, refraction and frost.
 * No React, Three.js, stock imagery or framework dependencies. */
const CORE_REFRACT = 1.0, IOR = 1.5, THICKNESS = 2.0;
export const GLASS_SETTINGS = Object.freeze({ depth: 30, size: 60, speed: 20, direction: "Clockwise", chromatic: 10, frost: 14 });
function rotYX(yaw: number, pitch: number): Float32Array {
    const cy = Math.cos(yaw)
    const sy = Math.sin(yaw)
    const cx = Math.cos(pitch)
    const sx = Math.sin(pitch)
    const m = new Float32Array(9)

    m[0]! = cy
    m[1]! = 0
    m[2]! = -sy

    m[3]! = sy * sx
    m[4]! = cx
    m[5]! = cy * sx

    m[6]! = sy * cx
    m[7]! = -sx
    m[8]! = cy * cx
    return m
}

function transpose3(m: Float32Array): Float32Array {
    const o = new Float32Array(9)
    o[0]! = m[0]!
    o[1]! = m[3]!
    o[2]! = m[6]!
    o[3]! = m[1]!
    o[4]! = m[4]!
    o[5]! = m[7]!
    o[6]! = m[2]!
    o[7]! = m[5]!
    o[8]! = m[8]!
    return o
}

function mul3(a: Float32Array, b: Float32Array): Float32Array {
    const o = new Float32Array(9)
    for (let c = 0; c < 3; c++)
        for (let r = 0; r < 3; r++)
            o[c * 3 + r]! = a[r]! * b[c * 3]! + a[3 + r]! * b[c * 3 + 1]! + a[6 + r]! * b[c * 3 + 2]!
    return o
}

function rotYXZ(yaw: number, pitch: number, roll: number): Float32Array {
    const base = rotYX(yaw, pitch)
    if (roll === 0) return base
    const c = Math.cos(roll)
    const s = Math.sin(roll)
    const rz = new Float32Array([c, s, 0, -s, c, 0, 0, 0, 1])
    return mul3(base, rz)
}

function buildEnvCanvas(): HTMLCanvasElement | null {
    if (typeof document === "undefined") return null
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(0, 0, 1024, 512)

    const softbox = (x: number, y: number, w: number, h: number, intensity: number) => {
        const grd = ctx.createLinearGradient(x, y, x, y + h)
        grd.addColorStop(0, `rgba(255, 255, 255, ${intensity})`)
        grd.addColorStop(1, `rgba(50, 50, 50, ${intensity * 0.2})`)
        ctx.fillStyle = grd
        ctx.shadowColor = "#ffffff"
        ctx.shadowBlur = 80
        ctx.beginPath()
        const rr = ctx.roundRect
        if (typeof rr === "function") rr.call(ctx, x, y, w, h, 60)
        else ctx.rect(x, y, w, h)
        ctx.fill()
    }
    softbox(50, 100, 300, 312, 1)
    softbox(674, 100, 300, 312, 1)
    softbox(350, -50, 324, 150, 0.9)
    ctx.shadowBlur = 40
    ctx.shadowColor = "#C91422"
    ctx.fillStyle = "#C91422"
    ctx.fillRect(520, 210, 35, 250)
    ctx.shadowBlur = 0
    return canvas
}

// A local translucent studio-light plate gives frost/refraction something to sample,
// without changing the near-black page background or loading remote demo imagery.
function buildLightPlate(): HTMLCanvasElement | null {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const light = ctx.createLinearGradient(0, 0, 512, 512);
    light.addColorStop(0, "rgba(215,209,200,.65)");
    light.addColorStop(.42, "rgba(110,106,100,.35)");
    light.addColorStop(.7, "rgba(20,18,18,.15)");
    light.addColorStop(1, "rgba(201,20,34,.4)");
    ctx.fillStyle = light; ctx.fillRect(0,0,512,512);
    return canvas;
}

const SDF_MAX = 384
const SDF_PAD = 24
const SDF_SPREAD = 32

function edt1d(f: Float32Array, d: Float32Array, v: Int32Array, z: Float32Array, n: number) {
    let k = 0
    v[0]! = 0
    z[0]! = -Infinity
    z[1]! = Infinity
    for (let q = 1; q < n; q++) {
        let s = (f[q]! + q * q - (f[v[k]!]! + v[k]! * v[k]!)) / (2 * q - 2 * v[k]!)
        while (s <= z[k]!) {
            k--
            s = (f[q]! + q * q - (f[v[k]!]! + v[k]! * v[k]!)) / (2 * q - 2 * v[k]!)
        }
        k++
        v[k]! = q
        z[k]! = s
        z[k + 1]! = Infinity
    }
    k = 0
    for (let q = 0; q < n; q++) {
        while (z[k + 1]! < q) k++
        d[q]! = (q - v[k]!) * (q - v[k]!) + f[v[k]!]!
    }
}

function edt2d(mask: Uint8Array, w: number, h: number): Float32Array {
    const INF = 1e20
    const grid = new Float32Array(w * h)
    for (let i = 0; i < w * h; i++) grid[i]! = mask[i]! ? 0 : INF
    const n = Math.max(w, h)
    const f = new Float32Array(n)
    const d = new Float32Array(n)
    const v = new Int32Array(n)
    const z = new Float32Array(n + 1)
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) f[y]! = grid[y * w + x]!
        edt1d(f, d, v, z, h)
        for (let y = 0; y < h; y++) grid[y * w + x]! = d[y]!
    }
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) f[x]! = grid[y * w + x]!
        edt1d(f, d, v, z, w)
        for (let x = 0; x < w; x++) grid[y * w + x]! = d[x]!
    }
    return grid
}

export function bakeSDF(alpha: Uint8ClampedArray, w: number, h: number): Uint8Array {
    const inside = new Uint8Array(w * h)
    const outside = new Uint8Array(w * h)
    for (let i = 0; i < w * h; i++) {
        const on = alpha[i * 4 + 3]! > 127 ? 1 : 0
        inside[i]! = on
        outside[i]! = on ? 0 : 1
    }
    const dOut = edt2d(inside, w, h)
    const dIn = edt2d(outside, w, h)
    const signed = new Float32Array(w * h)
    for (let i = 0; i < w * h; i++) signed[i]! = inside[i]! ? Math.sqrt(dIn[i]!) : -Math.sqrt(dOut[i]!)

    const blurred = new Float32Array(w * h)
    const tmp = new Float32Array(w * h)
    const K = [0.06136, 0.24477, 0.38774, 0.24477, 0.06136]
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            let s = 0
            for (let k = -2; k <= 2; k++) s += K[k + 2]! * signed[y * w + Math.min(w - 1, Math.max(0, x + k))]!
            tmp[y * w + x]! = s
        }
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            let s = 0
            for (let k = -2; k <= 2; k++) s += K[k + 2]! * tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x]!
            blurred[y * w + x]! = s
        }

    const out = new Uint8Array(w * h * 4)
    for (let i = 0; i < w * h; i++) {
        const norm = Math.max(0, Math.min(1, 0.5 + blurred[i]! / (2 * SDF_SPREAD)))
        const b = Math.round(norm * 255)
        out[i * 4]! = b
        out[i * 4 + 1]! = b
        out[i * 4 + 2]! = b
        out[i * 4 + 3]! = 255
    }
    return out
}

const FULLSCREEN_VS = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`

const GLASS_FS = `
precision highp float;

uniform vec2 uRes;
uniform float uAspect;
uniform float uTanHalf;

uniform sampler2D uPlate;
uniform vec2 uPlateFit;
uniform float uHasPlate;
uniform sampler2D uEnv;
uniform sampler2D uSDF;
uniform sampler2D uBrand;

uniform mat3 uRot;
uniform mat3 uRotT;
uniform vec3 uCenter;
uniform float uScale;
uniform float uBoundR;

uniform float uHalfDepth;
uniform float uBevel;
uniform vec2 uLogoHalf;
uniform float uSdfUnits;

uniform float uDisp;
uniform float uFrost;
uniform vec3 uTint;

const float PI = 3.14159265359;
const float CORE_REFRACT = ${CORE_REFRACT.toFixed(4)};
const float IOR = ${IOR.toFixed(4)};
const float THICKNESS = ${THICKNESS.toFixed(4)};

float sdLogo(vec2 p) {
    vec2 uv = p / (2.0 * uLogoHalf) + 0.5;

    uv.y = 1.0 - uv.y;
    vec2 e = abs(p) - uLogoHalf;
    float dBox = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0);

    float dTex = (0.5 - texture2D(uSDF, clamp(uv, 0.0, 1.0)).r) * 2.0 * uSdfUnits;
    return max(dTex, dBox);
}

float extrudeRound(float d2, float pz, float hd, float r) {
    vec2 q = vec2(d2 + r, abs(pz) - hd + r);
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float map(vec3 p) {
    return extrudeRound(sdLogo(p.xy), p.z, uHalfDepth, uBevel);
}

vec3 mapNormal(vec3 p) {
    const float e = 0.0015;
    vec2 k = vec2(1.0, -1.0);
    return normalize(
        k.xyy * map(p + k.xyy * e) +
        k.yyx * map(p + k.yyx * e) +
        k.yxy * map(p + k.yxy * e) +
        k.xxx * map(p + k.xxx * e)
    );
}

vec4 plate(vec2 screenUv) {
    if (uHasPlate < 0.5) return vec4(0.0);
    vec2 uv = (screenUv - 0.5) * uPlateFit + 0.5;
    return texture2D(uPlate, clamp(uv, 0.0, 1.0));
}

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 screenUv = gl_FragCoord.xy / uRes;
    vec2 ndc = screenUv * 2.0 - 1.0;

    vec3 D = normalize(vec3(ndc.x * uTanHalf * uAspect, ndc.y * uTanHalf, -1.0));
    vec3 rd = normalize(uRotT * D);
    vec3 ro = (uRotT * -uCenter) / uScale;

    float bb = dot(ro, rd);
    float cc = dot(ro, ro) - uBoundR * uBoundR;
    float hh = bb * bb - cc;
    if (hh < 0.0) discard;
    hh = sqrt(hh);
    float t = max(-bb - hh, 0.0);
    float tMax = -bb + hh;

    bool hit = false;
    for (int i = 0; i < 80; i++) {
        if (t > tMax) break;
        float d = map(ro + rd * t);
        if (d < 0.0009) { hit = true; break; }
        t += d * 0.9;
    }
    if (!hit) discard;

    vec3 pObj = ro + rd * t;
    vec3 nObj = mapNormal(pObj);

    vec3 vP = uCenter + uScale * (uRot * pObj);
    vec3 normal = normalize(uRot * nObj);
    vec3 viewDir = normalize(-vP);

    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 4.0);

    float coreFactor = pow(max(dot(normal, viewDir), 0.0), 2.0);
    vec2 lensOffset = (screenUv - 0.5) * (CORE_REFRACT * 0.15) * coreFactor;

    vec3 refractView = refract(-viewDir, normal, 1.0 / IOR);
    vec2 offset = refractView.xy * (THICKNESS * 0.1) - lensOffset;

    vec3 reflectDir = reflect(-viewDir, normal);
    vec2 equirectUv = vec2(
        atan(reflectDir.z, reflectDir.x) / (2.0 * PI) + 0.5,
        asin(clamp(reflectDir.y, -1.0, 1.0)) / PI + 0.5
    );
    vec3 reflection = texture2D(uEnv, equirectUv).rgb * 2.5;

    vec3 transmission = vec3(0.0);
    float bgAlpha = 0.0;

    vec2 uvR = screenUv + offset * (1.0 + uDisp);
    vec2 uvG = screenUv + offset;
    vec2 uvB = screenUv + offset * (1.0 - uDisp);

    if (uFrost > 0.001) {
        float rnd = rand(screenUv) * 6.2831853;
        const int SAMPLES = 12;
        const float GOLDEN_ANGLE = 2.39996323;
        float radius = 0.0;
        float radiusStep = 1.0 / float(SAMPLES);
        float blurMultiplier = uFrost * 0.025;
        for (int i = 0; i < SAMPLES; i++) {
            float theta = float(i) * GOLDEN_ANGLE + rnd;
            radius += radiusStep;
            vec2 bo = vec2(cos(theta), sin(theta)) * radius * blurMultiplier;
            transmission.r += plate(uvR + bo).r;
            vec4 g = plate(uvG + bo);
            transmission.g += g.g;
            bgAlpha += g.a;
            transmission.b += plate(uvB + bo).b;
        }
        transmission /= float(SAMPLES);
        bgAlpha /= float(SAMPLES);
    } else {
        transmission.r = plate(uvR).r;
        vec4 g = plate(uvG);
        transmission.g = g.g;
        bgAlpha = g.a;
        transmission.b = plate(uvB).b;
    }

    transmission *= uTint;

    vec3 clearGlassTint = mix(uTint, reflection, 0.5);
    transmission = mix(clearGlassTint, transmission, bgAlpha);

    vec3 finalColor = mix(transmission, reflection, fresnel * 0.8);

    float baseAlpha = max(0.25, fresnel * 0.85);
    float outAlpha = mix(baseAlpha, 1.0, bgAlpha);

    // Sample the actual logo in object space: the swoosh rotates with the glass,
    // rather than receiving a screen-space red overlay or recoloring the AW body.
    vec2 brandUv = pObj.xy / (2.0 * uLogoHalf) + 0.5;
    brandUv.y = 1.0 - brandUv.y;
    float accent = texture2D(uBrand, clamp(brandUv, 0.0, 1.0)).r;
    vec3 brandedRed = vec3(201.0, 20.0, 34.0) / 255.0;
    vec3 redGlass = brandedRed * (0.8 + 0.2 * max(dot(normal, viewDir), 0.0));
    redGlass += min(reflection, vec3(1.0)) * fresnel * 0.06;
    finalColor = mix(finalColor, redGlass, accent);
    outAlpha = mix(outAlpha, max(outAlpha, 0.95), accent);
    // Match the alpha-premultiplied browser compositor; misses remain discarded.
    gl_FragColor = vec4(finalColor * outAlpha, outAlpha);
}`


/** Extract only the source artwork's red ink, retaining antialiased boundaries. */
export function bakeBrandMask(rgba: Uint8ClampedArray): Uint8Array {
    const mask = new Uint8Array(rgba.length);
    for (let i = 0; i < rgba.length; i += 4) {
        const dominance = Math.max(0, rgba[i]! - Math.max(rgba[i+1]!, rgba[i+2]!));
        const value = Math.round(Math.min(1, dominance / 120) * rgba[i+3]!);
        mask[i] = mask[i+1] = mask[i+2] = value;
        mask[i+3] = 255;
    }
    return mask;
}

type GlassEffect = { destroy(): void };
const instances = new WeakMap<HTMLElement, GlassEffect>();

/** Exactly one owner per stage. Reduced motion keeps the original transparent PNG. */
export function initGlassLogo(host: HTMLElement): GlassEffect {
    const existing = instances.get(host);
    if (existing) return existing;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const controller = new AbortController();
    let renderer: GlassEffect | null = null;
    let destroyed = false;
    const update = () => {
        renderer?.destroy(); renderer = null;
        if (!destroyed && !reduced.matches) renderer = initGlassRenderer(host);
    };
    const effect = { destroy() {
        if (destroyed) return;
        destroyed = true; controller.abort(); renderer?.destroy(); renderer = null;
        instances.delete(host);
    } };
    instances.set(host, effect);
    reduced.addEventListener("change", update, { signal: controller.signal });
    update();
    return effect;
}

function initGlassRenderer(host: HTMLElement): GlassEffect {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    host.append(canvas);
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) {
        canvas.remove();
        return { destroy() {} };
    }
    const controller = new AbortController();
    const { signal } = controller;
    const shaders: WebGLShader[] = [], textures: WebGLTexture[] = [];
    let program: WebGLProgram | null = null, buffer: WebGLBuffer | null = null;
    let resizeObserver: ResizeObserver | null = null, intersection: IntersectionObserver | null = null;
    let frame = 0, last = 0, lastPaint = 0, elapsed = 0, visible = true, destroyed = false, ready = false;
    let sdfHeight = 1, aspect = 1, width = 1, height = 1;
    let tiltX = 0, tiltY = 0, targetX = 0, targetY = 0, dragYaw = 0, dragPitch = 0;
    let drag: { id: number; x: number; y: number } | null = null;
    const desktop = matchMedia("(min-width: 900px)");
    const coarse = matchMedia("(pointer: coarse)");
    const image = new Image();
    const mobile = () => !desktop.matches || coarse.matches;
    const stop = () => { cancelAnimationFrame(frame); frame = 0; last = 0; lastPaint = 0; };
    const release = () => {
        const id = drag?.id;
        drag = null;
        if (id !== undefined && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
        host.classList.remove("glass-dragging");
    };
    const destroy = () => {
        if (destroyed) return;
        destroyed = true; stop(); release(); controller.abort();
        image.onload = image.onerror = null;
        resizeObserver?.disconnect(); intersection?.disconnect();
        textures.forEach(texture => gl.deleteTexture(texture));
        shaders.forEach(shader => gl.deleteShader(shader));
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
        canvas.remove(); host.classList.remove("glass-ready");
    };
    const fallback = () => {
        destroy();
    };
    try {
        const compile = (type: number, source: string) => {
            const shader = gl.createShader(type);
            if (!shader) throw new Error("Shader allocation");
            shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Glass shader compilation");
            return shader;
        };
        program = gl.createProgram();
        if (!program) throw new Error("Program allocation");
        gl.attachShader(program, compile(gl.VERTEX_SHADER, FULLSCREEN_VS));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, GLASS_FS));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Glass program linking");
        const uniforms = new Map<string, WebGLUniformLocation | null>();
        const uniform = (name: string) => {
            if (!uniforms.has(name)) uniforms.set(name, gl.getUniformLocation(program!, name));
            return uniforms.get(name) ?? null;
        };
        const texture = (unit: number, source?: HTMLCanvasElement) => {
            const tex = gl.createTexture();
            if (!tex) throw new Error("Texture allocation");
            textures.push(tex); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            if (source) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
            else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));
            return tex;
        };
        const env = buildEnvCanvas();
        if (!env) throw new Error("Reflection map");
        const plate = buildLightPlate();
        if (!plate) throw new Error("Light plate");
        texture(0, plate); texture(1, env); const sdfTexture = texture(2); const brandTexture = texture(3);
        buffer = gl.createBuffer();
        if (!buffer) throw new Error("Buffer allocation");
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
        gl.useProgram(program);
        const attribute = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
        gl.disable(gl.DEPTH_TEST);
        gl.clearColor(0, 0, 0, 0);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform1i(uniform("uPlate"),0); gl.uniform1i(uniform("uEnv"),1); gl.uniform1i(uniform("uSDF"),2); gl.uniform1i(uniform("uBrand"),3);
        gl.uniform1f(uniform("uHasPlate"),1); gl.uniform2f(uniform("uPlateFit"),1,1);
        gl.uniform1f(uniform("uTanHalf"),Math.tan(Math.PI/8));
        gl.uniform1f(uniform("uHalfDepth"),GLASS_SETTINGS.depth/100*.5/1.3);
        gl.uniform1f(uniform("uBevel"),.025/1.3);
        gl.uniform1f(uniform("uDisp"),GLASS_SETTINGS.chromatic/1000);
        gl.uniform1f(uniform("uFrost"),GLASS_SETTINGS.frost/100);
        gl.uniform3f(uniform("uTint"),1,.98,.95);
        const paint = () => {
            if (destroyed || !ready || !visible || document.hidden) return;
            const yaw = elapsed * GLASS_SETTINGS.speed/50*.5 + dragYaw + tiltX - .24;
            const pitch = .08 + dragPitch - tiltY + Math.sin(elapsed*.2)*.06;
            const rotation = rotYXZ(yaw, pitch, 0);
            gl.viewport(0,0,width,height); gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform2f(uniform("uRes"),width,height); gl.uniform1f(uniform("uAspect"),width/height);
            gl.uniformMatrix3fv(uniform("uRot"),false,rotation);
            gl.uniformMatrix3fv(uniform("uRotT"),false,transpose3(rotation));
            gl.uniform3f(uniform("uCenter"),0,Math.sin(elapsed*.5)*.015,-5);
            gl.uniform1f(uniform("uScale"),.60*5*Math.tan(Math.PI/8)/Math.max(1,aspect));
            gl.uniform1f(uniform("uBoundR"),Math.hypot(aspect,1,.12)+.025);
            gl.uniform2f(uniform("uLogoHalf"),aspect,1);
            gl.uniform1f(uniform("uSdfUnits"),SDF_SPREAD*2/sdfHeight);
            gl.drawArrays(gl.TRIANGLES,0,3);
            host.classList.add("glass-ready");
        };
        const tick = (time: number) => {
            frame = 0;
            if (destroyed || !ready || !visible || document.hidden) return;
            const dt = last ? Math.min((time-last)/1000,.05) : 1/60;
            last = time; elapsed += dt;
            const k = 1-Math.exp(-5*dt);
            tiltX += (targetX-tiltX)*k; tiltY += (targetY-tiltY)*k;
            // Mobile keeps the same time-based speed while drawing about 30 fps.
            if (!mobile() || !lastPaint || time-lastPaint >= 1000/30-.5) {
                paint(); lastPaint = time;
            }
            frame = requestAnimationFrame(tick);
        };
        const wake = () => {
            if (destroyed || !ready || !visible || document.hidden) return;
            if (!frame) frame = requestAnimationFrame(tick);
        };
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, mobile()?2:1.5);
            const rect = host.getBoundingClientRect();
            width = Math.max(1,Math.min(mobile()?640:780,Math.round(rect.width*dpr)));
            height = Math.max(1,Math.min(mobile()?640:780,Math.round(rect.height*dpr)));
            canvas.width = width; canvas.height = height; wake();
        };
        const mode = () => { stop(); release(); targetX=targetY=tiltX=tiltY=0; dragYaw=dragPitch=0; resize();
        };
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host); resize();
        intersection = new IntersectionObserver(entries => {
            visible = entries[0]?.isIntersecting ?? false;
            if (!visible) { stop(); release(); } else wake();
        }); intersection.observe(host);
        document.addEventListener("visibilitychange",()=>{if(document.hidden){stop();release();}else wake();},{signal});
        desktop.addEventListener("change",mode,{signal}); coarse.addEventListener("change",mode,{signal});
        canvas.addEventListener("webglcontextlost",event=>{event.preventDefault();fallback();},{signal});
        canvas.addEventListener("pointerdown",event=>{
            if(event.pointerType!=="mouse" || event.button!==0 || drag) return;
            drag={id:event.pointerId,x:event.clientX,y:event.clientY};
            canvas.setPointerCapture(event.pointerId);host.classList.add("glass-dragging");
        },{signal});
        canvas.addEventListener("pointermove",event=>{
            if(event.pointerType!=="mouse") return;
            if(drag?.id===event.pointerId){
                dragYaw=Math.max(-.5,Math.min(.5,dragYaw+(event.clientX-drag.x)*.003));
                dragPitch=Math.max(-.3,Math.min(.3,dragPitch+(event.clientY-drag.y)*.003));
                drag.x=event.clientX;drag.y=event.clientY;
            }else{
                const r=host.getBoundingClientRect();
                targetX=Math.max(-.14,Math.min(.14,((event.clientX-r.left)/r.width-.5)*.28));
                targetY=Math.max(-.14,Math.min(.14,-((event.clientY-r.top)/r.height-.5)*.28));
            }
        },{signal});
        for(const event of ["pointerup","pointercancel","lostpointercapture"])canvas.addEventListener(event,release,{signal});
        canvas.addEventListener("pointerleave",()=>{targetX=targetY=0;},{signal});
        image.onload = () => {
            if(destroyed)return;
            try{
                const sample=document.createElement("canvas");
                const limit=desktop.matches?SDF_MAX:256;
                const ratio=Math.min((limit-SDF_PAD*2)/image.width,(limit-SDF_PAD*2)/image.height,1);
                const iw=Math.max(1,Math.round(image.width*ratio)),ih=Math.max(1,Math.round(image.height*ratio));
                sample.width=iw+SDF_PAD*2;sample.height=ih+SDF_PAD*2;
                const ctx=sample.getContext("2d");if(!ctx)throw new Error("Logo sampling");
                ctx.drawImage(image,SDF_PAD,SDF_PAD,iw,ih);
                const rgba=ctx.getImageData(0,0,sample.width,sample.height).data;
                const pixels=bakeSDF(rgba,sample.width,sample.height);
                gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,sdfTexture);
                gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,sample.width,sample.height,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
                gl.activeTexture(gl.TEXTURE0+3);gl.bindTexture(gl.TEXTURE_2D,brandTexture);
                gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,sample.width,sample.height,0,gl.RGBA,gl.UNSIGNED_BYTE,bakeBrandMask(rgba));
                sdfHeight=sample.height;aspect=sample.width/sample.height;ready=true;mode();
            }catch{fallback();}
        };
        image.onerror=fallback;image.src="/brand/anza-logo-main.png";
    } catch { fallback(); }
    return { destroy };
}
