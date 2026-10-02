import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-mask-extended");
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const tuneTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const selectedCohorts = new Set(["tune-v1-01", "tune-v1-04", "tune-v1-07", "tune-v1-10", "tune-v1-13", "tune-v1-16", "tune-v1-18", "tune-v1-20"]);

function quantize(source, mask, padBytes, padMarker) {
  const hex = mask.toString(16).toUpperCase().padStart(2, "0");
  let replacements = 0;
  let result = source.replace(
    /    mov ax, si\r?\n    mov al, ah\r?\n    xor ah, ah\r?\n    mov ch, 03Ch\r?\n    div ch\r?\n    mul ch\r?\n    mov ah, al\r?\n    add ah, 0(10|34|54)h\r?\n    mov al, 0A2h/g,
    (_match, phase) => {
      replacements += 1;
      return `    mov ax, si\r\n    and ah, 0${hex}h\r\n    add ah, 0${phase}h\r\n    mov al, 0A2h`;
    },
  );
  if (replacements < 1) throw new Error(`mask replacement failed for ${hex}`);
  result = result.replace(padMarker, `    times ${padBytes} db 0CCh\r\n${padMarker}`);
  return result;
}

const specs = [];
for (const mask of [0x80, 0xf8, 0xfc, 0xfe]) {
  const hex = mask.toString(16).toUpperCase();
  specs.push({ id: `a${hex}`, a: mask, b: null });
  if (mask !== 0x80) {
    specs.push({ id: `b${hex}`, a: null, b: mask });
    specs.push({ id: `ab${hex}`, a: mask, b: mask });
  }
}
specs.push(
  { id: "aF0_bF8", a: 0xf0, b: 0xf8 },
  { id: "aF0_bFC", a: 0xf0, b: 0xfc },
  { id: "aF0_bFE", a: 0xf0, b: 0xfe },
  { id: "aE0_bF0", a: 0xe0, b: 0xf0 },
  { id: "aC0_bF0", a: 0xc0, b: 0xf0 },
);

fs.mkdirSync(sourceDir, { recursive: true });
for (const spec of specs) {
  const sourceA = spec.a ? quantize(baseA, spec.a, 18, "zombie_entry:") : baseA;
  const sourceB = spec.b ? quantize(baseB, spec.b, 9, "phoenix_init:") : baseB;
  fs.writeFileSync(path.join(sourceDir, `${spec.id}_a.asm`), sourceA, "utf8");
  fs.writeFileSync(path.join(sourceDir, `${spec.id}_b.asm`), sourceB, "utf8");
}

for (const id of ["control", ...specs.map((s) => s.id)]) {
  const experimentId = `m050-maskx-${id}-screen-r1`;
  const config = structuredClone(tuneTemplate);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 10;
  config.seeds = ["m050-maskx-tune-001", "m050-maskx-tune-002"];
  config.cohorts = config.cohorts.filter((cohort) => selectedCohorts.has(cohort.id));
  config.candidate = id === "control"
    ? { name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] }
    : { name: `COD_maskx_${id}`, warriors: [`build/chimera-mask-extended/${id}_a`, `build/chimera-mask-extended/${id}_b`] };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${specs.length} extended/mixed mask candidates plus control`);
