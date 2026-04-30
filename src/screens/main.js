const { menu, separator } = require('../ui');
const reposScreen = require('./repos');
const authScreen = require('./auth');

/**
 * Main menu loop.
 */
async function mainMenu() {
  while (true) {
    const choice = await menu('ghmenu', [
      { name: 'Repositories', value: 'repos' },
      { name: 'Auth & Settings', value: 'auth' },
      { name: 'Exit', value: 'exit' },
    ]);

    switch (choice) {
      case 'repos':
        await reposScreen.show();
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
