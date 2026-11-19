import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMotionPlan} from '../public/table-motion.js';
const played=(seat,id)=>({type:'played',seat,card:{id,suit:id.split('-')[0],rank:Number(id.split('-')[1])}});
test('a completed trick includes the final played card before collection, in multiplayer event order',()=>{
  const plan=buildMotionPlan([{id:'coins-1'},{id:'clubs-7'},{id:'cups-4'}],[played(3,'swords-12'),{type:'trick',seat:1,n:15}],'balote');
  assert.equal(plan[0].type,'play');assert.equal(plan[1].seat,1);
  assert.deepEqual(plan[1].ids,['coins-1','clubs-7','cups-4','swords-12']);
});
test('Ronda animation collects only the contiguous matching sequence including 7 to 10',()=>{
  const plan=buildMotionPlan([{id:'coins-7'},{id:'cups-10'},{id:'clubs-11'},{id:'swords-4'}],[played(0,'swords-7'),{type:'capture',seat:0,n:4}],'ronda');
  assert.deepEqual(plan[1].ids,['coins-7','cups-10','clubs-11','swords-7']);
});
test('batched online tricks collect separately and only expose public played cards',()=>{
  const events=[played(0,'coins-1'),played(1,'cups-1'),{type:'trick',seat:0},played(0,'clubs-4'),played(1,'clubs-5'),{type:'trick',seat:1}];
  const plan=buildMotionPlan([],events,'brisca');
  assert.deepEqual(plan.filter(x=>x.type==='collect').map(x=>x.ids),[['coins-1','cups-1'],['clubs-4','clubs-5']]);
  assert.equal(plan.filter(x=>x.type==='play').length,4);
});
