import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../../../");
const oldBlock = [
  "    xor si, si",
  "    mov di, ax",
  "    mov ax, FAR_SEG",
  "    mov es, ax",
  "    mov sp, di",
].join("\n");
const newBlock = [
  "    xor si, si",
  "    les di, [bx]",
  "    mov sp, di",
].join("\n");

for (const warrior of ["A", "B"]) {
  const sourcePath = path.join(repo, "final", `Chimera${warrior}.asm`);
  const source = fs.readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");
  if (source.split(oldBlock).length !== 2) {
    throw new Error(`expected one exact bootstrap block in ${sourcePath}`);
  }
  const output = path.join(here, `Chimera${warrior}-les.asm`);
  if (fs.existsSync(output)) throw new Error(`refusing to overwrite ${output}`);
  fs.writeFileSync(output, source.replace(oldBlock, newBlock));
  console.log(`${sourcePath} -> ${output}`);
}
