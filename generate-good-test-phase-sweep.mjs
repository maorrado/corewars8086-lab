import crypto from "node:crypto";
import fs from "node:fs";

const source1 = "C:/Users/ronyr/Downloads/Good_Test1";
const source2 = "C:/Users/ronyr/Downloads/Good_Test2";
const outputDirectory = "build/good-test-phase-sweep";
fs.mkdirSync(outputDirectory, { recursive: true });
const a = fs.readFileSync(source1);
const b = fs.readFileSync(source2);
const expectedA = "1490503d6bb108d0e6e0c751fdc3ef2c34c81c70c8eb647f27a49510a9cf8e23";
const expectedB = "3a0f7a2a13dc4e284b226a6b5f33f67cff738656de355977039c418ba170e385";
const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
if (sha(a) !== expectedA || sha(b) !== expectedB) throw new Error("Good_Test input hash mismatch");

const variants = [{ id: "control", a: source1, b: source2 }];
function binaryVariant(id, patchA, patchB) {
  const outA = Buffer.from(a);
  const outB = Buffer.from(b);
  if (patchA !== null) outA[65] = patchA;
  if (patchB?.main !== undefined) outB[48] = patchB.main;
  if (patchB?.captured !== undefined) outB[95] = patchB.captured;
  const pathA = `${outputDirectory}/${id}1`;
  const pathB = `${outputDirectory}/${id}2`;
  fs.writeFileSync(pathA, outA);
  fs.writeFileSync(pathB, outB);
  variants.push({ id, a: pathA, b: pathB });
}

for (const value of [0x08, 0x0c, 0x14, 0x18, 0x1c, 0x20, 0x24]) {
  binaryVariant(`bmain_${value.toString(16)}`, null, { main: value });
}
for (const value of [0x28, 0x2c, 0x30, 0x38, 0x3c, 0x40]) {
  binaryVariant(`bcap_${value.toString(16)}`, null, { captured: value });
}
for (const value of [0x24, 0x28, 0x30, 0x34]) {
  binaryVariant(`amain_${value.toString(16)}`, value, null);
}
binaryVariant("spread_28_14_38", 0x28, { main: 0x14, captured: 0x38 });
binaryVariant("spread_30_0c_30", 0x30, { main: 0x0c, captured: 0x30 });

const base = JSON.parse(fs.readFileSync("config-good-test-quick-control.json", "utf8"));
for (const variant of variants) {
  const experimentId = `good-test-phase-${variant.id}`;
  const config = {
    ...structuredClone(base),
    experimentId,
    outputPath: `experiments/good-test-evaluation/phase-sweep/${experimentId}.json`,
    runDirectory: `build/official-runs/good-test-evaluation/phase-sweep/${experimentId}`,
    battles: 30,
    seeds: ["good-test-phase-20260929-a", "good-test-phase-20260929-b"],
    candidate: { name: `COD_${variant.id}`, warriors: [variant.a, variant.b] },
  };
  fs.writeFileSync(`config-${experimentId}.json`, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
fs.writeFileSync(`${outputDirectory}/manifest.json`, `${JSON.stringify(variants, null, 2)}\n`, "utf8");
console.log(`generated ${variants.length} phase variants`);
