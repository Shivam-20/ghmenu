const { menu, askConfirm, separator, error, success, info, pause } = require('../ui');
const { getToken, runGh } = require('../config');
const { clearClient } = require('../github');
const ora = require('ora');

/**
 * Auth & Settings sub-menu.
 */
async function authMenu() {
  while (true) {
    const choice = await menu('Auth & Settings', [
      { name: 'Check status', value: 'status' },
      { name: 'Login (web)', value: 'login' },
      { name: 'Logout', value: 'logout' },
      { name: 'Switch account', value: 'switch' },
      { name: 'Back to main menu', value: 'back' },
    ]);

    switch (choice) {
      case 'status':
        await checkStatus();
        break;
      case 'login':
        await login();
        break;
      case 'logout':
        await logout();
        break;
      case 'switch':
        await switchAccount();
        break;
      case 'back':
        return;
    }
  }
}

/**
 * Check authentication status.
 */
async function checkStatus() {
  const spinner = ora('Checking auth status...').start();

  try {
    const token = await getToken();
    spinner.stop();

    if (!token) {
      error('Not authenticated.\nRun: gh auth login\nOr set GITHUB_TOKEN env var.');
      await pause();
      return;
    }

    // Validate token by fetching user
    const { Octokit } = require('octokit');
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getAuthenticated();

    separator('Auth Status');
    console.log(`  User:      ${user.login}`);
    console.log(`  Name:      ${user.name || 'N/A'}`);
    console.log(`  Email:     ${user.email || 'N/A'}`);
    console.log(`  Token:     ${token.substring(0, 8)}...`);
    console.log();
    success('Authenticated!');
    await pause();
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

/**
 * Login via gh CLI web flow.
 */
async function login() {
  const spinner = ora('Opening browser for login...').start();

  try {
    await runGh(['auth', 'login', '--web']);
    spinner.stop();
    success('Logged in successfully!');
    await pause();
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

/**
 * Logout from gh CLI.
 */
async function logout() {
  const confirmed = await askConfirm('Are you sure you want to logout?');

  if (!confirmed) {
    info('Logout cancelled.');
    await pause();
    return;
  }

  const spinner = ora('Logging out...').start();

  try {
    await runGh(['auth', 'logout']);
    clearClient();
    spinner.stop();
    success('Logged out.');
    await pause();
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

/**
 * Switch gh CLI account.
 */
async function switchAccount() {
  const spinner = ora('Switching account...').start();

  try {
    await runGh(['auth', 'switch']);
    clearClient();
    spinner.stop();
    success('Account switched.');
    await pause();
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

module.exports = { show: authMenu };
