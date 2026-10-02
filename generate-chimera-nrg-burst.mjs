import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const outputDirectory = path.join(root, "candidates", "generated", "chimera-nrg-burst");
const baseB = fs
  .readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8")
  .replaceAll("\r\n", "\n");
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const selectedCohorts = new Set(["tune-v1-06", "tune-v1-17", "tune-v1-08"]);

const variants = [
  [1, 8], [1, 16], [1, 32], [1, 64],
  [2, 8], [2, 16], [2, 32],
  [3, 4], [3, 8], [3, 16], [3, 32],
  [4, 4], [4, 8], [4, 16],
];

fs.mkdirSync(outputDirectory, { recursive: true });
const manifest = [];

for (const [nrgPerIteration, iterations] of variants) {
  const name = `burst_k${nrgPerIteration}_n${String(iterations).padStart(2, "0")}`;
  const nrg = Array.from(
    { length: nrgPerIteration },
    () => "    db 09Bh, 09Bh        ; NRG",
  ).join("\n");
  const burst = [
    `    mov cx, ${iterations}`,
    `${name}_charge:`,
    nrg,
    `    loop ${name}_charge`,
  ].join("\n");
  const source = baseB
    .replace(
      "; Chimera B (m049): m048 with signature-hardened Phoenix initialization.",
      `; Experimental m050 search: m049 B with a ${iterations}x${nrgPerIteration} NRG pre-Phoenix burst.`,
    )
    .replace("    jmp short phoenix_init\n\nphoenix_init:", `${burst}\n\nphoenix_init:`);
  const sourcePath = path.join(outputDirectory, `${name}.asm`);
  fs.writeFileSync(sourcePath, source, "utf8");
  manifest.push({ name, nrgPerIteration, iterations, source: path.relative(root, sourcePath).replaceAll("\\", "/") });

  const experimentId = `m050-${name}-screen`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 20;
  config.seeds = ["m050-burst-screen-001"];
  config.cohorts = config.cohorts.filter((cohort) => selectedCohorts.has(cohort.id));
  config.candidate = {
    name: `COD_${name}`,
    warriors: ["build/final/ChimeraA", `build/chimera-nrg-burst/${name}`],
  };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

const control = structuredClone(template);
control.experimentId = "m050-burst-control-screen";
control.outputPath = "experiments/m050-search/m050-burst-control-screen.json";
control.runDirectory = "build/official-runs/m050-search/m050-burst-control-screen";
control.battles = 20;
control.seeds = ["m050-burst-screen-001"];
control.cohorts = control.cohorts.filter((cohort) => selectedCohorts.has(cohort.id));
control.candidate = {
  name: "COD_m049_control",
  warriors: ["build/final/ChimeraA", "build/final/ChimeraB"],
};
fs.writeFileSync(
  path.join(root, "config-m050-burst-control-screen.json"),
  `${JSON.stringify(control, null, 2)}\n`,
  "utf8",
);

for (const name of ["burst_k1_n16", "burst_k1_n64"]) {
  const experimentId = `m050-${name}-full-tune`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 15;
  config.seeds = ["m050-screen-001", "m050-screen-002"];
  config.candidate = {
    name: `COD_${name}`,
    warriors: ["build/final/ChimeraA", `build/chimera-nrg-burst/${name}`],
  };
  fs.writeFileSync(
    path.join(root, `config-${experimentId}.json`),
    `${JSON.stringify(config, null, 2)}\n`,
    "utf8",
  );
}

fs.writeFileSync(
  path.join(outputDirectory, "manifest.json"),
  `${JSON.stringify({ family: "chimera-nrg-burst", base: "m049 ChimeraB", candidates: manifest }, null, 2)}\n`,
  "utf8",
);
console.log(`generated ${manifest.length} candidates in ${outputDirectory}`);
