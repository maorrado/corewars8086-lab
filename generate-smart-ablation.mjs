import fs from "node:fs";

const root = "candidates/generated/smart-ablation-2026-09-30";
fs.mkdirSync(root, { recursive: true });
const a = fs.readFileSync("candidates/generated/smart-counter-2026-09-30/SmartA.asm", "utf8");
const b = fs.readFileSync("candidates/generated/smart-counter-2026-09-30/SmartB.asm", "utf8");
function save(name, aSource, bSource) {
  const dir = `${root}/${name}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/A.asm`, aSource);
  fs.writeFileSync(`${dir}/B.asm`, bSource);
}
const fixed = (source) => source.replace("    xor bp, dx\n", "    mov bp, bp\n");
const copyNine = (source) => source.replaceAll("    mov cx, 10\n", "    mov cx, 9\n").replace("    mov cx, 9\n    mov dx,", "    mov cx, 8\n    mov dx,").replace("    mov cl, 10\n", "    mov cl, 9\n");
save("fixed-both", fixed(a), fixed(b));
save("fixed-a", fixed(a), b);
save("fixed-b", a, fixed(b));
save("copy-nine", copyNine(a), copyNine(b));
save("copy-nine-a", copyNine(a), b);
save("copy-nine-b", a, copyNine(b));
const config = JSON.parse(fs.readFileSync("config-smart-counter-joint-smart.json", "utf8"));
for (const name of ["fixed-both", "fixed-a", "fixed-b", "copy-nine", "copy-nine-a", "copy-nine-b", "hybrid-a", "hybrid-b"]) {
  const c = structuredClone(config);
  c.experimentId = `smart-ablation-${name}`;
  c.outputPath = `experiments/smart-counter-2026-09-30/screen/${name}.json`;
  c.runDirectory = `build/official-runs/smart-counter-2026-09-30/screen/${name}`;
  c.battles = 100;
  c.seeds = ["smart-screen-fresh-a", "smart-screen-fresh-b"];
  const pair = name === "hybrid-a" ? ["build/smart-counter-2026-09-30/SmartA", config.cohorts[0].opponents[0].warriors[1]]
    : name === "hybrid-b" ? [config.cohorts[0].opponents[0].warriors[0], "build/smart-counter-2026-09-30/SmartB"]
      : [`build/smart-ablation-2026-09-30/${name}/A`, `build/smart-ablation-2026-09-30/${name}/B`];
  c.candidate = { name: `COD_${name.replaceAll("-", "_")}`, warriors: pair };
  fs.writeFileSync(`config-smart-ablation-${name}.json`, `${JSON.stringify(c, null, 2)}\n`);
}
