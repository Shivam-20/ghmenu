const { menu, askText, askConfirm, separator, error, success, info, pause } = require('../ui');
const { getClient } = require('../github');
const { runGhRepoScoped } = require('../config');
const { getActiveRepo } = require('../profiles');
const ora = require('ora');

/**
 * Pull Requests sub-menu.
 */
async function prsMenu() {
  while (true) {
    const activeRepo = getActiveRepo();
    const title = activeRepo ? `Pull Requests (${activeRepo})` : 'Pull Requests';

    const choice = await menu(title, [
      { name: 'List open PRs', value: 'list_open' },
      { name: 'List closed PRs', value: 'list_closed' },
      { name: 'Create PR', value: 'create' },
      { name: 'Back to main menu', value: 'back' },
    ]);

    switch (choice) {
      case 'list_open':
        await listPRs('open');
        break;
      case 'list_closed':
        await listPRs('closed');
        break;
      case 'create':
        await createPR();
        break;
      case 'back':
        return;
    }
  }
}

function getRepoContext() {
  const repo = getActiveRepo();
  if (repo) return repo;
  return null;
}

async function promptForRepo() {
  const repo = await askText('Repository (OWNER/REPO):');
  if (!repo || !repo.includes('/')) {
    error('Please provide a valid OWNER/REPO format.');
    return null;
  }
  return repo;
}

/**
 * List PRs for a repo.
 */
async function listPRs(state) {
  let repo = getRepoContext();
  if (!repo) {
    repo = await promptForRepo();
    if (!repo) {
      await pause();
      return;
    }
  }

  const spinner = ora(`Loading ${state} PRs...`).start();

  try {
    const octokit = await getClient();
    const [owner, name] = repo.split('/');
    const { data: prs } = await octokit.rest.pulls.list({
      owner,
      repo: name,
      state,
      per_page: 50,
      sort: 'updated',
      direction: 'desc',
    });

    spinner.stop();

    if (prs.length === 0) {
      info(`No ${state} pull requests found.`);
      await pause();
      return;
    }

    const choices = prs.map((pr) => ({
      name: `#${pr.number} ${pr.title}  [${pr.user.login}] ${pr.draft ? '(draft)' : ''}`,
      value: pr.number,
      description: pr.body ? pr.body.substring(0, 80).replace(/\n/g, ' ') : 'No description',
    }));

    choices.push({ name: 'Back', value: 'back' });

    const selected = await menu(`${state.toUpperCase()} Pull Requests (${prs.length})`, choices, { pageSize: 15 });

    if (selected !== 'back') {
      await viewPR(repo, selected);
    }
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

/**
 * View a single PR and show action menu.
 */
async function viewPR(repo, number) {
  const spinner = ora('Loading PR details...').start();

  try {
    const octokit = await getClient();
    const [owner, name] = repo.split('/');
    const { data: pr } = await octokit.rest.pulls.get({ owner, repo: name, pull_number: number });

    spinner.stop();

    separator(`PR #${pr.number}: ${pr.title}`);
    console.log(`  State:     ${pr.state}${pr.draft ? ' (draft)' : ''}`);
    console.log(`  Author:    ${pr.user.login}`);
    console.log(`  Branch:    ${pr.head.ref} → ${pr.base.ref}`);
    console.log(`  Created:   ${new Date(pr.created_at).toLocaleDateString()}`);
    console.log(`  Updated:   ${new Date(pr.updated_at).toLocaleDateString()}`);
    console.log(`  Merged:    ${pr.merged ? 'Yes' : 'No'}`);
    console.log(`  URL:       ${pr.html_url}`);
    if (pr.body) {
      console.log(`  Body:`);
      console.log(pr.body.substring(0, 300).replace(/\n/g, '\n    '));
      if (pr.body.length > 300) console.log('    ...');
    }
    console.log();

    // Action menu
    const actions = [
      { name: 'View diff URL', value: 'diff' },
    ];

    if (pr.state === 'open') {
      actions.push({ name: 'Merge', value: 'merge' });
      actions.push({ name: 'Close', value: 'close' });
    } else if (pr.state === 'closed' && !pr.merged) {
      actions.push({ name: 'Reopen', value: 'reopen' });
    }

    actions.push({ name: 'Back', value: 'back' });

    const action = await menu(`Actions for PR #${pr.number}`, actions);

    switch (action) {
      case 'diff':
        separator('Diff URL');
        console.log(`${pr.html_url}/files`);
        await pause();
        break;
      case 'merge':
        await mergePR(repo, pr.number, pr.title);
        break;
      case 'close':
        await closePR(repo, pr.number);
        break;
      case 'reopen':
        await reopenPR(repo, pr.number);
        break;
      case 'back':
        return;
    }
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

/**
 * Create a new PR.
 */
async function createPR() {
  let repo = getRepoContext();
  if (!repo) {
    repo = await promptForRepo();
    if (!repo) {
      await pause();
      return;
    }
  }

  try {
    const title = await askText('PR title:');
    if (!title) {
      error('Title is required.');
      await pause();
      return;
    }

    const body = await askText('Body (optional):');
    const base = await askText('Base branch:', { default: 'main' });

    const spinner = ora('Creating pull request...').start();

    const octokit = await getClient();
    const [owner, name] = repo.split('/');

    // Need to get current branch for head
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo: name,
      ref: 'heads/' + (await getCurrentBranch()),
    });

    const { data: pr } = await octokit.rest.pulls.create({
      owner,
      repo: name,
      title,
      body: body || undefined,
      head: (await getCurrentBranch()),
      base: base || 'main',
    });

    spinner.stop();
    success(`PR #${pr.number} created: ${pr.html_url}`);
    await pause();
  } catch (err) {
    error(err.message);
    await pause();
  }
}

/**
 * Get current git branch (best effort).
 */
async function getCurrentBranch() {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec('git branch --show-current', { cwd: process.cwd() }, (err, stdout) => {
      if (err) {
        resolve('HEAD');
      } else {
        resolve(stdout.trim() || 'HEAD');
      }
    });
  });
}

