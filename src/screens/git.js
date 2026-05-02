const { menu, askText, askConfirm, separator, error, success, info, pause } = require('../ui');
const chalk = require('chalk');
const ora = require('ora');
const { spawn } = require('child_process');

/**
 * Run a git command and return stdout.
 */
function runGit(args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: options.cwd || process.cwd(),
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `git exited with code ${code}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

/**
 * Get recent commits as structured data.
 */
async function getRecentCommits(count = 20) {
  const format = '%H|%s|%an|%ae|%ad';
  const out = await runGit(['log', `--pretty=format:${format}`, '-n', String(count), '--date=short']);

  return out.split('\n').filter(Boolean).map((line) => {
    const [hash, message, author, email, date] = line.split('|');
    return { hash, message, author, email, date, shortHash: hash.slice(0, 7) };
  });
}

/**
 * Check if current directory is a git repo.
 */
async function isGitRepo() {
  try {
    await runGit(['rev-parse', '--git-dir']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current branch name.
 */
async function getCurrentBranch() {
  try {
    return await runGit(['branch', '--show-current']);
  } catch {
    return 'HEAD';
  }
}

/**
 * Git operations sub-menu.
 */
async function gitMenu() {
  const repoCheck = await isGitRepo();
  if (!repoCheck) {
    error('Not a git repository.\nPlease run this from inside a git repo.');
    await pause();
    return;
  }

  const branch = await getCurrentBranch();

  while (true) {
    const choice = await menu(`Git Operations  [${branch}]`, [
      { name: 'View recent commits', value: 'log' },
      { name: 'Revert commit(s)', value: 'revert' },
      { name: 'Reset commits', value: 'reset' },
      { name: 'Back to main menu', value: 'back' },
    ]);

    switch (choice) {
      case 'log':
        await showLog();
        break;
      case 'revert':
        await revertCommits();
        break;
      case 'reset':
        await resetCommits();
        break;
      case 'back':
        return;
    }
  }
}

/**
 * Show recent commits.
 */
async function showLog() {
  const spinner = ora('Loading commit history...').start();

  try {
    const commits = await getRecentCommits(20);
    spinner.stop();

    if (commits.length === 0) {
      info('No commits found.');
      await pause();
      return;
    }

    separator('Recent Commits');
    commits.forEach((c, i) => {
      const marker = i === 0 ? 'HEAD → ' : '        ';
      console.log(`${marker}${c.shortHash}  ${c.date}  ${c.author}`);
      console.log(`       ${c.message}`);
      console.log();
    });

    await pause();
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

/**
 * Revert one or more commits.
 */
async function revertCommits() {
  const spinner = ora('Loading commits...').start();

  let commits;
  try {
    commits = await getRecentCommits(20);
    spinner.stop();
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
    return;
  }

  if (commits.length === 0) {
    info('No commits to revert.');
    await pause();
    return;
  }

  // Show commits and ask for hash
  separator('Select commit to revert');
  commits.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.shortHash}  ${c.date}  ${c.message.substring(0, 50)}`);
  });
  console.log();

  const input = await askText('Enter number(s) to revert (e.g. 1 or 1,2,3):');
  if (!input) {
    info('Revert cancelled.');
    await pause();
    return;
  }

  const indices = input.split(',').map(s => parseInt(s.trim(), 10) - 1).filter(i => i >= 0 && i < commits.length);
  if (indices.length === 0) {
    error('No valid commits selected.');
    await pause();
    return;
  }

  const selected = indices.map(i => commits[i]);

  // Preview
  separator('Preview');
  console.log(chalk.yellow('This will create new revert commits:'));
  selected.forEach(c => {
    console.log(`  Revert "${c.message.substring(0, 60)}" (${c.shortHash})`);
  });
  console.log();

  const confirmed = await askConfirm('Proceed with revert?');
  if (!confirmed) {
    info('Revert cancelled.');
    await pause();
    return;
  }

  const doSpinner = ora('Reverting...').start();

  try {
    for (const commit of selected) {
      await runGit(['revert', '--no-edit', commit.hash]);
    }
    doSpinner.stop();
    success(`Reverted ${selected.length} commit(s).`);
    await pause();
  } catch (err) {
    doSpinner.stop();
    error(`Revert failed: ${err.message}`);
    info('If there are conflicts, resolve them manually and run: git revert --continue');
    await pause();
  }
}

