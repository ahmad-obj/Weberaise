const QUAD = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
const INSTANCE_FLOATS = 6;
const INSTANCE_STRIDE = INSTANCE_FLOATS * 4;

const FULLSCREEN_VERTEX = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPosition;
out vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;

const FIELD_VERTEX = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
layout(location=1) in vec2 aCenter;
layout(location=2) in float aRadius;
layout(location=3) in vec2 aVelocity;
layout(location=4) in float aStrength;
uniform float uAspect;
out vec2 vLocal;
out float vStrength;
void main(){
 vec2 metricVelocity=vec2(aVelocity.x*uAspect,aVelocity.y);
 float speed=length(metricVelocity);
 vec2 direction=speed>.001?normalize(metricVelocity):vec2(1.,0.);
 vec2 perpendicular=vec2(-direction.y,direction.x);
 float stretch=1.+min(speed*.028,.12);
 float squash=inversesqrt(stretch);
 vec2 metricOffset=direction*(aCorner.x*stretch)+perpendicular*(aCorner.y*squash);
 vec2 uvOffset=vec2(metricOffset.x/max(.001,uAspect),metricOffset.y)*aRadius*1.55;
 vec2 uv=aCenter+uvOffset;
 vLocal=aCorner;vStrength=aStrength;gl_Position=vec4(uv*2.-1.,0.,1.);
}`;

const FIELD_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vLocal;
in float vStrength;
out vec4 outColor;
void main(){
 float d=length(vLocal);if(d>=1.)discard;
 float contribution=pow(max(0.,1.-d),1.16)*vStrength;
 outColor=vec4(contribution,0.,0.,contribution);
}`;

const COMP = `#version 300 es
precision highp float;
in vec2 vUv;out vec4 outColor;
uniform sampler2D uField,uBrand;
uniform float uTime,uSurfaceThreshold,uContourWarp,uFillProgress,uFillEnabled;
void main(){
 float field=texture(uField,vUv).r;
 float wave=(sin(vUv.x*13.+uTime*.28)+sin(vUv.y*11.-uTime*.21)+sin((vUv.x+vUv.y)*8.+uTime*.16))/3.;
 float threshold=uSurfaceThreshold+wave*uContourWarp;
 float aa=clamp(fwidth(field)*1.15,.004,.016);
 float reveal=smoothstep(threshold-aa,threshold+aa,field);
 vec4 brand=texture(uBrand,vUv);vec3 diff=mix(vec3(1.),vec3(1.)-brand.rgb,brand.a);
 float damp=sin(3.14159265*clamp(uFillProgress,0.,1.));
 float crest=uFillProgress+sin(vUv.x*8.5+uTime*.45)*.014*damp+sin(vUv.x*17.-uTime*.32)*.006*damp;
 float fill=(1.-smoothstep(crest-.012,crest+.012,vUv.y))*uFillEnabled;
 float ra=reveal*(1.-uFillEnabled);float a=max(ra,fill);
 outColor=vec4(diff*ra,a);
}`;

function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function program(gl,vert,frag){const p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,vert),f=shader(gl,gl.FRAGMENT_SHADER,frag);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
function texture(gl,w,h,data=null){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,data);return t;}
function target(gl,w,h){const t=texture(gl,w,h),f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('incomplete framebuffer');gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);return{texture:t,framebuffer:f,width:w,height:h};}
function radiusScale(age,lifetime,hold=.6){if(age>=lifetime)return 0;if(age<=lifetime*hold)return 1;let t=(age-lifetime*hold)/(lifetime-lifetime*hold);t=Math.max(0,Math.min(1,t));const e=t*t*(3-2*t);return Math.pow(Math.max(0,1-e),.72);}

function fullscreenGeometry(gl){const vao=gl.createVertexArray(),buffer=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,QUAD,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);return{vao,buffer};}
function fieldGeometry(gl){const vao=gl.createVertexArray(),corner=gl.createBuffer(),instances=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,corner);gl.bufferData(gl.ARRAY_BUFFER,QUAD,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,instances);for(const [loc,size,offset] of [[1,2,0],[2,1,8],[3,2,12],[4,1,20]]){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,INSTANCE_STRIDE,offset);gl.vertexAttribDivisor(loc,1);}return{vao,corner,instances};}

