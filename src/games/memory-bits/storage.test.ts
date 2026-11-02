import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {begin,guess,playbackDone,start} from './engine';
import {emptyStats,key,loadSession,loadStats,parseState,recordResult,saveSession,startSession,STATS_KEY} from './storage';
const data=new Map<string,string>();
beforeEach(()=>{data.clear();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}});});
afterEach(()=>vi.unstubAllGlobals());
describe('Memory Bits isolated persistence',()=>{
  it('saves/resumes a partial answer without corrupting other games',()=>{
    const s=start('classic',22,()=>.1);
    const p=playbackDone(begin(s));
    const part=guess(p,p.sequence[0]).state;
    saveSession(part);
    expect(loadSession('classic')).toEqual(part);
    expect(loadSession('reverse')).toBeNull();
    expect([...data.keys()]).toEqual([key('classic')]);
  });
  it('invalid JSON, outdated versions and broken sequences are ignored',()=>{
    data.set(key('daily'),'{bad');
    expect(loadSession('daily')).toBeNull();
    expect(parseState({...start('classic'),sequence:[999]},'classic')).toBeNull();
    expect(parseState({...start('classic'),version:2},'classic')).toBeNull();
  });
  it('interrupted playback resumes ready to replay the pattern',()=>{
    const s=begin(start('glitch',100));
    saveSession(s);
    expect(loadSession('glitch')?.phase).toBe('ready');
  });
  it('counts starts only when a new game is explicitly created',()=>{
    startSession('reverse',100,()=>.2);
    loadSession('reverse');
    expect(loadStats().modes.reverse.plays).toBe(1);
    startSession('reverse',200,()=>.3);
    expect(loadStats().modes.reverse.plays).toBe(2);
  });
  it('records daily win and first M32 milestone only once',()=>{
    const s=start('daily',Date.UTC(2026,10,2));
    const completed={...s,unlocked32:true,phase:'won' as const,score:1120,bestCombo:8,round:8,finishedAt:1200};
    recordResult(completed,s);
    expect(loadStats().modes.daily.wins).toBe(1);
    expect(loadStats().daily['2026-11-02']).toBe(1120);
    expect(loadStats().unlocked32).toBe(true);
    recordResult(completed,completed);
    expect(loadStats().modes.daily.wins).toBe(1);
  });
  it('recovers malformed stats and storage denial',()=>{
    data.set(STATS_KEY,JSON.stringify({modes:{classic:{bestScore:'wrong'}},daily:{'2026-11-02':'bad'}}));
    expect(loadStats().modes.classic.bestScore).toBe(0);
    vi.stubGlobal('localStorage',{getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');}});
    expect(loadStats()).toEqual(emptyStats());
    expect(()=>startSession('classic',111)).not.toThrow();
  });
});
