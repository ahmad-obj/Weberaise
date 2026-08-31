export type FluidTarget = {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
};

export type DoubleFluidTarget = {
  read: FluidTarget;
  write: FluidTarget;
  swap(): void;
};

export type FluidSplat = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  strength: number;
};
