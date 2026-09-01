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
uniform float uExitProgress;
uniform float uExitEnabled;
uniform float uExitSealStart;

void main() {
  float dye = texture(uDye, vUv).r;
  float raw = dye * uRevealGain;
  float reveal = smoothstep(uEdgeSoftness, uEdgeSoftness + uEdgeWidth, raw);

  if (uExitEnabled > 0.5) {
    float seal = smoothstep(
      uExitSealStart,
      1.0,
      clamp(uExitProgress, 0.0, 1.0)
    );
    float alpha = max(reveal, seal);
    outColor = vec4(0.0, 0.0, 0.0, alpha);
    return;
  }

  // Preserve the existing WEBERAISE difference-composite contract. The fluid
  // controls only where the registered hidden state is visible; typography and
  // the brand lockup remain crisp DOM-aligned assets.
  vec4 brand = texture(uBrand, vUv);
  vec3 differenceSource = mix(vec3(1.0), vec3(1.0) - brand.rgb, brand.a);
  vec3 premultipliedRgb = differenceSource * reveal;
  outColor = vec4(premultipliedRgb, reveal);
}`;
