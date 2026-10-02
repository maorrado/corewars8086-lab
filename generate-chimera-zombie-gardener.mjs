import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const outputDirectory = path.join(root, "candidates", "generated", "chimera-zombie-gardener");
const baseA = fs
  .readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8")
  .replaceAll("\r\n", "\n");
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const selectedCohorts = new Set(["tune-v1-06", "tune-v1-17", "tune-v1-08"]);
const fullTuneFinalists = new Set([
  "garden4_plain_then_phoenix",
  "garden128_then_phoenix",
  "garden64_plain_then_phoenix",
  "garden64_then_phoenix",
]);

const variants = [
  { name: "garden_forever_payload", payload: true, cycles: 0 },
  { name: "garden_forever_plain", payload: false, cycles: 0 },
  { name: "garden1_then_phoenix", payload: true, cycles: 1 },
  { name: "garden2_then_phoenix", payload: true, cycles: 2 },
  { name: "garden4_then_phoenix", payload: true, cycles: 4 },
  { name: "garden8_then_phoenix", payload: true, cycles: 8 },
  { name: "garden1_plain_then_phoenix", payload: false, cycles: 1 },
  { name: "garden4_plain_then_phoenix", payload: false, cycles: 4 },
  { name: "garden16_then_phoenix", payload: true, cycles: 16 },
  { name: "garden32_then_phoenix", payload: true, cycles: 32 },
  { name: "garden64_then_phoenix", payload: true, cycles: 64 },
  { name: "garden128_then_phoenix", payload: true, cycles: 128 },
  { name: "garden64_plain_then_phoenix", payload: false, cycles: 64 },
];

const payload = [
  "    xor di, di",
  "    mov ax, 0A5F3h",
  "    mov dx, 01F06h",
  "    mov bl, 0CCh",
  "    std",
  "    int 087h",
  "    cld",
].join("\n");

function quantize(phase) {
  return [
    "    mov ax, si",
    "    mov al, ah",
    "    xor ah, ah",
    "    mov ch, 03Ch",
    "    div ch",
    "    mul ch",
    "    mov ah, al",
    `    add ah, ${phase}`,
    "    mov al, 0A2h",
  ].join("\n");
}

function makeZombieEntry(variant) {
  const lines = [
    "zombie_entry:",
    ...(variant.payload ? payload.split("\n") : []),
    "    call .get_ip",
    ".get_ip:",
    "    pop si",
    "    sub si, .get_ip - start",
    "    mov dx, si             ; preserve A's load offset for optional Phoenix handoff",
    quantize("010h"),
    "    mov di, ax",
    "    mov ax, FAR_SEG",
    "    mov es, ax",
    "    mov bp, 03C02h         ; STOSW adds 2; subtracting 3C02 advances by -3C00",
    "    mov ax, 01FFFh",
  ];
  if (variant.cycles === 0) {
    lines.push(
      ".repair_forever:",
      "    stosw",
      "    sub di, bp",
      "    jmp short .repair_forever",
    );
  } else {
    lines.push(
      `    mov cx, ${variant.cycles}`,
      ".repair_early:",
      "    stosw",
      "    sub di, bp",
      "    loop .repair_early",
      "    mov si, dx",
      quantize("054h"),
      "    add si, worker - start",
      "    jmp short captured_init",
    );
  }
  return lines.join("\n");
}

const zombieStart = baseA.indexOf("zombie_entry:\n");
const capturedStart = baseA.indexOf("captured_init:\n");
if (zombieStart < 0 || capturedStart < 0 || capturedStart <= zombieStart) {
  throw new Error("unable to locate the m049 zombie_entry/captured_init block");
}

fs.mkdirSync(outputDirectory, { recursive: true });
const manifest = [];
for (const variant of variants) {
  const source = [
    baseA.slice(0, zombieStart),
    makeZombieEntry(variant),
    "\n\n",
    baseA.slice(capturedStart),
  ].join("").replace(
    "; Chimera A (m049): m048 with signature-hardened Phoenix initialization.",
    `; Experimental m050 A: captured-Zombie anchor gardener (${variant.name}).`,
  );
  const sourcePath = path.join(outputDirectory, `${variant.name}.asm`);
  fs.writeFileSync(sourcePath, source, "utf8");
  manifest.push({ ...variant, source: path.relative(root, sourcePath).replaceAll("\\", "/") });

  const experimentId = `m050-${variant.name}-screen`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 20;
  config.seeds = ["m050-gardener-screen-001"];
  config.cohorts = config.cohorts.filter((cohort) => selectedCohorts.has(cohort.id));
  config.candidate = {
    name: `COD_${variant.name}`,
    warriors: [`build/chimera-zombie-gardener/${variant.name}`, "build/final/ChimeraB"],
  };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");

  if (fullTuneFinalists.has(variant.name)) {
    const fullExperimentId = `m050-${variant.name}-full-tune`;
    const fullConfig = structuredClone(template);
    fullConfig.experimentId = fullExperimentId;
    fullConfig.outputPath = `experiments/m050-search/${fullExperimentId}.json`;
    fullConfig.runDirectory = `build/official-runs/m050-search/${fullExperimentId}`;
    fullConfig.battles = 15;
    fullConfig.seeds = ["m050-screen-001", "m050-screen-002"];
    fullConfig.candidate = {
      name: `COD_${variant.name}`,
      warriors: [`build/chimera-zombie-gardener/${variant.name}`, "build/final/ChimeraB"],
    };
    fs.writeFileSync(
      path.join(root, `config-${fullExperimentId}.json`),
      `${JSON.stringify(fullConfig, null, 2)}\n`,
      "utf8",
    );
  }
}

const control = structuredClone(template);
control.experimentId = "m050-gardener-control-screen";
control.outputPath = "experiments/m050-search/m050-gardener-control-screen.json";
control.runDirectory = "build/official-runs/m050-search/m050-gardener-control-screen";
control.battles = 20;
control.seeds = ["m050-gardener-screen-001"];
control.cohorts = control.cohorts.filter((cohort) => selectedCohorts.has(cohort.id));
control.candidate = {
  name: "COD_m049_control",
  warriors: ["build/final/ChimeraA", "build/final/ChimeraB"],
};
fs.writeFileSync(path.join(root, "config-m050-gardener-control-screen.json"), `${JSON.stringify(control, null, 2)}\n`, "utf8");

fs.writeFileSync(
  path.join(outputDirectory, "manifest.json"),
  `${JSON.stringify({ family: "chimera-zombie-gardener", base: "m049 ChimeraA", candidates: manifest }, null, 2)}\n`,
  "utf8",
);
console.log(`generated ${manifest.length} gardener candidates`);
