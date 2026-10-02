import fs from "node:fs";

const baseA = fs.readFileSync("candidates/generated/m050-pointer-operator/xor-b/A.asm", "utf8");
const baseB = fs.readFileSync("candidates/generated/m050-pointer-operator/xor-b/B.asm", "utf8");
const values = ["3400", "3800", "3c00", "4000", "4400", "4800", "4c00", "5000", "5400"];
const fieldTemplate = JSON.parse(fs.readFileSync("config-m050-pointer-field-xor-b.json", "utf8"));
const duelTemplate = JSON.parse(fs.readFileSync("config-m050-vs-claude-xor-b.json", "utf8"));
for (const value of values) {
  const directory = `candidates/generated/m050-xorb-bp-sweep/${value}`;
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(`${directory}/A.asm`, baseA);
  const sourceB = baseB.replace("mov bp, 04400h", `mov bp, 0${value}h`);
  if (sourceB === baseB && value !== "4400") throw new Error(`missing B BP in ${value}`);
  fs.writeFileSync(`${directory}/B.asm`, sourceB);
  const team = { name: `COD_xorb_bp_${value}`, warriors: [`build/m050-xorb-bp-sweep/${value}/A`, `build/m050-xorb-bp-sweep/${value}/B`] };
  for (const [kind, template] of [["field", fieldTemplate], ["duel", duelTemplate]]) {
    const config = structuredClone(template);
    config.experimentId = `m050-xorb-bp-${kind}-${value}`;
    config.outputPath = `experiments/smart-counter-2026-09-30/xorb-bp-sweep/${kind}-${value}.json`;
    config.runDirectory = `build/official-runs/smart-counter-2026-09-30/xorb-bp-sweep/${kind}-${value}`;
    config.candidate = team;
    if (kind === "duel") {
      config.battles = 100;
      config.seeds = config.seeds.slice(0, 2);
    }
    fs.writeFileSync(`config-m050-xorb-bp-${kind}-${value}.json`, `${JSON.stringify(config, null, 2)}\n`);
  }
}
