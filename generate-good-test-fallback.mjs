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

// Keep the partner redirect publication at [4A17h], but remove the main
// process's narrow 0E 17 BB 00 INT87 attack.  The captured-process INT87 path
// remains intact.  Four code-relative immediates move back by 20 bytes.
const patched = Buffer.from(original);
patched[6] = 0x25;   // zombie_entry: 0x39 -> 0x25
patched[53] = 0x88;  // worker: 0x9c -> 0x88 (main path)
patched[77] = 0x36;  // get-ip correction: 0x4a -> 0x36
patched[100] = 0x88; // worker: 0x9c -> 0x88 (captured path)
const fallback = Buffer.concat([patched.subarray(0, 12), patched.subarray(32)]);
const fallbackPath = `${outputDirectory}/Good_Test2_early_fallback`;
fs.writeFileSync(fallbackPath, fallback);

const base = JSON.parse(fs.readFileSync("config-good-test-quick-control.json", "utf8"));
const experimentId = "good-test-quick-early_fallback";
const config = {
  ...structuredClone(base),
  experimentId,
  outputPath: `experiments/good-test-evaluation/${experimentId}.json`,
  runDirectory: `build/official-runs/good-test-evaluation/${experimentId}`,
  candidate: {
    name: "COD_early_fallback",
    warriors: [source1, fallbackPath],
  },
};
fs.writeFileSync(`config-${experimentId}.json`, `${JSON.stringify(config, null, 2)}\n`, "utf8");
console.log(`generated ${fallbackPath} (${fallback.length} bytes)`);
