import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-zero-di-elision");
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const tuneTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const futureTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-m050-control-future.json"), "utf8"));

function optimizeA(pad) {
  let result = baseA
    .replace("    mov di, ax\r\n    add di, zombie_entry - start\r\n    mov [05D13h], di", "    mov bx, ax\r\n    add bx, zombie_entry - start\r\n    mov [05D13h], bx")
    .replace("    push cs\r\n    pop es\r\n    xor di, di\r\n    mov ax, 0F9EBh", "    push cs\r\n    pop es\r\n    mov ax, 0F9EBh");
  if (pad) result = result.replace("zombie_entry:", "    times 2 db 0CCh\r\nzombie_entry:");
  return result;
}

function optimizeB(pad) {
  let result = baseB.replace("    push cs\r\n    pop es\r\n    xor di, di\r\n    mov ax, 0F9EBh", "    push cs\r\n    pop es\r\n    mov ax, 0F9EBh");
  if (pad) result = result.replace("phoenix_init:", "    times 2 db 0CCh\r\nphoenix_init:");
  return result;
}

const variants = [
  { id: "a_raw", a: true, b: false, pad: false },
  { id: "b_raw", a: false, b: true, pad: false },
  { id: "ab_raw", a: true, b: true, pad: false },
  { id: "a_pad", a: true, b: false, pad: true },
  { id: "b_pad", a: false, b: true, pad: true },
  { id: "ab_pad", a: true, b: true, pad: true },
];

fs.mkdirSync(sourceDir, { recursive: true });
for (const variant of variants) {
  const sourceA = variant.a ? optimizeA(variant.pad) : baseA;
  const sourceB = variant.b ? optimizeB(variant.pad) : baseB;
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_a.asm`), sourceA, "utf8");
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_b.asm`), sourceB, "utf8");
}

for (const id of ["control", ...variants.map((v) => v.id)]) {
  for (const [gate, template, battles, seeds] of [
    ["tune", tuneTemplate, 10, ["m050-zdi-tune-001", "m050-zdi-tune-002"]],
    ["future", futureTemplate, 20, ["m050-zdi-future-001", "m050-zdi-future-002"]],
  ]) {
    const experimentId = `m050-zdi-${id}-${gate}-r1`;
    const config = structuredClone(template);
    config.experimentId = experimentId;
    config.outputPath = path.join(root, "experiments", "m050-search", `${experimentId}.json`);
    config.runDirectory = path.join(root, "build", "official-runs", "m050-search", experimentId);
    config.battles = battles;
    config.seeds = seeds;
    config.candidate = id === "control"
      ? { name: "COD_m049_control", warriors: [path.join(root, "build/final/ChimeraA"), path.join(root, "build/final/ChimeraB")] }
      : { name: `COD_zdi_${id}`, warriors: [path.join(root, `build/chimera-zero-di-elision/${id}_a`), path.join(root, `build/chimera-zero-di-elision/${id}_b`)] };
    fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }
}

console.log(`generated ${variants.length} zero-DI-elision candidates plus controls`);
