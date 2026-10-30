/* Particle network — responsive mouse interaction, decorative only */
(()=>{'use strict';
const hero=document.querySelector('.blog-hero');
if(!hero||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const canvas=document.createElement('canvas');canvas.className='hero-particles';canvas.setAttribute('aria-hidden','true');hero.prepend(canvas);
const ctx=canvas.getContext('2d');if(!ctx)return;
let w=0,h=0,dpr=1,particles=[],pointer={x:-9999,y:-9999,active:false},frame=0,running=true;
const reduced=matchMedia('(max-width: 700px)').matches;
function resize(){const rect=hero.getBoundingClientRect();w=rect.width;h=rect.height;dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);const count=Math.max(20,Math.min(reduced?35:80,Math.floor(w*h/13500)));particles=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.42,vy:(Math.random()-.5)*.42,r:Math.random()*1.7+1}));}
function draw(){if(!running)return;ctx.clearRect(0,0,w,h);const dark=document.documentElement.getAttribute('data-theme')==='dark';const rgb=dark?'222,190,118':'170,126,50';const range=dark?126:112;
for(const p of particles){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;
if(pointer.active){let dx=p.x-pointer.x,dy=p.y-pointer.y,dist=Math.hypot(dx,dy);if(dist<145&&dist>1){const force=(145-dist)/145;p.x+=dx/dist*force*1.35;p.y+=dy/dist*force*1.35;}}
}
for(let i=0;i<particles.length;i++){let a=particles[i];for(let j=i+1;j<particles.length;j++){let b=particles[j],distance=Math.hypot(a.x-b.x,a.y-b.y);if(distance<range){let glow=pointer.active&&Math.min(Math.hypot(a.x-pointer.x,a.y-pointer.y),Math.hypot(b.x-pointer.x,b.y-pointer.y))<155;ctx.strokeStyle='rgba('+rgb+','+(glow?.48:.15)*(1-distance/range)+')';ctx.lineWidth=glow?1.2:.65;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}}
for(const p of particles){let hover=pointer.active&&Math.hypot(p.x-pointer.x,p.y-pointer.y)<110;ctx.beginPath();ctx.arc(p.x,p.y,hover?p.r+1.5:p.r,0,Math.PI*2);ctx.fillStyle='rgba('+rgb+','+(hover?.95:.5)+')';ctx.fill();}
frame=requestAnimationFrame(draw)}
hero.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;let rect=hero.getBoundingClientRect();pointer.x=e.clientX-rect.left;pointer.y=e.clientY-rect.top;pointer.active=true},{passive:true});
hero.addEventListener('pointerleave',()=>{pointer.active=false},{passive:true});
if('ResizeObserver'in window)new ResizeObserver(resize).observe(hero);else addEventListener('resize',resize,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){running=false;cancelAnimationFrame(frame)}else if(!running){running=true;draw()}});
resize();draw();
})();
