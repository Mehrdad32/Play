import { beforeEach,afterEach,describe,expect,it,vi } from 'vitest';
import {createGame,execute} from './engine';
import {TERMINAL_SESSION_KEY,TERMINAL_STATS_KEY,emptyStats,loadTerminalGame,loadTerminalStats,parseGame,recordTerminalEscape,resumeOrStartTerminal,saveTerminalGame,startTerminalGame} from './storage';
const mem=new Map<string,string>();
beforeEach(()=>{mem.clear();vi.stubGlobal('localStorage',{getItem:(k:string)=>mem.get(k)??null,setItem:(k:string,v:string)=>{mem.set(k,v);}});});
afterEach(()=>vi.unstubAllGlobals());
describe('Terminal Escape namespaced persistence',()=>{
  it('restores current terminal and history on refresh',()=>{
    const old=execute(createGame(100),'cat access.log',200);
    saveTerminalGame(old);
    expect(loadTerminalGame()).toEqual(old);
    expect(resumeOrStartTerminal()).toEqual(old);
  });
  it('isolates its keys from merge settings',()=>{
    startTerminalGame(10);
    expect(mem.has(TERMINAL_SESSION_KEY)).toBe(true);
    expect(mem.has(TERMINAL_STATS_KEY)).toBe(true);
    expect([...mem.keys()].every(k=>k.includes('terminalEscape'))).toBe(true);
  });
  it('ignores corrupt or obsolete data and creates fresh session',()=>{
    mem.set(TERMINAL_SESSION_KEY,'not json');expect(loadTerminalGame()).toBeNull();
    mem.set(TERMINAL_SESSION_KEY,JSON.stringify({...createGame(3),version:2}));
    expect(loadTerminalGame()).toBeNull();
    expect(parseGame({stage:3,history:[]})).toBeNull();
    expect(resumeOrStartTerminal().stage).toBe(0);
  });
  it('increments game count only when a new run begins',()=>{
    startTerminalGame(1);resumeOrStartTerminal();expect(loadTerminalStats().games).toBe(1);
    startTerminalGame(3);expect(loadTerminalStats().games).toBe(2);
  });
  it('records earned completion without overwriting a better record',()=>{
    startTerminalGame(1);
    const done={...createGame(10),stage:5 as const,finishedAt:4010,score:2500,commands:13};
    recordTerminalEscape(done,4010);
    expect(loadTerminalStats().escapes).toBe(1);
    expect(loadTerminalStats().fastestSeconds).toBe(4);
    expect(loadTerminalStats().bestScore).toBe(2500);
    const worse={...done,score:1800,commands:23,finishedAt:10010};
    recordTerminalEscape(worse,10010);
    expect(loadTerminalStats().bestScore).toBe(2500);
    expect(loadTerminalStats().leastCommands).toBe(13);
  });
  it('tolerates localStorage being unavailable',()=>{
    vi.stubGlobal('localStorage',{getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}});
    expect(loadTerminalStats()).toEqual(emptyStats);
    expect(()=>saveTerminalGame(createGame(1))).not.toThrow();
  });
});
