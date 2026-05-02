const { menu } = require('../ui');
const { getActiveProfile, getActiveRepo } = require('../profiles');
const reposScreen = require('./repos');
const prsScreen = require('./prs');
const gitScreen = require('./git');
const authScreen = require('./auth');
const searchScreen = require('./search');
const profilesScreen = require('./profiles');

/**
 * Main menu loop.
 */
async function mainMenu() {
  while (true) {
    const active = getActiveProfile();
    const repo = getActiveRepo();

    let title = 'ghmenu';
    if (active && repo) {
      title = `ghmenu  [${active}: ${repo}]`;
    }

    const choice = await menu(title, [
      { name: 'Repositories', value: 'repos' },
      { name: 'Pull Requests', value: 'prs' },
      { name: 'Git Operations', value: 'git' },
      { name: 'Search GitHub', value: 'search' },
      { name: 'Profiles', value: 'profiles' },
      { name: 'Auth & Settings', value: 'auth' },
      { name: 'Exit', value: 'exit' },
    ]);

    switch (choice) {
      case 'repos':
        await reposScreen.show();
        break;
      case 'prs':
        await prsScreen.show();
        break;
      case 'git':
        await gitScreen.show();
        break;
      case 'search':
        await searchScreen.show();
        break;
      case 'profiles':
        await profilesScreen.show();
        break;
      case 'auth':
        await authScreen.show();
        break;
      case 'exit':
        console.clear();
        console.log('Goodbye!');
        process.exit(0);
    }
  }
}

module.exports = { show: mainMenu };
