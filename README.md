# Space Killer React Version

This repository contains the original JavaScript implementation and a new React version located in `react-app`.

## Development

Install dependencies and start the dev server:

```bash
cd react-app
npm install
npm run dev
```

Run the tests with:

```bash
npm test
```

## Deployment

The React version is prepared for Netlify. A sample `netlify.toml` is included and uses the default Vite build output (`dist`).

To store high scores persistently you can use Netlify Functions with a small database (for example FaunaDB or Deno KV) instead of the localStorage approach of the original game.
