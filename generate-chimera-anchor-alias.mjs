import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-anchor-alias");
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");

function aliasAnchor(source, label) {
  const replaced = source.replace("mov ax, 01FFFh", "mov ax, 018FFh");
  if (replaced === source) throw new Error(`anchor not found in ${label}`);
  return replaced.replace(
    /; Chimera ([AB]) \(m049\):[^\r\n]*/,
    `; Experimental m050 $1: equivalent CALL FAR [BX+SI] anchor (${label}).`,
  );
}

const variants = [
  { name: "alias_a", a: true, b: false },
  { name: "alias_b", a: false, b: true },
  { name: "alias_ab", a: true, b: true },
];

fs.mkdirSync(sourceDir, { recursive: true });
for (const variant of variants) {
  const aPath = path.join(sourceDir, `${variant.name}_a.asm`);
  const bPath = path.join(sourceDir, `${variant.name}_b.asm`);
  fs.writeFileSync(aPath, variant.a ? aliasAnchor(baseA, variant.name) : baseA, "utf8");
  fs.writeFileSync(bPath, variant.b ? aliasAnchor(baseB, variant.name) : baseB, "utf8");

  const experimentId = `m050-${variant.name}-full-tune`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 15;
  config.seeds = ["m050-screen-001", "m050-screen-002"];
  config.candidate = {
    name: `COD_${variant.name}`,
    warriors: [
      `build/chimera-anchor-alias/${variant.name}_a`,
      `build/chimera-anchor-alias/${variant.name}_b`,
    ],
  };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} anchor-alias pairs`);
