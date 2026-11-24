/* background-runtime.js : moteur WebGL2 du composant Smoke de shadcn.io (composant Pro),
   utilisé sous la licence du client. Fichier d'origine : background-runtime.ts, converti en JavaScript
   par node:module stripTypeScriptTypes (types retirés, code inchangé). Pour le mettre à jour,
   refaire la même conversion sur la nouvelle version du fichier. */
/**
 * Runs GLSL fragment shaders on WebGL2 for the background components.
 * Framework-free and dependency-free: React, Vue, Svelte and Solid all
 * install this file as is.
 *
 * - Every background on the page shares one frame loop. A background
 *   animates only while it's on screen and the tab is visible; with reduced
 *   motion it draws one still frame.
 * - Colours are any CSS colour (`var(--primary)`, `oklch(…)`, `color-mix(…)`),
 *   resolved on the canvas and again when the theme changes.
 * - The canvas is transparent: a scene returns premultiplied colour, so it
 *   sits on whatever surface is behind it. The runtime reads that surface
 *   (`uSurface`, `uDark`) so a scene can glow on dark and tint on light.
 *   What it outputs is always valid premultiplied colour (alpha at least
 *   the brightest channel): Safari drops anything brighter than its alpha.
 * - Without WebGL2, the root keeps its CSS background (`data-state` is
 *   "unsupported").
 *
 * A scene is GLSL ES 3.00 that declares its own uniforms and defines
 * `vec4 scene(vec2 frag)`: `frag` in device pixels from the bottom left,
 * the result premultiplied. The runtime adds the header, the shared
 * uniforms and helpers below (`PRELUDE`), and `main`, which dithers the
 * result and adds the `grain`.
 */

/** What every scene starts with: the shared uniforms and helpers. */
const PRELUDE = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uResolution;   // device pixels
uniform float uTime;        // seconds, already scaled by speed
uniform float uPixelRatio;  // device pixels per CSS pixel
uniform vec3 uPointer;      // xy: device pixels from the bottom left, eased; z: 0-1 while it's over
uniform vec2 uPointerMove;  // the pointer's eased velocity, device pixels per second
uniform vec4 uPulses[4];    // presses: xy device pixels, z age in seconds, w 1 while alive
uniform float uIntro;       // eases 0-1 once, when it first shows
uniform vec3 uSurface;      // the surface behind the canvas, sRGB
uniform float uDark;        // 1 on a dark surface, 0 on a light one
uniform float uGrain;
uniform sampler2D uState;   // the simulation's last result
uniform sampler2D uAtlas;   // the glyph row
uniform float uAtlasCount;
out vec4 outColor;

#define PI 3.141592653589793
#define TAU 6.283185307179586

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec2 hash22(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
vec3 hash32(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yxz + 33.33); return fract((q.xxy + q.yzz) * q.zyx); }
mat2 rotate(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

// Value noise, 0-1.
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 w = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), w.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), w.x), w.y);
}

// Simplex noise, -1 to 1.
vec3 permute(vec3 x) { return mod((x * 34.0 + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy)), x0 = v - i + dot(i, C.xx);
  vec2 i1 = x0.x > x0.y ? vec2(1, 0) : vec2(0, 1);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0, i1.y, 1)) + i.x + vec3(0, i1.x, 1));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m *= m; m *= m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0, h = abs(x) - 0.5, a0 = x - floor(x + 0.5);
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  return 130.0 * dot(m, vec3(a0.x * x0.x + h.x * x0.y, a0.yz * x12.xz + h.yz * x12.yw));
}

// Fractal noise, about -1 to 1: octaves of simplex, each turned so no axis shows.
float fbm(vec2 p, int octaves) {
  float sum = 0.0, amp = 0.5;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amp * snoise(p);
    p = rotate(0.6) * p * 2.02 + 11.7;
    amp *= 0.5;
  }
  return sum;
}

