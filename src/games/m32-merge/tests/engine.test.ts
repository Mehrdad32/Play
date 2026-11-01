import { describe, it, expect } from 'vitest';
import { canMove, continueGame, emptyBoard, move, newGame, spawnTile, undo, type GameState, type Board } from '../engine';
const random = () => 0;
function fixture(board: Board): GameState {
  return { ...newGame(random, 1), board, past: null };
}
const zero = () => emptyBoard();
describe('M32 Merge engine', () => {
  it('starts with exactly two 2/4 tiles', () => {
    const b = newGame(random).board.flat().filter(Boolean);
    expect(b).toEqual([2,2]);
  });
  it('spawns 2 at 90% and 4 at 10%', () => {
    expect(spawnTile(zero(), () => 0).flat()[0]).toBe(2);
    const values = [0, .99]; let i = 0;
    expect(spawnTile(zero(), () => values[i++]).flat()[0]).toBe(4);
  });
  it.each([
    ['left', [[2,2,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], [4,0,0,0]],
    ['right', [[2,2,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], [0,0,0,4]],
    ['up', [[2,0,0,0],[2,0,0,0],[0,0,0,0],[0,0,0,0]], [4,0,0,0]],
    ['down', [[2,0,0,0],[2,0,0,0],[0,0,0,0],[0,0,0,0]], [0,0,0,4]]
  ] as const)('moves %s correctly', (direction, board, expected) => {
    const result = move(fixture(board.map(row => [...row])), direction, () => .999999);
    const col = direction === 'up' || direction === 'down';
    expect(col ? result.state.board.map(row => row[0]) : result.state.board[0]).toEqual(expected);
    expect(result.state.score).toBe(4);
  });
  it('merges a tile only once per move', () => {
    const s = fixture([[2,2,2,2],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
    const result = move(s, 'left', () => .999999);
    expect(result.state.board[0]).toEqual([4,4,0,0]);
    expect(result.state.score).toBe(8);
    expect(result.merges).toHaveLength(2);
  });
  it('does not spawn on an invalid move', () => {
    const s = fixture([[2,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
    const result = move(s, 'left', () => .999999);
    expect(result.moved).toBe(false);
    expect(result.state).toBe(s);
  });
  it('detects game over and allows matches on a full board', () => {
    const board = [[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]];
    expect(canMove(board)).toBe(false);
    board[0][0] = 4;
    expect(canMove(board)).toBe(true);
  });
  it('detects reaching 2048 and allows continuation', () => {
    const s = fixture([[1024,1024,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
    const won = move(s, 'left', () => .999999).state;
    expect(won.won).toBe(true);
    expect(move(won,'right',random).moved).toBe(false);
    expect(move(continueGame(won),'right',random).moved).toBe(true);
  });
  it('supports a single-step undo with score and counters restored', () => {
    const s = fixture([[16,16,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
    const next = move(s, 'left', () => .999999).state;
    expect(next.merge32Count).toBe(1);
    const reverted = undo(next);
    expect(reverted.board).toEqual(s.board);
    expect(reverted.score).toBe(0);
    expect(reverted.merge32Count).toBe(0);
    expect(undo(reverted)).toBe(reverted);
  });
  it('triggers M32 only when 16+16 creates 32', () => {
    const s = fixture([[32,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
    expect(move(s,'right',random).created32).toBe(0);
    expect(move(fixture([[16,16,16,16],[0,0,0,0],[0,0,0,0],[0,0,0,0]]),'left',random).created32).toBe(2);
  });
  it('detects game over from the last possible slide and spawn', () => {
    const s = fixture([[4,2,4,0],[4,2,4,2],[2,4,2,4],[4,2,4,2]]);
    const result = move(s,'right',random);
    expect(result.moved).toBe(true);
    expect(result.state.board[0]).toEqual([2,4,2,4]);
    expect(result.state.over).toBe(true);
    expect(move(result.state,'left',random).moved).toBe(false);
  });
  it('exposes tile origins and destinations for precise animation', () => {
    const s = fixture([[2,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
    const result = move(s,'right',random);
    expect(result.motions).toContainEqual({fromRow:0,fromCol:0,toRow:0,toCol:3,merged:false});
  });
  it('holds state while paused', () => {
    const s = { ...fixture([[2,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]), paused: true };
    expect(move(s,'right',random).moved).toBe(false);
  });
});
