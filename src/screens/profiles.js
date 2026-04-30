const { menu, askText, askConfirm, separator, error, success, info, pause } = require('../ui');
const { listProfiles, addProfile, removeProfile, setActiveProfile, getActiveProfile, getProfileRepo } = require('../profiles');

/**
 * Profiles management screen.
 */
async function profilesMenu() {
  while (true) {
    const profiles = listProfiles();
    const active = getActiveProfile();

    const choices = [
      { name: 'List profiles', value: 'list' },
      { name: 'Add profile', value: 'add' },
      { name: 'Remove profile', value: 'remove' },
      { name: 'Switch active profile', value: 'switch' },
      { name: 'Clear active profile', value: 'clear' },
      { name: 'Back to main menu', value: 'back' },
    ];

    const choice = await menu(
      active ? `Profiles (active: ${active})` : 'Profiles',
      choices
    );

    switch (choice) {
      case 'list':
        await listProfilesScreen(profiles);
        break;
      case 'add':
        await addProfileScreen();
        break;
      case 'remove':
        await removeProfileScreen(profiles);
        break;
      case 'switch':
        await switchProfileScreen(profiles);
        break;
      case 'clear':
        await clearProfileScreen();
        break;
      case 'back':
        return;
    }
  }
}

async function listProfilesScreen(profiles) {
  if (profiles.length === 0) {
    info('No profiles saved. Add one first.');
    await pause();
    return;
  }

  separator('Saved Profiles');
  profiles.forEach((p) => {
    const marker = p.active ? '▶ ' : '  ';
    console.log(`${marker}${p.name} → ${p.repo}`);
  });
  console.log();
  await pause();
}

async function addProfileScreen() {
  const name = await askText('Profile name (e.g. work, personal):');
  if (!name) {
    error('Profile name is required.');
    await pause();
    return;
  }

  const repo = await askText('Repository (OWNER/REPO):');
  if (!repo || !repo.includes('/')) {
    error('Please provide a valid OWNER/REPO format.');
    await pause();
    return;
  }

  addProfile(name, repo);
  success(`Profile "${name}" → ${repo} saved.`);
  await pause();
}

async function removeProfileScreen(profiles) {
  if (profiles.length === 0) {
    info('No profiles to remove.');
    await pause();
    return;
  }

  const choices = profiles.map((p) => ({
    name: `${p.name} → ${p.repo}${p.active ? ' (active)' : ''}`,
    value: p.name,
  }));
  choices.push({ name: 'Cancel', value: 'cancel' });

  const selected = await menu('Remove profile', choices);

  if (selected === 'cancel') {
    info('Removal cancelled.');
    await pause();
    return;
  }

  const confirmed = await askConfirm(`Remove profile "${selected}"?`);
  if (!confirmed) {
    info('Removal cancelled.');
    await pause();
    return;
  }

  removeProfile(selected);
  success(`Profile "${selected}" removed.`);
  await pause();
}

async function switchProfileScreen(profiles) {
  if (profiles.length === 0) {
    info('No profiles saved. Add one first.');
    await pause();
    return;
  }

  const choices = profiles.map((p) => ({
    name: `${p.name} → ${p.repo}${p.active ? ' (active)' : ''}`,
    value: p.name,
  }));
  choices.push({ name: 'Cancel', value: 'cancel' });

  const selected = await menu('Switch to profile', choices);

  if (selected === 'cancel') {
    info('Switch cancelled.');
    await pause();
    return;
  }

  setActiveProfile(selected);
  success(`Active profile set to "${selected}".`);
  await pause();
}

async function clearProfileScreen() {
  const active = getActiveProfile();
  if (!active) {
    info('No active profile to clear.');
    await pause();
    return;
  }

  setActiveProfile(null);
  success('Active profile cleared.');
  await pause();
}

module.exports = { show: profilesMenu };
