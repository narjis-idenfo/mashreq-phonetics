# Phonetics Demo — Double Metaphone

A React-based demo application showcasing the **Double Metaphone** phonetic algorithm for name matching. Built for Node 16+ and easily deployable on GitHub Pages.

## Features

- **Phonetic Search** — Type a name and find all phonetically similar names
- **Compare Names** — Side-by-side comparison of two names with match analysis
- **Phonetic Groups** — Browse names grouped by their phonetic codes
- **Full Data Table** — Sortable, filterable table of all 100 names with their codes

## Tech Stack

- React 18 + Vite
- [double-metaphone](https://www.npmjs.com/package/double-metaphone) npm library
- CSS (dark theme, responsive)
- GitHub Pages deployment via `gh-pages`

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploy to GitHub Pages

1. Create a GitHub repository and push this code
2. Update `homepage` in `package.json` to match your repo URL:
   ```json
   "homepage": "https://<username>.github.io/<repo-name>"
   ```
3. Update `base` in `vite.config.js`:
   ```js
   base: '/<repo-name>/',
   ```
4. Deploy:
   ```bash
   npm run deploy
   ```

## Node Compatibility

This project is designed to work with **Node.js 16+**.
