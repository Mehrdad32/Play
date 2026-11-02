import {describe,it,expect} from 'vitest';
import {begin,chooseSignal,create,finishRush,median,next,press,reveal,avoidDecoy,scoreFor,totalAttempts,totalHits,waitMs,winner} from './index';
describe('Reaction 32 pure state machine',()=>{
 it('starts each mode ready with independent stats',()=>{
  for(const mode of ['classic','rush','precision','duel'] as const){
   const s=create(mode);expect(s.phase).toBe('ready');expect(s.attempts).toEqual([0,0]);
   expect(s.hits).toEqual([[],[]]);expect(s.started).toBe(false);
  }
 });
 it('random wait always covers 1200 to 3499 ms',()=>{
  expect(waitMs(0)).toBe(1200);expect(waitMs(.999999)).toBe(3499);
  expect(waitMs(1)).toBe(3499);
 });
 it('rejects interactions before ready or after result, counting exactly one press',()=>{
  let s=create('classic');expect(press(s,10)).toBe(s);
  s=begin(s);expect(s.phase).toBe('waiting');
  s=reveal(s,'go');s=press(s,205);
  expect(s.attempts).toEqual([1,0]);expect(s.hits[0]).toEqual([205]);
  expect(press(s,250)).toBe(s);expect(totalHits(s)).toBe(1);
 });
 it('counts early taps and precision decoy taps as false starts',()=>{
  let s=press(begin(create('precision')),null);
  expect(s.phase).toBe('result');expect(s.falseStarts).toEqual([1,0]);
  s=next(s);s=reveal(begin(s),'decoy');s=press(s,null);
  expect(s.falseStarts[0]).toBe(2);expect(s.attempts[0]).toBe(2);
 });
 it('decoy ignored safely, no attempt counted or lost',()=>{
  let s=begin(create('precision'));s=reveal(s,'decoy');
  const a=avoidDecoy(s);
  expect(a.phase).toBe('waiting');expect(totalAttempts(a)).toBe(0);
  expect(a.decoysAvoided).toBe(1);expect(a.trials[0].kind).toBe('decoy-avoided');
  expect(chooseSignal({...a,decoyChain:2},.01)).toBe('go');
  expect(reveal(a,'go').phase).toBe('go');
 });
 it('never allows decoys outside precision',()=>{
  const s=begin(create('classic'));expect(reveal(s,'decoy')).toBe(s);
  expect(chooseSignal(s,0)).toBe('go');
 });
 it('finishes classic after exactly five attempts',()=>{
  let s=create('classic');
  for(let i=0;i<5;i++){
   s=press(reveal(begin(s),'go'),170+i*20);
   if(i<4)s=next(s);
  }
  expect(s.phase).toBe('finished');expect(totalAttempts(s)).toBe(5);
  expect(s.hits[0]).toHaveLength(5);
 });
 it('precision finishes after ten signal attempts regardless of ignored decoys',()=>{
  let s=create('precision');
  for(let i=0;i<10;i++){
   s=press(reveal(begin(s),'go'),200);
   if(i<9)s=next(s);
  }
  expect(s.phase).toBe('finished');expect(s.attempts[0]).toBe(10);
 });
 it('duel alternates players and uses the median to choose winner',()=>{
  let s=create('duel');
  for(let i=0;i<10;i++){
   const ms=i%2===0?180:240;
   s=press(reveal(begin(s),'go'),ms);
   if(i<9)s=next(s);
  }
  expect(s.phase).toBe('finished');expect(s.attempts).toEqual([5,5]);
  expect(median(s.hits[0])).toBe(180);
  expect(median(s.hits[1])).toBe(240);
  expect(winner(s)).toBe(0);
 });
 it('duel tie and early starts determine winner correctly',()=>{
  expect(winner(create('duel'))).toBeNull();
  const s={...create('duel'),phase:'finished' as const,hits:[[200],[200]] as [number[],number[]],falseStarts:[1,0] as [number,number]};
  expect(winner(s)).toBe(1);
  expect(winner({...s,falseStarts:[1,1]})).toBeNull();
  expect(winner({...s,hits:[[],[300]]})).toBe(1);
 });
 it('rush has unbounded trials and ends on deadline',()=>{
  let s=begin(create('rush'));
  for(let i=0;i<35;i++){
   s=press(reveal(s,'go'),210);
   s=next(s);s=begin(s);
  }
  expect(totalHits(s)).toBe(35);
  const ended=finishRush(s);
  expect(ended.phase).toBe('finished');expect(press(ended,100)).toBe(ended);
  expect(finishRush(create('rush')).phase).toBe('ready');
 });
 it('penalizes false starts in rush and resets combo',()=>{
  let s=press(reveal(begin(create('rush')),'go'),180);
  s=press(begin(next(s)),null);
  expect(s.falseStarts[0]).toBe(1);expect(s.streak).toBe(0);
  expect(s.score).toBeGreaterThanOrEqual(0);
 });
 it('uses safe medians, finite reaction measurements and scoring',()=>{
  expect(median([])).toBeNull();
  expect(median([100,250,150])).toBe(150);
  expect(median([100,200])).toBe(150);
  expect(scoreFor(300)).toBeGreaterThan(scoreFor(600));
  const s=reveal(begin(create('classic')),'go');
  expect(press(s,-1)).toBe(s);expect(press(s,NaN)).toBe(s);
 });
});
