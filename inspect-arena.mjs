import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const configPath = process.argv[2];
if (!configPath) throw new Error("usage: node inspect-arena.mjs <config.json>");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const root = path.dirname(path.resolve(configPath));
const readBytes = (name) => [...fs.readFileSync(path.resolve(root, name))];
const readText = (name) => fs.readFileSync(path.resolve(root, name), "utf8");
const teams = config.teams.map((team) => ({
  name: team.name,
  warriors: team.asmWarriors
    ? team.asmWarriors.map((name) => ({ kind: "asm", data: readText(name) }))
    : team.warriors.map((name) => ({ kind: "binary", data: readBytes(name) })),
}));
const zombies = (config.zombies ?? []).map((zombie) => ({
  name: zombie.name,
  bytes: readBytes(zombie.path),
}));

const browser = await chromium.launch({
  headless: true,
  executablePath: config.browserPath ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await browser.newPage({ viewport: { width: 1800, height: 1100 } });
await page.goto(config.url ?? "http://127.0.0.1:8123/page.html", { waitUntil: "load" });
await page.waitForFunction(() => typeof window.j_loadBinary === "function");
await page.evaluate(({ teams, zombies, seed, speed, inspectTeam, inspectWarrior }) => {
  window.removeAllPlayers();
  window.removeAllZombies();
  window.__teamLabels = [];
  for (const team of teams) {
    const label = window.addPlayerPanel_as(team.name, true);
    window.__teamLabels.push(label);
    team.warriors.forEach((warrior, index) => {
      window.j_srcSelectionChanged(label, index + 1);
      if (warrior.kind === "asm") {
        window.asm_edit.value = warrior.data;
        window.j_asm_edit_changed();
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
  window.seed.value = seed;
  window.j_srcSelectionChanged(window.__teamLabels[inspectTeam], inspectWarrior);
  window.debugCheckbox.checked = true;
  window.triggerDebug();
  window.speedSlider.value = String(speed);
  window.speedSlider.dispatchEvent(new Event("input", { bubbles: true }));
}, {
  teams,
  zombies,
  seed: config.seed ?? "arena",
  speed: config.speed ?? 100,
  inspectTeam: config.inspectTeam ?? 0,
  inspectWarrior: config.inspectWarrior ?? 1,
});

const targetRound = config.targetRound ?? 2000;
await page.waitForTimeout(500);
if (await page.evaluate(() => Number(window.stepnum.innerText) === 0 && /resume/i.test(window.btnPause.innerText))) {
  await page.locator("#btnPause").click();
}
await page.waitForFunction((target) => Number(window.stepnum.innerText) >= target || !window.debugCheckbox.checked,
  targetRound, { timeout: config.timeoutMs ?? 120000 });
if (await page.evaluate(() => window.debugCheckbox.checked)) await page.locator("#btnPause").click();
await page.waitForTimeout(250);
await page.evaluate(({ inspectTeam, inspectWarrior }) => {
  const label = window.__teamLabels[inspectTeam];
  const selector = document.getElementById(`sel_code_w${inspectWarrior}_${label}`);
  selector?.removeAttribute("disabled");
  if (selector) selector.checked = true;
  selector?.click();
  if (selector) selector.checked = true;
  window.j_srcSelectionChanged(label, inspectWarrior);
}, { inspectTeam: config.inspectTeam ?? 0, inspectWarrior: config.inspectWarrior ?? 1 });
await page.waitForTimeout(250);
const outputPath = path.resolve(root, config.outputPath ?? "experiments/arena.png");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
await page.locator("#warCanvas").screenshot({ path: outputPath });
const state = await page.evaluate(() => ({
  round: Number(window.stepnum.innerText),
  error: window.error_msg?.innerText,
  messages: window.messagesArea?.innerText,
  canvas: { width: window.warCanvas.width, height: window.warCanvas.height },
  registers: Object.fromEntries(["AX", "BX", "CX", "DX", "SI", "DI", "BP", "SP", "CS", "DS", "SS", "ES", "IP", "Energy", "Flags"]
    .map((name) => [name, document.getElementById(`reg_${name}`)?.value])),
  debugText: window.debug_text?.innerText,
  selectedCodeInputs: [...document.querySelectorAll('input[id^="sel_code_"]:checked')].map((element) => element.id),
}));
fs.writeFileSync(outputPath.replace(/\.png$/i, ".json"), `${JSON.stringify({ config, state }, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, state }));
await browser.close();
