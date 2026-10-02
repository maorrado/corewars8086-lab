import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const outputDirectory = path.join(root, "candidates", "generated", "m050-partner-finalists");
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const finalists = [
  ["n017", "candidates/generated/chimera-adaptive/n017_b.asm"],
  ["m045b", "candidates/generated/chimera-focused/m045_b.asm"],
  ["n030", "candidates/generated/chimera-adaptive/n030_b.asm"],
  ["n034", "candidates/generated/chimera-adaptive/n034_b.asm"],
  ["n015", "candidates/generated/chimera-adaptive/n015_b.asm"],
  ["n031", "candidates/generated/chimera-adaptive/n031_b.asm"],
  ["n032", "candidates/generated/chimera-adaptive/n032_b.asm"],
];

fs.mkdirSync(outputDirectory, { recursive: true });
const manifest = [];
for (const [id, relativeSource] of finalists) {
  const original = fs.readFileSync(path.join(root, relativeSource), "utf8").replaceAll("\r\n", "\n");
  const oldSequence = [
    "    push ss",
    "    pop ds",
    "    push cs",
    "    pop ss",
    "    mov bx, PTR_CELL",
  ].join("\n");
  const hardenedSequence = [
    "    push ss",
    "    pop ds",
    "    mov bx, PTR_CELL",
    "    push cs",
    "    pop ss",
  ].join("\n");
  if (!original.includes(oldSequence)) throw new Error(`${relativeSource} lacks the expected initializer sequence`);
  const source = original
    .replace(oldSequence, hardenedSequence)
    .replace("bits 16\n", `bits 16\n\n; m050 partner finalist ${id}: signature-hardened, paired with m049 A.\n`);
  const name = `h_${id}_b`;
  const sourcePath = path.join(outputDirectory, `${name}.asm`);
  fs.writeFileSync(sourcePath, source, "utf8");
  manifest.push({ id, name, base: relativeSource, source: path.relative(root, sourcePath).replaceAll("\\", "/") });

  const experimentId = `m050-partner-${id}-full-tune`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 15;
  config.seeds = ["m050-screen-001", "m050-screen-002"];
  config.candidate = {
    name: `COD_partner_${id}`,
    warriors: ["build/final/ChimeraA", `build/m050-partner-finalists/${name}`],
  };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

fs.writeFileSync(
  path.join(outputDirectory, "manifest.json"),
  `${JSON.stringify({ family: "m050-partner-finalists", baseA: "m049 ChimeraA", candidates: manifest }, null, 2)}\n`,
  "utf8",
);
console.log(`generated ${manifest.length} hardened partner finalists`);
