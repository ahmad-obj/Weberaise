export const workSphereVertexShader = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aUv;
layout(location = 2) in vec4 aInstance0;
layout(location = 3) in vec4 aInstance1;
layout(location = 4) in vec4 aInstance2;
layout(location = 5) in vec4 aInstance3;
layout(location = 6) in vec2 aInstanceMeta;

uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 vUv;
out float vAlpha;
flat out int vProjectIndex;
flat out int vSlotId;

void main() {
  mat4 instanceMatrix = mat4(aInstance0, aInstance1, aInstance2, aInstance3);
  vec4 worldPosition = instanceMatrix * vec4(aPosition, 1.0);
  vec3 centerPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float radius = max(0.0001, length(centerPos));

  worldPosition.xyz = radius * normalize(worldPosition.xyz);

  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  vAlpha = smoothstep(0.5, 1.0, normalize(worldPosition.xyz).z) * 0.9 + 0.1;
  vUv = aUv;
  vProjectIndex = int(aInstanceMeta.x + 0.5);
  vSlotId = int(aInstanceMeta.y + 0.5);
}
`;

export const workSphereFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D uPosterAtlas;
uniform sampler2D uVideo0;
uniform sampler2D uVideo1;
uniform sampler2D uVideo2;
uniform int uVideoSlot0;
uniform int uVideoSlot1;
uniform int uVideoSlot2;
uniform int uAtlasGrid;
uniform float uCornerRadius;

in vec2 vUv;
in float vAlpha;
flat in int vProjectIndex;
flat in int vSlotId;

out vec4 outColor;

float roundedRectSdf(vec2 uv, float radius) {
  vec2 p = abs(uv - 0.5) - (vec2(0.5) - vec2(radius));
  return length(max(p, 0.0)) + min(max(p.x, p.y), 0.0) - radius;
}

vec2 fitWebsiteUv(vec2 uv) {
  float sourceAspect = 1.6;
  float targetAspect = 4.0 / 3.0;
  float visibleWidth = targetAspect / sourceAspect;
  return vec2((uv.x - 0.5) * visibleWidth + 0.5, uv.y);
}

vec4 samplePoster(vec2 websiteUv) {
  int grid = max(1, uAtlasGrid);
  int cellX = vProjectIndex % grid;
  int cellY = vProjectIndex / grid;
  vec2 cellSize = vec2(1.0) / float(grid);
  vec2 atlasUv = (vec2(float(cellX), float(cellY)) + websiteUv) * cellSize;
  return texture(uPosterAtlas, atlasUv);
}

void main() {
  vec2 websiteUv = fitWebsiteUv(vUv);
  vec4 color = samplePoster(websiteUv);
  if (vSlotId == uVideoSlot0) color = texture(uVideo0, websiteUv);
  else if (vSlotId == uVideoSlot1) color = texture(uVideo1, websiteUv);
  else if (vSlotId == uVideoSlot2) color = texture(uVideo2, websiteUv);

  float distanceToRounded = roundedRectSdf(vUv, uCornerRadius);
  float edge = max(fwidth(distanceToRounded) * 1.35, 0.00075);
  float roundedAlpha = 1.0 - smoothstep(0.0, edge, distanceToRounded);
  color.a *= roundedAlpha * vAlpha;
  if (color.a <= 0.001) discard;
  outColor = color;
}
`;
