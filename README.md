# Space Killer React

Space Killer React is an in-progress rewrite of the original Pascal/JavaScript Space Killer in modern React. The legacy static assets have been removed so the focus is entirely on the React/Vite application.

## Requirements

- Node.js 18 or newer (Node 20 is recommended)
- npm 9+ (or another Node package manager such as pnpm or yarn)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   The game is served on the URL printed in the terminal.
3. Build a production bundle:
   ```bash
   npm run build
   ```
4. Preview the production build locally:
   ```bash
   npm run preview
   ```

## Controls

- **Keyboard**
  - `A` / `ArrowLeft`: queue a move to the left
  - `D` / `ArrowRight`: queue a move to the right
  - `W`, `ArrowUp`, or `Space`: fire a shot
  - `P`: toggle pause
  - `R`: reset the run
- **On-screen controls**
  - Pause/Reset buttons mirror the keyboard shortcuts
  - Hold the Left/Right buttons to continuously queue moves (the button repeats while held)
  - Tap the Fire button to queue a shot

The queued actions are applied on the next game tick, preserving the behaviour of the original engine.

## Testing

The project uses [Vitest](https://vitest.dev/) for unit tests. Run the full test suite with:

```bash
npm test
```

### Adding tests for game functions

1. Create a `*.test.js` file next to the logic you want to cover (for example, `src/game/engine.test.js`).
2. Import the function(s) under test and any helpers/constants:
   ```javascript
   import { describe, expect, it } from 'vitest';
   import { advanceGame, createInitialState } from './engine.js';
   ```
3. Write assertions that capture the expected behaviour. The existing `src/game/engine.test.js` demonstrates how to exercise queued movement and firing logic while keeping parity with the classic ruleset.
4. Run `npm test` to execute the new cases.

Vitest automatically picks up any file that matches `*.test.js` or `*.spec.js`.

## Project Structure

- `src/components` – visual building blocks, including the game board and the keyboard/on-screen control surfaces
- `src/context` – React context and hooks that expose the game reducer
- `src/game` – core engine logic, constants, and tests
- `src/hooks` – reusable hooks (e.g. the game loop)
- `src/styles` – global styling for the React UI

## Verifying gameplay parity

Automated tests cover the critical input queueing paths (moving, pausing, and firing). The controls dispatch the same reducer actions as the classic implementation, so gameplay timing remains unchanged while offering both keyboard and touch-friendly inputs.

## Deployment

### Netlify

To deploy on Netlify:

1. Push the `netlify.toml` file to your repository (already added in this repo).
2. In Netlify, create a new site from Git and select this repository.
3. When prompted for build settings, use:
   - **Base directory:** `space-killer-react`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Ensure the environment variables are set (if not picked up from `netlify.toml`):
   - `NODE_VERSION` = `20`
   - `NPM_VERSION` = `9`
5. Deploy the site. Netlify will automatically handle SPA routing via the redirect rule in the config file.

For local testing, install the Netlify CLI and run:

```bash
npm install --global netlify-cli
netlify dev
```

This will run the Vite dev server through Netlify's proxy so redirects and environment variables mirror production.

