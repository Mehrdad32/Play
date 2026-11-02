import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {start,submit} from './engine';
import {beginNew,emptyStats,loadSession,loadStats,parseState,record,restore,saveSession,sessionKey,statsKey} from './storage';
let items=new Map<string,string>();
beforeEach(()=>{items=new Map();vi.stubGlobal('localStorage',{getItem:(k:string)=>items.get(k)??null,setItem:(k:string,v:string)=>{items.set(k,v);}});});
afterEach(()=>vi.unstubAllGlobals());
describe('HEX Hunter persistence',()=>{
  it('saves state by mode with no collision with other games',()=>{
    const s=start('decode',100,()=>.5);
    saveSession(s);
    expect(loadSession('decode')).toEqual(s);
    expect(loadSession('odd')).toBeNull();
    expect([...items.keys()]).toEqual([sessionKey('decode')]);
  });
  it('rejects corrupt, obsolete, out-of-range or tampered session',()=>{
    items.set(sessionKey('decode'),'bad json');
    expect(loadSession('decode')).toBeNull();
    const s=start('decode',100,()=>.2);
    expect(parseState({...s,version:2},'decode')).toBeNull();
    expect(parseState({...s,round:55},'decode')).toBeNull();
    expect(parseState({...s,phase:'won'},'decode')).toBeNull();
    expect(parseState({...s,question:{kind:'decode',target:'#FFFFFF'}},'decode')?.question).toEqual(s.question);
  });
  it('resets daily session on UTC date change',()=>{
    const now=Date.UTC(2026,10,2);
    const s=beginNew('daily',now);
    expect(restore('daily',now+1234)?.seed).toBe(s.seed);
    expect(restore('daily',now+86400000)).toBeNull();
  });
  it('counts new sessions and tracks a win once',()=>{
    const s=beginNew('decode',0,()=>.2);
    expect(loadStats().byMode.decode.plays).toBe(1);
    if(s.question.kind!=='decode')throw Error('mode');
    const result=submit(s,s.question.answer,100);
    record(s,result);record(result,result);
    expect(loadStats().byMode.decode.bestScore).toBeGreaterThan(100);
    expect(loadStats().byMode.decode.plays).toBe(1);
  });
  it('stores M32 achievement and daily best score',()=>{
    const s=start('daily',Date.UTC(2026,10,2));
    const end={...s,phase:'won' as const,round:8,score:3000,unlocked32:true};
    record(s,end);
    expect(loadStats().earnedM32).toBe(true);
    expect(loadStats().daily['2026-11-02']).toBe(3000);
    expect(loadStats().byMode.daily.wins).toBe(1);
  });
  it('handles denied storage with graceful fallback',()=>{
    items.set(statsKey,'broken');
    expect(loadStats()).toEqual(emptyStats());
    vi.stubGlobal('localStorage',{getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');}});
    expect(loadSession('decode')).toBeNull();
    expect(()=>beginNew('decode')).not.toThrow();
  });
});
