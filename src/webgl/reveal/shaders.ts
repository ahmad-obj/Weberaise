export const MAX_SPLATS = 24;

export const FULLSCREEN_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export const HISTORY_FRAGMENT = `#version 300 es
precision highp float;
#define MAX_SPLATS 24
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uPrevious;
uniform float uDelta;
uniform float uTime;
uniform float uHalfLife;
uniform float uAdvection;
uniform float uAspect;
uniform int uSplatCount;
uniform vec2 uSplatPos[MAX_SPLATS];
uniform vec2 uSplatVelocity[MAX_SPLATS];
uniform float uSplatRadius[MAX_SPLATS];
uniform float uSplatStrength[MAX_SPLATS];

vec2 decodeVelocity(vec2 value) { return value * 2.0 - 1.0; }
vec2 encodeVelocity(vec2 value) { return value * 0.5 + 0.5; }

void main() {
  vec4 seed = texture(uPrevious, vUv);
  vec2 oldVelocity = decodeVelocity(seed.gb);

  // Deliberately tiny settling motion: viscous material should relax, not swim.
  vec2 settling = vec2(
    sin(vUv.y * 16.0 + uTime * 0.55),
    cos(vUv.x * 13.0 - uTime * 0.42)
  ) * 0.0018 * seed.r;

  vec2 velocity = oldVelocity * pow(0.12, uDelta) + settling;
  vec2 advectedUv = clamp(
    vUv - velocity * uAdvection * min(uDelta * 60.0, 2.0),
    0.001,
    0.999
  );
  vec4 previous = texture(uPrevious, advectedUv);

  // Time-correct persistence. The perceptual tail extends several half-lives.
  float retention = pow(0.5, uDelta / max(0.05, uHalfLife));
  float mask = previous.r * retention;
  velocity = decodeVelocity(previous.gb) * pow(0.18, uDelta) + settling;

  for (int i = 0; i < MAX_SPLATS; i++) {
    if (i >= uSplatCount) break;
    vec2 delta = vUv - uSplatPos[i];
    delta.x *= uAspect;
    float radius = max(0.001, uSplatRadius[i]);
    float distanceToSplat = length(delta);
    float influence = 1.0 - smoothstep(radius * 0.28, radius, distanceToSplat);
    influence = pow(max(0.0, influence), 1.15) * uSplatStrength[i];
    mask = max(mask, influence);

    vec2 injectedVelocity = clamp(uSplatVelocity[i] * 0.18, vec2(-1.0), vec2(1.0));
    velocity = mix(velocity, injectedVelocity, influence * 0.32);
  }

  velocity = clamp(velocity, vec2(-1.0), vec2(1.0));
  outColor = vec4(clamp(mask, 0.0, 1.0), encodeVelocity(velocity), 1.0);
}`;

export const COMPOSITE_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uHistory;
uniform sampler2D uBrand;
uniform float uTime;
uniform float uNoiseAmount;
uniform float uFillProgress;
uniform float uFillEnabled;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

void main() {
  float history = texture(uHistory, vUv).r;
  float noise = (hash(floor(vUv * 260.0) + floor(uTime * 4.0)) - 0.5) * uNoiseAmount;
  float reveal = smoothstep(0.105, 0.36, history + noise * (1.0 - history));

  // The canvas uses CSS difference blending over the native DOM front layer.
  // White perfectly inverts white/black WELCOME/TO; inside the brand pixels,
  // the complementary source color reconstructs the approved brand asset.
  vec4 brand = texture(uBrand, vUv);
  vec3 differenceSource = mix(vec3(1.0), vec3(1.0) - brand.rgb, brand.a);

  float edgeDamping = sin(3.14159265 * clamp(uFillProgress, 0.0, 1.0));
  float crest = uFillProgress
    + sin(vUv.x * 8.5 + uTime * 0.45) * 0.014 * edgeDamping
    + sin(vUv.x * 17.0 - uTime * 0.32) * 0.006 * edgeDamping;
  float fill = (1.0 - smoothstep(crest - 0.012, crest + 0.012, vUv.y)) * uFillEnabled;

  // Bottom-fill mode is normal-blended black. Reveal mode is a premultiplied
  // difference source. We never mix the two visual languages in one frame.
  float revealAlpha = reveal * (1.0 - uFillEnabled);
  float alpha = max(revealAlpha, fill);
  vec3 premultipliedRgb = differenceSource * revealAlpha;
  outColor = vec4(premultipliedRgb, alpha);
}`;