// OKLab, so colours mix without going muddy or grey in the middle.
vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 toSrgb(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
vec3 toOklab(vec3 c) {
  vec3 l = toLinear(c);
  vec3 lms = pow(max(mat3(0.4122214708, 0.2119034982, 0.0883024619, 0.5363325363, 0.6806995451, 0.2817188376, 0.0514459929, 0.1073969566, 0.6299787005) * l, 0.0), vec3(1.0 / 3.0));
  return mat3(0.2104542553, 1.9779984951, 0.0259040371, 0.7936177850, -2.4285922050, 0.7827717662, -0.0040720468, 0.4505937099, -0.8086757660) * lms;
}
vec3 fromOklab(vec3 c) {
  vec3 lms = mat3(1.0, 1.0, 1.0, 0.3963377774, -0.1055613458, -0.0894841775, 0.2158037573, -0.0638541728, -1.2914855480) * c;
  lms *= lms * lms;
  return toSrgb(mat3(4.0767416621, -1.2684380046, -0.0041960863, -3.3077115913, 2.6097574011, -0.7034186147, 0.2309699292, -0.3413193965, 1.7076147010) * lms);
}
vec3 mixColor(vec3 a, vec3 b, float t) { return fromOklab(mix(toOklab(a), toOklab(b), t)); }

// A colour list as a smooth ramp: t 0-1 runs first to last.
vec3 ramp(vec3 colors[8], int count, float t) {
  float x = clamp(t, 0.0, 1.0) * float(max(count - 1, 1));
  int i = int(min(floor(x), float(max(count - 2, 0))));
  return mixColor(colors[i], colors[min(i + 1, count - 1)], smoothstep(0.0, 1.0, x - float(i)));
}
// The same, as a loop: t wraps, last blends back into first.
vec3 loopRamp(vec3 colors[8], int count, float t) {
  float x = fract(t) * float(count);
  int i = int(floor(x)) % count;
  return mixColor(colors[i], colors[(i + 1) % count], smoothstep(0.0, 1.0, fract(x)));
}

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

// Light of a colour: it brightens a dark surface (like a screen blend, so
// lights pile up without covering it) and tints a light one.
vec4 glow(vec3 color, float amount) {
  float a = clamp(amount, 0.0, 1.0);
  vec3 lit = min(color * max(amount, 0.0), 1.0);
  return mix(vec4(color * a, a), vec4(lit, max(lit.r, max(lit.g, lit.b))), uDark);
}
// Paint of a colour: it covers the surface by amount, premultiplied.
vec4 paint(vec3 color, float amount) { float a = clamp(amount, 0.0, 1.0); return vec4(color * a, a); }
// One premultiplied layer over another.
vec4 over(vec4 top, vec4 under) { return top + under * (1.0 - top.a); }

// A point in CSS pixels from the centre, and in 0-1 across the box.
vec2 centered(vec2 frag) { return (frag - 0.5 * uResolution) / uPixelRatio; }
vec2 uvOf(vec2 frag) { return frag / uResolution; }
// The same from the centre, with the shorter side spanning -0.5 to 0.5.
vec2 fitted(vec2 frag) { return (frag - 0.5 * uResolution) / min(uResolution.x, uResolution.y); }
`;

/** What every scene ends with: dither (no banding), grain, and the output. */
const MAIN = /* glsl */ `
void main() {
  vec4 c = scene(gl_FragCoord.xy);
  float flick = fract(uTime * 7.31) * 61.7;
  // Dither, a device pixel wide, wherever something shows: no banding.
  float shown = step(0.002, max(c.a, luma(c.rgb)));
  c += (hash21(gl_FragCoord.xy + flick) - 0.5) * (1.5 / 255.0) * shown;
  // Grain, about a CSS pixel wide: light specks add, dark ones cover.
  float g = (hash21(floor(gl_FragCoord.xy / max(uPixelRatio * 0.75, 1.0)) + flick) - 0.5) * uGrain * 0.34;
  float cover = max(-g, 0.0);
  c.rgb = c.rgb * (1.0 - cover) + max(g, 0.0);
  c.a += cover * (1.0 - c.a);
  // Premultiplied, always: a colour brighter than its alpha is dropped by
  // some browsers' compositors (Safari), so the alpha rises to meet it.
  c = clamp(c, 0.0, 1.0);
  c.a = max(c.a, max(c.r, max(c.g, c.b)));
  outColor = c;
}
`;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

const reduced = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// Every animating background, drawn by one loop.
const running = new Set          ();
let raf = 0;
const tick = (now        ) => {
  for (const instance of running) {
    instance.frame(now);
  }
  raf = running.size > 0 ? requestAnimationFrame(tick) : 0;
};
const sync = () => {
  if (running.size > 0 && !raf) {
    raf = requestAnimationFrame(tick);
  } else if (running.size === 0 && raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
};

// One observer each for the page: on screen or not, resized, theme switched,
// tab shown; and one pointer listener, so a `fixed` background under the
// page's content still follows the pointer.
const byRoot = new WeakMap                   ();
const mounted = new Set          ();
const pointers = new Set                                             ();
let io                              = null;
let ro                        = null;
let page                         = null;
const watchPage = () => {
  if (page) {
    return;
  }
  page = new AbortController();
  const { signal } = page;
  const themes = new MutationObserver(() => {
    for (const each of mounted) {
      each.retheme();
    }
  });
  themes.observe(document.documentElement, {
    attributeFilter: ["class", "style", "data-theme"],
  });
  signal.addEventListener("abort", () => themes.disconnect());
  const all = () => {
    for (const each of mounted) {
      each.refresh();
    }
  };
  document.addEventListener("visibilitychange", all, { signal });
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
    "change",
    all,
    { signal }
  );
  const options = { passive: true, signal };
  const send = (kind        ) => (event              ) => {
    for (const each of pointers) {
      each(event, kind);
    }
  };
  addEventListener("pointermove", send(0), options);
  addEventListener("pointerdown", send(1), options);
  document.documentElement.addEventListener("pointerleave", send(2), options);
};
const watch = (root         , instance          ) => {
  io ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const found = byRoot.get(entry.target);
      if (found) {
        found.inView = entry.isIntersecting;
        found.refresh();
      }
    }
  });
  ro ??= new ResizeObserver((entries) => {
    for (const entry of entries) {
      const found = byRoot.get(entry.target);
      if (found) {
        // Its padding box, which the canvas fills: layout is fresh here.
        found.fitTo(entry.target.clientWidth, entry.target.clientHeight);
        found.refresh();
      }
    }
  });
  watchPage();
  byRoot.set(root, instance);
  mounted.add(instance);
  io.observe(root);
  ro.observe(root);
};
const unwatch = (root         , instance          ) => {
  mounted.delete(instance);
  io?.unobserve(root);
  ro?.unobserve(root);
  if (mounted.size === 0) {
    page?.abort();
    page = null;
  }
};

let probe                                  = null;
const parsed = new Map                       ();
/** A computed colour as sRGB 0–1 and its alpha; each read once. */
const parse = (computed        )                => {
  const known = parsed.get(computed);
  if (known) {
    return known;
  }
  probe ??= document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (!probe) {
    return [[0, 0, 0], 0];
  }
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#000";
  probe.fillStyle = computed;
  probe.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 0] = probe.getImageData(0, 0, 1, 1).data;
  const alpha = a / 255;
  // The pixel read back is straight alpha; a clear colour has no hue to keep.
  const found                = [[r / 255, g / 255, b / 255], alpha];
  if (parsed.size > 400) {
    parsed.clear();
  }
  parsed.set(computed, found);
  return found;
};

/** Any CSS colour (vars, oklch, color-mix) as sRGB 0–1, resolved on `el`. */
const rgbOf = (el             , css        , seen                  )      => {
  const known = seen.get(css);
  if (known) {
    return known;
  }
  el.style.color = css;
  const computed = getComputedStyle(el).color;
  el.style.color = "";
  const [rgb] = parse(computed);
  seen.set(css, rgb);
  return rgb;
};

/**
 * The colour behind the canvas: the nearest ancestor with a background
 * colour, or the page's color scheme when none has one.
 */
const surfaceOf = (root             )      => {
  for (let el                     = root; el; el = el.parentElement) {
    const [rgb, alpha] = parse(getComputedStyle(el).backgroundColor);
    if (alpha > 0.5) {
      return rgb;
    }
  }
  return matchMedia("(prefers-color-scheme: dark)").matches
    ? [0.04, 0.04, 0.04]
    : [1, 1, 1];
};

const keyOf = (options         ) =>
  `${options.scene}\n${options.simulation?.source ?? ""}\n${options.simulation?.scale ?? ""}\n${options.atlas?.chars ?? ""}${options.atlas?.font ?? ""}${options.atlas?.weight ?? ""}`;

const QUAD = new Float32Array([-1, -1, 3, -1, -1, 3]);
const CONTROLS =
  "a, button, input, textarea, select, label, summary, [role=button], [contenteditable]";
const ATLAS_CELL = 64;

/** A scene's own uniform: a float, a switch as 0 or 1, or a vector by its length. */
const put = (
  gl                        ,
  at                      ,
  value
) => {
  if (typeof value === "number") {
    gl.uniform1f(at, value);
  } else if (typeof value === "boolean") {
    gl.uniform1f(at, value ? 1 : 0);
  } else if (value.length === 2) {
    gl.uniform2fv(at, value);
  } else if (value.length === 3) {
    gl.uniform3fv(at, value);
  } else {
    gl.uniform4fv(at, value);
  }
};

const compile = (gl                        , body        )       => {
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, VERTEX],
    [gl.FRAGMENT_SHADER, PRELUDE + body],
  ]         ) {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error("no shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) ?? "compile failed");
    }
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.bindAttribLocation(program, 0, "aPosition");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "link failed");
  }
  const at = new Map                                     ();
  const select = gl.useProgram.bind(gl);
  return {
    program,
    select: () => select(program),
    set: (name, write) => {
      let where = at.get(name);
      if (where === undefined) {
        where = gl.getUniformLocation(program, name);
        at.set(name, where);
      }
      if (where) {
        write(where);
      }
    },
  };
};

/** The glyphs, white on clear, one square cell each, in a row. */
const drawAtlas = (atlas                               ) => {
  const chars = [...atlas.chars];
  const sheet = document.createElement("canvas");
  [sheet.width, sheet.height] = [ATLAS_CELL * chars.length, ATLAS_CELL];
  const ctx = sheet.getContext("2d");
  if (ctx) {
    ctx.font = `${atlas.weight ?? 500} ${ATLAS_CELL * 0.8}px ${atlas.font ?? "ui-monospace, SFMono-Regular, Menlo, monospace"}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    chars.forEach((char, i) => {
      ctx.fillText(char, (i + 0.5) * ATLAS_CELL, ATLAS_CELL * 0.54);
    });
  }
  return { count: chars.length, sheet };
};

