import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
for (const id of ["m049", "m050"]) {
  const original = JSON.parse(fs.readFileSync(path.join(root, `m049-m050-realistic-20260930-${id}.json`), "utf8"));
  const config = structuredClone(original);
  config.experimentId = `m049-m050-realistic-20260930-${id}-seed2`;
  config.outputPath = `experiments/m049-m050-realistic-20260930/${id}-seed2.json`;
  config.runDirectory = `build/official-runs/m049-m050-realistic-20260930/${id}-seed2`;
  config.seeds = ["realistic-senior-fresh-20260930-5311"];
  const target = path.join(root, `m049-m050-realistic-20260930-${id}-seed2.json`);
  fs.writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`);
  console.log(target);
}
