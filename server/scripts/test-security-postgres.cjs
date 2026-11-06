const { execFileSync, spawnSync } = require('node:child_process');
const { randomBytes, randomUUID } = require('node:crypto');
const path = require('node:path');
const { Client } = require('pg');

async function run() {
  const name = 'senior-ai-security-' + randomUUID();
  const password = randomBytes(32).toString('hex');
  let created = false;
  try {
    console.log('Iniciando PostgreSQL temporario, acessivel somente em 127.0.0.1.');
    execFileSync('docker', ['run', '--rm', '-d', '--name', name, '-p', '127.0.0.1::5432', '-e', 'POSTGRES_PASSWORD=' + password, '-e', 'POSTGRES_DB=seniorai_security', 'postgres:16-alpine'], { stdio: ['ignore', 'pipe', 'inherit'], timeout: 180000 });
    created = true;
    const endpoint = execFileSync('docker', ['port', name, '5432/tcp'], { encoding: 'utf8' }).trim();
    if (!/^127\.0\.0\.1:\d+$/.test(endpoint)) throw new Error('Porta de teste invalida');
    const url = 'postgres://postgres:' + password + '@' + endpoint + '/seniorai_security';
    let ready = false;
    for (let i = 0; i < 120; i++) {
      const client = new Client({ connectionString: url, connectionTimeoutMillis: 500 });
      try { await client.connect(); ready = true; } catch { /* Wait for this disposable instance only. */ }
      finally { await client.end().catch(() => {}); }
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error('PostgreSQL temporario nao iniciou');
    const result = spawnSync(process.execPath, [path.join(__dirname, '../node_modules/vitest/vitest.mjs'), 'run', 'src/modules/accounts/SecurityDatabase.postgres.spec.ts'], {
      stdio: 'inherit', env: { ...process.env, SECURITY_TEST_DATABASE_URL: url }, timeout: 120000,
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } finally {
    if (created && /^senior-ai-security-[a-f0-9-]{36}$/.test(name)) {
      execFileSync('docker', ['rm', '--force', name], { stdio: 'ignore' });
      console.log('PostgreSQL temporario removido.');
    }
  }
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
