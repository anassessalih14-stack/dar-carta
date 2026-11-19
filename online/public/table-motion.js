// Presentation only. Never changes game state or reads an opponent's hand.
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const relative=(r,area)=>({x:r.left-area.left,y:r.top-area.top,w:r.width,h:r.height});
export function captureScene(){
  const stage=document.querySelector('.table-stage');if(!stage)return null;
  const area=stage.getBoundingClientRect(),cards=selector=>Array.from(stage.querySelectorAll(selector)).map(el=>({id:el.querySelector('img')?.getAttribute('src')?.match(/([^/]+)\.png/)?.[1],html:el.outerHTML,...relative(el.getBoundingClientRect(),area)}));
  return {cards:cards('.table-centre .card'),hand:cards('.hand-fan .card')};
}
export function buildMotionPlan(previous,events,mode){
  let visible=previous.map(c=>c.id);const steps=[];
  for(const e of events){
    if(e.type==='played'){visible.push(e.card.id);steps.push({type:'play',seat:e.seat,card:e.card});}
    if(e.type==='trick'){steps.push({type:'collect',seat:e.seat,ids:visible.slice()});visible=[];}
    if(e.type==='capture'&&mode==='ronda'){
      const played=[...steps].reverse().find(x=>x.type==='play');if(!played)continue;
      const ranks=[1,2,3,4,5,6,7,10,11,12];let high=ranks.indexOf(played.card.rank);
      while(high+1<ranks.length&&visible.some(id=>Number(id.split('-').at(-1))===ranks[high+1]))high++;
      const ids=visible.filter(id=>{const i=ranks.indexOf(Number(id.split('-').at(-1)));return i>=ranks.indexOf(played.card.rank)&&i<=high;});
      steps.push({type:'collect',seat:e.seat,ids});visible=visible.filter(id=>!ids.includes(id));
    }
  }
  return steps;
}
function context(){const stage=document.querySelector('.table-stage'),host=document.querySelector('#effects');if(!stage||!host)return null;const area=stage.getBoundingClientRect();return {stage,host,area,seat:n=>{const r=stage.querySelector(`[data-seat="${n}"] .portrait`)?.getBoundingClientRect();return r?{x:r.left+r.width/2-area.left,y:r.top+r.height/2-area.top}:{x:area.width/2,y:area.height/2};}};}
function ghost(ctx,html,r){const el=document.createElement('span');el.className='motion-card';el.innerHTML=html;Object.assign(el.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});ctx.host.append(el);return el;}
async function animate(el,frames,options){if(!el.isConnected)return;try{await el.animate(frames,{fill:'forwards',easing:'cubic-bezier(.2,.72,.28,1)',...options}).finished;}catch{/* A navigation or reduced-motion change can cancel a scene. */}}
function reveal(ctx){if(!ctx.stage.isConnected)return;ctx.stage.classList.remove('motion-active','dealing-active');ctx.stage.querySelectorAll('[data-motion-hidden]').forEach(el=>{el.style.visibility='';delete el.dataset.motionHidden;});ctx.host.replaceChildren();}
function hide(el){el.style.visibility='hidden';el.dataset.motionHidden='true';}
export async function playTableMotion(s,scene,events,{me,card}){
  const ctx=context();if(!ctx||!scene)return;const steps=buildMotionPlan(scene.cards,events,s.mode);if(!steps.length)return;
  ctx.stage.classList.add('motion-active');hide(ctx.stage.querySelector('.table-centre'));
  const handIds=new Set(scene.hand.map(c=>c.id));ctx.stage.querySelectorAll('.hand-fan .card').forEach(el=>{const id=el.querySelector('img')?.getAttribute('src')?.match(/([^/]+)\.png/)?.[1];if(!handIds.has(id))hide(el);});
  const visible=new Map(scene.cards.map(c=>[c.id,{...c,el:ghost(ctx,c.html,c)}]));
  try{
    for(const step of steps){
      if(!ctx.stage.isConnected)break;
      if(step.type==='play'){
        const old=step.seat===me?scene.hand.find(c=>c.id===step.card.id):null,origin=ctx.seat(step.seat);
        const target=Array.from(ctx.stage.querySelectorAll('.table-centre .card')).find(el=>el.querySelector('img')?.getAttribute('src')?.includes('/'+step.card.id+'.png'));
        const width=ctx.area.width<520?55:76,height=width*319/208;
        const rel=(step.seat-me+s.count)%s.count,offset=s.count===3?[{x:0,y:24},{x:35,y:-12},{x:-35,y:-12}][rel]:s.count===2?(rel?{x:0,y:-24}:{x:0,y:24}):[{x:0,y:24},{x:35,y:0},{x:0,y:-25},{x:-35,y:0}][rel];
        const dest=target?relative(target.getBoundingClientRect(),ctx.area):{x:ctx.area.width/2-width/2+offset.x,y:ctx.area.height*.43-height/2+offset.y,w:width,h:height};
        const start=old||{x:origin.x-width/2,y:origin.y-height/2,w:width,h:height};
        const el=ghost(ctx,card(step.card),dest),dx=start.x-dest.x,dy=start.y-dest.y;
        await animate(el,[{transform:`translate(${dx}px,${dy}px) rotate(${rel===1?-24:rel===3?24:8}deg) scale(.85)`,opacity:.9},{transform:'translate(0,0) rotate(0) scale(1)',opacity:1}],{duration:390});
        visible.set(step.card.id,{...dest,id:step.card.id,el});
        await wait(100);
      }else{
        await wait(470);const dest=ctx.seat(step.seat),collected=step.ids.map(id=>visible.get(id)).filter(Boolean);
        await Promise.all(collected.map((c,i)=>animate(c.el,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${ctx.area.width/2-c.x-c.w/2}px,${ctx.area.height*.43-c.y-c.h/2}px) rotate(${i*3-4}deg)`,opacity:1,offset:.3},{transform:`translate(${dest.x-c.x-c.w/2}px,${dest.y-c.y-c.h/2}px) rotate(${i*2}deg) scale(.3)`,opacity:0}],{duration:560,delay:i*24})));
        for(const c of collected){c.el.remove();visible.delete(c.id);}
        const portrait=ctx.stage.querySelector(`[data-seat="${step.seat}"] .portrait`);if(portrait)animate(portrait,[{boxShadow:'0 0 0 0 #efcb70'},{boxShadow:'0 0 0 15px #efcb7000'}],{duration:600});
      }
    }
  }finally{reveal(ctx);}
}
export async function dealTableMotion(s,previous,{me,back,card,shuffle}){
  const ctx=context();if(!ctx)return;ctx.stage.classList.add('motion-active','dealing-active');
  const deck=ctx.stage.querySelector('.stock-deck .card'),dr=relative(deck.getBoundingClientRect(),ctx.area),jobs=[];
  const label=document.createElement('span');label.className='deal-caption';label.textContent=shuffle.shuffleText;ctx.host.append(label);
  for(let offset=1;offset<=s.count;offset++){
    const seat=(s.dealer+offset)%s.count,amount=Math.max(0,s.handCounts[seat]-(previous?.[seat]||0));
    const slots=seat===me?Array.from(ctx.stage.querySelectorAll('.hand-fan .card')):Array.from(ctx.stage.querySelectorAll(`[data-seat="${seat}"] .hidden-hand .card`));
    slots.slice(slots.length-amount).forEach((el,i)=>{const r=relative(el.getBoundingClientRect(),ctx.area);hide(el);jobs.push({seat,i,r,el,html:seat===me?card(s.hand[s.hand.length-amount+i]):back()});});
  }
  if(shuffle.full&&s.mode==='ronda')ctx.stage.querySelectorAll('.table-centre .card').forEach((el,i)=>{const r=relative(el.getBoundingClientRect(),ctx.area);hide(el);jobs.push({seat:-1,i:8+i,r,el,html:el.outerHTML});});
  jobs.sort((a,b)=>a.i-b.i);
  try{if(shuffle.full){const cuts=Array.from({length:3},(_,i)=>ghost(ctx,back(),dr));await Promise.all(cuts.map((el,i)=>animate(el,[{transform:`translate(${i*2}px,${-i*2}px)`},{transform:`translate(${i%2?55:-40}px,-25px) rotate(${i%2?12:-12}deg)`,offset:.45},{transform:'translate(0,0)'}],{duration:600,delay:i*65})));cuts.forEach(el=>el.remove());}label.textContent=shuffle.dealingText;await Promise.all(jobs.map(async(job,index)=>{
    const el=ghost(ctx,back(),{...dr,w:job.r.w,h:job.r.h});
    await animate(el,[{transform:'translate(0,0) scale(.6)',opacity:0},{opacity:1,offset:.08},{transform:`translate(${job.r.x-dr.x}px,${job.r.y-dr.y}px) scale(1)`,opacity:1}],{duration:390,delay:index*85});
    if(job.seat===me||job.seat===-1){await animate(el,[{transform:`translate(${job.r.x-dr.x}px,${job.r.y-dr.y}px) scaleX(1)`},{transform:`translate(${job.r.x-dr.x}px,${job.r.y-dr.y}px) scaleX(0)`}],{duration:90});el.innerHTML=job.html;await animate(el,[{transform:`translate(${job.r.x-dr.x}px,${job.r.y-dr.y}px) scaleX(0)`},{transform:`translate(${job.r.x-dr.x}px,${job.r.y-dr.y}px) scaleX(1)`}],{duration:90});}
    job.el.style.visibility='';delete job.el.dataset.motionHidden;el.remove();
  }));}finally{reveal(ctx);}
}
