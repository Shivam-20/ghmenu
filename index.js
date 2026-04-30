#!/usr/bin/env node

const mainScreen = require('./src/screens/main');

async function start() {
  try {
    await mainScreen.show();
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

start();
