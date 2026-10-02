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

function writeVariant(name, mutate) {
  const bytes = Buffer.from(original);
  mutate(bytes);
  const path = `${outputDirectory}/${name}`;
  fs.writeFileSync(path, bytes);
  return path;
}

const stack200 = writeVariant("Good_Test2_stack200", (bytes) => {
  bytes[138] = 0x00;
  bytes[139] = 0x02;
});
const stack280 = writeVariant("Good_Test2_stack280", (bytes) => {
  bytes[138] = 0x80;
  bytes[139] = 0x02;
});
const generalPhoenix = writeVariant("Good_Test2_general_phoenix", (bytes) => {
  bytes[138] = 0x80;
  bytes[139] = 0x02;
  bytes[141] = 0x09;
  bytes[145] = 0x40;
  bytes[148] = 0x44;
});

const base = JSON.parse(fs.readFileSync("config-good-test-quick-control.json", "utf8"));
const variants = { stack200, stack280, general_phoenix: generalPhoenix };
for (const [id, warrior2] of Object.entries(variants)) {
  const experimentId = `good-test-quick-${id}`;
  const config = {
    ...structuredClone(base),
    experimentId,
    outputPath: `experiments/good-test-evaluation/${experimentId}.json`,
    runDirectory: `build/official-runs/good-test-evaluation/${experimentId}`,
    candidate: { name: `COD_${id}`, warriors: [source1, warrior2] },
  };
  fs.writeFileSync(`config-${experimentId}.json`, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${Object.keys(variants).length} Phoenix-constant variants`);
