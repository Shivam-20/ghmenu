const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');

const { loadWithMocks } = require('./helpers/load-with-mocks');

function createFakeProcess() {
  const proc = new EventEmitter();
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  return proc;
}

test('runGh resolves stdout for successful gh commands', async () => {
  const fakeProc = createFakeProcess();

  const { runGh } = loadWithMocks('src/config.js', {
    './logger': { debug() {} },
    child_process: {
      spawn(command, args, options) {
        assert.equal(command, 'gh');
        assert.deepEqual(args, ['auth', 'token']);
        assert.equal(options.env.GH_PROMPT_DISABLED, '1');

        process.nextTick(() => {
          fakeProc.stdout.emit('data', 'token-123\n');
          fakeProc.emit('close', 0);
        });

        return fakeProc;
      },
    },
  });

  const stdout = await runGh(['auth', 'token']);
  assert.equal(stdout, 'token-123\n');
});

test('runGh rejects with stderr output for failed gh commands', async () => {
  const fakeProc = createFakeProcess();

  const { runGh } = loadWithMocks('src/config.js', {
    './logger': { debug() {} },
    child_process: {
      spawn() {
        process.nextTick(() => {
          fakeProc.stderr.emit('data', 'auth failed');
          fakeProc.emit('close', 1);
        });

        return fakeProc;
      },
    },
  });

  await assert.rejects(() => runGh(['auth', 'token']), /auth failed/);
});

test('getToken prefers gh auth token output and trims whitespace', async () => {
  const fakeProc = createFakeProcess();

  const { getToken } = loadWithMocks('src/config.js', {
    './logger': { debug() {} },
    child_process: {
      spawn() {
        process.nextTick(() => {
          fakeProc.stdout.emit('data', ' gh-token \n');
          fakeProc.emit('close', 0);
        });

        return fakeProc;
      },
    },
  });

  const previousToken = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = 'env-token';

  try {
    const token = await getToken();
    assert.equal(token, 'gh-token');
  } finally {
    process.env.GITHUB_TOKEN = previousToken;
  }
});

test('getToken falls back to GITHUB_TOKEN when gh auth token fails', async () => {
  const fakeProc = createFakeProcess();

  const { getToken } = loadWithMocks('src/config.js', {
    './logger': { debug() {} },
    child_process: {
      spawn() {
        process.nextTick(() => {
          fakeProc.stderr.emit('data', 'not logged in');
          fakeProc.emit('close', 1);
        });

        return fakeProc;
      },
    },
  });

  const previousToken = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = 'env-token';

  try {
    const token = await getToken();
    assert.equal(token, 'env-token');
  } finally {
    process.env.GITHUB_TOKEN = previousToken;
  }
});

test('getToken returns null when neither gh nor environment provide a token', async () => {
  const fakeProc = createFakeProcess();

  const { getToken } = loadWithMocks('src/config.js', {
    './logger': { debug() {} },
    child_process: {
      spawn() {
        process.nextTick(() => {
          fakeProc.stderr.emit('data', 'missing auth');
          fakeProc.emit('close', 1);
        });

        return fakeProc;
      },
    },
  });

  const previousToken = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;

  try {
    const token = await getToken();
    assert.equal(token, null);
  } finally {
    process.env.GITHUB_TOKEN = previousToken;
  }
});
