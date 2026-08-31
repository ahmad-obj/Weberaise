export const FULLSCREEN_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export const COMPOSITE_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uDye;
uniform sampler2D uBrand;
uniform float uRevealGain;
uniform float uEdgeSoftness;
uniform float uEdgeWidth;
uniform float uTime;
uniform float uFillProgress;
uniform float uFillEnabled;

void main() {
  float dye = texture(uDye, vUv).r;
  float raw = dye * uRevealGain;
  float reveal = smoothstep(uEdgeSoftness, uEdgeSoftness + uEdgeWidth, raw);

  // Preserve the existing WEBERAISE difference-composite contract. The fluid
  // controls only where the registered hidden state is visible; typography and
  // the brand lockup remain crisp DOM-aligned assets.
  vec4 brand = texture(uBrand, vUv);
  vec3 differenceSource = mix(vec3(1.0), vec3(1.0) - brand.rgb, brand.a);

  // EXPLORE exit is a separate authored transition. Its restrained crest is not
  // part of the interactive liquid material and remains behaviorally unchanged.
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
