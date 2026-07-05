// main.js — 初期化・dispatch・イベントデリゲーション・SW 登録・対戦履歴
// Requirements: 1.4, 6.4, 6.5, 8.7, 10.7, 10.8

import { INITIAL_STATE, transition } from './logic.js';
import { render } from './render.js';

// ─── 対戦履歴（localStorage） ─────────────────────────────────────────────────

const HISTORY_KEY = 'quadattr_match_history';
const MAX_HISTORY = 10;

function loadHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // localStorage が使えない場合は無視
  }
}

function addMatchResult(state) {
  if (!state.result) return;
  const names = state.playerNames || { player1: 'Player 1', player2: 'Player 2' };
  let entry;
  if (state.result === 'draw') {
    entry = `${names.player1} vs ${names.player2} - 引き分け`;
  } else {
    const winnerName = names[state.result];
    entry = `${names.player1} vs ${names.player2} - ${winnerName} win`;
  }
  const history = loadHistory();
  history.unshift(entry);
  saveHistory(history);
}

function renderHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;
  const history = loadHistory();
  list.innerHTML = '';
  if (history.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'まだ対戦履歴はありません';
    li.style.opacity = '0.5';
    list.appendChild(li);
  } else {
    for (const entry of history) {
      const li = document.createElement('li');
      li.textContent = entry;
      list.appendChild(li);
    }
  }
}

function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
  renderHistory();
}

// ─── 状態管理 ─────────────────────────────────────────────────────────────────

let state = INITIAL_STATE;
let previousPhase = state.phase;

// ─── dispatch ─────────────────────────────────────────────────────────────────

function dispatch(action) {
  if (action.type === 'HANDOVER_READY') {
    try {
      state = transition(state, action);
      render(state);
    } catch (e) {
      const msg = document.getElementById('handover-message');
      if (msg) {
        msg.textContent = 'エラーが発生しました。もう一度「準備OK」を押してください。';
      }
      console.error('[QuadAttribute] HANDOVER_READY error:', e);
    }
  } else {
    state = transition(state, action);
    render(state);
  }

  // 対戦結果を保存（RESULT_SCREEN に遷移したタイミング）
  if (state.phase === 'RESULT_SCREEN' && previousPhase !== 'RESULT_SCREEN') {
    addMatchResult(state);
    renderHistory();
  }
  previousPhase = state.phase;
}

// ─── data-action → Action オブジェクト変換 ────────────────────────────────────

function buildAction(actionType, dataset) {
  switch (actionType) {
    case 'START_GAME': {
      const p1Input = document.getElementById('player1-name');
      const p2Input = document.getElementById('player2-name');
      const player1Name = (p1Input?.value?.trim()) || 'Player 1';
      const player2Name = (p2Input?.value?.trim()) || 'Player 2';
      return {
        type: 'START_GAME',
        payload: {
          playerNames: { player1: player1Name, player2: player2Name },
        },
      };
    }

    case 'PLACE_PIECE':
      return {
        type: 'PLACE_PIECE',
        payload: { cellIndex: Number(dataset.cellIndex) },
      };

    case 'SELECT_PIECE':
      return {
        type: 'SELECT_PIECE',
        payload: { pieceId: dataset.pieceId },
      };

    case 'CONFIRM_SELECTION':
      return { type: 'CONFIRM_SELECTION' };

    case 'HANDOVER_READY':
      return { type: 'HANDOVER_READY' };

    case 'REPLAY':
      return { type: 'REPLAY' };

    default:
      return null;
  }
}

// ─── イベントデリゲーション ───────────────────────────────────────────────────

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;

  const actionType = el.dataset.action;
  const action = buildAction(actionType, el.dataset);

  if (action) {
    dispatch(action);
  }
});

// 履歴消去ボタン
document.addEventListener('click', (e) => {
  if (e.target.id === 'clear-history-btn') {
    clearHistory();
  }
});

// ─── 初期化 ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  render(state);
  renderHistory();
});

// ─── Service Worker 登録（サイレントフォールバック: Req 8.7） ─────────────────

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {
    // オフライン機能は無効になるが、アプリは正常動作を継続
  });
}
