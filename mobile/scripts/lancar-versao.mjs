#!/usr/bin/env node
/**
 * Lança uma versão nova do app Android de ponta a ponta:
 *   1. sobe a versão em app.json;
 *   2. gera o APK no EAS (perfil "apk") e espera terminar;
 *   3. baixa o APK para ../seniorai.apk;
 *   4. envia o APK para o Cloudflare R2 e confere o download público;
 *   5. só então anuncia a versão em web/public/app-versao.json;
 *   6. commita e envia para a main (a Vercel publica e o app se atualiza sozinho).
 *
 * Uso (na pasta mobile):
 *   npm run lancar -- --novidades "Gráfico novo; Correção no login"
 *   npm run lancar -- --minor --novidades "..."      (1.2.0 -> 1.3.0; padrão: --patch)
 *   npm run lancar -- --versao 2.0.0 --obrigatoria --novidades "..."
 *   npm run lancar -- --sem-push --novidades "..."   (faz tudo, mas não envia para a main)
 *   npm run lancar -- --testar-r2                     (só confere as credenciais do R2)
 *
 * Credenciais do R2 em mobile/.env.lancamento.local ou mobile/.env (nenhum vai para o Git):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *   R2_BUCKET=seniorai-app, R2_CHAVE=seniorai/seniorai.apk
 */
import { execFileSync, spawnSync } from "node:child_process";
import { createHash, createHmac } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MOBILE = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAIZ = join(MOBILE, "..");
const APP_JSON = join(MOBILE, "app.json");
const VERSAO_JSON = join(RAIZ, "web", "public", "app-versao.json");
const APK_LOCAL = join(RAIZ, "seniorai.apk");
const URL_PUBLICA = "https://download.dimitech.com.br/seniorai/seniorai.apk";
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";

const passo = (n, texto) => console.log(`\n[${n}/6] ${texto}`);
const falhar = (texto) => {
  console.error(`\n✖ ${texto}`);
  process.exit(1);
};

// ---------- argumentos ----------
const args = process.argv.slice(2);
const valor = (nome) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};
const tem = (nome) => args.includes(nome);

const env = { ...lerEnv(join(MOBILE, ".env")), ...lerEnv(join(MOBILE, ".env.lancamento.local")) };
const R2 = {
  // Aceita o ID puro ou o endpoint S3 (https://<id>.r2.cloudflarestorage.com).
  conta: /[a-f0-9]{32}/i.exec(env.R2_ACCOUNT_ID ?? "")?.[0],
  chaveAcesso: env.R2_ACCESS_KEY_ID,
  segredo: env.R2_SECRET_ACCESS_KEY,
  bucket: env.R2_BUCKET || "seniorai-app",
  chave: env.R2_CHAVE || "seniorai/seniorai.apk",
};
conferirCredenciaisR2();

if (tem("--testar-r2")) {
  // Envia um arquivo pequeno ao lado do APK, confere pelo endereço público e apaga.
  const chaveTeste = R2.chave.replace(/[^/]+$/, "teste-lancamento.txt");
  const conteudo = Buffer.from(`teste ${new Date().toISOString()}`);
  console.log(`Testando o R2 (${R2.bucket}/${chaveTeste})...`);
  await requisicaoR2("PUT", chaveTeste, conteudo, "text/plain");
  console.log("   Envio aceito pelo R2.");
  const publico = await fetch(`${URL_PUBLICA.replace(/[^/]+$/, "teste-lancamento.txt")}?t=${Date.now()}`);
  console.log(publico.ok ? "   Arquivo visível no endereço público." : `   Aviso: o endereço público respondeu ${publico.status}.`);
  await requisicaoR2("DELETE", chaveTeste);
  console.log("   Arquivo de teste apagado.\n\n✔ Credenciais do R2 funcionando.");
  process.exit(0);
}

const novidades = (valor("--novidades") ?? "")
  .split(";")
  .map((n) => n.trim())
  .filter(Boolean);
if (!novidades.length) falhar('Informe o que mudou: --novidades "Primeira novidade; Segunda novidade"');

