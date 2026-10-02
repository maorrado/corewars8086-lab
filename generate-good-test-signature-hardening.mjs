import crypto from "node:crypto";
import fs from "node:fs";

const inputs = [
  "C:/Users/ronyr/Downloads/Good_Test1",
  "C:/Users/ronyr/Downloads/Good_Test2",
];
const expected = [
  "1490503d6bb108d0e6e0c751fdc3ef2c34c81c70c8eb647f27a49510a9cf8e23",
  "3a0f7a2a13dc4e284b226a6b5f33f67cff738656de355977039c418ba170e385",
];
const immediates = [[0xc0, 0x02], [0x80, 0x02]];
const outputDirectory = "build/good-test-signature-hardening";
fs.mkdirSync(outputDirectory, { recursive: true });

const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const manifest = [];
for (let index = 0; index < inputs.length; index += 1) {
  const bytes = fs.readFileSync(inputs[index]);
  if (sha256(bytes) !== expected[index]) throw new Error(`input ${index + 1} hash mismatch`);
  const [lo, hi] = immediates[index];
  const pattern = Buffer.from([0x16, 0x1f, 0x0e, 0x17, 0xbb, lo, hi]);
  const offset = bytes.indexOf(pattern);
  if (offset < 0 || bytes.indexOf(pattern, offset + 1) >= 0) throw new Error(`expected one initializer in Good_Test${index + 1}`);
  const hardened = Buffer.from(bytes);
  Buffer.from([0x16, 0x1f, 0xbb, lo, hi, 0x0e, 0x17]).copy(hardened, offset);
  const output = `${outputDirectory}/Good_Test${index + 1}_hardened`;
  fs.writeFileSync(output, hardened);
  const sourceDirectory = "candidates/generated/good-test-signature-hardening";
  fs.mkdirSync(sourceDirectory, { recursive: true });
  const dbLines = [];
  for (let byte = 0; byte < hardened.length; byte += 16) {
    dbLines.push(`db ${[...hardened.subarray(byte, byte + 16)].map((value) => `0x${value.toString(16).padStart(2, "0")}`).join(", ")}`);
  }
  fs.writeFileSync(`${sourceDirectory}/Good_Test${index + 1}.asm`, `bits 16\n${dbLines.join("\n")}\n`);
  manifest.push({
    input: inputs[index],
    output,
    offset,
    bytes: hardened.length,
    inputSha256: sha256(bytes),
    outputSha256: sha256(hardened),
    before: [...pattern].map((value) => value.toString(16).padStart(2, "0")).join(" "),
    after: [...hardened.subarray(offset, offset + 7)].map((value) => value.toString(16).padStart(2, "0")).join(" "),
  });
}

fs.writeFileSync(`${outputDirectory}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);

// A controlled adversarial pair: the same proven INT 87h redirect used by
// New_Best, retargeted to the two exposed Good_Test initializer signatures.
const counter1 = fs.readFileSync("C:/Users/ronyr/Downloads/New_Best1");
const counter2 = fs.readFileSync("C:/Users/ronyr/Downloads/New_Best2");
if (counter1[9] !== 0xba || counter1[10] !== 0xbb || counter1[11] !== 0x00) throw new Error("New_Best1 signature layout changed");
if (counter2[18] !== 0xba || counter2[19] !== 0xbb || counter2[20] !== 0x00) throw new Error("New_Best2 signature layout changed");
counter1[11] = 0xc0;
counter2[20] = 0x80;
fs.writeFileSync(`${outputDirectory}/Signature_Counter1`, counter1);
fs.writeFileSync(`${outputDirectory}/Signature_Counter2`, counter2);

console.log(JSON.stringify(manifest, null, 2));
