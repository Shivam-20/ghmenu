const { select, input, confirm } = require('@inquirer/prompts');
const chalk = require('chalk');

/**
 * Create a numbered menu using inquirer select.
 * Maps choices like [{name: 'Repos', value: 'repos'}] to a select prompt.
 */
async function menu(title, choices, options = {}) {
  console.clear();
  if (title) {
    console.log(chalk.bold.cyan(title));
    console.log(chalk.gray('─'.repeat(Math.min(title.length, 50))));
  }

  const result = await select({
    message: options.message || 'Choose an option:',
    choices: choices.map((c, i) => ({
      name: `${i + 1}. ${c.name}`,
      value: c.value,
      description: c.description,
    })),
    pageSize: options.pageSize || 10,
  });

  return result;
}

/**
 * Prompt for text input.
 */
async function askText(message, options = {}) {
  return input({ message, default: options.default || '' });
}

/**
 * Prompt for confirmation.
 */
async function askConfirm(message) {
  return confirm({ message, default: false });
}

/**
 * Show a separator line.
 */
function separator(text) {
  console.log(chalk.gray(`\n── ${text} ──\n`));
}

/**
 * Show an error message.
 */
function error(msg) {
  console.log(chalk.red(`\n✖ ${msg}\n`));
}

/**
 * Show a success message.
 */
function success(msg) {
  console.log(chalk.green(`\n✔ ${msg}\n`));
}

/**
 * Show an info message.
 */
function info(msg) {
  console.log(chalk.blue(`\nℹ ${msg}\n`));
}

/**
 * Pause and wait for user to press Enter.
 */
async function pause() {
  await input({ message: chalk.gray('Press Enter to continue...') });
}

module.exports = {
  menu,
  askText,
  askConfirm,
  separator,
  error,
  success,
  info,
  pause,
};
