# ghmenu

A lightweight terminal menu for GitHub. Simple, fast, no TUI framework — just arrow keys and numbers.

## Install

```bash
git clone https://github.com/Shivam-20/ghmenu.git
cd ghmenu
npm install
npm link      # optional: makes `ghmenu` available globally
```

## Usage

```bash
node index.js
# or if linked:
ghmenu
```

## Features

- **Repositories**: List, view, create, delete
- **Auth**: Check status, login (web), logout, switch account
- **Navigation**: Arrow keys or number keys (1, 2, 3...)

## Auth

Uses `gh auth token` first, falls back to `GITHUB_TOKEN` env var.

```bash
# Option 1: Use gh CLI auth
gh auth login

# Option 2: Set token manually
export GITHUB_TOKEN=your_token_here
```

## Requirements

- Node.js 18+

## License

MIT
