const { menu, askText, separator, error, success, info, pause } = require('../ui');
const { getClient } = require('../github');
const { runGh } = require('../config');
const ora = require('ora');

/**
 * Search sub-menu.
 */
async function searchMenu() {
  while (true) {
    const choice = await menu('Search GitHub', [
      { name: 'Search repositories', value: 'repos' },
      { name: 'Search issues', value: 'issues' },
      { name: 'Search code', value: 'code' },
      { name: 'Search users', value: 'users' },
      { name: 'Back to main menu', value: 'back' },
    ]);

    switch (choice) {
      case 'repos':
        await searchRepos();
        break;
      case 'issues':
        await searchIssues();
        break;
      case 'code':
        await searchCode();
        break;
      case 'users':
        await searchUsers();
        break;
      case 'back':
        return;
    }
  }
}

/**
 * Search repositories.
 */
async function searchRepos() {
  const query = await askText('Search query (e.g. "tui language:javascript"):');
  if (!query) {
    info('Query cancelled.');
    await pause();
    return;
  }

  const spinner = ora('Searching repositories...').start();

  try {
    const octokit = await getClient();
    const { data } = await octokit.rest.search.repos({
      q: query,
      per_page: 20,
    });

    spinner.stop();

    if (data.items.length === 0) {
      info('No repositories found.');
      await pause();
      return;
    }

    const choices = data.items.map((r) => ({
      name: `${r.full_name}  ⭐${r.stargazers_count}  ${r.language || ''}`,
      value: r.full_name,
      description: r.description || 'No description',
    }));

    choices.push({ name: 'Back', value: 'back' });

    const selected = await menu(`Repositories (${data.total_count} found)`, choices, { pageSize: 15 });

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
 * Search issues.
 */
async function searchIssues() {
  const query = await askText('Search query (e.g. "bug is:open"):');
  if (!query) {
    info('Query cancelled.');
    await pause();
    return;
  }

  const spinner = ora('Searching issues...').start();

  try {
    const octokit = await getClient();
    const { data } = await octokit.rest.search.issuesAndPullRequests({
      q: query,
      per_page: 20,
    });

    spinner.stop();

    if (data.items.length === 0) {
      info('No issues found.');
      await pause();
      return;
    }

    const choices = data.items.map((issue) => ({
      name: `#${issue.number} ${issue.title}  [${issue.state}]`,
      value: issue.html_url,
      description: `${issue.user.login} in ${issue.repository_url.split('/').slice(-2).join('/')}`,
    }));

    choices.push({ name: 'Back', value: 'back' });

    const selected = await menu(`Issues (${data.total_count} found)`, choices, { pageSize: 15 });

    if (selected !== 'back') {
      separator('Issue URL');
      console.log(selected);
      await pause();
    }
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

/**
 * Search code.
 */
async function searchCode() {
  const query = await askText('Search query (e.g. "filename:package.json"):');
  if (!query) {
    info('Query cancelled.');
    await pause();
    return;
  }

  const spinner = ora('Searching code...').start();

  try {
    const octokit = await getClient();
    const { data } = await octokit.rest.search.code({
      q: query,
      per_page: 20,
    });

    spinner.stop();

    if (data.items.length === 0) {
      info('No code results found.');
      await pause();
      return;
    }

    const choices = data.items.map((item) => ({
      name: `${item.repository.full_name}: ${item.path}`,
      value: item.html_url,
      description: `Score: ${item.score}`,
    }));

    choices.push({ name: 'Back', value: 'back' });

    const selected = await menu(`Code (${data.total_count} found)`, choices, { pageSize: 15 });

    if (selected !== 'back') {
      separator('File URL');
      console.log(selected);
      await pause();
    }
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

/**
 * Search users.
 */
async function searchUsers() {
  const query = await askText('Search query:');
  if (!query) {
    info('Query cancelled.');
    await pause();
    return;
  }

  const spinner = ora('Searching users...').start();

  try {
    const octokit = await getClient();
    const { data } = await octokit.rest.search.users({
      q: query,
      per_page: 20,
    });

    spinner.stop();

    if (data.items.length === 0) {
      info('No users found.');
      await pause();
      return;
    }

    const choices = data.items.map((user) => ({
      name: `${user.login}  ${user.type}`,
      value: user.login,
      description: user.html_url,
    }));

    choices.push({ name: 'Back', value: 'back' });

    const selected = await menu(`Users (${data.total_count} found)`, choices, { pageSize: 15 });

    if (selected !== 'back') {
      await viewUser(selected);
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
 * View a single user's details.
 */
async function viewUser(login) {
  const spinner = ora('Loading user details...').start();

  try {
    const octokit = await getClient();
    const { data: user } = await octokit.rest.users.getByUsername({ username: login });

    spinner.stop();

    separator(user.login);
    console.log(`  Name:        ${user.name || 'N/A'}`);
    console.log(`  Bio:         ${user.bio || 'N/A'}`);
    console.log(`  Company:     ${user.company || 'N/A'}`);
    console.log(`  Location:    ${user.location || 'N/A'}`);
    console.log(`  Followers:   ${user.followers}`);
    console.log(`  Following:   ${user.following}`);
    console.log(`  Public repos: ${user.public_repos}`);
    console.log(`  URL:         ${user.html_url}`);
    console.log();

    await pause();
  } catch (err) {
    spinner.stop();
    error(err.message);
    await pause();
  }
}

module.exports = { show: searchMenu };
