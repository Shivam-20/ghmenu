# ghmenu — Plan

## Overview
Lightweight Node.js terminal menu for GitHub. Companion to `ghTui` (Python Textual TUI) but completely independent.

## Repo
- **Name:** `Shivam-20/ghmenu`
- **Visibility:** Public
- **Relationship:** Independent — no coupling to `ghTui`

## Tech Stack
- **Runtime:** Node 18+
- **Menu:** `@inquirer/prompts` (modern, arrow-key navigation, nested lists)
- **GitHub API:** `octokit` + `gh auth token` / `GITHUB_TOKEN` fallback
- **Styling:** `chalk` for minimal color accents
- **Spinner:** `ora` for loading states

## Install (Initially)
```bash
git clone https://github.com/Shivam-20/ghmenu.git
cd ghmenu
npm install
npm link        # Makes `ghmenu` available globally
# OR run directly:
node index.js
```

## Architecture
```
ghmenu/
├── package.json
├── index.js              # CLI entry, argument parsing, main loop
├── src/
│   ├── config.js         # Auth resolution (gh token → GITHUB_TOKEN)
│   ├── gh.js             # gh CLI wrapper (spawn)
│   ├── github.js         # Octokit client factory
│   ├── ui.js             # inquirer helpers (menu builder, back navigation)
│   └── screens/
│       ├── main.js       # [1] Repos  [2] Auth  [3] Exit
│       ├── repos.js      # List → View/Create/Delete
│       └── auth.js       # Status/Login/Logout
└── README.md
```

## MVP Features

### Main Menu
```
ghmenu — Simple GitHub CLI
──────────────────────────
[1] Repositories
[2] Auth & Settings
[3] Exit
```

### Repos Menu (nested)
```
Repositories
────────────
[1] List my repos
[2] Create new repo
[3] Delete repo
[0] Back to main menu
```

### Repo List (navigable with ↑/↓ + number keys)
```
Your Repositories
─────────────────
  ●  Shivam-20/ghmenu    public  Node.js
    Shivam-20/ghTui      private Python
    ...
─────────────────────────────
[↑/↓] Navigate  [Enter] View  [0] Back
```

### Auth Menu
```
Auth & Settings
───────────────
[1] Check status
[2] Login (web)
[3] Logout
[4] Switch account
[0] Back
```

## Auth Strategy
1. Try `gh auth token` (reads `gh` CLI session)
2. Fallback to `GITHUB_TOKEN` env var
3. If neither: prompt user to run `gh auth login` or set `GITHUB_TOKEN`

## Decisions Log
| Date | Decision | Reason |
|------|----------|--------|
| 2026-04-28 | Separate repo (ghmenu) | Independent project, no coupling |
| 2026-04-28 | Public visibility | Open source companion to ghTui |
| 2026-04-28 | @inquirer/prompts | Modern, actively maintained (Apr 2026) |
| 2026-04-28 | Both gh CLI + Octokit | gh for auth reuse, Octokit for speed |
| 2026-04-28 | Minimal repo actions | MVP: List, View, Create, Delete |
| 2026-04-28 | Node 18+ | LTS baseline |
| 2026-04-28 | git clone install initially | No npm publish yet |
