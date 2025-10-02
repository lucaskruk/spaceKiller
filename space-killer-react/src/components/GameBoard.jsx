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
} from '../game/constants.js';

const CELL_DISPLAY = {
  [CELL_TYPES.BORDER]: BORDER_SYMBOL,
  [CELL_TYPES.EMPTY]: EMPTY_SYMBOL,
  [CELL_TYPES.PLAYER]: ' P ',
  [CELL_TYPES.ENEMY]: ' E ',
  [CELL_TYPES.PLAYER_BULLET]: PLAYER_BULLET_SYMBOL,
  [CELL_TYPES.ENEMY_BULLET]: ENEMY_BULLET_SYMBOL,
  [CELL_TYPES.BOTH_BULLETS]: BOTH_BULLETS_SYMBOL,
  [CELL_TYPES.FILLER]: FILLER_SYMBOL,
};

function getCellText(cell) {
  return CELL_DISPLAY[cell.type] ?? EMPTY_SYMBOL;
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
                {getCellText(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
