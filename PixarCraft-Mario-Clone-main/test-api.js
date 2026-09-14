const API_URL = 'http://localhost:3201/api';

async function testSuite() {
  console.log('--- Starting API Test Suite ---');
  let failures = 0;
  function assert(cond, msg) {
    if (!cond) {
      console.error('❌ FAIL:', msg);
      failures++;
    } else {
      console.log('✅ PASS:', msg);
    }
  }

  // 1. Register User A
  const emailA = `player_a_${Date.now()}@test.com`;
  const resRegA = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: emailA,
      password: 'password123',
      confirmPassword: 'password123'
    })
  });
  const dataRegA = await resRegA.json();
  assert(resRegA.status === 201, 'User A registered with 201');
  assert(dataRegA.token && dataRegA.user.email === emailA, 'User A received token and user info');
  assert(dataRegA.save.currency === 0, 'User A initial currency is 0');
  const tokenA = dataRegA.token;

  // 2. Duplicate registration
  const resDup = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: emailA,
      password: 'password123',
      confirmPassword: 'password123'
    })
  });
  assert(resDup.status === 409, 'Duplicate email registration rejected with 409');

  // 3. Login wrong password
  const resBadLogin = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: emailA,
      password: 'wrongpassword'
    })
  });
  assert(resBadLogin.status === 401, 'Wrong password rejected with 401');

  // 4. Login correct password
  const resLoginA = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: emailA,
      password: 'password123'
    })
  });
  const dataLoginA = await resLoginA.json();
  assert(resLoginA.status === 200, 'User A login succeeded with 200');
  assert(dataLoginA.token, 'User A received session token on login');

  // 5. Auth Me check
  const resMeA = await fetch(`${API_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const dataMeA = await resMeA.json();
  assert(resMeA.status === 200 && dataMeA.user.email === emailA, 'GET /api/auth/me works');

  // 6. Guest migration with User B
  const emailB = `player_b_${Date.now()}@test.com`;
  const guestSave = {
    currency: 450,
    unlockedWeapons: ['w1', 'w2', 'w3'],
    equippedWeapon: 'w3',
    config: { collectible: 'diamonds', enemy: 'zombies', powerUp: 'dash', speed: 7, weapon: 'w3' },
    stats: { highScore: 1200, maxLevelReached: 2, completedLevels: [1] }
  };
  const resRegB = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: emailB,
      password: 'password456',
      confirmPassword: 'password456',
      guestSave
    })
  });
  const dataRegB = await resRegB.json();
  assert(resRegB.status === 201, 'User B registered with guest save migration');
  assert(dataRegB.save.currency === 450, 'User B retained guest currency (450)');
  assert(dataRegB.save.unlockedWeapons.includes('w3'), 'User B retained unlocked weapon w3');
  const tokenB = dataRegB.token;

  // 7. Save progress for User B
  const updatedSaveB = { ...dataRegB.save, currency: 900 };
  const resSaveB = await fetch(`${API_URL}/save`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenB}`
    },
    body: JSON.stringify({ progressData: updatedSaveB })
  });
  const dataSaveB = await resSaveB.json();
  assert(resSaveB.status === 200, 'User B saved progress');
  assert(dataSaveB.save.currency === 900, 'User B save has currency 900');

  // 8. User isolation check: User A save must NOT have been changed by User B
  const resLoadA = await fetch(`${API_URL}/save`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const dataLoadA = await resLoadA.json();
  assert(dataLoadA.save.currency === 0, 'User A save isolated and still has currency 0');

  // 9. Data validation test: negative currency rejected
  const resBadSave = await fetch(`${API_URL}/save`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    },
    body: JSON.stringify({ progressData: { currency: -100 } })
  });
  assert(resBadSave.status === 400, 'Negative currency rejected with 400');

  // 10. Password reset flow for User A
  const resForgot = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailA })
  });
  const dataForgot = await resForgot.json();
  assert(resForgot.status === 200, 'Forgot password code requested');
  const resetCode = dataForgot.code;
  assert(resetCode && resetCode.length === 6, 'Reset code received');

  const resReset = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: emailA,
      code: resetCode,
      newPassword: 'newpassword789',
      confirmPassword: 'newpassword789'
    })
  });
  assert(resReset.status === 200, 'Password reset succeeded');

  // 11. Login with new password
  const resNewLogin = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: emailA,
      password: 'newpassword789'
    })
  });
  assert(resNewLogin.status === 200, 'Login with new password succeeded');

  // 12. Logout User A
  const resLogout = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert(resLogout.status === 200, 'Logout succeeded');

  // 13. Token A revoked check
  const resMeAfterLogout = await fetch(`${API_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert(resMeAfterLogout.status === 401, 'Old session token invalidated after password reset/logout');

  console.log(`\n--- Test Suite Completed: ${failures === 0 ? 'ALL TESTS PASSED 🎉' : `${failures} FAILURES`} ---`);
  if (failures > 0) process.exit(1);
}

testSuite().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
