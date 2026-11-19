import {createGame,play,nextRound,view,botCard,team,bid,announce,botBid} from '../public/engine.js';
const error=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const hex=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),x=>x.toString(16).padStart(2,'0')).join('');
const rng=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const empty=()=>({sessions:{},rooms:{}});
function apply(state,route,method,token,body,now){
  const {sessions,rooms}=state;
  for(const [code,r] of Object.entries(rooms))if(now-r.updated>6*3600000){for(const id of r.players)if(sessions[id])sessions[id].room=null;delete rooms[code];}
  for(const [id,p] of Object.entries(sessions))if(now-p.seen>24*3600000)delete sessions[id];
  const options=b=>{if(!['ronda','brisca','balote'].includes(b.mode)||!(b.mode==='balote'?[3,4]:[2,4]).includes(b.count))error('Invalid table settings');return {mode:b.mode,count:b.count,target:[250,500,1000].includes(b.target)?b.target:500,forceJack:b.forceJack===true};};
  const touch=r=>{r.updated=now;r.revision++;};
  const roomFor=p=>p.room?rooms[p.room]:null;
  const begin=r=>{r.game=createGame(r.mode,r.count,rng,{target:r.target,forceJack:r.forceJack});r.deadline=now+45000;touch(r);};
  function snapshot(p,r){const seat=r.players.indexOf(p.id);if(seat<0)error('You are not in this room',403);return {code:r.code,mode:r.mode,count:r.count,target:r.target,forceJack:r.forceJack,kind:r.kind,seat,host:r.host===p.id,players:r.players.map(id=>({name:sessions[id]?.name||'Player',online:!!sessions[id]&&now-sessions[id].seen<15000})),game:r.game?view(r.game,seat):null,revision:r.revision,deadline:r.deadline,serverTime:now,forfeit:r.forfeit};}
  if(route==='/api/session'&&method==='POST'){
    if(Object.keys(sessions).length>=128)error('The test server is full. Please try again later.',503);
    const name=String(body.name||'').trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,24);if(!name)error('Enter your nickname');
    const id=hex(32);sessions[id]={id,name,room:null,seen:now};return {token:id,name};
  }
  const p=sessions[token];if(!p)error('Session expired. Enter your nickname again.',401);p.seen=now;
  let r=roomFor(p);
  if(r?.game){r.game.rng=rng;if(['playing','bidding'].includes(r.game.phase)&&now>r.deadline){const seat=r.game.turn;const player=sessions[r.players[seat]];if(!player||now-player.seen>120000){r.game.phase='finished';r.game.winner=r.count===3?null:1-team(seat);r.forfeit=true;}else if(r.game.phase==='bidding')bid(r.game,seat,botBid(r.game));else play(r.game,seat,botCard(view(r.game,seat)));r.deadline=now+45000;touch(r);}}
  if(route==='/api/me'&&method==='GET')return {name:p.name,room:r?snapshot(p,r):null};
  function make(kind){if(r)error('Leave your current room first');if(Object.keys(rooms).length>=32)error('All test tables are busy. Please try later.',503);let code;do{code=hex(3).toUpperCase();}while(rooms[code]);r={...options(body),code,kind,host:p.id,players:[p.id],created:now,updated:now,revision:0,game:null,deadline:0,forfeit:false};rooms[code]=r;p.room=code;return snapshot(p,r);}
  function join(target){if(r)error('Leave your current room first');if(!target||target.game||target.players.length>=target.count)error('Room unavailable or full',404);r=target;r.players.push(p.id);p.room=r.code;touch(r);if(r.kind==='random'&&r.players.length===r.count)begin(r);return snapshot(p,r);}
  if(method!=='POST')error('Not found',404);
  if(route==='/api/rooms')return make('private');
  if(route==='/api/join')return join(rooms[String(body.code||'').trim().toUpperCase()]);
  if(route==='/api/match'){const o=options(body);const found=Object.values(rooms).find(r=>r.kind==='random'&&!r.game&&r.mode===o.mode&&r.count===o.count&&(o.mode!=='balote'||r.target===o.target&&r.forceJack===o.forceJack)&&r.players.length<r.count);return found?join(found):make('random');}
  if(route==='/api/leave'){
    if(r){if(r.game&&r.game.phase!=='finished'){r.game.phase='finished';r.game.winner=r.count===3?null:1-team(r.players.indexOf(p.id));r.forfeit=true;}if(!r.game){r.players=r.players.filter(id=>id!==p.id);if(!r.players.length)delete rooms[r.code];else r.host=r.players[0];}touch(r);p.room=null;}return {ok:true};
  }
  if(!r)error('No active room',404);
  if(route==='/api/start'){if(r.host!==p.id)error('Only the host can start',403);if(r.game||r.players.length!==r.count)error('Wait for every seat to fill');begin(r);return snapshot(p,r);}
  if(route==='/api/bid'){if(!r.game)error('Match has not started');bid(r.game,r.players.indexOf(p.id),body.choice);r.deadline=now+45000;touch(r);return snapshot(p,r);}
  if(route==='/api/announce'){if(!r.game)error('Match has not started');announce(r.game,r.players.indexOf(p.id));touch(r);return snapshot(p,r);}
  if(route==='/api/play'){if(!r.game)error('Match has not started');play(r.game,r.players.indexOf(p.id),body.cardId);r.deadline=now+45000;touch(r);return snapshot(p,r);}
  if(route==='/api/next'){if(r.host!==p.id)error('Only the host can deal',403);if(!r.game)error('No match');nextRound(r.game);r.deadline=now+45000;touch(r);return snapshot(p,r);}
  error('Not found',404);
}
const limits=new Map();
export async function apiFetch(request,env){
  const route=new URL(request.url).pathname;
  if(route==='/api/health')return reply({ok:true});
  if(!['GET','POST'].includes(request.method))return reply({error:'Method not allowed'},405);
  const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)return reply({error:'Origin not allowed'},403);
  const ip=request.headers.get('CF-Connecting-IP')||'test';const now=Date.now();let b=limits.get(ip);if(!b||now-b.at>60000){b={at:now,n:0};limits.set(ip,b);}if(++b.n>300)return reply({error:'Too many requests. Please wait.'},429);if(limits.size>1000)for(const [k,v]of limits)if(now-v.at>60000)limits.delete(k);
  let body={};try{if(request.method==='POST'){const raw=await request.text();if(raw.length>4096)return reply({error:'Request too large'},413);body=JSON.parse(raw||'{}');if(!body||Array.isArray(body)||typeof body!=='object')return reply({error:'Invalid request'},400);}}catch{return reply({error:'Invalid JSON'},400);}
  const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');
  try{
    if(!env.DB)return reply({error:'Room storage is not ready'},503);
    for(let attempt=0;attempt<8;attempt++){
      const row=await env.DB.prepare('SELECT version, payload FROM friend_tables_state WHERE id = 1').first();
      if(!row){await env.DB.prepare('INSERT OR IGNORE INTO friend_tables_state (id, version, payload) VALUES (1, 0, ?)').bind(JSON.stringify(empty())).run();continue;}
      const state=JSON.parse(row.payload);let result;
      try{result=apply(state,route,request.method,token,body,now);}catch(err){return reply({error:err.message},err.status||400);}
      const saved=await env.DB.prepare('UPDATE friend_tables_state SET payload = ?, version = version + 1 WHERE id = 1 AND version = ?').bind(JSON.stringify(state),row.version).run();
      if(saved.meta.changes===1)return reply(result);
    }
    return reply({error:'The table is busy. Try again.'},409);
  }catch{return reply({error:'Room service is temporarily unavailable. Please retry.'},503);}
}
