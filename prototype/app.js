import { createRevealEngine } from './reveal-engine.js';

const $ = (s, root=document) => root.querySelector(s);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const ease = (t) => 1 - Math.pow(1 - t, 4);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const loader = $('[data-loader]');
const countRoot = $('[data-loader-count]');
const completion = $('[data-loader-completion]');
const line = $('[data-loader-line]');
const zero = $('[data-loader-zero]');
const tagline = $('[data-loader-tagline]');
const hero = $('[data-hero-root]');
const revealCanvas = $('[data-reveal-canvas]');
const cursor = $('[data-hero-cursor]');
const explore = $('[data-explore]');
const main = $('[data-main]');
const debugState = new URLSearchParams(location.search).get('debugState');
let engine = null;
let previousPoint = null;
let autonomousPlayed = false;
let interactive = false;

function seeded(index){let x=(index+1)*2654435761>>>0;x^=x>>>15;x=Math.imul(x,2246822519);x^=x>>>13;return(x>>>0)/4294967295;}
function countPosition(value){if(value===0)return {x:50,y:50};const a=seeded(value*2),b=seeded(value*2+1);return{x:10+a*80,y:12+b*76};}
function showCount(value){countRoot.querySelectorAll('.count-number.leaving').forEach(node=>node.remove());const old=$('.count-number:not(.leaving)',countRoot);const el=document.createElement('span');el.className='count-number';el.textContent=String(value);const p=countPosition(value);el.style.left=`${p.x}%`;el.style.top=`${p.y}%`;countRoot.append(el);if(old){old.classList.add('leaving');setTimeout(()=>old.remove(),155);}return el;}

async function realReady(){
  const tasks=[];
  tasks.push(document.fonts?.ready ?? Promise.resolve());
  tasks.push(new Promise(resolve=>{const img=new Image();img.onload=resolve;img.onerror=resolve;img.src='../public/brand/weberaise-horizontal-on-dark.svg';}));
  tasks.push(Promise.resolve().then(()=>{const probe=document.createElement('canvas');probe.getContext('webgl2');}));
  await Promise.all(tasks);
}

async function countdown(){
  showCount(100);
  let ready=false;realReady().then(()=>{ready=true});
  let value=100;
  while(value>0){
    const target=ready?0:Math.max(1,100-Math.floor(performance.now()/30)%70);
    if(value>target){value-=1;showCount(value);await sleep(reduced?3:(value>55?10:value>20?14:20));}
    else await sleep(16);
  }
  return ready;
}

function animate(el,keyframes,options){return el.animate(keyframes,{fill:'forwards',...options}).finished.catch(()=>{});}

async function loaderCompletion(){
  countRoot.hidden=true;completion.hidden=false;
  line.style.transform='translate(-50%,-50%) scaleX(0)';
  await animate(line,[{transform:'translate(-50%,-50%) scaleX(0)'},{transform:'translate(-50%,-50%) scaleX(1)'}],{duration:reduced?80:520,easing:'cubic-bezier(.22,.8,.2,1)'});
  await Promise.all([
    animate(zero,[{transform:'translateY(0)'},{transform:'translateY(125%)'}],{duration:reduced?100:520,easing:'cubic-bezier(.55,0,.2,1)'}),
    animate(tagline,[{transform:'translateY(125%)'},{transform:'translateY(0)'}],{duration:reduced?100:560,easing:'cubic-bezier(.22,.8,.2,1)'})
  ]);
  await sleep(reduced?100:1500);
  await animate(tagline,[{transform:'translateY(0)'},{transform:'translateY(125%)'}],{duration:reduced?100:480,easing:'cubic-bezier(.55,0,.2,1)'});
  const shortScale=Math.min(1,72/Math.min(innerWidth*.46,720));
  await animate(line,[{transform:'translate(-50%,-50%) scaleX(1) rotate(0)'},{transform:`translate(-50%,-50%) scaleX(${shortScale}) rotate(0)`}],{duration:reduced?100:420,easing:'cubic-bezier(.65,0,.35,1)'});
  await animate(line,[{transform:`translate(-50%,-50%) scaleX(${shortScale}) rotate(0)`},{transform:`translate(-50%,-50%) scaleX(${shortScale}) rotate(90deg)`}],{duration:reduced?100:460,easing:'cubic-bezier(.65,0,.35,1)'});
  line.style.width='100vh';
  const verticalScale=72/Math.max(1,innerHeight);
  line.style.transform=`translate(-50%,-50%) scaleX(${verticalScale}) rotate(90deg)`;
  await animate(line,[{transform:`translate(-50%,-50%) scaleX(${verticalScale}) rotate(90deg)`},{transform:'translate(-50%,-50%) scaleX(1) rotate(90deg)'}],{duration:reduced?120:560,easing:'cubic-bezier(.22,.8,.2,1)'});
}

async function heroOpen(){
  hero.hidden=false;
  const opening=$('[data-hero-opening]');opening.hidden=false;
  loader.hidden=true;
  const l=$('[data-opening-line-left]'),r=$('[data-opening-line-right]'),cl=$('[data-curtain-left]'),cr=$('[data-curtain-right]');
  const dur=reduced?280:1180;
  await Promise.all([
    animate(cl,[{transform:'translateX(0)'},{transform:'translateX(-100%)'}],{duration:dur,easing:'cubic-bezier(.65,0,.35,1)'}),
    animate(cr,[{transform:'translateX(0)'},{transform:'translateX(100%)'}],{duration:dur,easing:'cubic-bezier(.65,0,.35,1)'}),
    animate(l,[{transform:'translateX(0)'},{transform:'translateX(-50vw)'}],{duration:dur,easing:'cubic-bezier(.65,0,.35,1)'}),
    animate(r,[{transform:'translateX(0)'},{transform:'translateX(50vw)'}],{duration:dur,easing:'cubic-bezier(.65,0,.35,1)'})
  ]);
  opening.hidden=true;
  await setupInteractive();
}