export class RevealEngine {
  constructor(canvas,{lite=false}={}){
    this.canvas=canvas;this.gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,powerPreference:lite?'default':'high-performance'});
    if(!this.gl)throw new Error('WebGL2 unavailable');const gl=this.gl;
    this.fieldProgram=program(gl,FIELD_VERTEX,FIELD_FRAGMENT);this.compProgram=program(gl,FULLSCREEN_VERTEX,COMP);
    const fg=fieldGeometry(gl),full=fullscreenGeometry(gl);this.fieldVao=fg.vao;this.fieldCorner=fg.corner;this.instanceBuffer=fg.instances;this.fullVao=full.vao;this.fullBuffer=full.buffer;
    this.field=target(gl,2,2);this.brand=texture(gl,1,1,new Uint8Array([0,0,0,0]));this.primitives=[];this.mode='reveal';this.fill=0;this.running=false;
    this.shortAxis=lite?280:480;this.lifetime=lite?3.1:3.6;this.hold=.6;this.maxPrimitives=lite?220:420;this.threshold=lite?.42:.40;this.contour=lite?.0045:.010;canvas.dataset.mode='reveal';
  }
  u(p,n){return this.gl.getUniformLocation(p,n);}
  resize(w,h,dpr=1){this.cssW=Math.max(1,w);this.cssH=Math.max(1,h);const pr=Math.min(1.5,Math.max(1,dpr));this.canvas.width=Math.round(w*pr);this.canvas.height=Math.round(h*pr);const a=w/Math.max(1,h),maxLong=1024;let mw,mh;if(a>=1){mh=this.shortAxis;mw=Math.round(mh*a);if(mw>maxLong){mw=maxLong;mh=Math.round(mw/a);}}else{mw=this.shortAxis;mh=Math.round(mw/a);if(mh>maxLong){mh=maxLong;mw=Math.round(mh*a);}}mw=Math.max(2,mw);mh=Math.max(2,mh);if(this.field.width!==mw||this.field.height!==mh){this.gl.deleteFramebuffer(this.field.framebuffer);this.gl.deleteTexture(this.field.texture);this.field=target(this.gl,mw,mh);}}
  setBrand(source){const gl=this.gl;gl.bindTexture(gl.TEXTURE_2D,this.brand);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);}
  setMode(mode){this.mode=mode;this.canvas.dataset.mode=mode;}
  setBottomFillProgress(v){this.fill=Math.min(1,Math.max(0,v));}
  clear(){this.primitives.length=0;const gl=this.gl;gl.bindFramebuffer(gl.FRAMEBUFFER,this.field.framebuffer);gl.viewport(0,0,this.field.width,this.field.height);gl.disable(gl.BLEND);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.bindFramebuffer(gl.FRAMEBUFFER,null);}
  emit(samples){if(this.mode==='disabled'||!samples.length)return;const now=performance.now()/1000,newest=samples.at(-1)?.time??now;for(const s of samples){const lag=Math.min(.12,Math.max(0,newest-s.time));this.primitives.push({...s,bornAt:now-lag});}if(this.primitives.length>this.maxPrimitives)this.primitives.splice(0,this.primitives.length-this.maxPrimitives);}
  start(){if(this.running)return;this.running=true;requestAnimationFrame(this.frame);}
  stop(){this.running=false;}
  frame=(ms)=>{if(!this.running)return;const now=ms/1000;if(this.mode==='reveal')this.renderField(now);this.render(now);requestAnimationFrame(this.frame);}
  renderField(now){const gl=this.gl,active=[],vals=[];for(const p of this.primitives){const age=Math.max(0,now-p.bornAt);if(age>=this.lifetime)continue;active.push(p);const rs=radiusScale(age,this.lifetime,this.hold);if(rs<=.005)continue;vals.push(p.x,1-p.y,p.radius*rs,p.vx,-p.vy,p.strength);}this.primitives=active;gl.bindFramebuffer(gl.FRAMEBUFFER,this.field.framebuffer);gl.viewport(0,0,this.field.width,this.field.height);gl.disable(gl.BLEND);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);const count=vals.length/INSTANCE_FLOATS;if(!count){gl.bindFramebuffer(gl.FRAMEBUFFER,null);return;}gl.useProgram(this.fieldProgram);gl.bindVertexArray(this.fieldVao);gl.bindBuffer(gl.ARRAY_BUFFER,this.instanceBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vals),gl.DYNAMIC_DRAW);gl.uniform1f(this.u(this.fieldProgram,'uAspect'),this.cssW/this.cssH);gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFunc(gl.ONE,gl.ONE);gl.drawArraysInstanced(gl.TRIANGLES,0,6,count);gl.disable(gl.BLEND);gl.bindFramebuffer(gl.FRAMEBUFFER,null);}
  render(time){const gl=this.gl,p=this.compProgram;gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.disable(gl.BLEND);gl.useProgram(p);gl.bindVertexArray(this.fullVao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.field.texture);gl.uniform1i(this.u(p,'uField'),0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.brand);gl.uniform1i(this.u(p,'uBrand'),1);gl.uniform1f(this.u(p,'uTime'),time);gl.uniform1f(this.u(p,'uSurfaceThreshold'),this.threshold);gl.uniform1f(this.u(p,'uContourWarp'),this.contour);gl.uniform1f(this.u(p,'uFillProgress'),this.fill);gl.uniform1f(this.u(p,'uFillEnabled'),this.mode==='bottomFill'?1:0);gl.drawArrays(gl.TRIANGLES,0,6);}
}

export function createRevealEngine(canvas){try{return new RevealEngine(canvas,{lite:matchMedia('(prefers-reduced-motion:reduce)').matches||innerWidth<560});}catch{return null;}}
