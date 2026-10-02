import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-alias-copycount");
const buildDir = path.join(root, "build", "chimera-alias-copycount");
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");

function mutateA(copyWords, aliasAnchor) {
  let source = baseA;
  if (aliasAnchor) {
    source = source.replace("mov ax, 01FFFh", "mov ax, 018FFh");
  }
  source = source.replace("mov cx, 8\r\n    mov dx, 03800h", `mov cx, ${copyWords}\r\n    mov dx, 03800h`);
  if (!source.includes(`mov cx, ${copyWords}\r\n    mov dx, 03800h`)) {
    throw new Error(`failed to set A first-copy count to ${copyWords}`);
  }
  return source.replace(
    /; Chimera A \(m049\):[^\r\n]*/,
    `; Experimental m050 A: first-copy=${copyWords}, dynamic anchor=${aliasAnchor ? "FF18" : "FF1F"}.`,
  );
}

const variants = [
  { name: "control", copyWords: 8, aliasAnchor: false },
  { name: "copy7", copyWords: 7, aliasAnchor: false },
  { name: "alias_c6", copyWords: 6, aliasAnchor: true },
  { name: "alias_c7", copyWords: 7, aliasAnchor: true },
  { name: "alias_c8", copyWords: 8, aliasAnchor: true },
  { name: "alias_c9", copyWords: 9, aliasAnchor: true },
  { name: "alias_c10", copyWords: 10, aliasAnchor: true },
];

fs.mkdirSync(sourceDir, { recursive: true });
fs.mkdirSync(buildDir, { recursive: true });
for (const variant of variants) {
  const aName = `${variant.name}_a`;
  const bName = `${variant.name}_b`;
  fs.writeFileSync(path.join(sourceDir, `${aName}.asm`), mutateA(variant.copyWords, variant.aliasAnchor), "utf8");
  fs.writeFileSync(path.join(sourceDir, `${bName}.asm`), baseB, "utf8");

  const experimentId = `m050-ac-${variant.name}-tune-r1`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 25;
  config.seeds = ["m050-ac-r1-001", "m050-ac-r1-002"];
  config.candidate = {
    name: `COD_${variant.name}`,
    warriors: [
      `build/chimera-alias-copycount/${aName}`,
      `build/chimera-alias-copycount/${bName}`,
    ],
  };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify({ sourceDir, buildDir, variants }, null, 2));
