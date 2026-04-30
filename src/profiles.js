const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('./logger');

const CONFIG_DIR = path.join(os.homedir(), '.config', 'ghmenu');
const PROFILES_FILE = path.join(CONFIG_DIR, 'profiles.json');

let _cache = null;

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    logger.debug('Created config dir:', CONFIG_DIR);
  }
}

function loadProfiles() {
  if (_cache) return _cache;

  ensureConfigDir();

  if (!fs.existsSync(PROFILES_FILE)) {
    _cache = { active: null, list: {} };
    return _cache;
  }

  try {
    const raw = fs.readFileSync(PROFILES_FILE, 'utf-8');
    _cache = JSON.parse(raw);
    logger.debug('Loaded profiles:', Object.keys(_cache.list || {}));
    return _cache;
  } catch (err) {
    logger.debug('Failed to load profiles:', err.message);
    _cache = { active: null, list: {} };
    return _cache;
  }
}

function saveProfiles(data) {
  ensureConfigDir();
  _cache = data;
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2));
  logger.debug('Saved profiles');
}

function getActiveProfile() {
  const profiles = loadProfiles();
  return profiles.active || null;
}

function getActiveRepo() {
  const profiles = loadProfiles();
  if (!profiles.active) return null;
  return profiles.list[profiles.active] || null;
}

function setActiveProfile(name) {
  const profiles = loadProfiles();
  if (name && !profiles.list[name]) {
    throw new Error(`Profile "${name}" does not exist.`);
  }
  profiles.active = name || null;
  saveProfiles(profiles);
  logger.debug('Active profile set to:', name);
}

function addProfile(name, repo) {
  const profiles = loadProfiles();
  profiles.list[name] = repo;
  saveProfiles(profiles);
}

function removeProfile(name) {
  const profiles = loadProfiles();
  delete profiles.list[name];
  if (profiles.active === name) {
    profiles.active = null;
  }
  saveProfiles(profiles);
}

function listProfiles() {
  const profiles = loadProfiles();
  return Object.entries(profiles.list).map(([name, repo]) => ({
    name,
    repo,
    active: name === profiles.active,
  }));
}

function getProfileRepo(name) {
  const profiles = loadProfiles();
  return profiles.list[name] || null;
}

module.exports = {
  loadProfiles,
  saveProfiles,
  getActiveProfile,
  getActiveRepo,
  setActiveProfile,
  addProfile,
  removeProfile,
  listProfiles,
  getProfileRepo,
};
