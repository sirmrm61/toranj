import type { TransitionName } from "@/content/catalog";

export const fullscreenVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const common = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform sampler2D uDepthFrom;
uniform sampler2D uDepthTo;
uniform float uProgress;
uniform float uTime;
uniform vec2 uLook;       // -1..1, direction from the eyes to the pointer (y up)
uniform vec2 uPointer;    // -1..1 over the hero (y up)
uniform vec2 uLight;      // pointer in image uv
uniform vec2 uImageSize;  // px
uniform vec2 uEye0;       // px, y down
uniform vec2 uEye1;
uniform vec2 uEyeSize;    // px (rx, ry)
uniform float uIrisR;     // px
uniform float uEyeTravel; // px
uniform vec3 uHead;       // px centre + radius
uniform float uParallax;
uniform float uEyesOn;

const float PI = 3.14159265;
const vec3 GOLD = vec3(1.0, 0.84, 0.55);

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

vec2 toPx(vec2 uv) { return vec2(uv.x, 1.0 - uv.y) * uImageSize; }

// Depth parallax + a subtle head turn toward the pointer (only around the head).
vec2 displace(sampler2D depth, vec2 uv) {
  float d = texture2D(depth, uv).r;
  float head = 1.0 - smoothstep(uHead.z * 0.6, uHead.z, distance(toPx(uv), uHead.xy));
  vec2 headShift = uLook * vec2(3.0, 2.0) / uImageSize * head;
  return uv - headShift - uPointer * (d - 0.5) * uParallax;
}

vec4 fromAt(vec2 uv) { return texture2D(uFrom, displace(uDepthFrom, uv)); }
vec4 toAt(vec2 uv) { return texture2D(uTo, displace(uDepthTo, uv)); }

vec4 drawEye(vec4 col, vec2 px, vec2 eye) {
  vec2 e = (px - eye) / uEyeSize;
  float inside = 1.0 - smoothstep(0.82, 1.0, length(e));
  vec2 ic = eye + vec2(uLook.x, -uLook.y) * vec2(uEyeTravel, uEyeTravel * 0.45);
  float r = distance(px, ic);
  float iris = 1.0 - smoothstep(uIrisR - 0.7, uIrisR + 0.5, r);
  float pupil = 1.0 - smoothstep(uIrisR * 0.42 - 0.4, uIrisR * 0.42 + 0.4, r);
  vec3 c = mix(vec3(0.24, 0.15, 0.09), vec3(0.42, 0.27, 0.15), smoothstep(0.0, uIrisR, r));
  c = mix(c, vec3(0.04, 0.025, 0.015), pupil);
  float hl = 1.0 - smoothstep(0.5, 1.1, distance(px, ic + vec2(1.4, -1.4)));
  c = mix(c, vec3(1.0), hl * 0.85);
  col.rgb = mix(col.rgb, c, iris * inside * col.a * uEyesOn);
  return col;
}

vec4 finish(vec4 col) {
  vec2 p = toPx(displace(uDepthTo, vUv));
  col = drawEye(col, p, uEye0);
  col = drawEye(col, p, uEye1);
  float light = 1.0 - smoothstep(0.0, 0.55, distance(vUv, uLight));
  col.rgb += vec3(1.0, 0.93, 0.8) * 0.1 * light * col.a;
  return col;
}
`;

const bodies: Record<TransitionName, string> = {
  // 1. Liquid noise morph
  liquid: /* glsl */ `
vec4 transition(vec2 uv, float p) {
  float n = fbm(uv * 4.0 + vec2(0.0, uTime * 0.15));
  float w = sin(p * PI);
  vec2 off = (vec2(n, fbm(uv * 4.0 + 7.3)) - 0.5) * 0.09 * w;
  float t = n * 0.6 + (1.0 - uv.y) * 0.4;
  float m = smoothstep(t - 0.1, t + 0.1, p * 1.3 - 0.15);
  return mix(fromAt(uv + off), toAt(uv - off), m);
}`,
  // 2. Fabric wave / ripple
  ripple: /* glsl */ `
vec4 transition(vec2 uv, float p) {
  float w = sin(p * PI);
  float wave = sin(uv.y * 18.0 + p * 12.0);
  vec2 off = vec2(wave * 0.015, cos(uv.x * 14.0 + p * 9.0) * 0.01) * w;
  float edge = uv.x + sin(uv.y * 10.0 + p * 6.0) * 0.05;
  float m = smoothstep(edge - 0.08, edge + 0.08, p * 1.36 - 0.18);
  vec4 c = mix(fromAt(uv + off), toAt(uv + off), m);
  c.rgb *= 1.0 - 0.1 * w * wave;
  return c;
}`,
  // 3. Light sweep + golden sparkles
  sweep: /* glsl */ `
vec4 transition(vec2 uv, float p) {
  float d = uv.x * 0.7 + uv.y * 0.6;
  float pos = p * 1.7 - 0.2;
  float m = smoothstep(pos + 0.03, pos - 0.03, d);
  vec4 c = mix(fromAt(uv), toAt(uv), m);
  float env = sin(p * PI);
  float glow = exp(-abs(d - pos) * 25.0) * env;
  float sp = step(0.985, hash(floor(uv * vec2(160.0, 240.0)) + floor(uTime * 10.0))) * exp(-abs(d - pos) * 9.0) * env;
  c.rgb += GOLD * (glow * 0.6 + sp * 1.2) * max(c.a, 0.6);
  c.a = max(c.a, (glow * 0.35 + sp) * env);
  return c;
}`,
  // 4. Curtain opening from the centre
  curtain: /* glsl */ `
