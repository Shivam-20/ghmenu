#!/usr/bin/env bash
#
# ghmenu installer
# Usage: ./scripts/install.sh [--debug]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
APP_NAME="ghmenu"
NODE_MIN_VERSION=18

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
  echo -e "${BLUE}[ghmenu]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[ghmenu]${NC} $1"
}

error() {
  echo -e "${RED}[ghmenu]${NC} $1" >&2
}

success() {
  echo -e "${GREEN}[ghmenu]${NC} $1"
}

# Check Node.js version
check_node() {
  log "Checking Node.js version..."
  
  if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js ${NODE_MIN_VERSION}+ first."
    error "Visit: https://nodejs.org/"
    exit 1
  fi
  
  NODE_VERSION=$(node --version | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  
  if [ "$NODE_MAJOR" -lt "$NODE_MIN_VERSION" ]; then
    error "Node.js ${NODE_MIN_VERSION}+ required, found ${NODE_VERSION}"
    exit 1
  fi
  
  success "Node.js ${NODE_VERSION} detected"
}

# Install npm dependencies
install_deps() {
  log "Installing dependencies..."
  cd "$PROJECT_DIR"
  
  if [ -d "node_modules" ]; then
    warn "node_modules already exists, skipping npm install"
  else
    npm install
    success "Dependencies installed"
  fi
}

# Make executable
make_executable() {
  log "Setting up executable..."
  chmod +x "$PROJECT_DIR/index.js"
  success "index.js is now executable"
}

# Determine install location
get_bin_dir() {
  # Prefer user-local bin if we can't write to /usr/local/bin
  if [ -w "/usr/local/bin" ]; then
    echo "/usr/local/bin"
  elif [ -d "$HOME/.local/bin" ]; then
    echo "$HOME/.local/bin"
  else
    mkdir -p "$HOME/.local/bin"
    echo "$HOME/.local/bin"
  fi
}

# Create symlink
create_symlink() {
  local bin_dir
  bin_dir=$(get_bin_dir)
  local target="$bin_dir/$APP_NAME"
  
  log "Creating symlink in ${bin_dir}..."
  
  if [ -L "$target" ]; then
    warn "Removing existing symlink: ${target}"
    rm "$target"
  elif [ -e "$target" ]; then
    error "File already exists: ${target}"
    error "Please remove it manually and retry."
    exit 1
  fi
  
  ln -s "$PROJECT_DIR/index.js" "$target"
  success "Symlink created: ${target} → ${PROJECT_DIR}/index.js"
}

# Update PATH if needed
update_path() {
  local bin_dir="$HOME/.local/bin"
  
  if [[ ":$PATH:" != *":${bin_dir}:"* ]]; then
    warn "${bin_dir} is not in your PATH"
    warn "Add this to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
    warn "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo
  fi
}

# Create log directory
setup_logs() {
  local log_dir="$HOME/.local/share/ghmenu/logs"
  mkdir -p "$log_dir"
  log "Log directory: ${log_dir}"
}

# Main install
main() {
  echo
  log "Installing ghmenu..."
  echo
  
  check_node
  install_deps
  make_executable
  create_symlink
  update_path
  setup_logs
  
  echo
  success "ghmenu installed successfully!"
  echo
  log "Usage:"
  echo "  ghmenu          Start the menu"
  echo "  ghmenu --debug  Start with debug logging"
  echo
  log "To uninstall:"
  echo "  rm $(get_bin_dir)/ghmenu"
  echo
}

main "$@"
