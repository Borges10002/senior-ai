const { spawn } = require("node:child_process");

const COMANDOS = ["dev", "start", "admin:promover"];

const [mode, command, ...args] = process.argv.slice(2);
if (!["local", "online"].includes(mode) || !COMANDOS.includes(command)) {
  console.error(`Uso: node scripts/run-environment.cjs <local|online> <${COMANDOS.join("|")}> [args]`);
  process.exit(1);
}

const npmArgs = [process.env.npm_execpath, "run", command];
if (args.length) npmArgs.push("--", ...args);

const child = spawn(process.execPath, npmArgs, {
  stdio: "inherit",
  env: { ...process.env, APP_ENV: mode },
});
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
