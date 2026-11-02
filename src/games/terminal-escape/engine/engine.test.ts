import { describe, expect, it } from 'vitest';
import { computeScore, createGame, durationSeconds, execute, STAGES } from './index';
function run(commands: string[], start = createGame(1000)) {
  return commands.reduce((state, command, i) => execute(state, command, 2000+i*1000), start);
}
const path = [
  'cat access.log','unlock m32',
  'cd cache','cat trace.log','cd ..','decrypt echo-7',
  'scan','ping 10.0.0.32','connect 10.0.0.32 4321',
  'cat core.cfg','override 032',
  'status','launch m32'
];
describe('Terminal Escape pure engine', () => {
  it('starts at stage 0 and describes five playable layers', () => {
    expect(createGame(123).stage).toBe(0);
    expect(STAGES).toHaveLength(5);
    expect(createGame(123).startedAt).toBe(123);
  });
  it('prevents skipping credential discovery', () => {
    const state=execute(createGame(0),'unlock m32');
    expect(state.stage).toBe(0);expect(state.mistakes).toBe(1);
  });
  it('clears access layer only after reading log', () => {
    const game=run(['ls','cat access.log','unlock m32']);
    expect(game.stage).toBe(1);expect(game.found).toContain('access-log');
  });
  it('tracks filesystem navigation and requires root to decrypt', () => {
    const prefix=run(path.slice(0,4));
    expect(prefix.cwd).toBe('/cache');
    expect(execute(prefix,'decrypt echo-7').stage).toBe(1);
    expect(run(['cd ..','decrypt echo-7'],prefix).stage).toBe(2);
  });
  it('requires a scan and ping before network connection', () => {
    const atNetwork=run(path.slice(0,6));
    expect(execute(atNetwork,'connect 10.0.0.32 4321').stage).toBe(2);
    expect(run(path.slice(6,9),atNetwork).stage).toBe(3);
  });
  it('requires core config to be inspected before override', () => {
    const core=run(path.slice(0,9));
    expect(execute(core,'override 032').stage).toBe(3);
    expect(run(path.slice(9,11),core).stage).toBe(4);
  });
  it('requires final status before launch',()=>{
    const final=run(path.slice(0,11));
    expect(execute(final,'launch m32').stage).toBe(4);
    expect(run(path.slice(11),final).stage).toBe(5);
  });
  it('wins all five layers with real completion timestamp and score',()=>{
    const result=run(path);
    expect(result.stage).toBe(5);
    expect(result.finishedAt).not.toBeNull();
    expect(result.score).toBe(computeScore(result));
    expect(durationSeconds(result,300_000)).toBe(13);
    expect(execute(result,'ls')).toBe(result);
  });
  it('normalizes input without evaluating arbitrary shell commands',()=>{
    const a=execute(createGame(0),'  CAT     ACCESS.LOG  ');
    expect(a.found).toContain('access-log');
    const b=execute(a,'rm -rf /');
    expect(b.mistakes).toBe(1);
    expect(b.stage).toBe(0);
  });
  it('tracks hint penalty and secret bonus exactly once',()=>{
    let a=run(['hint','m32','m32']);
    expect(a.hintsUsed).toBe(1);expect(a.easterEgg).toBe(true);
    a=run(path,a);
    const regular=run(path);
    expect(a.score).toBeLessThan(regular.score);
    expect(a.score).toBe(computeScore(a));
  });
  it('clear removes transcript but preserves stage and discoveries',()=>{
    const a=run(['cat access.log','clear']);
    expect(a.history).toHaveLength(0);
    expect(a.found).toContain('access-log');
    expect(a.commands).toBe(2);
  });
  it('allows help, inventory, map and exposes output both languages',()=>{
    const a=run(['help','inventory','map']);
    expect(a.mistakes).toBe(0);
    expect(a.history[0].lines[0].fa).toContain('دستورهای');
    expect(a.history[0].lines[0].en).toContain('Global');
  });
  it('rejects missing or invalid commands with no stage advance',()=>{
    const a=createGame(0);
    expect(execute(a,'  ')).toBe(a);
    expect(execute(a,'cat nonexistent').stage).toBe(0);
  });
});