/**
 * Merge a PR.
 */
async function mergePR(repo, number, title) {
  const confirmed = await askConfirm(`Merge PR #${number}: ${title}?`);
  if (!confirmed) {
    info('Merge cancelled.');
    await pause();
    return;
  }

  const mergeMethod = await menu('Merge method', [
    { name: 'Merge commit', value: 'merge' },
    { name: 'Squash and merge', value: 'squash' },
    { name: 'Rebase and merge', value: 'rebase' },
    { name: 'Cancel', value: 'cancel' },
  ]);

  if (mergeMethod === 'cancel') {
    info('Merge cancelled.');
    await pause();
    return;
  }

  const spinner = ora('Merging pull request...').start();

  try {
    const octokit = await getClient();
    const [owner, name] = repo.split('/');
    await octokit.rest.pulls.merge({
      owner,
      repo: name,
      pull_number: number,
      merge_method: mergeMethod,
    });

    spinner.stop();
    success(`PR #${number} merged.`);
    await pause();
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

/**
 * Close a PR.
 */
async function closePR(repo, number) {
  const confirmed = await askConfirm(`Close PR #${number}?`);
  if (!confirmed) {
    info('Close cancelled.');
    await pause();
    return;
  }

  const spinner = ora('Closing pull request...').start();

  try {
    const octokit = await getClient();
    const [owner, name] = repo.split('/');
    await octokit.rest.pulls.update({
      owner,
      repo: name,
      pull_number: number,
      state: 'closed',
    });

    spinner.stop();
    success(`PR #${number} closed.`);
    await pause();
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

/**
 * Reopen a PR.
 */
async function reopenPR(repo, number) {
  const spinner = ora('Reopening pull request...').start();

  try {
    const octokit = await getClient();
    const [owner, name] = repo.split('/');
    await octokit.rest.pulls.update({
      owner,
      repo: name,
      pull_number: number,
      state: 'open',
    });

    spinner.stop();
    success(`PR #${number} reopened.`);
    await pause();
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

module.exports = { show: prsMenu };
