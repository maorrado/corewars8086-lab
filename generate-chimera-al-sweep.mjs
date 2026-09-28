import fs from "node:fs";
import path from "node:path";

// Night-session ablation: tests whether the fixed AL=0xA2 band low-byte
// constant (identical at both quantize sites in final/ChimeraA.asm) can be
// changed. Substitutes "mov al, 0A2h" with alternative even values while
// leaving every other byte of the source untouched.
const values = [0x00, 0x42, 0x62, 0x82, 0xc2, 0xe2];

const template = fs.readFileSync(path.resolve("final/ChimeraA.asm"), "utf8");
const outputDirectory = path.resolve("candidates/generated/chimera-al-sweep");
fs.mkdirSync(outputDirectory, { recursive: true });

for (const al of values) {
  const alHex = `0${al.toString(16).toUpperCase().padStart(2, "0")}h`;
  const src = template.replaceAll("mov al, 0A2h", `mov al, ${alHex}`);
  fs.writeFileSync(path.join(outputDirectory, `al-${al.toString(16)}.asm`), src);
}
console.log(`wrote ${values.length} AL variants to ${outputDirectory}`);
