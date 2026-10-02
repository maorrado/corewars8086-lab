import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-wall-phase-sweep");
const preA = fs.readFileSync(path.join(root, "candidates", "generated", "chimera-int86-decoy-wall", "wall_b_a.asm"), "utf8");
const preB = fs.readFileSync(path.join(root, "candidates", "generated", "chimera-int86-decoy-wall", "wall_b_b.asm"), "utf8");
const postB = fs.readFileSync(path.join(root, "candidates", "generated", "chimera-int86-postwall", "post_b_b.asm"), "utf8");
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const selectedCohorts = new Set(["tune-v1-01", "tune-v1-04", "tune-v1-07", "tune-v1-10", "tune-v1-13", "tune-v1-16", "tune-v1-18", "tune-v1-20"]);
const phases = [0x24, 0x28, 0x2c, 0x30, 0x34, 0x38, 0x3c, 0x40, 0x44];
const variants = [];

fs.mkdirSync(sourceDir, { recursive: true });
for (const timing of ["pre", "post"]) {
  for (const phase of phases) {
    const phaseHex = phase.toString(16).toUpperCase().padStart(2, "0");
    const id = `${timing}_p${phaseHex}`;
    const baseB = timing === "pre" ? preB : postB;
    const changedB = baseB
      .replace(/; Experimental m050 B:[^\r\n]*/, `; Experimental m050 B: ${timing}-INT87 decoy wall, phase ${phaseHex}h.`)
      .replace("    add ah, 034h", `    add ah, 0${phaseHex}h`);
    if (!changedB.includes(`add ah, 0${phaseHex}h`)) throw new Error(`phase edit failed for ${id}`);
    fs.writeFileSync(path.join(sourceDir, `${id}_a.asm`), preA, "utf8");
    fs.writeFileSync(path.join(sourceDir, `${id}_b.asm`), changedB, "utf8");
    variants.push(id);
  }
}

for (const id of ["control", ...variants]) {
  const experimentId = `m050-wall-phase-${id}-screen-r1`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 10;
  config.seeds = ["m050-wall-phase-001", "m050-wall-phase-002"];
  config.cohorts = config.cohorts.filter((cohort) => selectedCohorts.has(cohort.id));
  config.candidate = id === "control"
    ? { name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] }
    : { name: `COD_wall_${id}`, warriors: [`build/chimera-wall-phase-sweep/${id}_a`, `build/chimera-wall-phase-sweep/${id}_b`] };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} wall/phase candidates plus control`);
