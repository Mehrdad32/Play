import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
import {begin,create,finishRush,press,reveal} from './engine';
import {emptyStats,key,loadStats,recordRun,startRun} from './storage';
const data=new Map<string,string>();
beforeEach(()=>{data.clear();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}});});
afterEach(()=>vi.unstubAllGlobals());
describe('Reaction 32 local records',()=>{
 it('namespaces records without modifying other M32 games',()=>{
  startRun('classic');
  expect([...data.keys()]).toEqual([key]);
  expect(loadStats().modes.classic.plays).toBe(1);
  expect(loadStats().modes.rush.plays).toBe(0);
 });
 it('records completed runs and best reaction values',()=>{
  startRun('classic');
  let game=create('classic');
  game=press(reveal(begin(game),'go'),230);
  const complete={...game,phase:'finished' as const};
  const stats=recordRun(complete,null);
  expect(stats.modes.classic.bestMedianMs).toBe(230);
  expect(stats.modes.classic.fastestMs).toBe(230);
  expect(stats.modes.classic.completions).toBe(1);
 });
 it('tracks 32 Rush achievement at 32 valid hits',()=>{
  const game={...finishRush(begin(create('rush'))),hits:[Array.from({length:32},()=>200),[]] as [number[],number[]]};
  expect(recordRun(game,null).earnedM32).toBe(true);
 });
 it('safely handles corrupted records',()=>{
  data.set(key,'not-json');expect(loadStats()).toEqual(emptyStats());
  data.set(key,JSON.stringify({modes:{classic:{plays:'invalid',bestScore:-1}}}));
  expect(loadStats().modes.classic.plays).toBe(0);
 });
 it('survives blocked localStorage without throwing',()=>{
  vi.stubGlobal('localStorage',{getItem:()=>{throw Error('privacy');},setItem:()=>{throw Error('privacy');}});
  expect(()=>startRun('duel')).not.toThrow();
  expect(loadStats()).toEqual(emptyStats());
 });
 it('tracks duel results separately',()=>{
  const game={...create('duel'),phase:'finished' as const};
  recordRun(game,0);
  expect(loadStats().duelWins).toEqual([1,0]);
  recordRun(game,null);
  expect(loadStats().duelTies).toBe(1);
 });
});
