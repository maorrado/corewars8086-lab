import fs from "node:fs";

const directory = "candidates/generated/claude-fixed-toggle-2026-09-30";
fs.mkdirSync(directory, { recursive: true });
for (const [warrior, expectedCx] of [["A", 2], ["B", 1]]) {
  const path = `candidates/generated/smart-counter-2026-09-30/Smart${warrior}.asm`;
  let source = fs.readFileSync(path, "utf8");
  const cxMatches = [...source.matchAll(/mov cx, 10\r?\n/g)].length;
  const clMatches = [...source.matchAll(/mov cl, 10\r?\n/g)].length;
  const xorMatches = [...source.matchAll(/xor bp, dx\r?\n/g)].length;
  if (cxMatches !== expectedCx || clMatches !== 1 || xorMatches !== 1) {
    throw new Error(`unexpected original ${warrior} structure: ${cxMatches}/${clMatches}/${xorMatches}`);
  }
  source = source.replaceAll(/mov cx, 10\r?\n/g, "mov cx, 11\n");
  source = source.replaceAll(/mov cl, 10\r?\n/g, "mov cl, 11\n");
  source = source.replaceAll(/xor bp, dx\r?\n/g, "xor bp, 02000h\n");
  fs.writeFileSync(`${directory}/${warrior}.asm`, source);
}

const fieldTemplate = JSON.parse(fs.readFileSync("config-smart-addboth-holdout-field-add-a.json", "utf8"));
const duelTemplate = JSON.parse(fs.readFileSync("config-smart-addboth-holdout-duel-add-a.json", "utf8"));
const teams = {
  claude: { name: "COD_claude_fixed_toggle", warriors: ["build/claude-fixed-toggle-2026-09-30/A", "build/claude-fixed-toggle-2026-09-30/B"] },
  smart: JSON.parse(fs.readFileSync("config-smart-addboth-holdout-field-smart.json", "utf8")).candidate,
  phase30: JSON.parse(fs.readFileSync("config-smart-addboth-holdout-field-add-a-phase30.json", "utf8")).candidate,
  m050: JSON.parse(fs.readFileSync("config-smart-addboth-holdout-field-m050.json", "utf8")).candidate,
};
for (const [name, candidate] of Object.entries(teams)) {
  for (const [kind, template] of [["field", fieldTemplate], ["duel", duelTemplate]]) {
    if (kind === "duel" && name === "m050") continue;
    const config = structuredClone(template);
    config.experimentId = `claude-fixed-toggle-${kind}-${name}`;
    config.outputPath = `experiments/smart-counter-2026-09-30/claude-fixed-toggle/${kind}-${name}.json`;
    config.runDirectory = `build/official-runs/smart-counter-2026-09-30/claude-fixed-toggle/${kind}-${name}`;
    config.candidate = candidate;
    config.seeds = kind === "field"
      ? ["claude-fixed-toggle-field-20260930-a", "claude-fixed-toggle-field-20260930-b"]
      : ["claude-fixed-toggle-duel-20260930-a", "claude-fixed-toggle-duel-20260930-b", "claude-fixed-toggle-duel-20260930-c", "claude-fixed-toggle-duel-20260930-d"];
    fs.writeFileSync(`config-claude-fixed-toggle-${kind}-${name}.json`, `${JSON.stringify(config, null, 2)}\n`);
  }
}
