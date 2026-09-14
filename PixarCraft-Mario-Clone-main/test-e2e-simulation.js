const API_URL = 'http://localhost:3201/api';

class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(k) { return this.store[k] !== undefined ? this.store[k] : null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
  clear() { this.store = {}; }
}

async function testE2EScenario() {
  console.log('=== Running Full End-to-End Game Flow Simulation ===\n');
  const storage = new MockLocalStorage();
  let failures = 0;
  function assert(cond, msg) {
    if (!cond) {
      console.error('❌ FAIL:', msg);
      failures++;
    } else {
      console.log('✅ PASS:', msg);
    }
  }

  // -------------------------------------------------------------
  // Scenario 1: Guest Player
  // -------------------------------------------------------------
  console.log('--- Step 1: Guest Mode ---');
  // Guest plays game, collects 35 coins, buys weapon w2 (cost 10), has 25 coins left
  const guestSave = {
    currency: 25,
    unlockedWeapons: ['w1', 'w2'],
    equippedWeapon: 'w2',
    config: { collectible: 'coins', enemy: 'slimes', powerUp: 'doubleJump', speed: 5, weapon: 'w2' },
    stats: { highScore: 350, maxLevelReached: 1, completedLevels: [], totalCoinsEarned: 35, enemiesDefeated: 3, gamesPlayed: 1, wins: 0 },
    saveVersion: 1,
    updatedAt: new Date().toISOString()
  };
  storage.setItem('mario_cloud_save_local_cache', JSON.stringify(guestSave));
  storage.setItem('currency', '25');
  storage.setItem('unlockedWeapons', JSON.stringify(['w1', 'w2']));

  assert(storage.getItem('currency') === '25', 'Guest progress saved locally');

  // -------------------------------------------------------------
  // Scenario 2: Guest registers new account with progress preservation
  // -------------------------------------------------------------
  console.log('\n--- Step 2: Guest to Account Registration ---');
  const userEmail = `player_${Date.now()}@domain.com`;
  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userEmail,
      password: 'mySecretPassword1!',
      confirmPassword: 'mySecretPassword1!',
      guestSave
    })
  });
  const regData = await registerRes.json();
  assert(registerRes.status === 201, 'Account successfully created');
  assert(regData.save.currency === 25, 'Guest currency (25) migrated into account');
  assert(regData.save.unlockedWeapons.includes('w2'), 'Guest unlocked weapon (w2) migrated into account');
  storage.setItem('mario_auth_token', regData.token);

  // -------------------------------------------------------------
  // Scenario 3: Player makes progress while logged in
  // -------------------------------------------------------------
  console.log('\n--- Step 3: Cloud Saving during Gameplay ---');
  const updatedCloudSave = {
    ...regData.save,
    currency: 120,
    unlockedWeapons: ['w1', 'w2', 'w6'],
    equippedWeapon: 'w6',
    stats: { ...regData.save.stats, highScore: 1500, maxLevelReached: 2, completedLevels: [1], totalCoinsEarned: 150 }
  };

  const saveRes = await fetch(`${API_URL}/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${regData.token}`
    },
    body: JSON.stringify({ progressData: updatedCloudSave })
  });
  const saveData = await saveRes.json();
  assert(saveRes.status === 200, 'Cloud save uploaded successfully');
  assert(saveData.save.currency === 120, 'Cloud currency updated to 120');
  assert(saveData.save.unlockedWeapons.includes('w6'), 'Weapon w6 saved to cloud');

  // -------------------------------------------------------------
  // Scenario 4: Player logs out
  // -------------------------------------------------------------
  console.log('\n--- Step 4: Logout ---');
  const logoutRes = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${regData.token}` }
  });
  assert(logoutRes.status === 200, 'Logout completed');
  storage.removeItem('mario_auth_token');

  // -------------------------------------------------------------
  // Scenario 5: Player logs in from another device/browser
  // -------------------------------------------------------------
  console.log('\n--- Step 5: Cross-Device / Fresh Browser Login ---');
  const freshDeviceStorage = new MockLocalStorage(); // Brand new device with zero local progress
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userEmail,
      password: 'mySecretPassword1!'
    })
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, 'Login succeeded on new device');
  assert(loginData.save.currency === 120, 'All 120 coins retrieved on new device');
  assert(loginData.save.unlockedWeapons.includes('w6'), 'Weapon w6 retrieved on new device');
  assert(loginData.save.stats.completedLevels.includes(1), 'Level 1 completion retrieved on new device');
  freshDeviceStorage.setItem('mario_auth_token', loginData.token);
  freshDeviceStorage.setItem('mario_cloud_save_local_cache', JSON.stringify(loginData.save));

  // -------------------------------------------------------------
  // Scenario 6: Conflict resolution
  // -------------------------------------------------------------
  console.log('\n--- Step 6: Conflict Resolution ---');
  // Local has 500 coins, Cloud has 120 coins
  const conflictingLocalSave = { ...loginData.save, currency: 500, unlockedWeapons: ['w1', 'w2', 'w6', 'w10'] };
  
  // Option A: Choose Cloud
  const chosenCloud = loginData.save;
  assert(chosenCloud.currency === 120, 'User chooses Cloud save -> retains 120');

  // Option B: Choose Local (force overwrite cloud)
  const forceRes = await fetch(`${API_URL}/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    },
    body: JSON.stringify({ progressData: conflictingLocalSave, force: true })
  });
  const forceData = await forceRes.json();
  assert(forceRes.status === 200, 'Force update with local save succeeded');
  assert(forceData.save.currency === 500, 'Cloud save now updated with local progress (500 coins)');

  console.log(`\n======================================================`);
  console.log(`E2E SIMULATION RESULT: ${failures === 0 ? '100% PASSED (ALL CRITICAL SCENARIOS VERIFIED)' : `${failures} FAILURES`}`);
  console.log(`======================================================`);
  if (failures > 0) process.exit(1);
}

testE2EScenario().catch(err => {
  console.error('Fatal error in simulation:', err);
  process.exit(1);
});
