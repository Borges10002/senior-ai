const { spawn, spawnSync, execFileSync } = require('node:child_process');
const { randomBytes, randomUUID, createHash } = require('node:crypto');
const { createRequire } = require('node:module');
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const web = path.resolve(__dirname, '..');
const server = path.resolve(web, '../server');
const backendRequire = createRequire(path.join(server, 'package.json'));
const { Client } = backendRequire('pg');
const express = backendRequire('express');
const bcrypt = backendRequire('bcryptjs');
const freePort = () => new Promise(resolve => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
function command(file, args, cwd, env = process.env) {
  const r = spawnSync(file, args, { cwd, env, stdio: 'inherit', timeout: 180000 });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error('Comando de preparacao falhou: ' + path.basename(file));
}
async function run() {
  const name = 'senior-ai-security-' + randomUUID();
  const password = randomBytes(32).toString('hex');
  const resetToken = randomBytes(32).toString('hex');
  const runtime = path.join(web, '.security-browser-runtime');
  let container = false, apiProcess, staticServer;
  fs.mkdirSync(runtime, { recursive: true });
  try {
    console.log('Preparando navegador, API real e PostgreSQL local descartavel.');
    execFileSync('docker', ['run', '--rm', '-d', '--name', name, '-p', '127.0.0.1::5432', '-e', 'POSTGRES_PASSWORD=' + password, '-e', 'POSTGRES_DB=seniorai_security', 'postgres:16-alpine'], { stdio: ['ignore', 'pipe', 'inherit'], timeout: 180000 });
    container = true;
    const endpoint = execFileSync('docker', ['port', name, '5432/tcp'], { encoding: 'utf8' }).trim();
    if (!/^127\.0\.0\.1:\d+$/.test(endpoint)) throw new Error('Endpoint de banco invalido');
    const dbPort = endpoint.split(':')[1];
    const apiPort = await freePort(), webPort = await freePort();
    const api = 'http://127.0.0.1:' + apiPort, origin = 'http://127.0.0.1:' + webPort;
    command(process.execPath, [path.join(server, 'node_modules/@babel/cli/bin/babel.js'), 'src', '--extensions', '.js,.ts', '--out-dir', 'dist', '--copy-files', '--no-copy-ignored', '--ignore', 'src/**/*.spec.ts,src/shared/testes/**'], server);
    const quasar = require(path.join(web, 'node_modules/@quasar/app-webpack/package.json')).bin.quasar;
    command(process.execPath, [path.join(web, 'node_modules/@quasar/app-webpack', quasar), 'build'], web, { ...process.env, API_URL: api, SECURITY_BROWSER_BUILD: 'true' });
    apiProcess = spawn(process.execPath, [path.join(server, 'dist/shared/infra/http/server.js')], {
      cwd: runtime, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test', APP_ENV: '', DATABASE_URL: '', DB_HOST: '127.0.0.1', DB_PORT: dbPort, DB_USER: 'postgres', DB_PASS: password, DB_NAME: 'seniorai_security',
        DB_SYNCHRONIZE: 'false', DB_MIGRATIONS_RUN: 'true', PORT: String(apiPort), JWT_SECRET: randomBytes(32).toString('hex'), JWT_REFRESH_SECRET: randomBytes(32).toString('hex'), JWT_EXPIRES_IN: '15m',
        CORS_ORIGINS: origin, WEB_URL: origin, PLANOS_ATIVOS: 'false', AVISO_VENCIMENTO_ATIVO: 'false', DEBUG: 'false' },
    });
    let apiError = '';
    apiProcess.stderr.on('data', data => { apiError += data.toString(); });
    apiProcess.stdout.on('data', () => {});
    let ready = false;
    for (let i = 0; i < 240; i++) {
      if (apiProcess.exitCode !== null) throw new Error('API de teste nao iniciou: ' + apiError);
      try { ready = (await fetch(api + '/usuarios')).status === 401; } catch { /* Local process starting. */ }
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error('API de teste nao respondeu');
    const client = new Client({ host: '127.0.0.1', port: Number(dbPort), user: 'postgres', password, database: 'seniorai_security' });
    await client.connect();
    try {
      await client.query('INSERT INTO "DIMIUSUARIO" (codigo,nome,usuario,email,senha,ativo,nivelacesso,cpf) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [1, 'Teste Navegador', 'BROWSER', 'browser@test.com', await bcrypt.hash('Navegador@123456', 10), 'S', 1, '00000000000']);
      await client.query('INSERT INTO "DIMIRECUPERACAOSENHA" (codusuario,token_hash,expira_em) VALUES ($1,$2,$3)', [1, createHash('sha256').update(resetToken).digest('hex'), new Date(Date.now() + 3600000)]);
    } finally { await client.end(); }
    const app = express();
    const headers = require(path.join(web, 'vercel.json')).headers[0].headers;
    app.use((_req, res, next) => { for (const h of headers) res.setHeader(h.key, h.value); next(); });
    app.use(express.static(path.join(web, 'dist/security-browser')));
    app.get('*', (_req, res) => res.sendFile(path.join(web, 'dist/security-browser/index.html')));
    staticServer = await new Promise(resolve => { const s = app.listen(webPort, '127.0.0.1', () => resolve(s)); });
    await new Promise((resolve, reject) => {
      const testProcess = spawn(process.execPath, [path.join(web, 'node_modules/@playwright/test/cli.js'), 'test'], {
        cwd: web, stdio: 'inherit', env: { ...process.env, SECURITY_BROWSER_URL: origin, SECURITY_BROWSER_API: api, SECURITY_BROWSER_RESET_TOKEN: resetToken },
      });
      testProcess.once('error', reject);
      testProcess.once('exit', code => code === 0 ? resolve() : reject(new Error('Teste de navegador falhou')));
    });
  } finally {
    if (apiProcess && apiProcess.exitCode === null) { apiProcess.kill(); await new Promise(resolve => apiProcess.once('exit', resolve)); }
    if (staticServer) await new Promise(resolve => staticServer.close(resolve));
    if (container && /^senior-ai-security-[a-f0-9-]{36}$/.test(name)) execFileSync('docker', ['rm', '--force', name], { stdio: 'ignore' });
    console.log('API e banco de teste encerrados. Nenhum banco publicado foi utilizado.');
  }
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