const byCanvas = new WeakMap                             ();
// A canvas whose context we handed back, to ask for it again on a remount.
const released = new WeakMap                                       ();
const byteOf = (scale                    ) =>
  Math.min(Math.max(scale ?? 1, 0.25), 1);

const start = (
  root             ,
  canvas                   ,
  first
)           => {
  let options = first;
  let gl                                = null;
  let scene              = null;
  let sim              = null;
  let targets                                                     = [];
  let [simW, simH, flip, seeded] = [0, 0, 0, false];
  // The simulation's runs not yet made: frames don't come at one rate.
  let owed = 0;
  let atlasCount = 0;
  let glyphs                      = null;
  let colors                      = {};
  let palettes                                                        = {};
  let surface      = [0, 0, 0];
  // Each CSS colour resolved once per theme: a re-render with the same
  // props reads nothing.
  const seen = new Map             ();
  let [clock, last, ratio, shownAt] = [first.still ?? 0, 0, 1, 0];
  let [boxW, boxH] = [root.clientWidth, root.clientHeight];
  // The render scale drops a step when frames run long, down to half.
  let [auto, slow, frames] = [1, 0, 0];
  const pointer = { on: 0, tx: -1, ty: -1, vx: 0, vy: 0, x: -1, y: -1 };
  const pulses = [0, 1, 2, 3].map(() => ({ at: -1e9, x: 0, y: 0 }));
  const pulseData = new Float32Array(16);
  let nextPulse = 0;
  const off = new AbortController();
  const state = (value        ) => {
    root.dataset.state = value;
  };

  const animating = () =>
    options.time === undefined &&
    !options.paused &&
    (options.speed ?? 1) !== 0 &&
    !reduced() &&
    !document.hidden &&
    instance.inView;

  const now = () => {
    if (options.time !== undefined) {
      return options.time;
    }
    return reduced() ? (options.still ?? 0) : clock;
  };

  // The intro runs once, from the first animated frame. A frame held from
  // the start (reduced motion, a fixed time, paused, speed 0) shows the
  // scene whole: it would wait for a first animated frame that never comes.
  const intro = () => {
    const held =
      reduced() ||
      options.time !== undefined ||
      options.paused ||
      options.speed === 0;
    if (!shownAt) {
      if (held) {
        shownAt = -1e9;
      } else if (animating()) {
        shownAt = performance.now();
      }
    }
    if (held) {
      return 1;
    }
    const t = shownAt ? Math.min((performance.now() - shownAt) / 1100, 1) : 0;
    return 1 - (1 - t) ** 3;
  };

  const resolve = () => {
    colors = {};
    for (const [name, css] of Object.entries(options.colors ?? {})) {
      if (css) {
        colors[name] = rgbOf(canvas, css, seen);
      }
    }
    palettes = {};
    for (const [name, list] of Object.entries(options.palettes ?? {})) {
      if (list && list.length > 0) {
        const flat = new Float32Array(24);
        list.slice(0, 8).forEach((css, i) => {
          flat.set(rgbOf(canvas, css, seen), i * 3);
        });
        palettes[name] = { count: Math.min(list.length, 8), flat };
      }
    }
    surface = surfaceOf(root);
  };

  const fit = (context                        ) => {
    ratio = Math.min(devicePixelRatio || 1, 2) * byteOf(options.quality) * auto;
    const w = Math.max(1, Math.round(boxW * ratio));
    const h = Math.max(1, Math.round(boxH * ratio));
    if (canvas.width !== w || canvas.height !== h) {
      [canvas.width, canvas.height] = [w, h];
    }
    const { simulation } = options;
    if (!(simulation && sim)) {
      return;
    }
    const share = Math.min(Math.max(simulation.scale ?? 0.5, 0.05), 1);
    const sw = Math.max(2, Math.round((w / ratio) * share));
    const sh = Math.max(2, Math.round((h / ratio) * share));
    if (sw === simW && sh === simH) {
      return;
    }
    [simW, simH, seeded] = [sw, sh, false];
    for (const target of targets) {
      context.deleteFramebuffer(target.fbo);
      context.deleteTexture(target.texture);
    }
    const float = context.getExtension("EXT_color_buffer_float");
    targets = [0, 1].map(() => {
      const texture = context.createTexture();
      context.bindTexture(context.TEXTURE_2D, texture);
      context.texImage2D(
        context.TEXTURE_2D,
        0,
        float ? context.RGBA16F : context.RGBA8,
        sw,
        sh,
        0,
        context.RGBA,
        float ? context.HALF_FLOAT : context.UNSIGNED_BYTE,
        null
      );
      for (const [name, value] of [
        [context.TEXTURE_MIN_FILTER, context.LINEAR],
        [context.TEXTURE_MAG_FILTER, context.LINEAR],
        [context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE],
        [context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE],
      ]         ) {
        context.texParameteri(context.TEXTURE_2D, name, value);
      }
      const fbo = context.createFramebuffer();
      context.bindFramebuffer(context.FRAMEBUFFER, fbo);
      context.framebufferTexture2D(
        context.FRAMEBUFFER,
        context.COLOR_ATTACHMENT0,
        context.TEXTURE_2D,
        texture,
        0
      );
      return { fbo, texture };
    });
    context.bindFramebuffer(context.FRAMEBUFFER, null);
  };

  /** The scene's own uniforms: its numbers and vectors, colours and palettes. */
  const feedOwn = (context                        , pass      ) => {
    for (const [name, value] of Object.entries(options.uniforms ?? {})) {
      if (value !== undefined) {
        pass.set(name, (at) => put(context, at, value));
      }
    }
    for (const [name, rgb] of Object.entries(colors)) {
      pass.set(name, (at) => context.uniform3fv(at, rgb));
    }
    for (const [name, palette] of Object.entries(palettes)) {
      pass.set(name, (at) => context.uniform3fv(at, palette.flat));
      pass.set(`${name}Count`, (at) => context.uniform1i(at, palette.count));
    }
  };

  /** Every uniform a pass declares, for a target `w` by `h` device pixels. */
  const feed = (
    context                        ,
    pass      ,
    size                           ,
    scale        ,
    time
  ) => {
    const [w, h] = size;
    const dark =
      0.2126 * surface[0] + 0.7152 * surface[1] + 0.0722 * surface[2];
    pass.select();
    pass.set("uResolution", (at) => context.uniform2f(at, w, h));
    pass.set("uTime", (at) => context.uniform1f(at, time));
    pass.set("uPixelRatio", (at) => context.uniform1f(at, scale));
    pass.set("uPointer", (at) =>
      context.uniform3f(at, pointer.x * scale, pointer.y * scale, pointer.on)
    );
    pass.set("uPointerMove", (at) =>
      context.uniform2f(at, pointer.vx * scale, pointer.vy * scale)
    );
    pass.set("uPulses", (at) => {
      pulses.forEach((pulse, i) => {
        const age = (performance.now() - pulse.at) / 1000;
        pulseData.set(
          [pulse.x * scale, pulse.y * scale, age, age < 6 ? 1 : 0],
          i * 4
        );
      });
      context.uniform4fv(at, pulseData);
    });
    pass.set("uIntro", (at) => context.uniform1f(at, intro()));
    pass.set("uSurface", (at) => context.uniform3fv(at, surface));
    pass.set("uDark", (at) => context.uniform1f(at, dark < 0.4 ? 1 : 0));
    pass.set("uGrain", (at) => context.uniform1f(at, options.grain ?? 0));
    pass.set("uState", (at) => context.uniform1i(at, 0));
    pass.set("uAtlas", (at) => context.uniform1i(at, 1));
    pass.set("uAtlasCount", (at) => context.uniform1f(at, atlasCount));
    feedOwn(context, pass);
  };

  const ease = (dt        ) => {
    const here = pointer.tx >= 0;
    const [tx, ty] = here
      ? [pointer.tx, pointer.ty]
      : [
          pointer.x < 0 ? boxW / 2 : pointer.x,
          pointer.y < 0 ? boxH / 2 : pointer.y,
        ];
    // At first, and while it's still invisible, jump to the pointer:
    // easing from the centre would draw it part-way across.
    if (pointer.x < 0 || (here && pointer.on < 0.02)) {
      [pointer.x, pointer.y] = [tx, ty];
    }
    const k = 1 - Math.exp(-dt * 9);
    const [dx, dy] = [(tx - pointer.x) * k, (ty - pointer.y) * k];
    pointer.x += dx;
    pointer.y += dy;
    const rate = dt > 0 ? 1 / dt : 0;
    pointer.vx += (dx * rate - pointer.vx) * k;
    pointer.vy += (dy * rate - pointer.vy) * k;
    pointer.on += ((here ? 1 : 0) - pointer.on) * (1 - Math.exp(-dt * 6));
  };

  /**
   * The simulation's runs for this frame, each reading the last one's
   * result: `steps` of them a sixtieth of a second, so it runs as fast on a
   * 120 Hz screen as on a 60 Hz one, and its start state on the first.
   */
  const simulate = (
    context                        ,
    dt        ,
    time
  ) => {
    if (!(sim && targets.length === 2)) {
      return;
    }
    const steps = Math.max(1, options.simulation?.steps ?? 1);
    owed = Math.min(owed + dt * 60 * steps, steps * 4);
    // A held frame (dt 0) still takes one run, so a new size or seed shows.
    const runs = seeded ? Math.max(Math.floor(owed), dt === 0 ? 1 : 0) : 1;
    owed -= Math.min(runs, owed);
    context.viewport(0, 0, simW, simH);
    for (let i = 0; i < runs; i += 1) {
      const [from, to] = [targets[flip], targets[1 - flip]];
      if (!(from && to)) {
        break;
      }
      context.bindFramebuffer(context.FRAMEBUFFER, to.fbo);
      context.bindTexture(context.TEXTURE_2D, from.texture);
      feed(context, sim, [simW, simH], simW / Math.max(boxW, 1), time);
      sim.set("uSeed", (at) => context.uniform1f(at, seeded ? 0 : 1));
      context.drawArrays(context.TRIANGLES, 0, 3);
      flip = 1 - flip;
      seeded = true;
    }
    context.bindFramebuffer(context.FRAMEBUFFER, null);
    context.bindTexture(context.TEXTURE_2D, targets[flip]?.texture ?? null);
  };

  const draw = (dt        ) => {
    const context = gl;
    if (!(context && scene) || context.isContextLost()) {
      return;
    }
    // Unit 1 holds the glyphs, unit 0 the simulation's result.
    context.activeTexture(context.TEXTURE1);
    context.bindTexture(context.TEXTURE_2D, glyphs);
    context.activeTexture(context.TEXTURE0);
    fit(context);
    ease(dt);
    const time = now();
    simulate(context, dt, time);
    context.viewport(0, 0, canvas.width, canvas.height);
    feed(context, scene, [canvas.width, canvas.height], ratio, time);
    context.drawArrays(context.TRIANGLES, 0, 3);
  };

  const build = () => {
    const context = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
      premultipliedAlpha: true,
      stencil: false,
    });
    if (!context) {
      state("unsupported");
      return false;
    }
    gl = context;
    if (context.isContextLost()) {
      // Ours, let go on an earlier unmount: it rebuilds when it's back.
      released.get(canvas)?.restoreContext();
      released.delete(canvas);
      return false;
    }
    for (const pass of [scene, sim]) {
      if (pass) {
        context.deleteProgram(pass.program);
      }
    }
    for (const target of targets) {
      context.deleteFramebuffer(target.fbo);
      context.deleteTexture(target.texture);
    }
    [scene, sim, simW, simH, targets, seeded] = [null, null, 0, 0, [], false];
    try {
      scene = compile(context, options.scene + MAIN);
      sim = options.simulation
        ? compile(
            context,
            `uniform float uSeed;\n${options.simulation.source}\nvoid main() { outColor = simulate(gl_FragCoord.xy); }`
          )
        : null;
    } catch (error) {
      console.warn(`[background] ${root.dataset.slot ?? ""}`, error);
      state("unsupported");
      return false;
    }
    const buffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(context.ARRAY_BUFFER, QUAD, context.STATIC_DRAW);
    context.enableVertexAttribArray(0);
    context.vertexAttribPointer(0, 2, context.FLOAT, false, 0, 0);
    if (options.atlas) {
      const { count, sheet } = drawAtlas(options.atlas);
      atlasCount = count;
      glyphs = context.createTexture();
      context.activeTexture(context.TEXTURE1);
      context.bindTexture(context.TEXTURE_2D, glyphs);
      context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true);
      context.texImage2D(
        context.TEXTURE_2D,
        0,
        context.RGBA,
        context.RGBA,
        context.UNSIGNED_BYTE,
        sheet
      );
      context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, false);
      context.generateMipmap(context.TEXTURE_2D);
      context.texParameteri(
        context.TEXTURE_2D,
        context.TEXTURE_MIN_FILTER,
        context.LINEAR_MIPMAP_LINEAR
      );
      context.texParameteri(
        context.TEXTURE_2D,
        context.TEXTURE_WRAP_S,
        context.CLAMP_TO_EDGE
      );
      context.texParameteri(
        context.TEXTURE_2D,
        context.TEXTURE_WRAP_T,
        context.CLAMP_TO_EDGE
      );
    }
    return true;
  };

  const instance           = {
    dispose: () => {
      running.delete(instance);
      sync();
      unwatch(root, instance);
      pointers.delete(onPointer);
      byCanvas.delete(canvas);
      off.abort();
      // Hand the context back now: a page may hold only a few.
      const lose = gl?.getExtension("WEBGL_lose_context");
      if (lose && !gl?.isContextLost()) {
        released.set(canvas, lose);
        lose.loseContext();
      }
      [gl, scene, sim] = [null, null, null];
    },
    dropping: false,
    fitTo: (width, height) => {
      [boxW, boxH] = [width, height];
    },
    frame: (time) => {
      const dt = Math.min(time - (last || time), 100) / 1000;
      last = time;
      clock += dt * (options.speed ?? 1);
      draw(dt);
      // Long frames, a second of them: render fewer pixels.
      frames += 1;
      slow += dt > 0.024 ? 1 : 0;
      if (frames >= 60) {
        if (slow > 45 && auto > 0.5) {
          auto = Math.max(0.5, auto * 0.75);
        }
        [frames, slow] = [0, 0];
      }
    },
    handle: {
      // Let go at the end of the task: a re-run right after keeps it.
      destroy: () => {
        instance.dropping = true;
        queueMicrotask(() => {
          if (instance.dropping) {
            instance.dispose();
          }
        });
      },
    },
    inView: false,
    key: keyOf(first),
    // Animate while it should; otherwise draw one frame (the still, a fixed
    // time, a new colour or size while held).
    refresh: () => {
      if (!(gl && scene)) {
        return;
      }
      if (animating()) {
        if (!running.has(instance)) {
          last = 0;
          running.add(instance);
        }
      } else {
        running.delete(instance);
        draw(0);
      }
      sync();
      state(animating() ? "live" : "still");
    },
    retheme: () => {
      seen.clear();
      parsed.clear();
      resolve();
      instance.refresh();
    },
    update: (next) => {
      const key = keyOf(next);
      options = next;
      // New GLSL on the same canvas: recompile on the context it has.
      if (key !== instance.key) {
        instance.key = key;
        if (!build()) {
          return;
        }
      }
      resolve();
      instance.refresh();
    },
  };

  const onPointer = (event              , kind        ) => {
    if (
      !(options.interactive && instance.inView) ||
      event.pointerType === "touch" ||
      kind === 2
    ) {
      pointer.tx = -1;
      return;
    }
    const box = root.getBoundingClientRect();
    const [x, y] = [event.clientX - box.left, box.bottom - event.clientY];
    const inside = x >= 0 && y >= 0 && x <= box.width && y <= box.height;
    [pointer.tx, pointer.ty] = inside ? [x, y] : [-1, -1];
    // A press on a link, a button or a field is theirs, not the scene's.
    const pressed = event.target instanceof Element ? event.target : null;
    if (kind === 1 && inside && !reduced() && !pressed?.closest(CONTROLS)) {
      const pulse = pulses[nextPulse];
      if (pulse) {
        [pulse.x, pulse.y, pulse.at] = [x, y, performance.now()];
      }
      nextPulse = (nextPulse + 1) % pulses.length;
    }
  };

  canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      running.delete(instance);
      sync();
      // Its picture is gone until the context is back: show what's under it.
      state("loading");
    },
    { signal: off.signal }
  );
  canvas.addEventListener(
    "webglcontextrestored",
    () => {
      if (build()) {
        instance.refresh();
      }
    },
    { signal: off.signal }
  );

  state("loading");
  build();
  if (gl) {
    resolve();
    pointers.add(onPointer);
    watch(root, instance);
  }
  return instance;
};

/**
 * Mounts a background on `canvas` (inside `root`), or updates the one
 * already there: calling it again with new options updates it in place
 * (new GLSL recompiles on the same context, and the clock keeps running).
 * `destroy` lets go at the end of the current task.
 */
export const mountBackground = (
  root             ,
  canvas                   ,
  options
)                   => {
  const existing = byCanvas.get(canvas);
  if (existing) {
    existing.dropping = false;
    existing.update(options);
    return existing.handle;
  }
  const instance = start(root, canvas, options);
  byCanvas.set(canvas, instance);
  return instance.handle;
};
