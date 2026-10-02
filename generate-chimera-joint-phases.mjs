import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-joint-phases");
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const selectedCohorts = new Set(["tune-v1-01", "tune-v1-04", "tune-v1-08", "tune-v1-11", "tune-v1-15", "tune-v1-17", "tune-v1-19", "tune-v1-20"]);
const bPhases = [0x25, 0x2a, 0x2f, 0x34, 0x39];
const capturedPhases = [0x44, 0x4c, 0x54, 0x5c, 0x64];

const hex8 = (value) => `0${value.toString(16).toUpperCase().padStart(2, "0")}h`;
fs.mkdirSync(sourceDir, { recursive: true });
const manifest = [];

for (const bPhase of bPhases) {
  for (const capturedPhase of capturedPhases) {
    const id = `b${bPhase.toString(16).padStart(2, "0")}_z${capturedPhase.toString(16).padStart(2, "0")}`;
    const a = baseA
      .replace(/; Chimera A \(m049\):[^\r\n]*/, `; Experimental m050 A: captured phase ${hex8(capturedPhase)}.`)
      .replace("add ah, 054h", `add ah, ${hex8(capturedPhase)}`);
    const b = baseB
      .replace(/; Chimera B \(m049\):[^\r\n]*/, `; Experimental m050 B: phase ${hex8(bPhase)}.`)
      .replace("add ah, 034h", `add ah, ${hex8(bPhase)}`);
    fs.writeFileSync(path.join(sourceDir, `${id}_a.asm`), a, "utf8");
    fs.writeFileSync(path.join(sourceDir, `${id}_b.asm`), b, "utf8");

    const experimentId = `m050-jphase-${id}-screen-r1`;
    const config = structuredClone(template);
    config.experimentId = experimentId;
    config.outputPath = `experiments/m050-search/joint-phases/${experimentId}.json`;
    config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
    config.battles = 10;
    config.seeds = ["m050-jphase-screen-001"];
    config.cohorts = config.cohorts.filter((cohort) => selectedCohorts.has(cohort.id));
    config.candidate = {
      name: `COD_${id}`,
      warriors: [
        `build/chimera-joint-phases/${id}_a`,
        `build/chimera-joint-phases/${id}_b`,
      ],
    };
    const configPath = `config-${experimentId}.json`;
    fs.writeFileSync(path.join(root, configPath), `${JSON.stringify(config, null, 2)}\n`, "utf8");
    manifest.push({ id, bPhase, capturedPhase, configPath });
  }
}

fs.writeFileSync(path.join(sourceDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`generated ${manifest.length} joint-phase candidates`);
