import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-disp-anchor-fixed");
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const targetedTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-m050-hard-control-targeted.json"), "utf8"));
const tuneTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));

function mutateA(id, anchorWord, callOperand) {
  let source = baseA.replace(
    /; Chimera A \(m049\):[^\r\n]*/,
    `; Experimental m050 A: complete three-byte ${id} Phoenix anchor.`,
  );
  source = source
    .replaceAll("    mov cx, 9", "    mov cx, 10")
    .replace("    mov cx, 8", "    mov cx, 9")
    .replaceAll("    mov ax, 01FFFh", `    mov ax, ${anchorWord}`)
    .replace(
      /    stosw\r?\n    dec di\r?\n    call far \[bx\]/g,
      `    stosw\r\n    mov [es:di], ch\r\n    call far ${callOperand}`,
    );
  if (!source.includes("mov cl, 9") || !source.includes("mov [es:di], ch")) {
    throw new Error(`failed to build ${id}`);
  }
  return source;
}

const variants = [
  { id: "align_bxsi", anchorWord: "058FFh", callOperand: "[byte bx + si + 0]" },
  { id: "align_bx", anchorWord: "05FFFh", callOperand: "[byte bx + 0]" },
];

fs.mkdirSync(sourceDir, { recursive: true });
for (const variant of variants) {
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_a.asm`), mutateA(variant.id, variant.anchorWord, variant.callOperand), "utf8");
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_b.asm`), baseB, "utf8");

  for (const [gate, template, battles, seeds] of [
    ["targeted", targetedTemplate, 40, ["m050-disp-target-001", "m050-disp-target-002"]],
    ["tune", tuneTemplate, 15, ["m050-disp-tune-001", "m050-disp-tune-002"]],
  ]) {
    const experimentId = `m050-disp-${variant.id}-${gate}-r1`;
    const config = structuredClone(template);
    config.experimentId = experimentId;
    config.outputPath = `experiments/m050-search/${experimentId}.json`;
    config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
    config.battles = battles;
    config.seeds = seeds;
    config.candidate = {
      name: `COD_${variant.id}`,
      warriors: [
        `build/chimera-disp-anchor-fixed/${variant.id}_a`,
        `build/chimera-disp-anchor-fixed/${variant.id}_b`,
      ],
    };
    fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }
}

for (const [id, template, battles, seeds] of [
  ["targeted", targetedTemplate, 40, ["m050-disp-target-001", "m050-disp-target-002"]],
  ["tune", tuneTemplate, 15, ["m050-disp-tune-001", "m050-disp-tune-002"]],
]) {
  const experimentId = `m050-disp-control-${id}-r1`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = battles;
  config.seeds = seeds;
  config.candidate = {
    name: "COD_m049_control",
    warriors: ["build/final/ChimeraA", "build/final/ChimeraB"],
  };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} corrected three-byte anchor variants`);
