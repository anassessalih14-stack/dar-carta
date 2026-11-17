import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomBytes,randomInt} from 'node:crypto';
import {createGame,play,nextRound,view,botCard,team} from './public/engine.js';

const publicDir=path.resolve(fileURLToPath(new URL('./public/',import.meta.url)));
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
export function createApp({origins=[],now=Date.now}={}){
  const sessions=new Map(),rooms=new Map(),buckets=new Map();
  const rng=()=>randomInt(0,0x100000000)/0x100000000;
  const touch=r=>{r.updated=now();r.revision++;};
  function options(b){if(!['ronda','brisca'].includes(b.mode)||![2,4].includes(b.count))fail('Invalid table settings');return {mode:b.mode,count:b.count};}
  function start(r){r.game=createGame(r.mode,r.count,rng);r.deadline=now()+45000;touch(r);}
  function roomFor(p){return p.room?rooms.get(p.room):null;}
  function leave(p){const r=roomFor(p);if(!r)return;p.room=null;if(r.game&&r.game.phase!=='finished'){r.game.phase='finished';r.game.winner=1-team(r.players.indexOf(p.id));r.forfeit=true;}if(!r.game){r.players=r.players.filter(id=>id!==p.id);if(!r.players.length)rooms.delete(r.code);else r.host=r.players[0];}touch(r);}
  function make(p,b,kind){if(roomFor(p))fail('Leave your current room first');if(rooms.size>=2000)fail('Server is full',503);let code;do{code=randomBytes(4).toString('hex').slice(0,6).toUpperCase();}while(rooms.has(code));const r={...options(b),code,kind,host:p.id,players:[p.id],created:now(),updated:now(),revision:0,game:null,deadline:0,forfeit:false};rooms.set(code,r);p.room=code;return r;}
  function join(p,r){if(roomFor(p))fail('Leave your current room first');if(!r||r.game||r.players.length>=r.count)fail('Room unavailable or full',404);r.players.push(p.id);p.room=r.code;touch(r);if(r.kind==='random'&&r.players.length===r.count)start(r);return r;}
  function snapshot(p,r){const seat=r.players.indexOf(p.id);if(seat<0)fail('You are not in this room',403);return {code:r.code,mode:r.mode,count:r.count,kind:r.kind,seat,host:r.host===p.id,players:r.players.map(id=>{const x=sessions.get(id);return {name:x?.name||'Player',online:!!x&&now()-x.seen<12000};}),game:r.game?view(r.game,seat):null,revision:r.revision,deadline:r.deadline,serverTime:now(),forfeit:r.forfeit};}
  async function handler(req,res){
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    const origin=req.headers.origin;const sameHost=[`http://${req.headers.host}`,`https://${req.headers.host}`];
    if(origin){if(!sameHost.includes(origin)&&!origins.includes(origin)){res.writeHead(403);res.end('Origin not allowed');return;}res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');}
    if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
    let url;try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400);res.end();return;}
    if(!url.pathname.startsWith('/api/')){
      if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
      try{const name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).replace(/^\/+/, '');const f=path.resolve(publicDir,name);if(!f.startsWith(publicDir+path.sep)&&f!==path.join(publicDir,'index.html'))fail('Not found',404);const data=await readFile(f);const ext=path.extname(f);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'}[ext]||'application/octet-stream'));res.setHeader('Cache-Control','no-cache');res.writeHead(200);res.end(req.method==='HEAD'?undefined:data);}catch{res.writeHead(404);res.end('Not found');}return;
    }
    res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
    const send=(obj,status=200)=>{res.writeHead(status);res.end(JSON.stringify(obj));};
    try{
      const ip=req.socket.remoteAddress;let bucket=buckets.get(ip);if(!bucket||now()-bucket.at>60000){bucket={at:now(),n:0};buckets.set(ip,bucket);}if(++bucket.n>600)fail('Too many requests; try again shortly',429);
      let body={};if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)fail('Request too large',413);}try{body=JSON.parse(raw||'{}');}catch{fail('Invalid JSON');}}
      if(url.pathname==='/api/health'&&req.method==='GET'){send({ok:true});return;}
      if(url.pathname==='/api/session'&&req.method==='POST'){if(sessions.size>=10000)fail('Server is full',503);const name=String(body.name||'').trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,24);if(!name)fail('Enter your nickname');const id=randomBytes(32).toString('hex');sessions.set(id,{id,name,room:null,seen:now()});send({token:id,name});return;}
      const p=sessions.get((req.headers.authorization||'').replace(/^Bearer /,''));if(!p)fail('Session expired. Connect again.',401);p.seen=now();
      if(url.pathname==='/api/me'&&req.method==='GET'){const r=roomFor(p);send({name:p.name,room:r?snapshot(p,r):null});return;}
      if(url.pathname==='/api/rooms'&&req.method==='POST'){send(snapshot(p,make(p,body,'private')));return;}
      if(url.pathname==='/api/join'&&req.method==='POST'){send(snapshot(p,join(p,rooms.get(String(body.code||'').trim().toUpperCase()))));return;}
      if(url.pathname==='/api/match'&&req.method==='POST'){const o=options(body);if(roomFor(p))fail('Leave your current room first');const found=[...rooms.values()].find(r=>r.kind==='random'&&!r.game&&r.mode===o.mode&&r.count===o.count&&r.players.length<r.count);send(snapshot(p,found?join(p,found):make(p,body,'random')));return;}
      if(url.pathname==='/api/leave'&&req.method==='POST'){leave(p);send({ok:true});return;}
      const r=roomFor(p);if(!r)fail('No active room',404);
      if(url.pathname==='/api/start'&&req.method==='POST'){if(r.host!==p.id)fail('Only the host can start',403);if(r.game||r.players.length!==r.count)fail('Wait for every seat to fill');start(r);send(snapshot(p,r));return;}
      if(url.pathname==='/api/play'&&req.method==='POST'){if(!r.game)fail('Match has not started');play(r.game,r.players.indexOf(p.id),body.cardId);r.deadline=now()+45000;touch(r);send(snapshot(p,r));return;}
      if(url.pathname==='/api/next'&&req.method==='POST'){if(r.host!==p.id)fail('Only the host can deal',403);if(!r.game)fail('No match');nextRound(r.game);r.deadline=now()+45000;touch(r);send(snapshot(p,r));return;}
      fail('Not found',404);
    }catch(err){send({error:err.message||'Server error'},err.status||400);}
  }
  const server=http.createServer(handler);server.requestTimeout=15000;server.headersTimeout=10000;
  const timer=setInterval(()=>{
    for(const r of rooms.values()){
      if(now()-r.updated>6*3600000){for(const id of r.players){const p=sessions.get(id);if(p)p.room=null;}rooms.delete(r.code);continue;}
      if(r.game?.phase==='playing'&&now()>r.deadline){const seat=r.game.turn;const p=sessions.get(r.players[seat]);if(!p||now()-p.seen>120000){r.game.phase='finished';r.game.winner=1-team(seat);r.forfeit=true;}else play(r.game,seat,botCard(view(r.game,seat)));r.deadline=now()+45000;touch(r);}
    }
    for(const [id,p] of sessions)if(now()-p.seen>24*3600000){leave(p);sessions.delete(id);}
    for(const [ip,b] of buckets)if(now()-b.at>60000)buckets.delete(ip);
  },1000);timer.unref();server.on('close',()=>clearInterval(timer));return {server,rooms,sessions};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||3000);const origins=(process.env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);const {server}=createApp({origins});server.listen(port,'0.0.0.0',()=>console.log(`Dar Carta is ready at http://localhost:${port}`));
}
