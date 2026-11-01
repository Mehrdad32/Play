/**
 * Deterministic, UI-independent 2048/M32 game engine.
 * Inject a PRNG for reproducible test cases. Coordinates are always LTR.
 */
export type Direction = 'left' | 'right' | 'up' | 'down';
export type Board = number[][];
export type Snapshot = {
  board: Board; score: number; moves: number; won: boolean; over: boolean;
  continued: boolean; merge32Count: number;
};
export type GameState = Snapshot & {
  past: Snapshot | null; paused: boolean; startedAt: number; lastPlayedAt: number;
};
export type MergeEvent = { row: number; col: number; value: number };
export type MoveResult = { state: GameState; moved: boolean; merges: MergeEvent[]; created32: number };
export type Random = () => number;

export function emptyBoard(): Board {
  return Array.from({ length: 4 }, () => [0, 0, 0, 0]);
}
export function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}
export function highestTile(board: Board): number {
  return Math.max(0, ...board.flat());
}
export function canMove(board: Board): boolean {
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    if (!board[r][c]) return true;
    if (c < 3 && board[r][c] === board[r][c + 1]) return true;
    if (r < 3 && board[r][c] === board[r + 1][c]) return true;
  }
  return false;
}
export function spawnTile(board: Board, random: Random = Math.random): Board {
  const free: [number, number][] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    if (!board[r][c]) free.push([r, c]);
  }
  if (!free.length) return cloneBoard(board);
  const result = cloneBoard(board);
  const idx = Math.min(free.length - 1, Math.max(0, Math.floor(random() * free.length)));
  const [r, c] = free[idx];
  result[r][c] = random() < 0.9 ? 2 : 4;
  return result;
}
export function snapshot(state: GameState): Snapshot {
  return {
    board: cloneBoard(state.board), score: state.score, moves: state.moves,
    won: state.won, over: state.over, continued: state.continued,
    merge32Count: state.merge32Count
  };
}
export function newGame(random: Random = Math.random, now = Date.now()): GameState {
  const board = spawnTile(spawnTile(emptyBoard(), random), random);
  return {
    board, score: 0, moves: 0, won: false, over: false, continued: false,
    merge32Count: 0, past: null, paused: false, startedAt: now, lastPlayedAt: now
  };
}
export function move(state: GameState, direction: Direction, random: Random = Math.random, now = Date.now()): MoveResult {
  const noChange = { state, moved: false, merges: [] as MergeEvent[], created32: 0 };
  if (state.paused || state.over || (state.won && !state.continued)) return noChange;
  const board = emptyBoard();
  const merges: MergeEvent[] = [];
  let score = 0;
  for (let line = 0; line < 4; line++) {
    const coordinates: [number, number][] = [];
    for (let step = 0; step < 4; step++) {
      const n = (direction === 'right' || direction === 'down') ? 3 - step : step;
      coordinates.push(direction === 'left' || direction === 'right' ? [line, n] : [n, line]);
    }
    const occupied = coordinates.map(([r, c]) => state.board[r][c]).filter(Boolean);
    const output: number[] = [];
    for (let i = 0; i < occupied.length; i++) {
      if (i + 1 < occupied.length && occupied[i] === occupied[i + 1]) {
        const value = occupied[i] * 2;
        output.push(value);
        const [row, col] = coordinates[output.length - 1];
        merges.push({ row, col, value });
        score += value;
        i++;
      } else output.push(occupied[i]);
    }
    coordinates.forEach(([r, c], i) => { board[r][c] = output[i] ?? 0; });
  }
  if (board.every((row, r) => row.every((v, c) => v === state.board[r][c]))) return noChange;
  const nextBoard = spawnTile(board, random);
  const created32 = merges.filter(item => item.value === 32).length;
  const won = state.won || highestTile(nextBoard) >= 2048;
  return {
    moved: true, merges, created32,
    state: {
      ...state, board: nextBoard, score: state.score + score, moves: state.moves + 1,
      won, over: !canMove(nextBoard), merge32Count: state.merge32Count + created32,
      past: snapshot(state), lastPlayedAt: now
    }
  };
}
export function undo(state: GameState, now = Date.now()): GameState {
  if (!state.past) return state;
  return { ...state, ...state.past, board: cloneBoard(state.past.board),
    past: null, paused: false, lastPlayedAt: now };
}
export function continueGame(state: GameState): GameState {
  return { ...state, continued: true };
}
