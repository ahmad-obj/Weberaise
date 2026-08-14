export const workSphereVertexShader = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aUv;
layout(location = 2) in vec4 aInstance0;
layout(location = 3) in vec4 aInstance1;
layout(location = 4) in vec4 aInstance2;
layout(location = 5) in vec4 aInstance3;
layout(location = 6) in vec2 aInstanceMeta;

uniform mat4 uViewProjection;
uniform float uVelocity;
uniform float uDeformation;
uniform float uProjectOpening;
uniform int uOpeningSlot;
uniform int uHiddenSlot;

out vec2 vUv;
out float vDepthAlpha;
flat out int vProjectIndex;
flat out int vSlotId;

void main() {
  int slotId = int(aInstanceMeta.y + 0.5);
  vUv = aUv;
  vProjectIndex = int(aInstanceMeta.x + 0.5);
  vSlotId = slotId;

  if (slotId == uHiddenSlot) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vDepthAlpha = 0.0;
    return;
  }

  mat4 instanceMatrix = mat4(aInstance0, aInstance1, aInstance2, aInstance3);
  vec3 local = aPosition;
  local.x += local.y * clamp(uVelocity, -1.0, 1.0) * uDeformation * 0.02;

  if (uOpeningSlot >= 0 && slotId != uOpeningSlot) {
    local.xy *= mix(1.0, 0.72, uProjectOpening);
  }

  vec4 world = instanceMatrix * vec4(local, 1.0);
  gl_Position = uViewProjection * world;
  float ndcDepth = gl_Position.z / max(0.0001, gl_Position.w);
  vDepthAlpha = smoothstep(1.0, -0.35, ndcDepth);
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
in float vDepthAlpha;
flat in int vProjectIndex;
flat in int vSlotId;

out vec4 outColor;

float roundedRectSdf(vec2 uv, float radius) {
  vec2 p = abs(uv - 0.5) - (vec2(0.5) - vec2(radius));
  return length(max(p, 0.0)) + min(max(p.x, p.y), 0.0) - radius;
}

vec4 samplePoster() {
  int grid = max(1, uAtlasGrid);
  int cellX = vProjectIndex % grid;
  int cellY = vProjectIndex / grid;
  vec2 atlasUv = (vec2(float(cellX), float(cellY)) + vUv) / float(grid);
  return texture(uPosterAtlas, atlasUv);
}

void main() {
  vec4 color = samplePoster();
  if (vSlotId == uVideoSlot0) color = texture(uVideo0, vUv);
  else if (vSlotId == uVideoSlot1) color = texture(uVideo1, vUv);
  else if (vSlotId == uVideoSlot2) color = texture(uVideo2, vUv);

  float distanceToRounded = roundedRectSdf(vUv, uCornerRadius);
  float edge = max(fwidth(distanceToRounded) * 1.35, 0.00075);
  float roundedAlpha = 1.0 - smoothstep(0.0, edge, distanceToRounded);
  color.a *= roundedAlpha * mix(0.56, 1.0, clamp(vDepthAlpha, 0.0, 1.0));
  if (color.a <= 0.001) discard;
  outColor = color;
}
`;
