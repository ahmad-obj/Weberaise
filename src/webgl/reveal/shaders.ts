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

  // Dense gel-like settling: enough life to avoid a frozen mask, but far below
  // the amplitude that makes an old trail drift into smoke or fog.
  vec2 settling = vec2(
    sin(vUv.y * 14.0 + uTime * 0.24),
    cos(vUv.x * 12.0 - uTime * 0.19)
  ) * 0.00055 * seed.r;

  vec2 velocity = oldVelocity * pow(0.055, uDelta) + settling;
  vec2 advectedUv = clamp(
    vUv - velocity * uAdvection * min(uDelta * 60.0, 1.35),
    0.001,
    0.999
  );
  vec4 previous = texture(uPrevious, advectedUv);

  // Time-correct persistence. A spatially graded splat plus a high composite
  // threshold makes old marks erode inward instead of fading as translucent mist.
  float retention = pow(0.5, uDelta / max(0.05, uHalfLife));
  float mask = previous.r * retention;
  velocity = decodeVelocity(previous.gb) * pow(0.075, uDelta) + settling;

  for (int i = 0; i < MAX_SPLATS; i++) {
    if (i >= uSplatCount) break;
    vec2 delta = vUv - uSplatPos[i];
    delta.x *= uAspect;
    float radius = max(0.001, uSplatRadius[i]);
    float distanceToSplat = length(delta);

    // A larger solid core keeps the stroke ending as a proper rounded blob.
    // The graded outer band supplies antialiasing and clean contraction later.
    float influence = 1.0 - smoothstep(radius * 0.48, radius, distanceToSplat);
    influence = pow(max(0.0, influence), 1.05) * uSplatStrength[i];
    mask = max(mask, influence);

    vec2 injectedVelocity = clamp(uSplatVelocity[i] * 0.07, vec2(-1.0), vec2(1.0));
    velocity = mix(velocity, injectedVelocity, influence * 0.12);
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

void main() {
  float history = texture(uHistory, vUv).r;

  // Low-frequency contour warp only. No temporal hash grain: the boundary should
  // feel organic and liquid, never dusty, smoky or noisy.
  float contourWarp = (
    sin(vUv.x * 17.0 + uTime * 0.22) +
    sin(vUv.y * 13.0 - uTime * 0.17) +
    sin((vUv.x + vUv.y) * 10.5 + uTime * 0.12)
  ) * (uNoiseAmount / 3.0);

  // The narrow high threshold hides low-density history completely. As history
  // decays, the visible contour contracts inward and ends cleanly as a blob.
  float reveal = smoothstep(0.40, 0.47, history + contourWarp);

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
