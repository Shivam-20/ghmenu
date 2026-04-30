#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const mainScreen = require('./src/screens/main');
const logger = require('./src/logger');

// Parse CLI arguments
const args = process.argv.slice(2);
const isDebug = args.includes('--debug') || args.includes('-d');

// Setup logger
if (isDebug) {
  logger.enable();
  logger.info('ghmenu started with --debug');
}

async function start() {
  try {
    logger.info('Loading main menu...');
    await mainScreen.show();
  } catch (err) {
    logger.error('Fatal error:', err.message);
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

start();
