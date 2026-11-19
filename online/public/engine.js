import {createBalote,playBalote,viewBalote,nextBalote,bidBalote,announceBalote,botBidBalote} from './balote.js';
// Pure rules shared by practice mode and the authoritative server. No UI or network dependencies.
export const ranks=[1,2,3,4,5,6,7,10,11,12];
export const suits=['coins','cups','swords','clubs'];
export const points=c=>({1:11,3:10,12:4,11:3,10:2}[c.rank]||0);
const strength=c=>[2,4,5,6,7,10,11,12,3,1].indexOf(c.rank);
export const team=seat=>seat%2;
export function deck(rng=Math.random){const d=suits.flatMap(suit=>ranks.map(rank=>({id:`${suit}-${rank}`,suit,rank})));for(let i=d.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}
function emit(s,type,data={}){s.eventSeq=(s.eventSeq||0)+1;s.events.push({id:s.eventSeq,type,...data});if(s.events.length>14)s.events.shift();}
function score(s,side,n,reason){s.scores[side]+=n;emit(s,'score',{side,n,reason});if(s.mode==='ronda'&&s.scores[side]>=41){s.phase='finished';s.winner=side;}}
function rondaAnnounce(s){const combos=[];for(let seat=0;seat<s.count;seat++){const hand=s.hands[seat];for(const rank of ranks){const n=hand.filter(c=>c.rank===rank).length;if(n>=2){combos.push({seat,rank,n,shown:0});emit(s,n===3?'tringa':'ronda',{seat});}}}s.combos=combos;if(combos.length===1)settleCombos(s);}
function settleCombos(s){if(!s.combos.length||s.phase==='finished')return;const combos=s.combos;const best=Math.max(...combos.map(c=>c.n*100+c.rank));const winners=combos.filter(c=>c.n*100+c.rank===best);const pot=combos.reduce((n,c)=>n+(c.n===3?5:1),0);for(const c of winners){score(s,team(c.seat),Math.floor(pot/winners.length),'combination');if(s.phase==='finished')break;}s.combos=[];}
function packet(s){s.packetSeq=(s.packetSeq||0)+1;for(let offset=1;offset<=s.count;offset++){const seat=(s.dealer+offset)%s.count;s.hands[seat]=s.stock.splice(-3);}s.turn=(s.dealer+1)%s.count;s.lastPlayed=null;s.chain=null;rondaAnnounce(s);}
function opening(s){let attempts=0;while(true){const table=s.stock.splice(-4);const ix=table.map(c=>ranks.indexOf(c.rank)).sort((a,b)=>a-b);if(new Set(ix).size===4&&ix[3]-ix[0]!==3){s.table=table;return;}s.stock.push(...table);for(let i=s.stock.length-1;i>0;i--){const j=Math.floor(s.rng()*(i+1));[s.stock[i],s.stock[j]]=[s.stock[j],s.stock[i]];}if(++attempts>1000)throw Error('Unable to make opening table');}}
function beginRound(s){s.stock=deck(s.rng);s.hands=Array.from({length:s.count},()=>[]);s.captured=[[],[]];s.table=[];s.trick=[];s.lastTrick=[];s.lastCapture=null;s.combos=[];s.chain=null;s.lastPlayed=null;s.phase='playing';s.round++;if(s.mode==='ronda'){packet(s);opening(s);}else{for(let i=0;i<3;i++)for(let offset=1;offset<=s.count;offset++)s.hands[(s.dealer+offset)%s.count].push(s.stock.pop());s.trump={...s.stock[0]};s.turn=(s.dealer+1)%s.count;}emit(s,'round',{round:s.round});}
export function createGame(mode='ronda',count=2,rng=Math.random,settings={}){if(mode==='balote'){if(![3,4].includes(count))throw Error('Balote requires three or four players');return createBalote(rng,settings,count);}if(!['ronda','brisca'].includes(mode)||![2,4].includes(count))throw Error('Invalid table settings');const s={mode,count,rng,scores:[0,0],dealer:count-1,round:0,events:[],winner:null,revision:0};beginRound(s);return s;}
function finishChain(s){if(!s.chain)return;const c=s.chain;s.captured[team(c.seat)].push(...c.cards);s.lastCapture=c.seat;score(s,team(c.seat),[0,1,5,10][c.length]+(c.missa?1:0),'capture-chain');s.chain=null;}
function rondaMove(s,seat,card){
  for(const c of s.combos)if(c.seat===seat&&c.rank===card.rank)c.shown++;
  if(s.chain&&!(s.count===4&&s.chain.rank===card.rank&&s.chain.length<3)){finishChain(s);if(s.phase==='finished')return;}
  const lastCard=s.stock.length===0&&s.hands.every(h=>h.length===0);
  if(s.chain){s.chain.cards.push(card);s.chain.seat=seat;s.chain.length++;emit(s,'hit',{seat,n:[0,1,5,10][s.chain.length]});if(s.chain.length===3)finishChain(s);}
  else{
    const match=s.table.some(c=>c.rank===card.rank);
    if(match){let max=ranks.indexOf(card.rank);while(max+1<ranks.length&&s.table.some(c=>c.rank===ranks[max+1]))max++;const take=s.table.filter(c=>{const i=ranks.indexOf(c.rank);return i>=ranks.indexOf(card.rank)&&i<=max;});s.table=s.table.filter(c=>!take.includes(c));const captured=[card,...take];const missa=s.table.length===0&&!lastCard;const hit=s.lastPlayed&&s.lastPlayed.rank===card.rank&&take.some(c=>c.id===s.lastPlayed.id);
      if(hit){s.chain={rank:card.rank,seat,length:1,cards:captured,missa};emit(s,'hit',{seat,n:1});if(s.count===2)finishChain(s);}
      else{s.captured[team(seat)].push(...captured);s.lastCapture=seat;if(missa)score(s,team(seat),1,'missa');}
      emit(s,'capture',{seat,n:captured.length});
    }else s.table.push(card);
  }
  s.lastPlayed=card;
  if(s.phase==='finished')return;
  if(s.combos.length&&s.combos.every(c=>c.shown>=c.n))settleCombos(s);
  if(s.phase==='finished')return;
  if(s.hands.every(h=>h.length===0)){
    finishChain(s);if(s.phase==='finished')return;settleCombos(s);if(s.phase==='finished')return;
    if(s.stock.length)packet(s);else{
      if(s.lastCapture!==null){s.captured[team(s.lastCapture)].push(...s.table);s.table=[];}
      for(let side=0;side<2;side++)if(s.captured[side].length>20){score(s,side,s.captured[side].length-20,'majority');if(s.phase==='finished')return;}
      s.phase='roundEnd';emit(s,'roundEnd');
    }
  }else s.turn=(seat+1)%s.count;
}
function briscaMove(s,seat,card){s.trick.push({seat,card});if(s.trick.length<s.count){s.turn=(seat+1)%s.count;return;}const lead=s.trick[0].card.suit;const weight=c=>(c.suit===s.trump.suit?200:c.suit===lead?100:0)+strength(c);const winner=s.trick.reduce((a,b)=>weight(b.card)>weight(a.card)?b:a);s.lastTrick=s.trick.slice();s.captured[team(winner.seat)].push(...s.trick.map(x=>x.card));const n=s.trick.reduce((n,x)=>n+points(x.card),0);score(s,team(winner.seat),n,'trick');emit(s,'trick',{seat:winner.seat,n});s.trick=[];for(let i=0;i<s.count;i++){const p=(winner.seat+i)%s.count;if(s.stock.length)s.hands[p].push(s.stock.pop());}s.turn=winner.seat;if(s.hands.every(h=>h.length===0)){s.phase='finished';s.winner=s.scores[0]===s.scores[1]?null:s.scores[0]>s.scores[1]?0:1;}}
export function play(s,seat,cardId){if(s.mode==='balote')return playBalote(s,seat,cardId);if(s.phase!=='playing')throw Error('Match is not playing');if(!Number.isInteger(seat)||seat!==s.turn)throw Error('Wait for your turn');const i=s.hands[seat].findIndex(c=>c.id===cardId);if(i<0)throw Error('Card is not in your hand');if(s.mode==='ronda'&&s.chain&&!(s.count===4&&s.chain.rank===s.hands[seat][i].rank&&s.chain.length<3)){finishChain(s);if(s.phase==='finished'){s.revision++;return s;}}const [card]=s.hands[seat].splice(i,1);emit(s,'played',{seat,card});if(s.mode==='ronda')rondaMove(s,seat,card);else briscaMove(s,seat,card);s.revision++;return s;}
export function nextRound(s){if(s.mode==='balote')return nextBalote(s);if(s.phase!=='roundEnd')throw Error('Round is not over');s.dealer=(s.dealer+1)%s.count;beginRound(s);s.revision++;}
export function view(s,seat){if(s.mode==='balote')return viewBalote(s,seat);return {packetSeq:s.packetSeq||s.round,mode:s.mode,count:s.count,scores:s.scores.slice(),round:s.round,phase:s.phase,winner:s.winner,turn:s.turn,dealer:s.dealer,hand:s.hands[seat].map(c=>({...c})),handCounts:s.hands.map(h=>h.length),table:s.table.map(c=>({...c})),trick:s.trick.map(x=>({...x,card:{...x.card}})),lastTrick:s.lastTrick.map(x=>({...x,card:{...x.card}})),trump:s.trump?{...s.trump}:null,stockCount:s.stock.length,capturedCounts:s.captured.map(c=>c.length),events:s.events.map(e=>({...e})),pendingHit:s.chain?{seat:s.chain.seat,n:[0,1,5,10][s.chain.length],missa:s.chain.missa}:null,revision:s.revision};}
// Practice AI deliberately uses only its own hand and public information.
export function botCard(v){if(v.mode==='balote'){const h=v.hand.filter(c=>v.legal.includes(c.id));return h.sort((a,b)=>({10:20,6:14,1:11,7:10,12:4,11:3}[a.rank]||0)-({10:20,6:14,1:11,7:10,12:4,11:3}[b.rank]||0))[0].id;}return v.hand.slice().sort((a,b)=>{if(v.mode==='ronda'){const val=c=>v.table.some(t=>t.rank===c.rank)?30-c.rank:-c.rank;return val(b)-val(a);}const val=c=>points(c)+(c.suit===v.trump.suit?15:0);return val(a)-val(b);})[0].id;}

export function bid(s,seat,choice){return bidBalote(s,seat,choice);}
export function announce(s,seat){return announceBalote(s,seat);}
export function botBid(s){return botBidBalote(s);}
