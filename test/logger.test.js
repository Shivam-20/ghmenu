const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { loadWithMocks } = require('./helpers/load-with-mocks');

test('enable creates the log file inside the ghmenu data directory', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ghmenu-home-'));
  const logger = loadWithMocks('src/logger.js', {
    os: { homedir: () => tempHome },
  });

  logger.enable();

  const logPath = path.join(tempHome, '.local', 'share', 'ghmenu', 'logs', 'ghmenu.log');
  assert.equal(fs.existsSync(logPath), true);

  const contents = fs.readFileSync(logPath, 'utf8');
  assert.match(contents, /ghmenu session started/);
});

test('logger writes structured log lines after enable', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ghmenu-home-'));
  const logger = loadWithMocks('src/logger.js', {
    os: { homedir: () => tempHome },
  });

  logger.enable();
  logger.info('hello', { feature: 'tests' });

  const logPath = path.join(tempHome, '.local', 'share', 'ghmenu', 'logs', 'ghmenu.log');
  const contents = fs.readFileSync(logPath, 'utf8');

  assert.match(contents, /\[INFO\] hello \{"feature":"tests"\}/);
});
