/* smoke-scene.js : la scène GLSL du composant Smoke de shadcn.io (composant Pro, smoke.tsx),
   utilisée sous la licence du client. Le shader SCENE et les constantes sont copiés tels quels ;
   seuls "export" et le retrait des types TypeScript changent. La traduction des props en uniforms est dans fumee.js (style e). */
/** Slate smoke for a light surface, pale blue-white for a dark one. */
export const DAY = "#4d5870";
export const NIGHT = "#d6e0f1";
export const ORIGINS = { bottom: 0, center: 1 }         ;
export const tangentOf = (degrees        ) => Math.tan((degrees * Math.PI) / 180);

export const SCENE = /* glsl */ `
uniform vec3 uDayColor;
uniform vec3 uNightColor;
uniform float uCount;
uniform float uCurl;
uniform float uDensity;
uniform float uDetail;
uniform float uLean;
uniform float uOrigin;
uniform float uRise;
uniform float uScale;
uniform float uSeed;
uniform float uSoftness;
uniform float uSpread;

// How far apart, in plume heights, the curls leave the source.
const float SPACING = 0.3;

// How far plume i leans at height h. a is that height less what the smoke
// has risen, so the meanders climb with it; near the source it stands straight.
float sway(float a, float h, float i) {
  float lean = sin(a * 2.3 + i * 4.1 + uTime * 0.03) * 0.045 + sin(a * 5.9 - i * 2.7) * 0.02 + sin(a * 0.9 + i * 1.3) * 0.03;
  return lean * smoothstep(0.05, 0.7, h) * (0.4 + h);
}

// Half the plume's width at height h: a thread at the source, wider above.
float girth(float h) {
  return 0.01 + (0.025 + 0.13 * uSpread) * h;
}

// A thread where n crosses zero, sharp to the given power but never thinner
// than a pixel: blur is how far n moves from one pixel to the next, and past
// that the thread widens and dims by as much, so it can't break into dots.
float strand(float n, float sharp, float blur) {
  float k = min(sharp, 0.6 / max(blur, 0.0001));
  return pow(1.0 - min(abs(n), 1.0), k) * (k + 1.0) / (sharp + 1.0);
}

// One plume, in its own space: x from its axis, y above its source, both in
// box heights. unit is how many device pixels one of those spans.
float plume(vec2 q, float i, vec3 rnd, float unit) {
  // Nothing of this plume reaches this far from its axis.
  if (q.y <= 0.0 || abs(q.x) > 0.17 + (0.3 + 0.75 * uSpread) * q.y) return 0.0;
  float risen = uTime * 0.055 * uRise * (0.8 + 0.4 * rnd.y) + rnd.z * 9.0;
  // A street of curls rises with the smoke, one on the left edge, one on the
  // right: each winds the ribbon around itself, tighter the higher it gets.
  // gx and gy follow how the winding stretches the space from one pixel to
  // the next, across the ribbon and along it.
  float phase = risen / SPACING;
  vec2 warp = vec2(0.0);
  vec2 gx = vec2(1.0, 0.0);
  vec2 gy = vec2(0.0, 1.0);
  for (int m = 0; m < 9; m++) {
    float hc = (float(m) + fract(phase)) * SPACING;
    float reach = 0.06 + 0.12 * hc;
    // Too far above or below to turn anything here.
    if (abs(q.y - hc) > reach * 3.2) continue;
    float n = float(m) - floor(phase);
    vec3 v = hash32(vec2(n * 1.7 + 0.5, i * 3.1 + uSeed * 5.3));
    float side = mod(n, 2.0) < 0.5 ? 1.0 : -1.0;
    reach *= 0.55 + 0.45 * v.y;
    vec2 d = q - vec2(sway(hc - risen, hc, i) + side * girth(hc) * (0.6 + 0.6 * v.x), hc);
    float turn = side * uCurl * smoothstep(0.15, 0.75, hc) * (1.5 + 3.0 * hc) * (0.5 + v.z) * exp(-dot(d, d) / (reach * reach));
    float cs = cos(turn), sn = sin(turn);
    warp += vec2(cs * d.x - sn * d.y, sn * d.x + cs * d.y) - d;
    vec2 g = d * (-2.0 * turn / (reach * reach));
    gx += vec2(cs - 1.0, -sn) - (sn * d.x + cs * d.y) * g;
    gy += vec2(sn, cs - 1.0) + (cs * d.x - sn * d.y) * g;
  }
  q += warp;
  float h = max(q.y, 0.0);
  float a = q.y - risen;
  float u = q.x - sway(a, h, i);
  // Near the top the strands part and cross.
  if (h > 0.35) {
    u += (snoise(vec2(q.x * 7.0 + i * 3.0, a * 3.0)) * 0.03 + snoise(vec2(q.x * 15.0 - i, a * 6.0 + 2.0)) * 0.012) * smoothstep(0.35, 1.1, h) * uCurl;
  }
  // A soft haze hangs around the plume, where it has spread into the air.
  float wide = u / (girth(h) * 2.6 + 0.02);
  float haze = exp(-wide * wide);
  if (haze < 0.004) return 0.0;
  // The sheet turns as it climbs: edge on it's a bright thread, face on a
  // wide, faint veil.
  float twist = 0.3 + 1.2 * smoothstep(-0.6, 0.6, snoise(vec2(a * 1.7 + i * 3.7, 7.7)));
  float width = girth(h) * twist;
  float s = u / width;
  // Where the ribbon is squeezed thin it's denser, where it's pulled wide,
  // fainter. across is half its width on screen, in device pixels.
  float squeeze = length(gx);
  float shear = length(gy);
  float across = width * unit / max(squeeze, 0.001);
  float amount = 0.0;
  if (abs(s) < 2.6) {
    // Threads run along it, crisp at the source and softer as it thins out.
    float sharp = mix(9.0, 2.0, uSoftness) * mix(1.0, 0.4, smoothstep(0.2, 1.0, h));
    float blur = 1.6 * (1.1 / across + 0.8 * shear / unit);
    float threads = strand(snoise(vec2(s * 1.1 + i * 11.0, a * 0.8)), sharp, blur);
    threads += strand(snoise(vec2(s * 2.9 - i * 5.0, a * 1.4 + 4.0)), sharp * 1.3, blur * 2.4) * uDetail * 0.7;
    // Where a curl crushes the ribbon along its length the threads would
    // break into dashes: there they melt into the body.
    threads = mix(threads, 0.3, smoothstep(1.6, 4.0, shear));
    // The rims of the sheet, never thinner than a pixel either.
    float edge = mix(40.0, 10.0, uSoftness);
    float crisp = min(edge, across * across * 1.4);
    float rim = exp(-pow(abs(s) - 0.9, 2.0) * crisp) * sqrt(crisp / edge);
    amount = exp(-s * s * 1.2) * (0.08 + 0.25 * uSoftness + threads * 1.1) + rim * 0.2;
    amount *= mix(1.0, clamp(squeeze, 0.4, 2.4), 0.6) / (0.45 + 0.55 * twist);
  }
  // In the eye of a curl the sheet is wound tighter than a pixel can show:
  // there it blurs into the haze.
  amount = mix(amount, haze * 0.22, smoothstep(0.5, 1.5, 1.0 / max(across, 0.001)));
  if (h > 0.2) {
    amount += haze * (0.5 + 0.5 * snoise(vec2(q.x * 3.1 + i * 2.0, a * 2.2))) * smoothstep(0.2, 0.9, h) * (0.1 + 0.3 * uSoftness);
  }
  // It thins as it spreads, and starts just above the source.
  amount *= smoothstep(0.0, 0.07, q.y) / (1.0 + 1.6 * uSpread * h);
  return amount * (0.45 + 0.55 * rnd.x);
}

vec4 scene(vec2 frag) {
  vec2 uv = uvOf(frag);
  float aspect = uResolution.x / uResolution.y;
  bool center = uOrigin > 0.5;
  float zoom = uScale * (center ? 1.5 : 1.0);
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - (center ? 0.42 : -0.04));
  p.x -= uLean * p.y;
  // The pointer is in the way: the smoke parts around it.
  vec2 d = (frag - uPointer.xy) / uResolution.y;
  float reach = 70.0 * uPixelRatio / uResolution.y;
  float bend = reach * reach / (dot(d, d) + reach * reach * 0.5);
  p.x -= d.x * bend * uPointer.z * 0.7;
  float count = clamp(floor(uCount + 0.5), 1.0, 5.0);
  float total = 0.0;
  for (int i = 0; i < 5; i++) {
    if (float(i) >= count) break;
    vec3 rnd = hash32(vec2(float(i) * 7.31 + uSeed * 3.17, uSeed + 2.7));
    // Uneven places along the edge; one plume alone stands near the middle.
    float x0 = ((float(i) + 0.5 + (rnd.y - 0.5) * (count > 1.5 ? 0.7 : 0.2)) / count - 0.5) * aspect;
    total += plume(vec2(p.x - x0, p.y) * zoom, float(i), rnd, uResolution.y / zoom);
  }
  // The smoke climbs into the box as it first shows, and thins out toward the top.
  float reveal = smoothstep(0.0, 0.3, uIntro * 1.4 - uv.y) * (1.0 - 0.6 * smoothstep(0.8, 1.02, uv.y));
  float amount = (1.0 - exp(-total * uDensity * 0.9)) * reveal * (1.0 - uPointer.z * 0.6 * exp(-dot(d, d) / (reach * reach)));
  return paint(uDark > 0.5 ? uNightColor : uDayColor, amount * mix(0.75, 0.7, uDark));
}
`;
