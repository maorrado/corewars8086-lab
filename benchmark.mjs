import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const configPath = process.argv[2];
if (!configPath) {
  throw new Error("usage: node benchmark.mjs <config.json>");
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const root = path.dirname(path.resolve(configPath));
const readBytes = (name) => [...fs.readFileSync(path.resolve(root, name))];
const readText = (name) => fs.readFileSync(path.resolve(root, name), "utf8");

const browser = await chromium.launch({
  headless: true,
  executablePath: config.browserPath ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await browser.newPage();
page.on("console", (message) => {
  if (config.verbose) process.stderr.write(`[browser:${message.type()}] ${message.text()}\n`);
});
page.on("pageerror", (error) => process.stderr.write(`[pageerror] ${error.stack}\n`));

await page.goto(config.url ?? "http://127.0.0.1:8123/page.html", { waitUntil: "load" });
await page.waitForFunction(() => typeof window.j_loadBinary === "function");

const configuredTeams = [...(config.teams ?? [])];
for (const directory of config.teamDirectories ?? []) {
  const absoluteDirectory = path.resolve(root, directory.path);
  const paired = new Map();
  for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const match = /^(.*)([12])$/.exec(entry.name);
    if (!match) continue;
    const [, name, suffix] = match;
    if (directory.include && !(new RegExp(directory.include).test(name))) continue;
    if (directory.exclude && new RegExp(directory.exclude).test(name)) continue;
    const pair = paired.get(name) ?? [];
    pair[Number(suffix) - 1] = path.join(directory.path, entry.name);
    paired.set(name, pair);
  }
  for (const [name, warriors] of [...paired.entries()].sort()) {
    if (warriors.length === 2 && warriors.every(Boolean)) configuredTeams.push({ name, warriors });
  }
}

const configuredZombies = [...(config.zombies ?? [])];
for (const directory of config.zombieDirectories ?? []) {
  const absoluteDirectory = path.resolve(root, directory.path);
  for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (directory.include && !(new RegExp(directory.include).test(entry.name))) continue;
    if (directory.exclude && new RegExp(directory.exclude).test(entry.name)) continue;
    configuredZombies.push({ name: entry.name, path: path.join(directory.path, entry.name) });
  }
}

const teams = configuredTeams.map((team) => ({
  name: team.name,
  warriors: team.asmWarriors
    ? team.asmWarriors.map((name) => ({ kind: "asm", data: readText(name) }))
    : team.warriors.map((name) => ({ kind: "binary", data: readBytes(name) })),
}));
const zombies = configuredZombies.map((zombie) => ({
  name: zombie.name,
  bytes: readBytes(zombie.path),
}));

await page.evaluate(({ teams, zombies, battles, seed }) => {
  window.removeAllPlayers();
  window.removeAllZombies();
  window.__compileDiagnostics = [];

  for (const team of teams) {
    const label = window.addPlayerPanel_as(team.name, team.warriors.length === 2);
    team.warriors.forEach((warrior, index) => {
      window.j_srcSelectionChanged(label, index + 1);
      if (warrior.kind === "asm") {
        window.asm_edit.value = warrior.data;
        window.j_asm_edit_changed();
        window.__compileDiagnostics.push({
          team: team.name,
          warrior: index + 1,
          assemblerOutput: window.asm_output?.innerText,
          assemblerConsole: window.g_outputText,
          editorValue: window.asm_edit?.value,
          markedLines: [...document.querySelectorAll("#asm_linenums .edit_warning, #asm_linenums [class]")]
            .map((element) => ({ id: element.id, className: element.className, text: element.innerText })),
        });
      } else {
        const binary = Uint8Array.from(warrior.data);
        window.doLoadBinary(binary.buffer);
      }
    });
  }

  for (const zombie of zombies) {
    const label = window.addZombieCode_as(zombie.name);
    window.j_srcSelectionChanged(label, 1);
    const binary = Uint8Array.from(zombie.bytes);
    window.doLoadBinary(binary.buffer);
  }
  window.player_check_zombies.checked = zombies.length > 0;
  window.battlesPerGroupField.value = String(battles);
  window.seed.value = String(seed);
  window.competeCheckbox.checked = true;
  window.openCompete();
  window.competeRunCheckbox.checked = true;
  window.triggerStartCompete();
}, {
  teams,
  zombies,
  battles: config.battles ?? 100,
  seed: config.seed ?? "guru",
});

await page.waitForFunction(() => !window.competeRunCheckbox.checked, null, {
  timeout: config.timeoutMs ?? 30 * 60 * 1000,
});

const result = await page.evaluate(() => ({
  table: window.j_getResultTableText(),
  battlesRan: window.battlesRan?.innerText,
  error: window.error_msg?.innerText,
  assemblerOutput: window.asm_output?.innerText,
  assemblerConsole: window.g_outputText,
  assemblerMarkup: window.asm_pre?.innerHTML,
  compileDiagnostics: window.__compileDiagnostics,
}));
const payload = { config, resolvedTeams: configuredTeams, resolvedZombies: configuredZombies, result };
const outputText = `${JSON.stringify(payload, null, 2)}\n`;
if (config.outputPath) {
  fs.mkdirSync(path.dirname(path.resolve(root, config.outputPath)), { recursive: true });
  fs.writeFileSync(path.resolve(root, config.outputPath), outputText, "utf8");
}
if (config.quiet) {
  console.log(`${config.outputPath ?? configPath}: ${result.battlesRan}; ${result.table.replaceAll("\n", " | ")}`);
} else {
  console.log(outputText);
}
await browser.close();
