#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const mainScreen = require('./src/screens/main');
const logger = require('./src/logger');
const { setActiveProfile, loadProfiles } = require('./src/profiles');

// Parse CLI arguments
const args = process.argv.slice(2);
const isDebug = args.includes('--debug') || args.includes('-d');

// Setup logger
if (isDebug) {
  logger.enable();
  logger.info('ghmenu started with --debug');
}

// Handle --profile / -p flag
const profileFlagIndex = args.findIndex((a) => a === '--profile' || a === '-p');
if (profileFlagIndex !== -1 && args[profileFlagIndex + 1]) {
  const profileName = args[profileFlagIndex + 1];
  try {
    setActiveProfile(profileName);
    logger.info(`Profile activated: ${profileName}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
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