// ---------- conferências antes de começar ----------
const git = (...a) => execFileSync("git", a, { cwd: RAIZ, encoding: "utf8" }).trim();
if (git("rev-parse", "--abbrev-ref", "HEAD") !== "main") falhar("Rode o lançamento na branch main.");
const sujos = git("status", "--porcelain", "--", "mobile", "web/public/app-versao.json")
  .split("\n")
  .filter((l) => l && !l.startsWith("??"));
if (sujos.length) falhar(`Há alterações não commitadas no app:\n${sujos.join("\n")}\nCommite antes de lançar.`);


// ---------- 1. versão ----------
const appJson = JSON.parse(readFileSync(APP_JSON, "utf8"));
const atual = appJson.expo.version;
const nova = valor("--versao") ?? subir(atual, tem("--major") ? "major" : tem("--minor") ? "minor" : "patch");
if (!/^\d+\.\d+\.\d+$/.test(nova)) falhar(`Versão inválida: ${nova}`);
if (comparar(nova, atual) <= 0) falhar(`A versão nova (${nova}) precisa ser maior que a atual (${atual}).`);
passo(1, `Versão ${atual} → ${nova}`);
appJson.expo.version = nova;
writeFileSync(APP_JSON, `${JSON.stringify(appJson, null, 2)}\n`);

// ---------- 2. build no EAS ----------
passo(2, "Gerando o APK no EAS (leva alguns minutos)...");
const build = spawnSync(
  NPX,
  ["eas-cli@latest", "build", "--platform", "android", "--profile", "apk", "--non-interactive", "--wait", "--json"],
  { cwd: MOBILE, encoding: "utf8", shell: process.platform === "win32", stdio: ["ignore", "pipe", "inherit"] },
);
const builds = lerJson(build.stdout);
const urlApk = Array.isArray(builds) ? builds[0]?.artifacts?.buildUrl : undefined;
if (build.status !== 0 || !urlApk) {
  restaurarVersao(atual);
  falhar("O build no EAS falhou (veja o log acima). A versão do app.json foi restaurada.");
}

// ---------- 3. download ----------
passo(3, "Baixando o APK...");
const resposta = await fetch(urlApk);
if (!resposta.ok) falhar(`Não foi possível baixar o APK (${resposta.status}).`);
const apk = Buffer.from(await resposta.arrayBuffer());
if (apk.subarray(0, 2).toString() !== "PK") falhar("O arquivo baixado não é um APK válido.");
writeFileSync(APK_LOCAL, apk);
console.log(`   ${APK_LOCAL} (${(apk.length / 1024 / 1024).toFixed(1)} MB)`);

// ---------- 4. envio para o R2 ----------
passo(4, `Enviando para o R2 (${R2.bucket}/${R2.chave})...`);
await requisicaoR2("PUT", R2.chave, apk, "application/vnd.android.package-archive");
console.log(`   Enviado (${statSync(APK_LOCAL).size} bytes).`);
const publicado = await fetch(`${URL_PUBLICA}?v=${nova}`, { method: "HEAD" });
const tamanho = Number(publicado.headers.get("content-length"));
if (!publicado.ok || tamanho !== apk.length) {
  falhar(`O download público ainda não entrega o APK novo (status ${publicado.status}, ${tamanho} bytes). app-versao.json NÃO foi alterado.`);
}
console.log("   Download público conferido.");

// ---------- 5. anúncio da versão ----------
passo(5, "Atualizando web/public/app-versao.json...");
writeFileSync(
  VERSAO_JSON,
  `${JSON.stringify(
    {
      versao: nova,
      url: `${URL_PUBLICA}?v=${nova}`,
      data: new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }),
      obrigatoria: tem("--obrigatoria"),
      novidades,
    },
    null,
    2,
  )}\n`,
);

// ---------- 6. commit e envio ----------
passo(6, tem("--sem-push") ? "Commit (sem enviar para a main)..." : "Commit e envio para a main...");
git("add", "mobile/app.json", "web/public/app-versao.json");
git("commit", "-m", `chore: lançar a versão ${nova} do app\n\n${novidades.map((n) => `- ${n}`).join("\n")}`);
if (!tem("--sem-push")) git("push", "origin", "main");
console.log(
  `\n✔ Versão ${nova} lançada.${tem("--sem-push") ? " Falta: git push origin main." : " Em alguns minutos a Vercel publica e os apps 1.1.0+ se atualizam ao abrir."}`,
);

