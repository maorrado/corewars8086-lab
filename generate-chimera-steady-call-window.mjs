import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-steady-call-window");
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const tuneTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const targetTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-m050-hard-control-targeted.json"), "utf8"));

function moveSteadyDec(source, label) {
  const split = source.split("worker:");
  if (split.length !== 2) throw new Error(`unexpected worker count in ${label}`);
  const oldTail = "    stosw\r\n    dec di\r\n    call far [bx]";
  let worker = split[1];
  if (!worker.includes(oldTail)) throw new Error(`worker tail not found in ${label}`);
  worker = worker
    .replace(/^\r?\n    movsw/, "\r\n    dec di\r\n    movsw")
    .replace(oldTail, "    stosw\r\n    call far [bx]");
  const result = `${split[0]}worker:${worker}`.replace(
    /; Chimera ([AB]) \(m049\):[^\r\n]*/,
    `; Experimental m050 $1: steady-state DEC moved before copy (${label}); initial DEC preserved.`,
  );
  const beforeCount = (source.match(/\bdec di\b/g) ?? []).length;
  const afterCount = (result.match(/\bdec di\b/g) ?? []).length;
  if (beforeCount !== afterCount) throw new Error(`DEC count changed in ${label}: ${beforeCount} -> ${afterCount}`);
  return result;
}

const variants = [
  { id: "move_a", a: true, b: false },
  { id: "move_b", a: false, b: true },
  { id: "move_ab", a: true, b: true },
];

fs.mkdirSync(sourceDir, { recursive: true });
for (const variant of variants) {
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_a.asm`), variant.a ? moveSteadyDec(baseA, variant.id) : baseA, "utf8");
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_b.asm`), variant.b ? moveSteadyDec(baseB, variant.id) : baseB, "utf8");
}

for (const id of ["control", ...variants.map((v) => v.id)]) {
  for (const [gate, template, battles, seeds] of [
    ["tune", tuneTemplate, 10, ["m050-steady-window-tune-001", "m050-steady-window-tune-002"]],
    ["targeted", targetTemplate, 40, ["m050-steady-window-target-001", "m050-steady-window-target-002"]],
  ]) {
    const experimentId = `m050-steady-window-${id}-${gate}-r1`;
    const config = structuredClone(template);
    config.experimentId = experimentId;
    config.outputPath = `experiments/m050-search/${experimentId}.json`;
    config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
    config.battles = battles;
    config.seeds = seeds;
    config.candidate = id === "control"
      ? { name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] }
      : { name: `COD_${id}`, warriors: [`build/chimera-steady-call-window/${id}_a`, `build/chimera-steady-call-window/${id}_b`] };
    fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }
}

console.log(`generated ${variants.length} steady-state call-window candidates plus control`);
