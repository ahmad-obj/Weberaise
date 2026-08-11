const MAX_SPLATS = 24;
const VERT = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPosition;
out vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
const HIST = `#version 300 es
precision highp float;
#define MAX_SPLATS 24
in vec2 vUv;out vec4 outColor;
uniform sampler2D uPrevious;uniform float uDelta,uTime,uHalfLife,uAdvection,uAspect;
uniform int uSplatCount;uniform vec2 uSplatPos[MAX_SPLATS],uSplatVelocity[MAX_SPLATS];
uniform float uSplatRadius[MAX_SPLATS],uSplatStrength[MAX_SPLATS];
vec2 dv(vec2 v){return v*2.-1.;} vec2 ev(vec2 v){return v*.5+.5;}
void main(){
 vec4 seed=texture(uPrevious,vUv); vec2 old=dv(seed.gb);
 vec2 settle=vec2(sin(vUv.y*16.+uTime*.55),cos(vUv.x*13.-uTime*.42))*.0018*seed.r;
 vec2 vel=old*pow(.12,uDelta)+settle;
 vec2 auv=clamp(vUv-vel*uAdvection*min(uDelta*60.,2.),.001,.999);
 vec4 prev=texture(uPrevious,auv); float ret=pow(.5,uDelta/max(.05,uHalfLife));
 float mask=prev.r*ret; vel=dv(prev.gb)*pow(.18,uDelta)+settle;
 for(int i=0;i<MAX_SPLATS;i++){
   if(i>=uSplatCount)break; vec2 d=vUv-uSplatPos[i];d.x*=uAspect;
   float r=max(.001,uSplatRadius[i]); float inf=1.-smoothstep(r*.28,r,length(d));
   inf=pow(max(0.,inf),1.15)*uSplatStrength[i]; mask=max(mask,inf);
   vec2 injected=clamp(uSplatVelocity[i]*.18,vec2(-1.),vec2(1.)); vel=mix(vel,injected,inf*.32);
 }
 outColor=vec4(clamp(mask,0.,1.),ev(clamp(vel,vec2(-1.),vec2(1.))),1.);
}`;
const COMP = `#version 300 es
precision highp float; in vec2 vUv;out vec4 outColor;
uniform sampler2D uHistory,uBrand;uniform float uTime,uNoiseAmount,uFillProgress,uFillEnabled;
float hash(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}
void main(){
 float h=texture(uHistory,vUv).r;
 float n=(hash(floor(vUv*260.)+floor(uTime*4.))-.5)*uNoiseAmount;
 float reveal=smoothstep(.105,.36,h+n*(1.-h));
 vec4 brand=texture(uBrand,vUv); vec3 diff=mix(vec3(1.),vec3(1.)-brand.rgb,brand.a);
 float damp=sin(3.14159265*clamp(uFillProgress,0.,1.));
 float crest=uFillProgress+sin(vUv.x*8.5+uTime*.45)*.014*damp+sin(vUv.x*17.-uTime*.32)*.006*damp;
 float fill=(1.-smoothstep(crest-.012,crest+.012,vUv.y))*uFillEnabled;
 float ra=reveal*(1.-uFillEnabled); float a=max(ra,fill);
 outColor=vec4(diff*ra,a);
}`;

function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function program(gl,frag){const p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,VERT),f=shader(gl,gl.FRAGMENT_SHADER,frag);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
function texture(gl,w,h,data=null){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,data);return t;}
function target(gl,w,h){const t=texture(gl,w,h),f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('incomplete framebuffer');gl.clearColor(0,.5,.5,1);gl.clear(gl.COLOR_BUFFER_BIT);return{texture:t,framebuffer:f,width:w,height:h};}