async function image(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=async()=>{try{await i.decode();}catch{}resolve(i);};i.onerror=reject;i.src=src;});}
async function brandLayer(){const root=hero.getBoundingClientRect(),brand=$('.brand-lockup').getBoundingClientRect(),scale=Math.min(devicePixelRatio||1,1.5),c=document.createElement('canvas');c.width=Math.round(root.width*scale);c.height=Math.round(root.height*scale);const ctx=c.getContext('2d'),img=await image('../public/brand/weberaise-horizontal-on-dark.svg');ctx.drawImage(img,(brand.left-root.left)*scale,(brand.top-root.top)*scale,brand.width*scale,brand.height*scale);return c;}
async function resizeEngine(){if(!engine)return;const r=hero.getBoundingClientRect();engine.resize(r.width,r.height,devicePixelRatio||1);const c=await brandLayer();engine?.setBrand(c);}
function interpolate(a,b,spacing=.028){const d=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(d/spacing)),out=[];for(let i=1;i<=steps;i++){const t=i/steps;out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}return out;}
function pointerSamples(prev,cur){const pts=interpolate(prev,cur),dt=Math.max(1/240,cur.time-prev.time),vx=Math.max(-1.85,Math.min(1.85,(cur.x-prev.x)/dt)),vy=Math.max(-1.85,Math.min(1.85,(cur.y-prev.y)/dt)),radius=innerWidth<720?.135:.105;return pts.map((p,i)=>({...p,radius,strength:1,vx,vy,time:prev.time+dt*(i+1)/pts.length}));}
export function createAutonomousStroke(){const out=[],count=20,d=.64;let prev={x:.495,y:.82};for(let i=0;i<count;i++){const t=i/(count-1),iv=1-t,x=iv*iv*.495+2*iv*t*.515+t*t*.535,y=iv*iv*.82+2*iv*t*.79+t*t*.815,dt=d/(count-1);out.push({x,y,radius:.085,strength:.96,vx:i?(x-prev.x)/dt:0,vy:i?(y-prev.y)/dt:0,time:d*t});prev={x,y};}return out;}
function playAutonomous(){if(autonomousPlayed||!engine)return;autonomousPlayed=true;createAutonomousStroke().forEach((s,i,a)=>setTimeout(()=>engine?.emit([s]),260+(i/(a.length-1))*.64*1000));}

async function setupInteractive(){
  engine=createRevealEngine(revealCanvas);
  if(engine){await resizeEngine();engine.start();addEventListener('resize',()=>{void resizeEngine();},{passive:true});}
  hero.classList.add('interactive');interactive=true;playAutonomous();
}

hero.addEventListener('pointermove',e=>{
  if(!interactive||e.pointerType==='touch')return;const rect=hero.getBoundingClientRect(),cur={x:(e.clientX-rect.left)/rect.width,y:(e.clientY-rect.top)/rect.height,time:performance.now()/1000};
  cursor.style.transform=`translate3d(${e.clientX-rect.left}px,${e.clientY-rect.top}px,0)`;cursor.classList.add('visible');
  if(engine){if(previousPoint)engine.emit(pointerSamples(previousPoint,cur));else engine.emit([{...cur,radius:innerWidth<720?.135:.105,strength:1,vx:0,vy:0}]);}
  previousPoint=cur;
},{passive:true});
hero.addEventListener('pointerleave',()=>{previousPoint=null;cursor.classList.remove('visible')},{passive:true});

async function exitHero(){
  if(!interactive)return;interactive=false;hero.classList.remove('interactive');cursor.classList.remove('visible');explore.disabled=true;
  await animate(explore,[{opacity:1,transform:'translateX(-50%) translateY(0)'},{opacity:0,transform:'translateX(-50%) translateY(-7px)'}],{duration:reduced?80:220,easing:'ease-out'});
  if(engine){engine.clear();engine.setBottomFillProgress(0);engine.setMode('bottomFill');const start=performance.now(),duration=reduced?550:1720;await new Promise(resolve=>{const tick=now=>{const t=Math.min(1,(now-start)/duration),v=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;engine.setBottomFillProgress(v);if(t<1)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});}
  else {const fill=$('[data-hero-exit-fill]');fill.style.display='block';await animate(fill,[{transform:'scaleY(0)'},{transform:'scaleY(1)'}],{duration:reduced?550:1720,easing:'cubic-bezier(.65,0,.35,1)'});}
  hero.hidden=true;main.hidden=false;document.body.classList.remove('locked');scrollTo(0,0);
}
explore.addEventListener('click',exitHero);

async function boot(){
  if(debugState==='hero'){loader.hidden=true;hero.hidden=false;await setupInteractive();return;}
  if(debugState==='main'){loader.hidden=true;hero.hidden=true;main.hidden=false;document.body.classList.remove('locked');return;}
  await countdown();await loaderCompletion();await heroOpen();
}
boot();
