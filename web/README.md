# ACP Verifier Web

Vite React app for the "Are we ACP yet?" status site.

## Project Structure

```text
/
├── public/
├── src/
│   ├── components/
│   ├── data/
│   ├── styles/
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts
```

Static assets live in `public/`. Mock verifier results currently live in
`src/data/mock-results.json`.

## Commands

All commands are run from this directory:

| Command           | Action                               |
| :---------------- | :----------------------------------- |
| `bun install`     | Installs dependencies                |
| `bun run dev`     | Starts the Vite dev server           |
| `bun run build`   | Builds the production site to `dist` |
| `bun run preview` | Previews the production build        |

The app handles `/` and `/:agent` paths client-side. Production hosts should
serve `index.html` as the fallback for agent detail URLs.
