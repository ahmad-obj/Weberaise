export type ProgramBundle = {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
};

const FULLSCREEN_QUAD = new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
  -1,  1,
   1, -1,
   1,  1,
]);

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to allocate WebGL shader.');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): ProgramBundle {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    throw new Error('Unable to allocate WebGL program.');
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Unknown program link error.';
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return { program, uniforms: new Map() };
}

export function getUniform(
  gl: WebGL2RenderingContext,
  bundle: ProgramBundle,
  name: string,
): WebGLUniformLocation | null {
  if (!bundle.uniforms.has(name)) {
    bundle.uniforms.set(name, gl.getUniformLocation(bundle.program, name));
  }
  return bundle.uniforms.get(name) ?? null;
}

export function createFullscreenGeometry(gl: WebGL2RenderingContext) {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  if (!vao || !buffer) throw new Error('Unable to allocate fullscreen fluid geometry.');

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_QUAD, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return { vao, buffer };
}
