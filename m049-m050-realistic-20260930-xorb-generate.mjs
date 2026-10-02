import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const warriors = ["build/m050-pointer-operator/xor-b/A", "build/m050-pointer-operator/xor-b/B"];
const hashes = warriors.map((warrior) => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, warrior))).digest("hex"));
const expected = [
  "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44",
  "fb66036e0b20a8df162da32e453cc148b5ff5ea0d1494439f3c417be0a57d994",
];
if (JSON.stringify(hashes) !== JSON.stringify(expected)) throw new Error(`XOR-B hash mismatch: ${hashes}`);

for (const suffix of ["", "-seed2"]) {
  const baseline = JSON.parse(fs.readFileSync(path.join(root, `m049-m050-realistic-20260930-m050${suffix}.json`), "utf8"));
  const config = structuredClone(baseline);
  config.experimentId = `m049-m050-realistic-20260930-xorb${suffix}`;
  config.outputPath = `experiments/m049-m050-realistic-20260930/xorb${suffix}.json`;
  config.runDirectory = `build/official-runs/m049-m050-realistic-20260930/xorb${suffix}`;
  config.candidate.warriors = warriors;
  const target = path.join(root, `m049-m050-realistic-20260930-xorb${suffix}.json`);
  fs.writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`${target}: ${config.cohorts.length} cohorts, seed=${config.seeds[0]}`);
}
