const { spawn } = require('child_process');
const logger = require('./logger');
const { getActiveRepo } = require('./profiles');

/**
 * Get GitHub token from gh CLI or environment variable.
 * Priority: 1) gh auth token  2) GITHUB_TOKEN env var
 */
async function getToken() {
  logger.debug('Resolving GitHub token...');
  // Try gh CLI first
  try {
    const token = await runGh(['auth', 'token']);
    if (token) {
      logger.debug('Token resolved via gh CLI');
      return token.trim();
    }
  } catch (err) {
    logger.debug('gh auth token failed:', err.message);
  }

  // Fallback to env var
  const envToken = process.env.GITHUB_TOKEN;
  if (envToken) {
    logger.debug('Token resolved via GITHUB_TOKEN env var');
    return envToken;
  }

  logger.debug('No token found');
  return null;
}

/**
 * Run a gh CLI command and return stdout.
 */
function runGh(args) {
  logger.debug('$ gh', args.join(' '));
  return new Promise((resolve, reject) => {
    const proc = spawn('gh', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, GH_PROMPT_DISABLED: '1' },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });

    proc.on('close', (code) => {
      if (code !== 0) {
        const err = new Error(stderr || `gh exited with code ${code}`);
        logger.debug('gh failed:', err.message);
        reject(err);
      } else {
        logger.debug('gh success');
        resolve(stdout);
      }
    });
  });
}

/**
 * Run a gh CLI command, injecting --repo if an active profile is set.
 * Use this for repo-scoped commands.
 */
function runGhRepoScoped(args) {
  const repo = getActiveRepo();
  if (repo) {
    return runGh([...args, '--repo', repo]);
  }
  return runGh(args);
}

module.exports = { getToken, runGh, runGhRepoScoped };
