import React from 'react';
import clsx from 'clsx';
import { useGameState } from '../context/GameContext.jsx';
import {
  CELL_TYPES,
  BORDER_SYMBOL,
  EMPTY_SYMBOL,
  PLAYER_BULLET_SYMBOL,
  ENEMY_BULLET_SYMBOL,
  BOTH_BULLETS_SYMBOL,
  FILLER_SYMBOL,
  BOSS_SYMBOL,
  BOSS_DIAGONAL_BULLET_SYMBOL,
  BOSS_COMBINED_BULLET_SYMBOL,
} from '../game/constants.js';

const TEXT_SYMBOLS = {
  [CELL_TYPES.BORDER]: BORDER_SYMBOL,
  [CELL_TYPES.EMPTY]: EMPTY_SYMBOL,
  [CELL_TYPES.PLAYER_BULLET]: PLAYER_BULLET_SYMBOL,
  [CELL_TYPES.ENEMY_BULLET]: ENEMY_BULLET_SYMBOL,
  [CELL_TYPES.BOTH_BULLETS]: BOTH_BULLETS_SYMBOL,
  [CELL_TYPES.FILLER]: FILLER_SYMBOL,
  [CELL_TYPES.BOSS]: BOSS_SYMBOL,
  [CELL_TYPES.BOSS_DIAGONAL_BULLET]: BOSS_DIAGONAL_BULLET_SYMBOL,
  [CELL_TYPES.BOSS_COMBINED_BULLET]: BOSS_COMBINED_BULLET_SYMBOL,
};

function renderCellContent(cell) {
  if (cell.type === CELL_TYPES.PLAYER) {
    return (
      <img
        src="/img/player.png"
        alt="Player ship"
        className="cell-sprite"
        draggable={false}
      />
    );
  }

  if (cell.type === CELL_TYPES.ENEMY) {
    return (
      <img
        src="/img/enemy.png"
        alt="Enemy ship"
        className="cell-sprite"
        draggable={false}
      />
    );
  }

  const text = TEXT_SYMBOLS[cell.type] ?? EMPTY_SYMBOL;
  return <span className="cell-symbol">{text}</span>;
}

export function GameBoard() {
  const { board } = useGameState();

  return (
    <table className="game-board">
      <tbody>
        {board.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, colIndex) => (
              <td
                key={`${rowIndex}-${colIndex}`}
                className={clsx('cell', `cell-${cell.type}`)}
                data-row={rowIndex}
                data-col={colIndex}
              >
                {renderCellContent(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
