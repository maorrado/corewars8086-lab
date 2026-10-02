import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const outputDirectory = path.join(root, "candidates", "generated", "chimera-nrg-loop");
const baseB = fs
  .readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8")
  .replaceAll("\r\n", "\n");

fs.mkdirSync(outputDirectory, { recursive: true });

const manifest = [];
for (let count = 1; count <= 6; count += 1) {
  const nrg = Array.from({ length: count }, () => "    db 09Bh, 09Bh        ; NRG").join("\n");
  let source = baseB
    .replace(
      "; Chimera B (m049): m048 with signature-hardened Phoenix initialization.",
      `; Experimental m050 search: m049 B with ${count} protected-loop NRG opcode${count === 1 ? "" : "s"}.`,
    )
    // The private seed must include the enlarged worker.
    .replace("    mov cx, 9\n    rep movsw", `    mov cx, ${9 + count}\n    rep movsw`)
    // The initial arena copy and every later copy retain m049's one-word
    // safety margin while covering the added two bytes per NRG opcode.
    .replace("    mov cx, 9\n    mov dx, 04000h", `    mov cx, ${9 + count}\n    mov dx, 04000h`)
    .replace("    mov cl, 9", `    mov cl, ${9 + count}`)
    .replace(
      "worker:\n    movsw\n    rep movsw\n",
      `worker:\n    movsw\n    rep movsw\n${nrg}\n`,
    );

  const name = `nrg_b${String(count).padStart(2, "0")}`;
  const file = path.join(outputDirectory, `${name}.asm`);
  fs.writeFileSync(file, source, "utf8");
  manifest.push({ name, nrgPerLoop: count, source: path.relative(root, file).replaceAll("\\", "/") });
}

fs.writeFileSync(
  path.join(outputDirectory, "manifest.json"),
  `${JSON.stringify({ family: "chimera-nrg-loop", base: "m049 ChimeraB", candidates: manifest }, null, 2)}\n`,
  "utf8",
);

const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const configs = [
  {
    id: "m049-control",
    warriors: ["build/final/ChimeraA", "build/final/ChimeraB"],
  },
  ...manifest.map((candidate) => ({
    id: candidate.name,
    warriors: ["build/final/ChimeraA", `build/chimera-nrg-loop/${candidate.name}`],
  })),
];

for (const candidate of configs) {
  const experimentId = `m050-${candidate.id}-screen`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 15;
  config.seeds = ["m050-screen-001", "m050-screen-002"];
  config.candidate = {
    name: `COD_${candidate.id.replaceAll("-", "_")}`,
    warriors: candidate.warriors,
  };
  fs.writeFileSync(
    path.join(root, `config-${experimentId}.json`),
    `${JSON.stringify(config, null, 2)}\n`,
    "utf8",
  );
}

console.log(`generated ${manifest.length} candidates in ${outputDirectory}`);
