import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-int86-postwall");
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const tuneTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const targetTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-m050-hard-control-targeted.json"), "utf8"));

const postB = baseB
  .replace(/; Chimera B \(m049\):[^\r\n]*/, "; Experimental m050 B: place INT86 FF1F/CCCC decoy wall after the native INT87.")
  .replace(
    "    std\r\n    int 087h\r\n    cld",
    "    std\r\n    int 087h\r\n    mov ax, 01FFFh\r\n    int 086h\r\n    cld",
  );
if (postB === baseB || !postB.includes("int 086h")) throw new Error("failed postwall insertion");

fs.mkdirSync(sourceDir, { recursive: true });
fs.writeFileSync(path.join(sourceDir, "post_b_a.asm"), baseA, "utf8");
fs.writeFileSync(path.join(sourceDir, "post_b_b.asm"), postB, "utf8");

for (const [gate, template, battles, seeds] of [
  ["targeted", targetTemplate, 20, ["m050-postwall-target-001", "m050-postwall-target-002"]],
  ["tune", tuneTemplate, 10, ["m050-postwall-tune-001", "m050-postwall-tune-002"]],
]) {
  for (const variant of ["control", "pre_b", "post_b"]) {
    const experimentId = `m050-postwall-${variant}-${gate}-r1`;
    const config = structuredClone(template);
    config.experimentId = experimentId;
    config.outputPath = `experiments/m050-search/${experimentId}.json`;
    config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
    config.battles = battles;
    config.seeds = seeds;
    config.candidate = variant === "control"
      ? { name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] }
      : variant === "pre_b"
        ? { name: "COD_wall_pre_b", warriors: ["build/chimera-int86-decoy-wall/wall_b_a", "build/chimera-int86-decoy-wall/wall_b_b"] }
        : { name: "COD_wall_post_b", warriors: ["build/chimera-int86-postwall/post_b_a", "build/chimera-int86-postwall/post_b_b"] };
    fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }
}

console.log("generated post-INT87 wall candidate and comparison configs");
