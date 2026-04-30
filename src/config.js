const { spawn } = require('child_process');
const { promisify } = require('util');

/**
 * Get GitHub token from gh CLI or environment variable.
 * Priority: 1) gh auth token  2) GITHUB_TOKEN env var
 */
async function getToken() {
  // Try gh CLI first
  try {
    const token = await runGh(['auth', 'token']);
    if (token) return token.trim();
  } catch {
    // gh not installed or not logged in
  }

  // Fallback to env var
  const envToken = process.env.GITHUB_TOKEN;
  if (envToken) return envToken;

  return null;
}

/**
 * Run a gh CLI command and return stdout.
 */
function runGh(args) {
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
        reject(new Error(stderr || `gh exited with code ${code}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

module.exports = { getToken, runGh };
