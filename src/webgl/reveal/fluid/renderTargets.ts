import type { DoubleFluidTarget, FluidTarget } from './types';

export function createFluidTarget(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  filter: number,
): FluidTarget {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (!texture || !framebuffer) {
    if (texture) gl.deleteTexture(texture);
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    throw new Error('Unable to allocate fluid render target.');
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA16F,
    Math.max(1, width),
    Math.max(1, height),
    0,
    gl.RGBA,
    gl.HALF_FLOAT,
    null,
  );

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    throw new Error('Fluid RGBA16F framebuffer is incomplete.');
  }

  const target = {
    texture,
    framebuffer,
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
  clearFluidTarget(gl, target);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return target;
}

export function createDoubleFluidTarget(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  filter: number,
): DoubleFluidTarget {
  return {
    read: createFluidTarget(gl, width, height, filter),
    write: createFluidTarget(gl, width, height, filter),
    swap() {
      const previousRead = this.read;
      this.read = this.write;
      this.write = previousRead;
    },
  };
}

export function clearFluidTarget(gl: WebGL2RenderingContext, target: FluidTarget): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
  gl.viewport(0, 0, target.width, target.height);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

export function disposeFluidTarget(gl: WebGL2RenderingContext, target: FluidTarget): void {
  gl.deleteFramebuffer(target.framebuffer);
  gl.deleteTexture(target.texture);
}

export function disposeDoubleFluidTarget(
  gl: WebGL2RenderingContext,
  target: DoubleFluidTarget,
): void {
  disposeFluidTarget(gl, target.read);
  disposeFluidTarget(gl, target.write);
}
