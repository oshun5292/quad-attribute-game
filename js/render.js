// render.js — DOM 描画（render(state)）

/**
 * 文字列の先頭を大文字にするヘルパー
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Piece要素を生成するヘルパー関数
 * @param {import('../js/constants.js').Piece} piece
 * @returns {HTMLDivElement}
 */
function createPieceElement(piece) {
  const el = document.createElement('div');
  el.className = `piece piece--${piece.size} piece--${piece.shape} piece--${piece.pattern} piece--${piece.color}`;
  // aria-label: Size Pattern Color Shape（例: "Large Solid Red Circle"）
  el.setAttribute(
    'aria-label',
    `${capitalize(piece.size)} ${capitalize(piece.pattern)} ${capitalize(piece.color)} ${capitalize(piece.shape)}`
  );
  return el;
}

/**
 * GameStateを受け取り、DOMを完全に更新する
 * @param {Object} state - GameState
 */
export function render(state) {
  // 1. フェーズ切替: data-phase 更新
  document.body.dataset.phase = state.phase;

  // 2. ステータスバー
  const activePlayerLabel = document.getElementById('active-player-label');
  const phaseLabel = document.getElementById('phase-label');

  if (activePlayerLabel) {
    activePlayerLabel.textContent =
      state.activePlayer === 'player1' ? 'Player 1' : 'Player 2';
  }

  if (phaseLabel) {
    switch (state.phase) {
      case 'PLACE_PHASE':
        phaseLabel.textContent = '配置フェーズ';
        break;
      case 'SELECT_PHASE':
        phaseLabel.textContent = '選択フェーズ';
        break;
      case 'HANDOVER_SCREEN':
        phaseLabel.textContent = '受け渡し';
        break;
      default:
        phaseLabel.textContent = '';
        break;
    }
  }

  // 3. Board描画（#board）
  const board = document.getElementById('board');
  if (board) {
    // winningLines に含まれるインデックスをフラット化して集約
    const winningIndices = new Set();
    if (state.winningLines && state.winningLines.length > 0) {
      for (const line of state.winningLines) {
        for (const idx of line) {
          winningIndices.add(idx);
        }
      }
    }

    board.innerHTML = '';

    for (let i = 0; i < 16; i++) {
      const cell = document.createElement('div');
      const piece = state.board[i];

      cell.setAttribute('role', 'gridcell');

      if (piece === null) {
        // 空きCell
        cell.className = 'cell';
        cell.setAttribute('data-action', 'PLACE_PIECE');
        cell.setAttribute('data-cell-index', String(i));

        // PLACE_PHASE以外: disabled
        if (state.phase !== 'PLACE_PHASE') {
          cell.classList.add('cell--disabled');
          cell.setAttribute('aria-disabled', 'true');
        }
      } else {
        // 配置済みCell
        cell.className = 'cell cell--occupied';
        const pieceEl = createPieceElement(piece);
        cell.appendChild(pieceEl);
      }

      // WinningLine Cell の強調
      if (winningIndices.has(i)) {
        cell.classList.add('cell--winning');
      }

      board.appendChild(cell);
    }
  }

  // 4. SelectedPieceDisplay（#selected-piece-display）
  const selectedPieceDisplay = document.getElementById('selected-piece-display');
  if (selectedPieceDisplay) {
    selectedPieceDisplay.innerHTML = '';
    if (state.selectedPiece !== null) {
      const pieceEl = createPieceElement(state.selectedPiece);
      selectedPieceDisplay.appendChild(pieceEl);
    }
  }

  // 5. UnusedPiecesList（#unused-pieces-list）
  const unusedPiecesList = document.getElementById('unused-pieces-list');
  if (unusedPiecesList) {
    unusedPiecesList.innerHTML = '';

    for (const piece of state.unusedPieces) {
      const pieceEl = createPieceElement(piece);
      pieceEl.setAttribute('data-action', 'SELECT_PIECE');
      pieceEl.setAttribute('data-piece-id', piece.id);
      pieceEl.setAttribute('role', 'listitem');

      if (state.phase === 'SELECT_PHASE') {
        // SELECT_PHASE: 全Pieceタップ可能
        // pendingPiece に一致するPieceには .piece--selected を付与
        if (state.pendingPiece && state.pendingPiece.id === piece.id) {
          pieceEl.classList.add('piece--selected');
        }
      } else if (state.phase === 'PLACE_PHASE') {
        // PLACE_PHASE: selectedPiece以外のUnusedPiecesをdisabledにする
        pieceEl.setAttribute('aria-disabled', 'true');
      } else {
        // HANDOVER_SCREEN, RESULT_SCREEN等: 全Pieceロック
        pieceEl.setAttribute('aria-disabled', 'true');
      }

      unusedPiecesList.appendChild(pieceEl);
    }
  }

  // 6. 決定ボタン（#confirm-btn）
  const confirmBtn = document.getElementById('confirm-btn');
  if (confirmBtn) {
    if (state.phase === 'SELECT_PHASE' && state.pendingPiece !== null) {
      confirmBtn.disabled = false;
      confirmBtn.setAttribute('aria-disabled', 'false');
    } else {
      confirmBtn.disabled = true;
      confirmBtn.setAttribute('aria-disabled', 'true');
    }
  }

  // 7. HandoverOverlay（#handover-overlay）
  const handoverOverlay = document.getElementById('handover-overlay');
  const handoverMessage = document.getElementById('handover-message');

  if (handoverOverlay) {
    if (state.phase === 'HANDOVER_SCREEN') {
      handoverOverlay.setAttribute('aria-hidden', 'false');
    } else {
      handoverOverlay.setAttribute('aria-hidden', 'true');
    }
  }

  if (handoverMessage) {
    if (state.phase === 'HANDOVER_SCREEN') {
      // Handover画面ではまだactivePlayerは切替前なので、
      // 表示する「次のプレイヤー」は opposite(activePlayer)
      const nextPlayerNum = state.activePlayer === 'player1' ? 2 : 1;
      handoverMessage.textContent = `Player ${nextPlayerNum} の番です。\n端末を渡してください。`;
    } else {
      handoverMessage.textContent = '';
    }
  }

  // 8. ResultScreen（#result-screen）
  const resultMessage = document.getElementById('result-message');
  if (resultMessage) {
    if (state.result === 'player1') {
      resultMessage.textContent = 'Player 1 の勝利！';
    } else if (state.result === 'player2') {
      resultMessage.textContent = 'Player 2 の勝利！';
    } else if (state.result === 'draw') {
      resultMessage.textContent = '引き分け！';
    } else {
      resultMessage.textContent = '';
    }
  }
}
