const BASE = 'https://copiaos-backend.onrender.com/api/v1';
let TOKEN = null;
let TENANT_ID = 'd100c715-f90b-4a6c-9627-f965f740f2f0';

const results = [];
function log(name, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${status}: ${name} ${detail ? '- ' + detail : ''}`);
  results.push({ name, status, detail });
}

async function api(method, path, body = null, useToken = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (useToken && TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  // Don't send X-Tenant-ID for admin routes - they use @SkipTenant()
  
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json, ok: res.ok };
}

// ─── AUTH TESTS ──────────────────────────────────────────────────────
async function testAuth() {
  console.log('\n═══ AUTH TESTS ═══');

  // 1. Login with wrong password (must be >=6 chars to pass DTO validation)
  const wrongPw = await api('POST', '/auth/login', { email: 'manager1783102798@copiaos.com', password: 'wrongpassword' }, false);
  log('Login wrong password', wrongPw.status === 401 ? 'PASS' : 'FAIL', `status=${wrongPw.status}`);

  // 2. Login with wrong email
  const wrongEmail = await api('POST', '/auth/login', { email: 'nonexistent@test.com', password: 'Manager123!' }, false);
  log('Login wrong email', wrongEmail.status === 401 ? 'PASS' : 'FAIL', `status=${wrongEmail.status}`);

  // 3. Login with correct credentials
  const login = await api('POST', '/auth/login', { email: 'manager1783102798@copiaos.com', password: 'Manager123!' }, false);
  if (login.ok && login.json?.data?.accessToken) {
    TOKEN = login.json.data.accessToken;
    log('Login success', 'PASS', `hasToken=${!!TOKEN}, isSuperadmin=${login.json.data.user?.isSuperadmin}`);
  } else {
    log('Login success', 'FAIL', JSON.stringify(login.json).substring(0, 200));
    return false;
  }

  // 4. Verify isSuperadmin in token
  const isSA = login.json.data.user?.isSuperadmin === true;
  log('isSuperadmin=true in response', isSA ? 'PASS' : 'FAIL');

  // 5. Decode JWT to check payload
  try {
    const payload = JSON.parse(atob(TOKEN.split('.')[1]));
    log('JWT has isSuperadmin claim', payload.isSuperadmin === true ? 'PASS' : 'FAIL', `isSuperadmin=${payload.isSuperadmin}`);
    log('JWT has tenantId', payload.tenantId ? 'PASS' : 'FAIL');
    log('JWT has role', payload.role ? 'PASS' : 'FAIL', `role=${payload.role}`);
  } catch (e) {
    log('JWT decode', 'FAIL', e.message);
  }

  // 6. Login without token (no tenant context)
  const noTenant = await api('GET', '/admin/tenants', null, true);
  // This should work since admin is @SkipTenant()
  log('Admin endpoint without X-Tenant-ID', noTenant.ok ? 'PASS' : 'FAIL', `status=${noTenant.status}`);

  return true;
}

// ─── TENANT ENDPOINTS ────────────────────────────────────────────────
async function testTenants() {
  console.log('\n═══ TENANT ENDPOINTS ═══');

  // 1. List tenants
  const list = await api('GET', '/admin/tenants?page=1&limit=5');
  log('GET /admin/tenants', list.ok ? 'PASS' : 'FAIL', `status=${list.status}, total=${list.json?.total}`);

  // 2. List tenants with search
  const search = await api('GET', '/admin/tenants?search=Lagos');
  log('GET /admin/tenants?search=Lagos', search.ok ? 'PASS' : 'FAIL', `results=${search.json?.data?.length}`);

  // 3. Get tenant detail
  const detail = await api('GET', `/admin/tenants/${TENANT_ID}`);
  log('GET /admin/tenants/:id', detail.ok ? 'PASS' : 'FAIL', `name=${detail.json?.name}, plan=${detail.json?.plan}`);

  // 4. Get nonexistent tenant
  const noTenant = await api('GET', '/admin/tenants/00000000-0000-0000-0000-000000000000');
  log('GET /admin/tenants/:id (nonexistent)', !noTenant.ok ? 'PASS' : 'FAIL', `status=${noTenant.status}`);

  // 5. Update tenant plan
  const update = await api('PATCH', `/admin/tenants/${TENANT_ID}`, { plan: 'enterprise' });
  log('PATCH /admin/tenants/:id (plan)', update.ok ? 'PASS' : 'FAIL', `plan=${update.json?.plan}`);

  // 6. Update tenant with no fields
  const noFields = await api('PATCH', `/admin/tenants/${TENANT_ID}`, {});
  log('PATCH /admin/tenants/:id (no fields)', !noFields.ok ? 'PASS' : 'FAIL', `status=${noFields.status}`);

  // 7. Suspend tenant
  const suspend = await api('POST', `/admin/tenants/${TENANT_ID}/suspend`);
  log('POST /admin/tenants/:id/suspend', suspend.ok ? 'PASS' : 'FAIL', `status=${suspend.json?.status}`);

  // 8. Reactivate tenant
  const reactivate = await api('POST', `/admin/tenants/${TENANT_ID}/reactivate`);
  log('POST /admin/tenants/:id/reactivate', reactivate.ok ? 'PASS' : 'FAIL', `status=${reactivate.json?.status}`);

  // 9. Impersonate tenant
  const impersonate = await api('POST', `/admin/tenants/${TENANT_ID}/impersonate`);
  log('POST /admin/tenants/:id/impersonate', impersonate.ok ? 'PASS' : 'FAIL', `mdEmail=${impersonate.json?.mdEmail}`);
}

// ─── REVENUE ENDPOINTS ──────────────────────────────────────────────
async function testRevenue() {
  console.log('\n═══ REVENUE ENDPOINTS ═══');

  const summary = await api('GET', '/admin/revenue/summary');
  log('GET /admin/revenue/summary', summary.ok ? 'PASS' : 'FAIL', `tenants=${summary.json?.summary?.total_tenants}`);

  const byPlan = await api('GET', '/admin/revenue/by-plan');
  log('GET /admin/revenue/by-plan', byPlan.ok ? 'PASS' : 'FAIL', `plans=${Array.isArray(byPlan.json) ? byPlan.json.length : 'N/A'}`);

  const history = await api('GET', '/admin/revenue/history');
  log('GET /admin/revenue/history', history.ok ? 'PASS' : 'FAIL', `months=${Array.isArray(history.json) ? history.json.length : 'N/A'}`);
}

// ─── USER ENDPOINTS ─────────────────────────────────────────────────
async function testUsers() {
  console.log('\n═══ USER ENDPOINTS ═══');

  const list = await api('GET', '/admin/users?page=1&limit=5');
  log('GET /admin/users', list.ok ? 'PASS' : 'FAIL', `total=${list.json?.total}`);

  const search = await api('GET', '/admin/users?search=manager');
  log('GET /admin/users?search=manager', search.ok ? 'PASS' : 'FAIL', `results=${search.json?.data?.length}`);

  // Get first user ID for detail test
  const firstUserId = list.json?.data?.[0]?.id;
  if (firstUserId) {
    const detail = await api('GET', `/admin/users/${firstUserId}`);
    log('GET /admin/users/:id', detail.ok ? 'PASS' : 'FAIL', `email=${detail.json?.email}, memberships=${detail.json?.memberships?.length}`);

    // Deactivate (skip superadmin)
    if (!detail.json?.is_superadmin) {
      const deactivate = await api('PATCH', `/admin/users/${firstUserId}/deactivate`);
      log('PATCH /admin/users/:id/deactivate', deactivate.ok ? 'PASS' : 'FAIL', `status=${deactivate.json?.status}`);

      // Reactivate
      const reactivate = await api('PATCH', `/admin/users/${firstUserId}/reactivate`);
      log('PATCH /admin/users/:id/reactivate', reactivate.ok ? 'PASS' : 'FAIL', `status=${reactivate.json?.status}`);
    } else {
      log('Skip deactivate superadmin', 'PASS', 'correctly skipped');
    }
  }
}

// ─── HEALTH ENDPOINT ────────────────────────────────────────────────
async function testHealth() {
  console.log('\n═══ HEALTH ENDPOINT ═══');

  const health = await api('GET', '/admin/health');
  const hd = health.json?.data ?? health.json ?? {};
  log('GET /admin/health', health.ok ? 'PASS' : 'FAIL', `db=${hd.database}`);
  log('Health has memory', hd.memory ? 'PASS' : 'FAIL');
  log('Health has activeSubscriptions', hd.activeSubscriptions !== undefined ? 'PASS' : 'FAIL');
  log('Health has openTickets', hd.openTickets !== undefined ? 'PASS' : 'FAIL');
  log('Health has uptime', hd.uptime !== undefined ? 'PASS' : 'FAIL');
}

// ─── TICKET ENDPOINTS ───────────────────────────────────────────────
async function testTickets() {
  console.log('\n═══ TICKET ENDPOINTS ═══');

  const list = await api('GET', '/admin/tickets?page=1&limit=5');
  log('GET /admin/tickets', list.ok ? 'PASS' : 'FAIL', `total=${list.json?.total}`);

  const withSearch = await api('GET', '/admin/tickets?search=test');
  log('GET /admin/tickets?search=test', withSearch.ok ? 'PASS' : 'FAIL');

  const withStatus = await api('GET', '/admin/tickets?status=open');
  log('GET /admin/tickets?status=open', withStatus.ok ? 'PASS' : 'FAIL');
}

// ─── AUTH GUARD TESTS ───────────────────────────────────────────────
async function testGuards() {
  console.log('\n═══ AUTH GUARD TESTS ═══');

  // Without token
  const noAuth = await api('GET', '/admin/tenants', null, false);
  log('No token → 401', noAuth.status === 401 ? 'PASS' : 'FAIL', `status=${noAuth.status}`);

  // With invalid token
  const badToken = await api('GET', '/admin/tenants', null, false);
  const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer invalid_token_xyz' };
  const res = await fetch(`${BASE}/admin/tenants`, { headers });
  log('Invalid token → 401', res.status === 401 ? 'PASS' : 'FAIL', `status=${res.status}`);
}

// ─── RUN ALL TESTS ──────────────────────────────────────────────────
async function runAll() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  CopiaOS Admin Panel - Test Suite        ║');
  console.log('╚══════════════════════════════════════════╝');

  const authOk = await testAuth();
  if (!authOk) {
    console.log('\n❌ AUTH FAILED - Cannot proceed with other tests');
    return;
  }

  await testTenants();
  await testRevenue();
  await testUsers();
  await testHealth();
  await testTickets();
  await testGuards();

  console.log('\n══════════════════════════════════════════');
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  console.log(`\n📊 RESULTS: ${pass} PASS | ${fail} FAIL | ${warn} WARN (${results.length} total)`);
  
  if (fail > 0) {
    console.log('\n❌ FAILURES:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.detail}`);
    });
  }
}

runAll().catch(e => console.error('Fatal:', e));
