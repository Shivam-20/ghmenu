const { menu, askText, askConfirm, separator, error, success, info, pause } = require('../ui');
const { getClient } = require('../github');
const { runGh } = require('../config');
const ora = require('ora');

/**
 * Repositories sub-menu.
 */
async function reposMenu() {
  while (true) {
    const choice = await menu('Repositories', [
      { name: 'List my repos', value: 'list' },
      { name: 'Create new repo', value: 'create' },
      { name: 'Delete repo', value: 'delete' },
      { name: 'Back to main menu', value: 'back' },
    ]);

    switch (choice) {
      case 'list':
        await listRepos();
        break;
      case 'create':
        await createRepo();
        break;
      case 'delete':
        await deleteRepo();
        break;
      case 'back':
        return;
    }
  }
}

/**
 * List authenticated user's repositories.
 */
async function listRepos() {
  const spinner = ora('Loading repositories...').start();

  try {
    const octokit = await getClient();
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });

    spinner.stop();

    if (repos.length === 0) {
      info('No repositories found.');
      await pause();
      return;
    }

    const choices = repos.map((r) => ({
      name: `${r.full_name}  ${r.private ? '(private)' : '(public)'}  ${r.language || ''}`,
      value: r.full_name,
      description: r.description || 'No description',
    }));

    choices.push({ name: 'Back', value: 'back' });

    const selected = await menu('Your Repositories', choices, { pageSize: 15 });

    if (selected !== 'back') {
      await viewRepo(selected);
    }
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

/**
 * View a single repo's details.
 */
async function viewRepo(fullName) {
  const spinner = ora('Loading repo details...').start();

  try {
    const octokit = await getClient();
    const [owner, repo] = fullName.split('/');
    const { data: r } = await octokit.rest.repos.get({ owner, repo });

    spinner.stop();

    separator(r.full_name);
    console.log(`  Description: ${r.description || 'N/A'}`);
    console.log(`  Visibility:  ${r.private ? 'Private' : 'Public'}`);
    console.log(`  Language:    ${r.language || 'N/A'}`);
    console.log(`  Stars:       ${r.stargazers_count}`);
    console.log(`  Forks:       ${r.forks_count}`);
    console.log(`  Issues:      ${r.open_issues_count}`);
    console.log(`  URL:         ${r.html_url}`);
    console.log(`  Updated:     ${new Date(r.updated_at).toLocaleDateString()}`);
    console.log();

    await pause();
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

/**
 * Create a new repository.
 */
async function createRepo() {
  try {
    const name = await askText('Repository name:');
    if (!name) {
      error('Repository name is required.');
      await pause();
      return;
    }

    const description = await askText('Description (optional):');
    const isPrivate = await askConfirm('Make it private?');
    const addReadme = await askConfirm('Add README?');

    const spinner = ora('Creating repository...').start();

    const octokit = await getClient();
    await octokit.rest.repos.createForAuthenticatedUser({
      name,
      description: description || undefined,
      private: isPrivate,
      auto_init: addReadme,
    });

    spinner.stop();
    success(`Repository ${name} created successfully!`);
    await pause();
  } catch (err) {
    error(err.message);
    await pause();
  }
}

/**
 * Delete a repository.
 */
async function deleteRepo() {
  try {
    const fullName = await askText('Repository to delete (OWNER/REPO):');
    if (!fullName || !fullName.includes('/')) {
      error('Please provide a valid OWNER/REPO format.');
      await pause();
      return;
    }

    const confirmed = await askConfirm(
      `Are you sure you want to DELETE ${fullName}? This cannot be undone!`
    );

    if (!confirmed) {
      info('Deletion cancelled.');
      await pause();
      return;
    }

    const spinner = ora('Deleting repository...').start();

    const octokit = await getClient();
    const [owner, repo] = fullName.split('/');
    await octokit.rest.repos.delete({ owner, repo });

    spinner.stop();
    success(`Repository ${fullName} deleted.`);
    await pause();
  } catch (err) {
    error(err.message);
    await pause();
  }
}

module.exports = { show: reposMenu };