export class RevealEngine {
  constructor(canvas,{lite=false}={}){
    this.canvas=canvas;this.gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,powerPreference:lite?'default':'high-performance'});
    if(!this.gl)throw new Error('WebGL2 unavailable'); const gl=this.gl;
    this.histProgram=program(gl,HIST);this.compProgram=program(gl,COMP);this.vao=gl.createVertexArray();this.buffer=gl.createBuffer();gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    this.targets=[target(gl,2,2),target(gl,2,2)];this.read=0;this.brand=texture(gl,1,1,new Uint8Array([0,0,0,0]));this.samples=[];this.mode='reveal';this.fill=0;this.running=false;this.last=0;this.shortAxis=lite?220:360;this.halfLife=lite?1.28:1.45;this.advection=lite?.006:.012;this.noise=lite?.01:.018;canvas.dataset.mode='reveal';
  }
  u(p,n){return this.gl.getUniformLocation(p,n);}
  resize(w,h,dpr=1){this.cssW=Math.max(1,w);this.cssH=Math.max(1,h);const pr=Math.min(1.5,Math.max(1,dpr));this.canvas.width=Math.round(w*pr);this.canvas.height=Math.round(h*pr);const a=w/Math.max(1,h);let mw,mh;if(a>=1){mh=this.shortAxis;mw=Math.round(mh*a);}else{mw=this.shortAxis;mh=Math.round(mw/a);}mw=Math.max(2,Math.min(768,mw));mh=Math.max(2,Math.min(768,mh));if(this.targets[0].width!==mw||this.targets[0].height!==mh){this.targets.forEach(t=>{this.gl.deleteFramebuffer(t.framebuffer);this.gl.deleteTexture(t.texture)});this.targets=[target(this.gl,mw,mh),target(this.gl,mw,mh)];this.read=0;}}
  setBrand(source){const gl=this.gl;gl.bindTexture(gl.TEXTURE_2D,this.brand);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);}
  setMode(mode){this.mode=mode;this.canvas.dataset.mode=mode;}
  setBottomFillProgress(v){this.fill=Math.min(1,Math.max(0,v));}
  clear(){const gl=this.gl;for(const t of this.targets){gl.bindFramebuffer(gl.FRAMEBUFFER,t.framebuffer);gl.viewport(0,0,t.width,t.height);gl.clearColor(0,.5,.5,1);gl.clear(gl.COLOR_BUFFER_BIT);}gl.bindFramebuffer(gl.FRAMEBUFFER,null);this.samples.length=0;}
  emit(samples){if(this.mode==='disabled')return;this.samples.push(...samples);if(this.samples.length>96)this.samples.splice(0,this.samples.length-96);}
  start(){if(this.running)return;this.running=true;this.last=performance.now();requestAnimationFrame(this.frame);}
  stop(){this.running=false;}
  frame=(now)=>{if(!this.running)return;const dt=Math.min(.05,Math.max(1/240,(now-this.last)/1000));this.last=now;this.update(dt,now/1000);this.render(now/1000);requestAnimationFrame(this.frame);}
  update(dt,time){const gl=this.gl,read=this.targets[this.read],wi=this.read?0:1,write=this.targets[wi],splats=this.samples.splice(0,MAX_SPLATS),p=this.histProgram;gl.bindFramebuffer(gl.FRAMEBUFFER,write.framebuffer);gl.viewport(0,0,write.width,write.height);gl.useProgram(p);gl.bindVertexArray(this.vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,read.texture);gl.uniform1i(this.u(p,'uPrevious'),0);gl.uniform1f(this.u(p,'uDelta'),dt);gl.uniform1f(this.u(p,'uTime'),time);gl.uniform1f(this.u(p,'uHalfLife'),this.halfLife);gl.uniform1f(this.u(p,'uAdvection'),this.advection);gl.uniform1f(this.u(p,'uAspect'),this.cssW/this.cssH);gl.uniform1i(this.u(p,'uSplatCount'),splats.length);const pos=new Float32Array(MAX_SPLATS*2),vel=new Float32Array(MAX_SPLATS*2),rad=new Float32Array(MAX_SPLATS),str=new Float32Array(MAX_SPLATS);splats.forEach((s,i)=>{pos[i*2]=s.x;pos[i*2+1]=1-s.y;vel[i*2]=s.vx;vel[i*2+1]=-s.vy;rad[i]=s.radius;str[i]=s.strength;});gl.uniform2fv(this.u(p,'uSplatPos[0]'),pos);gl.uniform2fv(this.u(p,'uSplatVelocity[0]'),vel);gl.uniform1fv(this.u(p,'uSplatRadius[0]'),rad);gl.uniform1fv(this.u(p,'uSplatStrength[0]'),str);gl.drawArrays(gl.TRIANGLES,0,6);this.read=wi;}
  render(time){const gl=this.gl,p=this.compProgram,h=this.targets[this.read];gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.useProgram(p);gl.bindVertexArray(this.vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,h.texture);gl.uniform1i(this.u(p,'uHistory'),0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.brand);gl.uniform1i(this.u(p,'uBrand'),1);gl.uniform1f(this.u(p,'uTime'),time);gl.uniform1f(this.u(p,'uNoiseAmount'),this.noise);gl.uniform1f(this.u(p,'uFillProgress'),this.fill);gl.uniform1f(this.u(p,'uFillEnabled'),this.mode==='bottomFill'?1:0);gl.drawArrays(gl.TRIANGLES,0,6);}
}

export function createRevealEngine(canvas){try{return new RevealEngine(canvas,{lite:matchMedia('(prefers-reduced-motion:reduce)').matches||innerWidth<560});}catch{return null;}}
