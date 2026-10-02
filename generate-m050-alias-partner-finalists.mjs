import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const outputDirectory = path.join(root, "candidates", "generated", "m050-alias-partner-finalists");
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const finalists = [
  ["n023a", "candidates/generated/chimera-adaptive/n023_a.asm"],
  ["n033b", "candidates/generated/chimera-adaptive/n033_b.asm"],
  ["n022a", "candidates/generated/chimera-adaptive/n022_a.asm"],
  ["n006a", "candidates/generated/chimera-adaptive/n006_a.asm"],
  ["n007a", "candidates/generated/chimera-adaptive/n007_a.asm"],
  ["n041a", "candidates/generated/chimera-adaptive/n041_a.asm"],
  ["n027a", "candidates/generated/chimera-adaptive/n027_a.asm"],
  ["n016b", "candidates/generated/chimera-adaptive/n016_b.asm"],
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
  if (!original.includes(oldSequence)) throw new Error(`${relativeSource} lacks expected initializer`);
  const source = original
    .replace(oldSequence, hardenedSequence)
    .replace("bits 16\n", `bits 16\n\n; m050 alias-A partner ${id}: signature-hardened.\n`);
  const name = `alias_${id}`;
  const sourcePath = path.join(outputDirectory, `${name}.asm`);
  fs.writeFileSync(sourcePath, source, "utf8");
  manifest.push({ id, name, base: relativeSource });

  const experimentId = `m050-alias-partner-${id}-full-tune`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 15;
  config.seeds = ["m050-screen-001", "m050-screen-002"];
  config.candidate = {
    name: `COD_alias_partner_${id}`,
    warriors: [
      "build/chimera-anchor-alias/alias_a_a",
      `build/m050-alias-partner-finalists/${name}`,
    ],
  };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

fs.writeFileSync(path.join(outputDirectory, "manifest.json"), `${JSON.stringify({ finalists: manifest }, null, 2)}\n`, "utf8");
console.log(`generated ${manifest.length} alias-A partner finalists`);