// ======================================================================

function lerEnv(arquivo) {
  if (!existsSync(arquivo)) return {};
  return Object.fromEntries(
    readFileSync(arquivo, "utf8")
      .split(/\r?\n/)
      .filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
  );
}

function lerJson(texto) {
  // O EAS pode escrever avisos antes do JSON: pega do primeiro "[" ou "{".
  const inicio = String(texto ?? "").search(/[[{]/);
  try {
    return inicio >= 0 ? JSON.parse(texto.slice(inicio)) : null;
  } catch {
    return null;
  }
}

function subir(versao, parte) {
  const [maior, menor, correcao] = versao.split(".").map(Number);
  if (parte === "major") return `${maior + 1}.0.0`;
  if (parte === "minor") return `${maior}.${menor + 1}.0`;
  return `${maior}.${menor}.${correcao + 1}`;
}

function comparar(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

function restaurarVersao(versao) {
  const json = JSON.parse(readFileSync(APP_JSON, "utf8"));
  json.expo.version = versao;
  writeFileSync(APP_JSON, `${JSON.stringify(json, null, 2)}\n`);
}

function conferirCredenciaisR2() {
  if (!R2.conta) {
    falhar(
      "R2_ACCOUNT_ID inválido: use o ID da conta Cloudflare (32 letras/números, a-f e 0-9), que aparece no painel do R2 em \"Account ID\" ou no endpoint S3 https://<ID>.r2.cloudflarestorage.com. Não é o token.",
    );
  }
  if (!R2.chaveAcesso || !R2.segredo) {
    falhar("Faltam R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY (gerados ao criar o token de API do R2). Veja o README.");
  }
}

/** Requisição à API do R2 compatível com S3, assinada com AWS Signature V4. */
async function requisicaoR2(metodo, chave, corpo = Buffer.alloc(0), tipo) {
  const host = `${R2.conta}.r2.cloudflarestorage.com`;
  const caminho = `/${R2.bucket}/${chave.split("/").map(encodeURIComponent).join("/")}`;
  const agora = new Date();
  const amzData = agora.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dia = amzData.slice(0, 8);
  const hashCorpo = createHash("sha256").update(corpo).digest("hex");
  const cabecalhos = {
    ...(tipo && { "cache-control": "public, max-age=14400", "content-type": tipo }),
    host,
    "x-amz-content-sha256": hashCorpo,
    "x-amz-date": amzData,
  };
  const nomes = Object.keys(cabecalhos).sort();
  const canonico = [metodo, caminho, "", ...nomes.map((n) => `${n}:${cabecalhos[n]}`), "", nomes.join(";"), hashCorpo].join("\n");
  const escopo = `${dia}/auto/s3/aws4_request`;
  const paraAssinar = ["AWS4-HMAC-SHA256", amzData, escopo, createHash("sha256").update(canonico).digest("hex")].join("\n");
  const hmac = (chave, dado) => createHmac("sha256", chave).update(dado).digest();
  const chaveAssinatura = hmac(hmac(hmac(hmac(`AWS4${R2.segredo}`, dia), "auto"), "s3"), "aws4_request");
  const assinatura = createHmac("sha256", chaveAssinatura).update(paraAssinar).digest("hex");

  const resposta = await fetch(`https://${host}${caminho}`, {
    method: metodo,
    headers: {
      ...cabecalhos,
      authorization: `AWS4-HMAC-SHA256 Credential=${R2.chaveAcesso}/${escopo}, SignedHeaders=${nomes.join(";")}, Signature=${assinatura}`,
    },
    body: metodo === "PUT" ? corpo : undefined,
  });
  if (!resposta.ok) falhar(`O R2 recusou (${metodo} ${resposta.status}): ${(await resposta.text()).slice(0, 300)}`);
}
