import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-tail-guard");
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const targetTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-m050-hard-control-targeted.json"), "utf8"));
const tuneTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const selectedCohorts = new Set(["tune-v1-01", "tune-v1-04", "tune-v1-07", "tune-v1-10", "tune-v1-13", "tune-v1-16", "tune-v1-18", "tune-v1-20"]);
const guards = [0x00, 0x26, 0x60, 0x90, 0x9b, 0xa5, 0xc3, 0xcb, 0xeb, 0xf3, 0xfe, 0xff];
const variants = [];

function appendGuard(source, value, survivor) {
  const hex = value.toString(16).toUpperCase().padStart(2, "0");
  return source
    .replace(/; Chimera ([AB]) \(m049\):[^\r\n]*/, `; Experimental m050 $1: ${hex}h copied tail guard (${survivor}).`)
    .replace(/\s*$/, `\r\n\r\n    db 0${hex}h\r\n`);
}

fs.mkdirSync(sourceDir, { recursive: true });
for (const guard of guards) {
  const hex = guard.toString(16).toUpperCase().padStart(2, "0");
  const id = `both_g${hex}`;
  fs.writeFileSync(path.join(sourceDir, `${id}_a.asm`), appendGuard(baseA, guard, "A"), "utf8");
  fs.writeFileSync(path.join(sourceDir, `${id}_b.asm`), appendGuard(baseB, guard, "B"), "utf8");
  variants.push(id);
}

for (const id of ["control", ...variants]) {
  for (const [gate, template, battles, seeds] of [
    ["targeted", targetTemplate, 20, ["m050-tail-target-001", "m050-tail-target-002"]],
    ["tune-screen", tuneTemplate, 10, ["m050-tail-tune-001", "m050-tail-tune-002"]],
  ]) {
    const experimentId = `m050-tail-${id}-${gate}-r1`;
    const config = structuredClone(template);
    config.experimentId = experimentId;
    config.outputPath = `experiments/m050-search/${experimentId}.json`;
    config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
    config.battles = battles;
    config.seeds = seeds;
    if (gate === "tune-screen") config.cohorts = config.cohorts.filter((cohort) => selectedCohorts.has(cohort.id));
    config.candidate = id === "control"
      ? { name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] }
      : { name: `COD_tail_${id}`, warriors: [`build/chimera-tail-guard/${id}_a`, `build/chimera-tail-guard/${id}_b`] };
    fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }
}

console.log(`generated ${variants.length} copied-tail guard candidates plus control`);
