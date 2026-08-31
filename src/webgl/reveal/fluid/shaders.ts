export const FLUID_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export const SPLAT_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform vec3 uColor;
uniform float uRadius;
uniform float uAspectRatio;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspectRatio;
  float weight = exp(-dot(p, p) / max(uRadius, 0.0000001));
  vec3 base = texture(uTarget, vUv).xyz;
  outColor = vec4(base + weight * uColor, 1.0);
}`;

export const ADVECTION_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexelSize;
uniform float uDtFrames;
uniform float uDissipation;

vec4 bilerp(sampler2D samplerValue, vec2 uv, vec2 texelSize) {
  vec2 grid = uv / texelSize - 0.5;
  vec2 base = floor(grid);
  vec2 fraction = fract(grid);
  vec2 uv00 = (base + vec2(0.5, 0.5)) * texelSize;
  vec2 uv10 = (base + vec2(1.5, 0.5)) * texelSize;
  vec2 uv01 = (base + vec2(0.5, 1.5)) * texelSize;
  vec2 uv11 = (base + vec2(1.5, 1.5)) * texelSize;
  vec4 a = mix(texture(samplerValue, uv00), texture(samplerValue, uv10), fraction.x);
  vec4 b = mix(texture(samplerValue, uv01), texture(samplerValue, uv11), fraction.x);
  return mix(a, b, fraction.y);
}

void main() {
  vec2 velocity = texture(uVelocity, vUv).xy;
  vec2 coord = vUv - uDtFrames * velocity * uTexelSize;
  outColor = uDissipation * bilerp(uSource, coord, uTexelSize);
}`;

export const DIVERGENCE_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uVelocity;
uniform vec2 uTexelSize;
void main() {
  float left = texture(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).x;
  float right = texture(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).x;
  float bottom = texture(uVelocity, vUv - vec2(0.0, uTexelSize.y)).y;
  float top = texture(uVelocity, vUv + vec2(0.0, uTexelSize.y)).y;
  float divergence = 0.5 * (right - left + top - bottom);
  outColor = vec4(divergence, 0.0, 0.0, 1.0);
}`;

export const PRESSURE_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexelSize;
void main() {
  float left = texture(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
  float right = texture(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
  float bottom = texture(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
  float top = texture(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
  float divergence = texture(uDivergence, vUv).x;
  float pressure = 0.25 * (left + right + bottom + top - divergence);
  outColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

export const GRADIENT_SUBTRACT_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexelSize;
void main() {
  float left = texture(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
  float right = texture(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
  float bottom = texture(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
  float top = texture(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity -= 0.5 * vec2(right - left, top - bottom);
  outColor = vec4(velocity, 0.0, 1.0);
}`;
