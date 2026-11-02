import { describe, expect, it } from 'vitest';
import { advance, begin, cues, DAILY_ROUNDS, dayUTC, expected, guess, hashSeed, pattern, playbackDone, resume, rngFromSeed, start, type State } from './index';

const initial = (mode: State['mode'] = 'classic') => start(mode, Date.UTC(2026,10,2), () => .123);
function pass(state: State): State {
  const playing = playbackDone(begin(state,123),124);
  return expected(playing).reduce((s,c,i)=>guess(s,c,130+i).state,playing);
}
describe('Memory Bits engine', () => {
  it('creates a 4x4 pattern with two steps in round one', () => {
    const state=initial();expect(state.sequence).toHaveLength(2);
    expect(state.sequence.every(c=>Number.isInteger(c)&&c>=0&&c<16)).toBe(true);
    expect(state.phase).toBe('ready');
  });
  it('has deterministic seeded sequences with enough entropy',()=>{
    expect(pattern('classic',1234,8)).toEqual(pattern('classic',1234,8));
    expect(pattern('classic',1234,8)).not.toEqual(pattern('classic',1235,8));
    expect(rngFromSeed(5)()).toBe(rngFromSeed(5)());
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
  });
  it('daily is identical for all players on UTC date, changes on next day',()=>{
    const day=Date.UTC(2026,10,2,23,40);
    const first=start('daily',day,()=>0);
    expect(first.sequence).toEqual(start('daily',day,()=>.99).sequence);
    expect(first.day).toBe('2026-11-02');
    expect(start('daily',day+86400000).sequence).not.toEqual(first.sequence);
    expect(dayUTC(day+86400000)).toBe('2026-11-03');
  });
  it('blocks guesses before playback and never awards score early',()=>{
    const s=initial();
    expect(guess(s,s.sequence[0]).outcome).toBe('ignored');
    expect(playbackDone(s)).toBe(s);
    expect(begin(begin(s)).phase).toBe('showing');
  });
  it('correct order scores and advances with longer pattern',()=>{
    let s=pass(initial());
    expect(s.phase).toBe('between');
    expect(s.score).toBe(140);
    expect(s.combo).toBe(1);
    s=advance(s);
    expect(s.round).toBe(2);expect(s.sequence).toHaveLength(3);
    expect(s.phase).toBe('ready');
    expect(advance(s)).toBe(s);
  });
  it('wrong press ends run and shows expected cell without revealing it ahead of time',()=>{
    const s=playbackDone(begin(initial()));
    const wrong=(s.sequence[0]+1)%16;
    const result=guess(s,wrong,200);
    expect(result.outcome).toBe('wrong');
    expect(result.expectedCell).toBe(s.sequence[0]);
    expect(result.state.finishedAt).toBe(200);
    expect(result.state.score).toBe(0);
    expect(guess(result.state,0).outcome).toBe('ignored');
  });
  it('reverse changes answer order but not shown pattern',()=>{
    const s={...initial('reverse'),sequence:[3,4,5],phase:'input' as const};
    expect(expected(s)).toEqual([5,4,3]);
    expect(guess(s,3).outcome).toBe('wrong');
    expect(guess(s,5).outcome).toBe('correct');
  });
  it('glitch decoys are distinct from target and do not alter correct answer',()=>{
    const s={...initial('glitch'),round:8,sequence:pattern('glitch',55,8),seed:55};
    const shown=cues(s);
    expect(shown.filter(c=>c.kind==='target').map(c=>c.cell)).toEqual(s.sequence);
    expect(shown.length).toBeGreaterThanOrEqual(s.sequence.length);
    expect(expected(s)).toEqual(s.sequence);
    expect(cues(s)).toEqual(shown);
  });
  it('remembers input progress after refresh and restarts interrupted playback',()=>{
    const s=playbackDone(begin(initial()));
    const one=guess(s,s.sequence[0]).state;
    expect(resume(one).inputIndex).toBe(1);
    expect(resume(begin(initial())).phase).toBe('ready');
  });
  it('records a unique M32 achievement on finishing round 32',()=>{
    const s:State={...initial(),round:32,sequence:[1,2],phase:'input',inputIndex:0};
    const done=expected(s).reduce((v,c)=>guess(v,c).state,s);
    expect(done.unlocked32).toBe(true);expect(done.phase).toBe('between');
  });
  it('completes daily at exactly round eight',()=>{
    const s:State={...initial('daily'),round:DAILY_ROUNDS,sequence:[2,8],phase:'input'};
    const done=expected(s).reduce((v,c)=>guess(v,c,777).state,s);
    expect(done.phase).toBe('won');expect(done.finishedAt).toBe(777);
  });
  it('does not allow cheating via repeated press after stage completion',()=>{
    const s=pass(initial());
    expect(guess(s,0).outcome).toBe('ignored');
    expect(pass(initial()).score).toBe(s.score);
  });
});
