const { Octokit } = require('octokit');
const { getToken } = require('./config');

let octokit = null;

/**
 * Get or create an authenticated Octokit client.
 */
async function getClient() {
  if (octokit) return octokit;

  const token = await getToken();
  if (!token) {
    throw new Error(
      'No GitHub token found.\n' +
      'Run: gh auth login\n' +
      'Or set GITHUB_TOKEN environment variable.'
    );
  }

  octokit = new Octokit({ auth: token });
  return octokit;
}

/**
 * Clear the cached client (e.g. after logout).
 */
function clearClient() {
  octokit = null;
}

module.exports = { getClient, clearClient };
