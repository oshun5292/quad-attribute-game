// constants.js — WIN_LINES・属性定数・generatePieces()

// Cell インデックス配置（行優先: row * 4 + col）
//  0  1  2  3
//  4  5  6  7
//  8  9 10 11
// 12 13 14 15

/** @type {number[][]} 勝利判定の対象となる10本のライン */
export const WIN_LINES = [
  // 横 4 行
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  // 縦 4 列
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  // 対角線 2 本
  [0, 5, 10, 15],
  [3, 6, 9, 12],
];

/** @type {string[]} */
export const COLORS = ['red', 'blue'];

/** @type {string[]} */
export const SHAPES = ['circle', 'square'];

/** @type {string[]} */
export const PATTERNS = ['solid', 'hollow'];

/** @type {string[]} */
export const SIZES = ['large', 'small'];

// Piece ID 生成マッピング（各属性値の頭文字、重複回避のため一部変更）
// color:   red=R,    blue=B
// shape:   circle=C, square=Q  （square は Q で区別）
// pattern: solid=S,  hollow=H
// size:    large=L,  small=M   （small は M で区別）

const COLOR_KEY   = { red: 'R', blue: 'B' };
const SHAPE_KEY   = { circle: 'C', square: 'Q' };
const PATTERN_KEY = { solid: 'S', hollow: 'H' };
const SIZE_KEY    = { large: 'L', small: 'M' };

/**
 * 4属性の全組み合わせ（2×2×2×2 = 16個）の Piece を生成して返す。
 *
 * @typedef {Object} Piece
 * @property {string}               id      - 4文字の一意識別子（例: 'RCSL'）
 * @property {'red'|'blue'}         color
 * @property {'circle'|'square'}    shape
 * @property {'solid'|'hollow'}     pattern
 * @property {'large'|'small'}      size
 *
 * @returns {Piece[]} 16個の Piece からなる配列
 */
export function generatePieces() {
  const pieces = [];

  for (const color of COLORS) {
    for (const shape of SHAPES) {
      for (const pattern of PATTERNS) {
        for (const size of SIZES) {
          const id =
            COLOR_KEY[color] +
            SHAPE_KEY[shape] +
            PATTERN_KEY[pattern] +
            SIZE_KEY[size];

          pieces.push({ id, color, shape, pattern, size });
        }
      }
    }
  }

  return pieces;
}
