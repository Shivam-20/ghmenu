const test = require('node:test');
const assert = require('node:assert/strict');

const { loadWithMocks } = require('./helpers/load-with-mocks');

test('getClient throws a clear error when no token is available', async () => {
  const github = loadWithMocks('src/github.js', {
    './config': { getToken: async () => null },
    './logger': { debug() {} },
    octokit: { Octokit: function Octokit() {} },
  });

  await assert.rejects(
    () => github.getClient(),
    /No GitHub token found\./
  );
});

test('getClient caches the Octokit instance across calls', async () => {
  let constructed = 0;

  function FakeOctokit(options) {
    constructed += 1;
    this.auth = options.auth;
  }

  const github = loadWithMocks('src/github.js', {
    './config': { getToken: async () => 'abc123' },
    './logger': { debug() {} },
    octokit: { Octokit: FakeOctokit },
  });

  const first = await github.getClient();
  const second = await github.getClient();

  assert.equal(constructed, 1);
  assert.equal(first, second);
  assert.equal(first.auth, 'abc123');
});

test('clearClient resets the cached Octokit instance', async () => {
  let constructed = 0;

  function FakeOctokit(options) {
    constructed += 1;
    this.auth = options.auth;
  }

  const github = loadWithMocks('src/github.js', {
    './config': { getToken: async () => 'abc123' },
    './logger': { debug() {} },
    octokit: { Octokit: FakeOctokit },
  });

  const first = await github.getClient();
  github.clearClient();
  const second = await github.getClient();

  assert.notEqual(first, second);
  assert.equal(constructed, 2);
});
