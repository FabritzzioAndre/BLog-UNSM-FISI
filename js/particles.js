/* Interactive flame trail for FISI Academic Hub header. Decorative and accessible. */
(()=>{'use strict';
const hero=document.querySelector('.blog-hero');
if(!hero||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const cv=document.createElement('canvas');cv.className='hero-particles';cv.setAttribute('aria-hidden','true');hero.prepend(cv);
const ctx=cv.getContext('2d');if(!ctx)return;
let width=1,height=1,ratio=1,flames=[],embers=[],pointer={x:0,y:0,inside:false},last=0,raf=0;
const mobile=window.matchMedia('(max-width:700px)').matches;
function resize(){const r=hero.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);ratio=Math.min(devicePixelRatio||1,2);cv.width=Math.round(width*ratio);cv.height=Math.round(height*ratio);cv.style.width=width+'px';cv.style.height=height+'px';ctx.setTransform(ratio,0,0,ratio,0,0);}
function spawn(x,y,amount,strong){for(let i=0;i<amount&&flames.length<180;i++){const life=strong?38+Math.random()*28:35+Math.random()*28;flames.push({x:x+(Math.random()-.5)*25,y:y+(Math.random()-.5)*12,vx:(Math.random()-.5)*(strong?1.9:1.1),vy:-1.3-Math.random()*(strong?2.3:1.1),life,max:life,r:3+Math.random()*(strong?11:5),h:Math.random()*32});}}
function draw(t){raf=requestAnimationFrame(draw);if(document.hidden)return;let dt=Math.min((t-last)/16.67||1,2);last=t;const dark=document.documentElement.getAttribute('data-theme')==='dark';ctx.clearRect(0,0,width,height);
if(Math.random()<.55&&!mobile){spawn(Math.random()*width,height*(.55+Math.random()*.4),1,false);}
if(pointer.inside){spawn(pointer.x,pointer.y,3,true);}
ctx.globalCompositeOperation='lighter';
for(let i=flames.length-1;i>=0;i--){const p=flames[i];p.life-=dt;p.x+=p.vx*dt+Math.sin(p.life*.15)*.35;p.y+=p.vy*dt;p.vx*=.994;if(p.life<=0){flames.splice(i,1);continue;}const a=Math.pow(p.life/p.max,1.6)*(dark?.75:.48);const r=p.r*(.4+.65*p.life/p.max);const grad=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*2.8);grad.addColorStop(0,'rgba(255,245,187,'+a+')');grad.addColorStop(.25,'rgba(255,171,56,'+(a*.7)+')');grad.addColorStop(.65,'rgba(255,91,18,'+(a*.27)+')');grad.addColorStop(1,'rgba(255,60,10,0)');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(p.x,p.y,r*2.8,0,Math.PI*2);ctx.fill();}
ctx.globalCompositeOperation='source-over';}
hero.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const rect=hero.getBoundingClientRect();pointer.x=e.clientX-rect.left;pointer.y=e.clientY-rect.top;pointer.inside=true;},{passive:true});
hero.addEventListener('pointerleave',()=>{pointer.inside=false;},{passive:true});
if('ResizeObserver'in window)new ResizeObserver(resize).observe(hero);else addEventListener('resize',resize,{passive:true});
resize();raf=requestAnimationFrame(draw);
})();
