import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-mask-quantizer");
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
  if (padBytes > 0) {
    const padding = `    times ${padBytes} db 0CCh\r\n`;
    result = result.replace(padMarker, `${padding}${padMarker}`);
  }
  return result;
}

const variants = [];
for (const mask of [0xc0, 0xe0, 0xf0]) {
  const hex = mask.toString(16).toUpperCase();
  for (const mode of ["a_pad", "b_raw", "b_pad", "ab_pad"]) {
    const id = `m${hex}_${mode}`;
    const changeA = mode === "a_pad" || mode === "ab_pad";
    const changeB = mode.startsWith("b_") || mode === "ab_pad";
    const sourceA = changeA ? quantize(baseA, mask, 18, "zombie_entry:") : baseA;
    const sourceB = changeB ? quantize(baseB, mask, mode.endsWith("pad") ? 9 : 0, "phoenix_init:") : baseB;
    variants.push({ id, sourceA, sourceB });
  }
}

fs.mkdirSync(sourceDir, { recursive: true });
for (const variant of variants) {
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_a.asm`), variant.sourceA, "utf8");
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_b.asm`), variant.sourceB, "utf8");
}

for (const id of ["control", ...variants.map((v) => v.id)]) {
  const experimentId = `m050-mask-${id}-screen-r1`;
  const config = structuredClone(tuneTemplate);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 10;
  config.seeds = ["m050-mask-tune-001", "m050-mask-tune-002"];
  config.cohorts = config.cohorts.filter((cohort) => selectedCohorts.has(cohort.id));
  config.candidate = id === "control"
    ? { name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] }
    : { name: `COD_${id}`, warriors: [`build/chimera-mask-quantizer/${id}_a`, `build/chimera-mask-quantizer/${id}_b`] };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} mask-quantizer candidates plus control`);
