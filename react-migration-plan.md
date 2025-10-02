# React Migration Strategy

## Tooling
- Scaffold with `npm create vite@latest space-killer-react -- --template react`.
- Use JavaScript + JSX; keep files in `src/` with ES modules.
- Install deps: `howler`, `clsx` (for conditional classes), `immer` (optional for immutable grid updates).
- Reuse existing `audio/`, `img/`, `download/` folders under `public/` in the Vite app.
- Copy refreshed styles into `src/styles/`; consider CSS modules or scoped styles per component.

## Project Layout
- `src/main.jsx`: Vite entry point.
- `src/App.jsx`: top-level layout wrapper.
- `src/components/`
  - `GameBoard.jsx`: renders grid cells.
  - `Hud.jsx`: lives/score/level/enemies display + shots gauge.
  - `ControlsOverlay.jsx`: buttons for W/A/D with overlay styling.
  - `GameButtons.jsx`: start/pause buttons.
  - `Modal.jsx`: reusable modal wrapper with portal.
  - `HighScoreForm.jsx`: modal content for high score entry.
  - `HighScoresTable.jsx`: renders table of saved scores.
- `src/game/`
  - `constants.js`: board dimensions, symbols, timings.
  - `state.js`: initial game state, reducers/helpers.
  - `engine.js`: pure functions for game tick (movement, collisions, level transitions).
  - `audio.js`: Howler sound instances and helpers.
- `src/hooks/`
  - `useGameLoop.js`: manages interval / pause.
  - `useHighScores.js`: localStorage persistence.
- `src/context/GameContext.jsx`: provides state + dispatch to components.

## State Model
```
{
  status: { gameOver, paused, levelCleared, playerDied },
  metrics: { lives, level, currentScore, waitTime },
  ammo: { remainingShots },
  board: Cell[][],
  enemies: number,
  bullets: { player: Bullet[], enemy: Bullet[], merged: Bullet[] },
  rngSeed?: number (if needed)
}
```
- Represent `board` as array of cell objects `{ type: 'empty'|'border'|'player'|'enemy'|'playerBullet'|'enemyBullet'|'bothBullets', blocked: boolean }`.
- Maintain derived `enemies` count from board; reduce in reducer when enemy killed.
- Track bullets in arrays to ease movement calculations without querying DOM.

## Game Loop Plan
- Each tick (`waitTime` ms) run `advanceGame(state)` that returns new state.
- Sequence per tick: move bullets (player, enemy, merged), resolve collisions, move player if motion queued, move enemies, refresh derived metrics, check win/lose conditions.
- Queue player actions via reducer actions (`QUEUE_PLAYER_MOVE`, `QUEUE_SHOT`) set by input handlers.
- After tick resolves, clear queue.

## Input Handling
- Use global `keydown` listener (via `useEffect`) for `w/a/d` plus space for pause maybe.
- Buttons call same action creators.
- Debounce repeated keydown? allow hold for lateral movement (keep queue or set pressed flags).

## Audio Strategy
- Initialize Howler sounds once in `audio.js`.
- Context exposes helper functions (`playMusic`, `stopMusic`, `playSfx(name)`).
- Music loops via Howler; manage pause/resume with state changes.

## UI / Styling Notes
- Use CSS variables for palette; keep pixel-font aesthetic.
- Overlay controls positioned with `position: fixed` bottom-right, `opacity: 0.7`, become fully opaque on hover.
- Game board uses CSS grid with fixed cell size; support responsive scaling by adjusting root `--cell-size`.

## Persistence
- `useHighScores` loads scores from localStorage on mount, exposes `addScore(name, data)` preserving top 10 logic.
- Trigger modal on high score detection at game-over as current version.

## Migration Steps After Setup
1. Scaffold project and migrate assets.
2. Implement state/context + board rendering.
3. Port game mechanics into pure engine functions.
4. Hook up inputs, loop, and audio.
5. Implement modal/high scores + persistence.
6. Polish styling, overlays, responsiveness.
7. Validate gameplay parity + adjust timings.
8. Document commands and follow-ups.
