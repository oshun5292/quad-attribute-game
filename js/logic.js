// logic.js — 純粋関数群（transition / checkWin / INITIAL_STATE）

import { WIN_LINES, generatePieces } from './constants.js';

// ─── INITIAL_STATE ────────────────────────────────────────────────────────────

/** @type {import('./constants.js').Piece[]} */
export const INITIAL_STATE = {
  phase: 'START_SCREEN',
  board: Array(16).fill(null),
  unusedPieces: generatePieces(),
  selectedPiece: null,
  pendingPiece: null,
  activePlayer: 'player1',
  result: null,
  winningLines: [],
  playerNames: { player1: 'Player 1', player2: 'Player 2' },
};

// ─── ヘルパー関数 ──────────────────────────────────────────────────────────────

/**
 * Fisher-Yates シャッフル（コピーを返す）
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * プレイヤーの入れ替え
 * @param {'player1'|'player2'} player
 * @returns {'player1'|'player2'}
 */
function opposite(player) {
  return player === 'player1' ? 'player2' : 'player1';
}

// ─── 勝利判定 ─────────────────────────────────────────────────────────────────

/**
 * 4つのPieceが1属性以上で全て同じ値を持つか判定する
 * @param {(import('./constants.js').Piece|null)[]} pieces - 4要素の配列
 * @returns {boolean}
 */
export function checkLine(pieces) {
  // nullが1つでもあればfalse
  if (pieces.some((p) => p === null)) return false;

  for (const attr of ['color', 'shape', 'pattern', 'size']) {
    const values = new Set(pieces.map((p) => p[attr]));
    if (values.size === 1) return true;
  }

  return false;
}

/**
 * 盤面を走査し、勝利ラインの配列を返す
 * @param {(import('./constants.js').Piece|null)[]} board - length === 16
 * @returns {number[][]} 勝利ライン配列（空配列 = 勝利なし）
 */
export function checkWin(board) {
  const winningLines = [];

  for (const line of WIN_LINES) {
    const pieces = line.map((idx) => board[idx]);
    if (checkLine(pieces)) {
      winningLines.push(line);
    }
  }

  return winningLines;
}

// ─── transition ───────────────────────────────────────────────────────────────

/**
 * 状態遷移関数（純粋関数）
 * @param {Object} state - 現在のGameState
 * @param {Object} action - アクション { type, payload? }
 * @returns {Object} 新しいGameState
 */
export function transition(state, action) {
  switch (action.type) {

    case 'START_GAME': {
      if (state.phase !== 'START_SCREEN') return state;

      const pieces = shuffle(generatePieces());
      const selected = pieces[0];
      const playerNames = action.payload?.playerNames || state.playerNames;

      return {
        ...INITIAL_STATE,
        unusedPieces: generatePieces(),
        selectedPiece: selected,
        phase: 'PLACE_PHASE',
        activePlayer: 'player1',
        board: Array(16).fill(null),
        pendingPiece: null,
        result: null,
        winningLines: [],
        playerNames,
      };
    }

    case 'PLACE_PIECE': {
      if (state.phase !== 'PLACE_PHASE') return state;

      const cellIndex = Number(action.payload?.cellIndex ?? action.cellIndex);
      if (cellIndex < 0 || cellIndex > 15) return state;
      if (state.board[cellIndex] !== null) return state;

      const newBoard = [...state.board];
      newBoard[cellIndex] = state.selectedPiece;

      const newUnused = state.unusedPieces.filter(
        (p) => p.id !== state.selectedPiece.id
      );

      const winningLines = checkWin(newBoard);

      if (winningLines.length > 0) {
        return {
          ...state,
          board: newBoard,
          unusedPieces: newUnused,
          phase: 'RESULT_SCREEN',
          result: state.activePlayer,
          winningLines,
        };
      }

      if (newUnused.length === 0) {
        return {
          ...state,
          board: newBoard,
          unusedPieces: [],
          phase: 'RESULT_SCREEN',
          result: 'draw',
          winningLines: [],
        };
      }

      return {
        ...state,
        board: newBoard,
        unusedPieces: newUnused,
        phase: 'SELECT_PHASE',
        selectedPiece: null,
        pendingPiece: null,
      };
    }

    case 'SELECT_PIECE': {
      if (state.phase !== 'SELECT_PHASE') return state;

      const pieceId = action.payload?.pieceId ?? action.pieceId;
      const piece = state.unusedPieces.find((p) => p.id === pieceId);
      if (!piece) return state;

      // 同じPieceをタップ → トグル解除
      if (state.pendingPiece?.id === pieceId) {
        return { ...state, pendingPiece: null };
      }

      return { ...state, pendingPiece: piece };
    }

    case 'CONFIRM_SELECTION': {
      if (state.phase !== 'SELECT_PHASE') return state;
      if (state.pendingPiece === null) return state;

      return { ...state, phase: 'HANDOVER_SCREEN' };
    }

    case 'HANDOVER_READY': {
      if (state.phase !== 'HANDOVER_SCREEN') return state;

      const nextPlayer = opposite(state.activePlayer);

      return {
        ...state,
        phase: 'PLACE_PHASE',
        activePlayer: nextPlayer,
        selectedPiece: state.pendingPiece,
        pendingPiece: null,
      };
    }

    case 'REPLAY': {
      if (state.phase !== 'RESULT_SCREEN') return state;

      // 先攻後攻の入れ替え:
      // result === 'draw'   → opposite(activePlayer) が新player1（先攻）
      // result === 'player1'→ 'player2' が新player1（先攻）
      // result === 'player2'→ 'player1' が新player1（先攻）
      let newFirstPlayer;
      if (state.result === 'draw') {
        newFirstPlayer = opposite(state.activePlayer);
      } else {
        // 勝者ではない方が先攻（=敗者が先攻）
        newFirstPlayer = opposite(state.result);
      }

      const allPieces = generatePieces();
      const shuffled = shuffle(allPieces);
      const selected = shuffled[0];

      return {
        phase: 'PLACE_PHASE',
        board: Array(16).fill(null),
        unusedPieces: allPieces,
        selectedPiece: selected,
        pendingPiece: null,
        activePlayer: newFirstPlayer,
        result: null,
        winningLines: [],
        playerNames: state.playerNames,
      };
    }

    default:
      return state;
  }
}