/**
 * Reset commits with safety guards.
 */
async function resetCommits() {
  const spinner = ora('Loading commits...').start();

  let commits;
  try {
    commits = await getRecentCommits(20);
    spinner.stop();
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
    return;
  }

  if (commits.length === 0) {
    info('No commits to reset.');
    await pause();
    return;
  }

  // Show commits
  separator('Select commit to reset to');
  console.log(chalk.gray('You will reset to this commit. All commits AFTER it will be affected.'));
  console.log();
  commits.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.shortHash}  ${c.date}  ${c.message.substring(0, 50)}`);
  });
  console.log();

  const input = await askText('Enter number of target commit:');
  if (!input) {
    info('Reset cancelled.');
    await pause();
    return;
  }

  const index = parseInt(input.trim(), 10) - 1;
  if (index < 0 || index >= commits.length) {
    error('Invalid selection.');
    await pause();
    return;
  }

  const target = commits[index];
  const commitsAfter = index; // commits before this index are the ones after HEAD

  if (commitsAfter === 0) {
    info('This is the latest commit. Nothing to reset.');
    await pause();
    return;
  }

  // Choose reset mode
  const mode = await menu('Reset mode', [
    { name: 'Soft  — keep changes staged', value: 'soft' },
    { name: 'Mixed — keep changes unstaged (default)', value: 'mixed' },
    { name: 'Hard  — DELETE changes permanently', value: 'hard' },
    { name: 'Cancel', value: 'cancel' },
  ]);

  if (mode === 'cancel') {
    info('Reset cancelled.');
    await pause();
    return;
  }

  // Preview
  separator('⚠️  WARNING');
  console.log(`Target commit: ${target.shortHash} — ${target.message}`);
  console.log(`Commits to be reset: ${commitsAfter}`);
  console.log();

  if (mode === 'soft') {
    console.log(chalk.blue('Soft reset:'));
    console.log('  • Commits will be undone');
    console.log('  • All changes will be kept in staging area');
    console.log('  • No files will be lost');
  } else if (mode === 'mixed') {
    console.log(chalk.blue('Mixed reset:'));
    console.log('  • Commits will be undone');
    console.log('  • All changes will be kept but unstaged');
    console.log('  • No files will be lost');
  } else if (mode === 'hard') {
    console.log(chalk.red.bold('HARD reset:'));
    console.log('  • Commits will be permanently deleted');
    console.log('  • All changes will be LOST');
    console.log('  • This CANNOT be undone easily');
  }
  console.log();

  // First confirmation
  const confirmed = await askConfirm(`Reset ${commitsAfter} commit(s) with --${mode}?`);
  if (!confirmed) {
    info('Reset cancelled.');
    await pause();
    return;
  }

  // Extra confirmation for hard reset
  if (mode === 'hard') {
    const dangerConfirm = await askText('Type "DELETE" to confirm hard reset:');
    if (dangerConfirm !== 'DELETE') {
      info('Hard reset cancelled.');
      await pause();
      return;
    }
  }

  const doSpinner = ora(`Resetting (--${mode})...`).start();

  try {
    await runGit(['reset', `--${mode}`, target.hash]);
    doSpinner.stop();
    success(`Reset ${commitsAfter} commit(s) to ${target.shortHash}.`);

    if (mode === 'soft' || mode === 'mixed') {
      info('Your changes are preserved. Review with: git status');
    }

    await pause();
  } catch (err) {
    doSpinner.stop();
    error(`Reset failed: ${err.message}`);
    await pause();
  }
}

module.exports = { show: gitMenu };
