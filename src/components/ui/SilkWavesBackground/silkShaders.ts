export const SILK_VERTEX_SHADER = `
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const SILK_FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = p * 2.01 + vec2(19.1, 7.7);
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 resolution = max(uResolution, vec2(1.0));
  vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
  p += uPointer * 0.025;

  float t = uTime * 0.055;
  float warpA = fbm(p * 0.72 + vec2(t, -t * 0.42));
  float warpB = fbm(p * 1.12 + vec2(warpA * 0.55) + vec2(-t * 0.31, t * 0.22));
  float axis = p.x * 1.16 + p.y * 0.34 + warpA * 0.82 + warpB * 0.24;
  float fold = sin(axis * 3.05 + t * 1.1);
  float ridge = pow(max(0.0, 1.0 - abs(fold)), 4.2);
  float shoulder = pow(max(0.0, 1.0 - abs(sin(axis * 1.53 - 1.1))), 2.6);
  float depth = smoothstep(0.18, 0.82, warpB);

  vec3 black = vec3(0.0);
  vec3 deepBlue = vec3(8.0, 20.0, 52.0) / 255.0;
  vec3 blue = vec3(37.0, 99.0, 235.0) / 255.0;
  vec3 glow = vec3(96.0, 165.0, 250.0) / 255.0;

  float body = clamp(shoulder * 0.16 + depth * 0.09, 0.0, 0.24);
  float highlight = clamp(ridge * (0.22 + depth * 0.24), 0.0, 0.34);
  vec3 color = mix(black, deepBlue, body);
  color = mix(color, blue, highlight);
  color = mix(color, glow, ridge * ridge * 0.055);

  float vignette = 1.0 - smoothstep(0.46, 1.24, length(p * vec2(0.72, 0.94)));
  color *= mix(0.72, 1.0, vignette);

  gl_FragColor = vec4(color, 1.0);
}
`;
