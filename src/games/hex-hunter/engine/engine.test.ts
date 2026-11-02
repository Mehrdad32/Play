import {describe,expect,it} from 'vitest';
import {createQuestion,dayUTC,distance,MAX_ROUNDS,next,start,submit,toHex,toRgb,type State} from './index';
const seed=123456789;
describe('HEX Hunter engine',()=>{
  it('converts colors with 0/255 bounds and rejects unsafe hex',()=>{
    expect(toHex([0,32,255])).toBe('#0020FF');
    expect(toRgb('#fF00b4')).toEqual([255,0,180]);
    expect(toHex(toRgb('#54d3b2'))).toBe('#54D3B2');
    expect(()=>toRgb('red')).toThrow();
    expect(distance([0,0,0],[3,4,0])).toBe(5);
  });
  it('produces deterministic unique decode answers',()=>{
    for(let r=1;r<=MAX_ROUNDS;r++){
      const a=createQuestion('decode',seed,r);
      expect(a).toEqual(createQuestion('decode',seed,r));
      expect(a.kind).toBe('decode');
      if(a.kind!=='decode')continue;
      expect(a.options).toHaveLength(4);
      expect(new Set(a.options).size).toBe(4);
      expect(a.options[a.answer]).toBe(a.target);
      expect(a.options.every(x=>/^#[A-F0-9]{6}$/.test(x))).toBe(true);
    }
  });
  it('odd grids grow from 3x3 to 4x4 to 5x5 and exactly one differs',()=>{
    for(const [r,count] of [[1,9],[5,16],[14,25]]){
      const q=createQuestion('odd',seed,r);
      expect(q.kind).toBe('odd');
      if(q.kind==='odd'){expect(q.count).toBe(count);expect(q.answer).toBeLessThan(count);expect(q.base).not.toBe(q.different);}
    }
  });
  it('mix distance and tolerance affect submitted score',()=>{
    const s=start('mix',0,()=>.25);
    const target=toRgb(s.question.kind==='mix'?s.question.target:'#000000');
    const done=submit(s,target,100);
    expect(done.phase).toBe('feedback');expect(done.score).toBeGreaterThan(100);
    expect(done.streak).toBe(1);
    const far=submit(s,[0,0,0],100);
    if(s.question.kind==='mix'&&distance([0,0,0],toRgb(s.question.target))>s.question.tolerance)expect(far.lives).toBe(2);
  });
  it('wrong decode answer consumes one life; correct does not',()=>{
    const s=start('decode',100,()=>.5);
    if(s.question.kind!=='decode')throw Error('unexpected question');
    const wrong=(s.question.answer+1)%4;
    const a=submit(s,wrong,110);
    expect(a.lives).toBe(2);expect(a.score).toBe(0);expect(a.phase).toBe('feedback');
    expect(submit(a,s.question.answer)).toBe(a);
    const b=next(a);
    expect(b.round).toBe(2);expect(b.feedback).toBeNull();
    expect(submit(b,-1)).toBe(b);
  });
  it('three mistakes end run; no further input or advance',()=>{
    let s=start('decode',0,()=>.2);
    for(let n=0;n<3;n++){
      if(s.question.kind!=='decode')throw Error('unexpected question');
      s=submit(s,(s.question.answer+1)%4,100+n);
      if(n<2)s=next(s,200+n);
    }
    expect(s.phase).toBe('lost');expect(s.lives).toBe(0);
    expect(s.finishedAt).toBe(102);expect(next(s)).toBe(s);expect(submit(s,0)).toBe(s);
  });
  it('correct answers increase score and the streak across rounds',()=>{
    let s=start('odd',0,()=>.12);
    if(s.question.kind!=='odd')throw Error('odd expected');
    s=submit(s,s.question.answer,100);
    expect(s.streak).toBe(1);
    s=next(s);
    if(s.question.kind!=='odd')throw Error('odd expected');
    s=submit(s,s.question.answer,150);
    expect(s.bestStreak).toBe(2);expect(s.correctCount).toBe(2);
  });
  it('daily puzzle is shared per UTC calendar day and rotates categories',()=>{
    const now=Date.UTC(2026,10,2,23,45);
    const a=start('daily',now,()=>0);
    expect(a.question).toEqual(start('daily',now,()=>.9).question);
    expect(dayUTC(now+86400000)).toBe('2026-11-03');
    expect(start('daily',now+86400000).question).not.toEqual(a.question);
    expect([1,2,3,4,5,6].map(r=>createQuestion('daily',a.seed,r).kind))
      .toEqual(['decode','odd','mix','decode','odd','mix']);
  });
  it('win occurs at the last daily round and round 32 unlocks M32',()=>{
    const daily=start('daily',Date.UTC(2026,10,2));
    const q=createQuestion('daily',daily.seed,8);
    const s:State={...daily,round:8,question:q,phase:'question'};
    const input=q.kind==='decode'?q.answer:q.kind==='odd'?q.answer:toRgb(q.target);
    expect(submit(s,input,600).phase).toBe('won');
    const arcade=start('decode',0,()=>.5);
    const q32=createQuestion('decode',arcade.seed,32);
    if(q32.kind!=='decode')throw Error('unexpected');
    const end=submit({...arcade,round:32,question:q32},q32.answer);
    expect(end.unlocked32).toBe(true);expect(end.phase).toBe('won');
  });
  it('ignores invalid choice and does not skip a feedback stage',()=>{
    const s=start('decode',0,()=>.1);
    expect(submit(s,[1,2,3])).toBe(s);
    expect(submit(s,99)).toBe(s);
    expect(next(s)).toBe(s);
  });
});
