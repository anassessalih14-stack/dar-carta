import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.js';
test('real HTTP multiplayer: sessions, invites, ownership, matchmaking, leaving and private hands',async()=>{
  const {server}=createApp();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  async function call(route,token,body){const res=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{...(token?{Authorization:`Bearer ${token}`} :{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,data:await res.json()};}
  try{
    const tokens=[];for(let i=0;i<4;i++){const r=await call('/api/session',null,{name:`Player ${i}`});assert.equal(r.status,200);tokens.push(r.data.token);}
    assert.equal((await call('/api/me','wrong')).status,401);
    const made=await call('/api/rooms',tokens[0],{mode:'ronda',count:4});assert.equal(made.status,200);const code=made.data.code;
    assert.equal((await call('/api/start',tokens[0],{})).status,400);
    for(let i=1;i<4;i++)assert.equal((await call('/api/join',tokens[i],{code})).status,200);
    assert.equal((await call('/api/start',tokens[1],{})).status,403);
    const started=await call('/api/start',tokens[0],{});assert.equal(started.data.game.hand.length,3);assert.equal('hands' in started.data.game,false);
    const second=(await call('/api/me',tokens[1])).data.room;assert(second.game.hand.every(c=>!started.data.game.hand.some(x=>x.id===c.id)));
    assert.equal((await call('/api/play',tokens[1],{cardId:second.game.hand[0].id})).status,400);
    assert.equal((await call('/api/play',tokens[0],{cardId:second.game.hand[0].id})).status,400);
    assert.equal((await call('/api/play',tokens[0],{cardId:started.data.game.hand[0].id})).status,200);
    await call('/api/leave',tokens[1],{});const end=(await call('/api/me',tokens[0])).data.room;assert.equal(end.game.phase,'finished');assert.equal(end.game.winner,0);
    for(const token of tokens)await call('/api/leave',token,{});
    const a=(await call('/api/match',tokens[0],{mode:'brisca',count:2})).data;assert.equal(a.game,null);
    const b=(await call('/api/match',tokens[1],{mode:'ronda',count:2})).data;assert.notEqual(a.code,b.code);
    const c=(await call('/api/match',tokens[2],{mode:'brisca',count:2})).data;assert.equal(c.code,a.code);assert.equal(c.game.phase,'playing');
    const bad=await fetch(base+'/api/session',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{"name":"bad"}'});assert.equal(bad.status,403);
    assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/app.js')).status,200);assert.equal((await fetch(base+'/engine.js')).status,200);assert.equal((await fetch(base+'/style.css')).status,200);assert.equal((await fetch(base+'/server.js')).status,404);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
