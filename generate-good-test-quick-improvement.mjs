import crypto from "node:crypto";
import fs from "node:fs";

const source1 = "C:/Users/ronyr/Downloads/Good_Test1";
const source2 = "C:/Users/ronyr/Downloads/Good_Test2";
const expected2 = "3a0f7a2a13dc4e284b226a6b5f33f67cff738656de355977039c418ba170e385";
const outputDirectory = "build/good-test-quick-improvement";
fs.mkdirSync(outputDirectory, { recursive: true });

const original = fs.readFileSync(source2);
const hash = crypto.createHash("sha256").update(original).digest("hex");
if (hash !== expected2) throw new Error(`unexpected Good_Test2 hash: ${hash}`);
if (original[14] !== 0x31 || original[15] !== 0xff) throw new Error("expected XOR DI,DI at offset 14");

// Remove the redundant main-entry XOR DI,DI and compensate every code-relative
// immediate that crosses the removed two bytes.
const patched = Buffer.from(original);
patched[6] = 0x37;   // zombie_entry: 0x39 -> 0x37
patched[53] = 0x9a;  // worker: 0x9c -> 0x9a (main path)
patched[77] = 0x48;  // get-ip correction: 0x4a -> 0x48
patched[100] = 0x9a; // worker: 0x9c -> 0x9a (captured path)
const compact = Buffer.concat([patched.subarray(0, 14), patched.subarray(16)]);
fs.writeFileSync(`${outputDirectory}/Good_Test2_no_main_xordi`, compact);

const base = JSON.parse(fs.readFileSync("config-m050-control-all-field-holdout.json", "utf8"));
const selected = new Set([
  "all-v1-02", "all-v1-03", "all-v1-06", "all-v1-07",
  "all-v1-09", "all-v1-11", "all-v1-16", "all-v1-17",
]);
const cohorts = base.cohorts.filter((cohort) => selected.has(cohort.id));
const variants = {
  control: [source1, source2],
  swapped: [source2, source1],
  no_main_xordi: [source1, `${outputDirectory}/Good_Test2_no_main_xordi`],
  no_main_xordi_swapped: [`${outputDirectory}/Good_Test2_no_main_xordi`, source1],
};

for (const [id, warriors] of Object.entries(variants)) {
  const experimentId = `good-test-quick-${id}`;
  const config = {
    ...structuredClone(base),
    experimentId,
    outputPath: `experiments/good-test-evaluation/${experimentId}.json`,
    runDirectory: `build/official-runs/good-test-evaluation/${experimentId}`,
    battles: 50,
    threads: 4,
    seeds: ["good-test-quick-20260929-a", "good-test-quick-20260929-b"],
    candidate: { name: `COD_${id}`, warriors },
    cohorts,
  };
  fs.writeFileSync(`config-${experimentId}.json`, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${Object.keys(variants).length} quick-evaluation variants`);
