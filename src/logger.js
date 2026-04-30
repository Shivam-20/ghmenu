const fs = require('fs');
const path = require('path');
const os = require('os');

let enabled = false;
let logFile = null;

function getLogPath() {
  const logDir = path.join(os.homedir(), '.local', 'share', 'ghmenu', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return path.join(logDir, 'ghmenu.log');
}

function enable() {
  enabled = true;
  logFile = getLogPath();
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `\n=== ghmenu session started at ${timestamp} ===\n`);
}

function log(level, ...args) {
  if (!enabled) return;
  const timestamp = new Date().toISOString();
  const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  const line = `[${timestamp}] [${level}] ${message}\n`;
  fs.appendFileSync(logFile, line);
}

module.exports = {
  enable,
  debug: (...args) => log('DEBUG', ...args),
  info: (...args) => log('INFO', ...args),
  warn: (...args) => log('WARN', ...args),
  error: (...args) => log('ERROR', ...args),
};
