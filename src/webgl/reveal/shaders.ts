export const FULLSCREEN_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export const FIELD_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec2 aCenter;
layout(location = 2) in float aRadius;
layout(location = 3) in vec2 aVelocity;
layout(location = 4) in float aStrength;
uniform float uAspect;
out vec2 vLocal;
out float vStrength;

void main() {
  vec2 metricVelocity = vec2(aVelocity.x * uAspect, aVelocity.y);
  float speed = length(metricVelocity);
  vec2 direction = speed > 0.001 ? normalize(metricVelocity) : vec2(1.0, 0.0);
  vec2 perpendicular = vec2(-direction.y, direction.x);

  // The moving head gets only a restrained directional pull. The field itself
  // remains rounded and cohesive rather than becoming a streak/smoke brush.
  float stretch = 1.0 + min(speed * 0.028, 0.12);
  float squash = inversesqrt(stretch);
  vec2 metricOffset =
    direction * (aCorner.x * stretch) +
    perpendicular * (aCorner.y * squash);

  // Support is intentionally larger than the visible radius. Additive tails of
  // neighboring primitives create smooth metaball necks before thresholding.
  float support = 1.55;
  vec2 uvOffset = vec2(metricOffset.x / max(0.001, uAspect), metricOffset.y)
    * aRadius * support;
  vec2 uv = aCenter + uvOffset;

  vLocal = aCorner;
  vStrength = aStrength;
  gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
}`;

export const FIELD_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vLocal;
in float vStrength;
out vec4 outColor;

void main() {
  float distanceToCenter = length(vLocal);
  if (distanceToCenter >= 1.0) discard;

  // A compact implicit contribution. We render many of these additively and
  // extract one hard level set in the composite pass. This gives real union,
  // necking and pinch-off without any translucent density-history residue.
  float contribution = pow(max(0.0, 1.0 - distanceToCenter), 1.16) * vStrength;
  outColor = vec4(contribution, 0.0, 0.0, contribution);
}`;

export const COMPOSITE_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uField;
uniform sampler2D uBrand;
uniform float uTime;
uniform float uSurfaceThreshold;
uniform float uContourWarp;
uniform float uFillProgress;
uniform float uFillEnabled;

void main() {
  float field = texture(uField, vUv).r;

  // Surface motion is expressed as a tiny threshold displacement, so only the
  // contour moves. There is no temporal grain and no low-alpha cloud behind it.
  float contourWave = (
    sin(vUv.x * 13.0 + uTime * 0.28) +
    sin(vUv.y * 11.0 - uTime * 0.21) +
    sin((vUv.x + vUv.y) * 8.0 + uTime * 0.16)
  ) / 3.0;
  float threshold = uSurfaceThreshold + contourWave * uContourWarp;
  float antialiasWidth = clamp(fwidth(field) * 1.15, 0.004, 0.016);
  float reveal = smoothstep(threshold - antialiasWidth, threshold + antialiasWidth, field);

  // The canvas difference-blends over the DOM front layer. White inverts the
  // registered WELCOME/TO layer, while the complementary brand source rebuilds
  // the approved WEBERAISE lockup inside the same solid liquid surface.
  vec4 brand = texture(uBrand, vUv);
  vec3 differenceSource = mix(vec3(1.0), vec3(1.0) - brand.rgb, brand.a);

  float edgeDamping = sin(3.14159265 * clamp(uFillProgress, 0.0, 1.0));
  float crest = uFillProgress
    + sin(vUv.x * 8.5 + uTime * 0.45) * 0.014 * edgeDamping
    + sin(vUv.x * 17.0 - uTime * 0.32) * 0.006 * edgeDamping;
  float fill = (1.0 - smoothstep(crest - 0.012, crest + 0.012, vUv.y)) * uFillEnabled;

  float revealAlpha = reveal * (1.0 - uFillEnabled);
  float alpha = max(revealAlpha, fill);
  vec3 premultipliedRgb = differenceSource * revealAlpha;
  outColor = vec4(premultipliedRgb, alpha);
}`;
