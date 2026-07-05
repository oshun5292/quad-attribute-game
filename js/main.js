// main.js — 初期化・dispatch・イベントデリゲーション・SW 登録
// Requirements: 1.4, 6.4, 6.5, 8.7, 10.7, 10.8

import { INITIAL_STATE, transition } from './logic.js';
import { render } from './render.js';

// ─── 状態管理 ─────────────────────────────────────────────────────────────────

/** @type {import('./logic.js').GameState} */
let state = INITIAL_STATE;

// ─── dispatch ─────────────────────────────────────────────────────────────────

/**
 * アクションを受け取り、状態遷移と再描画を実行する。
 * HANDOVER_READY のみ try/catch でエラーリカバリーを行う（Req 6.5）。
 * @param {Object} action - { type, payload? }
 */
function dispatch(action) {
  if (action.type === 'HANDOVER_READY') {
    try {
      state = transition(state, action);
      render(state);
    } catch (e) {
      // Req 6.5: エラー時は HANDOVER_SCREEN を維持し、メッセージを表示
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
}

// ─── data-action → Action オブジェクト変換 ────────────────────────────────────

/**
 * data-action 属性値と dataset から Action オブジェクトを構築する。
 * @param {string} actionType - data-action の値
 * @param {DOMStringMap} dataset - クリックされた要素の dataset
 * @returns {Object|null} Action オブジェクト、または無効な場合 null
 */
function buildAction(actionType, dataset) {
  switch (actionType) {
    case 'START_GAME':
      return { type: 'START_GAME' };

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

  // disabled 状態のボタンや aria-disabled 要素はクリックを無視
  if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;

  const actionType = el.dataset.action;
  const action = buildAction(actionType, el.dataset);

  if (action) {
    dispatch(action);
  }
});

// ─── 初期化 ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  render(state);
});

// ─── Service Worker 登録（サイレントフォールバック: Req 8.7） ─────────────────

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {
    // オフライン機能は無効になるが、アプリは正常動作を継続
  });
}