vec4 transition(vec2 uv, float p) {
  float e = p * p * (3.0 - 2.0 * p);
  float h = e * 0.5;
  float dx = abs(uv.x - 0.5);
  if (dx < h) {
    vec4 c = toAt(uv);
    c.rgb *= 1.0 - 0.35 * smoothstep(h - 0.06, h, dx) * (1.0 - e);
    return c;
  }
  float s = sign(uv.x - 0.5);
  float k = (dx - h) / max(0.0001, 0.5 - h);
  vec4 c = fromAt(vec2(0.5 + s * k * 0.5, uv.y));
  c.rgb *= 0.88 + 0.12 * sin((dx - h) * 70.0);
  return c;
}`,
  // 5. Particle morph / dispersion
  particles: /* glsl */ `
vec4 transition(vec2 uv, float p) {
  vec2 grid = vec2(56.0, 84.0);
  vec2 cell = floor(uv * grid);
  float r = hash(cell);
  float m = smoothstep(r * 0.6, r * 0.6 + 0.4, p);
  vec2 local = fract(uv * grid) - 0.5;
  float box = max(abs(local.x), abs(local.y));
  float vf = step(box, 0.5 * (1.0 - m) + 0.001);
  float vt = step(box, 0.5 * m);
  vec2 drift = vec2((r - 0.5) * 0.06, 0.08) * m;
  vec4 f = fromAt(uv - drift) * vf;
  f.a *= 1.0 - m;
  vec4 c = mix(f, toAt(uv), vt);
  float glint = m * (1.0 - m) * 4.0;
  c.rgb += GOLD * glint * 0.35 * c.a;
  return c;
}`,
  // 6. Radial reveal with a golden ring
  radial: /* glsl */ `
vec4 transition(vec2 uv, float p) {
  vec2 c0 = vec2(0.5, 0.62);
  float d = length((uv - c0) * vec2(uImageSize.x / uImageSize.y, 1.0));
  float r = p * 1.1;
  float m = smoothstep(r, r - 0.05, d);
  vec4 c = mix(fromAt(uv), toAt(uv), m);
  float ring = exp(-abs(d - r) * 40.0) * sin(p * PI);
  c.rgb += GOLD * ring * 0.8;
  c.a = max(c.a, ring * 0.5);
  return c;
}`,
};

export function brideFrag(name: TransitionName) {
  return `${common}
${bodies[name] ?? bodies.liquid}
void main() {
  vec4 c = uProgress <= 0.0 ? fromAt(vUv) : uProgress >= 1.0 ? toAt(vUv) : transition(vUv, uProgress);
  gl_FragColor = finish(c);
}`;
}

export const TRANSITIONS = Object.keys(bodies) as TransitionName[];

export const groomFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uBlur;
void main() {
  vec4 c = vec4(0.0);
  float tot = 0.0;
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      vec2 o = vec2(float(x), float(y));
      float w = 1.0 - length(o) / 3.5;
      c += texture2D(uTex, vUv + o * uBlur) * w;
      tot += w;
    }
  }
  c /= tot;
  c.rgb *= 0.7;
  gl_FragColor = c;
}`;

export const backgroundFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uCover;   // uv scale for object-fit: cover
uniform vec2 uPointer;
uniform vec2 uLight;   // screen uv
uniform float uTime;
void main() {
  vec2 uv = (vUv - 0.5) * uCover + 0.5 + uPointer * 0.006;
  vec3 c = texture2D(uTex, uv).rgb;
  float light = 1.0 - smoothstep(0.0, 0.5, distance(vUv, uLight));
  c += vec3(1.0, 0.86, 0.62) * light * 0.12;
  float vig = smoothstep(1.05, 0.35, distance(vUv, vec2(0.5, 0.45)));
  c *= mix(0.55, 1.0, vig);
  gl_FragColor = vec4(c, 1.0);
}`;

export const particlesVert = /* glsl */ `
attribute vec3 aSeed; // x: horizontal pos, y: phase, z: depth (0 far .. 1 near)
uniform float uTime;
uniform vec2 uSize;
uniform vec2 uPointer;
uniform float uPixelRatio;
varying float vAlpha;
void main() {
  float speed = mix(8.0, 26.0, aSeed.z);
  float y = mod(aSeed.y * uSize.y + uTime * speed, uSize.y) - uSize.y * 0.5;
  float x = (aSeed.x - 0.5) * uSize.x + sin(uTime * 0.4 + aSeed.y * 30.0) * 18.0;
  vec2 par = uPointer * mix(6.0, 30.0, aSeed.z);
  vec4 mv = modelViewMatrix * vec4(x + par.x, y + par.y, mix(-3.0, 1.0, aSeed.z), 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = mix(1.5, 4.5, aSeed.z) * uPixelRatio;
  vAlpha = (0.35 + 0.65 * abs(sin(uTime * 0.8 + aSeed.y * 50.0))) * mix(0.35, 0.9, aSeed.z);
}`;

export const particlesFrag = /* glsl */ `
precision highp float;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha;
  gl_FragColor = vec4(1.0, 0.86, 0.6, a);
}`;
