const test = require('node:test');
const assert = require('node:assert/strict');

const { loadWithMocks } = require('./helpers/load-with-mocks');

function createOraStub() {
  return () => ({
    start() {
      return {
        stop() {},
      };
    },
  });
}

test('auth screen shows an unauthenticated error when no token is available', async () => {
  const menuChoices = ['status', 'back'];
  const calls = { error: [], pause: 0 };

  const auth = loadWithMocks('src/screens/auth.js', {
    '../ui': {
      menu: async () => menuChoices.shift(),
      askConfirm: async () => false,
      separator() {},
      error(message) { calls.error.push(message); },
      success() {},
      info() {},
      pause: async () => { calls.pause += 1; },
    },
    '../config': {
      getToken: async () => null,
      runGh: async () => {},
    },
    '../github': { clearClient() {} },
    ora: createOraStub(),
  });

  await auth.show();

  assert.equal(calls.pause, 1);
  assert.match(calls.error[0], /Not authenticated/);
});

test('repos screen validates OWNER\\/REPO input before deletion', async () => {
  const menuChoices = ['delete', 'back'];
  const textInputs = ['invalid-name'];
  const calls = { error: [], pause: 0 };

  const repos = loadWithMocks('src/screens/repos.js', {
    '../ui': {
      menu: async () => menuChoices.shift(),
      askText: async () => textInputs.shift(),
      askConfirm: async () => false,
      separator() {},
      error(message) { calls.error.push(message); },
      success() {},
      info() {},
      pause: async () => { calls.pause += 1; },
    },
    '../github': { getClient: async () => ({}) },
    '../config': { runGh: async () => {} },
    ora: createOraStub(),
  });

  await repos.show();

  assert.equal(calls.pause, 1);
  assert.match(calls.error[0], /valid OWNER\/REPO format/);
});
