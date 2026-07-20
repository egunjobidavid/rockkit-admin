async function debug() {
  // 1. Fetch the HTML page
  const htmlRes = await fetch('https://rockkit-admin.vercel.app');
  const html = await htmlRes.text();
  const jsMatch = html.match(/src="([^"]+\.js)"/);
  console.log('JS path:', jsMatch ? jsMatch[1] : 'NOT FOUND');

  if (!jsMatch) return;

  // 2. Fetch and analyze the JS bundle
  const jsRes = await fetch('https://rockkit-admin.vercel.app' + jsMatch[1]);
  const js = await jsRes.text();
  console.log('JS size:', js.length, 'bytes');
  console.log('Has copiaos-backend:', js.includes('copiaos-backend'));
  console.log('Has isSuperadmin:', js.includes('isSuperadmin'));
  console.log('Has admin_token:', js.includes('admin_token'));
  console.log('Has /auth/login:', js.includes('/auth/login'));
  console.log('Has loadFromStorage:', js.includes('loadFromStorage'));

  // 3. Simulate the actual login flow
  console.log('\n--- Simulating Login ---');
  const loginRes = await fetch('https://copiaos-backend.onrender.com/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager1783102798@copiaos.com', password: 'Manager123!' })
  });
  
  console.log('Login status:', loginRes.status);
  console.log('CORS header:', loginRes.headers.get('access-control-allow-origin'));
  
  const json = await loginRes.json();
  console.log('Response success:', json.success);
  console.log('Response has data:', !!json.data);
  console.log('Response data keys:', Object.keys(json.data || {}));
  
  // This is what client.ts does: return json.data ?? json
  const data = json.data ?? json;
  console.log('\n--- After client.ts unwrap ---');
  console.log('data keys:', Object.keys(data));
  console.log('data.user:', JSON.stringify(data.user));
  console.log('data.accessToken:', !!data.accessToken);
  
  // This is what auth-store does
  const user = data.user;
  console.log('\n--- Auth store check ---');
  console.log('user exists:', !!user);
  console.log('user.isSuperadmin:', user?.isSuperadmin);
  
  if (!user?.isSuperadmin) {
    console.log('WOULD FAIL: Not a superadmin account');
  } else {
    console.log('WOULD PASS: Login would succeed');
    console.log('Token would be stored, redirect would fire');
  }
}

debug().catch(e => console.error('ERROR:', e));
