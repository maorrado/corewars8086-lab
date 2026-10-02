import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-lea-stack");
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const tuneTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const targetTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-m050-hard-control-targeted.json"), "utf8"));
const selectedCohorts = new Set(["tune-v1-01", "tune-v1-04", "tune-v1-07", "tune-v1-10", "tune-v1-13", "tune-v1-16", "tune-v1-18", "tune-v1-20"]);

function lea(source, offset, pad) {
  let result = source.replace(
    `    mov sp, di\r\n    add sp, ${offset}`,
    `    lea sp, [di + ${offset}]`,
  );
  if (result === source) throw new Error(`LEA replacement failed for ${offset}`);
  if (pad) result = result.replace(/\s*$/, `\r\n\r\n    db ${pad.map((b) => `0${b.toString(16).toUpperCase().padStart(2, "0")}h`).join(", ")}\r\n`);
  return result;
}

const variants = [
  { id: "lea_a_raw", a: true, b: false, pad: null },
  { id: "lea_b_raw", a: false, b: true, pad: null },
  { id: "lea_ab_raw", a: true, b: true, pad: null },
  { id: "lea_a_padcc", a: true, b: false, pad: [0xcc, 0xcc] },
  { id: "lea_b_padcc", a: false, b: true, pad: [0xcc, 0xcc] },
  { id: "lea_ab_padcc", a: true, b: true, pad: [0xcc, 0xcc] },
  { id: "lea_b_g90", a: false, b: true, pad: [0x90, 0xcc] },
  { id: "lea_ab_g90", a: true, b: true, pad: [0x90, 0xcc] },
  { id: "lea_b_g00", a: false, b: true, pad: [0x00, 0xcc] },
  { id: "lea_ab_g00", a: true, b: true, pad: [0x00, 0xcc] },
];

fs.mkdirSync(sourceDir, { recursive: true });
for (const variant of variants) {
  const sourceA = variant.a ? lea(baseA, "00200h", variant.pad) : baseA;
  const sourceB = variant.b ? lea(baseB, "00280h", variant.pad) : baseB;
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_a.asm`), sourceA, "utf8");
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_b.asm`), sourceB, "utf8");
}

for (const id of ["control", ...variants.map((v) => v.id)]) {
  for (const [gate, template, battles, seeds] of [
    ["tune-screen", tuneTemplate, 10, ["m050-lea-tune-001", "m050-lea-tune-002"]],
    ["targeted", targetTemplate, 20, ["m050-lea-target-001", "m050-lea-target-002"]],
  ]) {
    const experimentId = `m050-lea-${id}-${gate}-r1`;
    const config = structuredClone(template);
    config.experimentId = experimentId;
    config.outputPath = `experiments/m050-search/${experimentId}.json`;
    config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
    config.battles = battles;
    config.seeds = seeds;
    if (gate === "tune-screen") config.cohorts = config.cohorts.filter((cohort) => selectedCohorts.has(cohort.id));
    config.candidate = id === "control"
      ? { name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] }
      : { name: `COD_${id}`, warriors: [`build/chimera-lea-stack/${id}_a`, `build/chimera-lea-stack/${id}_b`] };
    fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }
}

console.log(`generated ${variants.length} LEA-stack candidates plus control`);
