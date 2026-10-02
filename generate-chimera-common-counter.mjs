import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const sourceB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const candidateDir = path.join(root, "candidates", "generated", "chimera-common-counter");
fs.mkdirSync(candidateDir, { recursive: true });

const variants = [
  // Bytes 90 90 F3 A5: shared by HLS_EmoMutants2, TOM_2B2Team1,
  // and HRZ_ADDvanced1, absent from Chimera.
  { id: "common_nop_rep", ax: "09090h", dx: "0A5F3h" },
  // Bytes BD F0 36 90: shared by HLS_EmoMutants2 and TOM_2B2Team1.
  { id: "common_bp_nop", ax: "0F0BDh", dx: "09036h" },
  // Bytes B8 A5 29 BA: shared by HLS_EmoMutants2 and TOM_2B2Team1.
  { id: "common_movax", ax: "0A5B8h", dx: "0BA29h" },
];

for (const variant of variants) {
  const textA = sourceA
    .replace(
      "; Chimera A (m049): m048 with signature-hardened Phoenix initialization.",
      `; Chimera A (${variant.id}): FF18 split anchor plus shared-signature counter.`,
    )
    .replace("    mov ax, 0A5F3h", `    mov ax, ${variant.ax}`)
    .replace("    mov dx, 01F06h", `    mov dx, ${variant.dx}`)
    .replace("    mov ax, 01FFFh", "    mov ax, 018FFh");
  fs.writeFileSync(path.join(candidateDir, `${variant.id}_a.asm`), textA, "utf8");
  fs.writeFileSync(path.join(candidateDir, `${variant.id}_b.asm`), sourceB, "utf8");
}

console.log(`generated ${variants.length} shared-signature counter candidates`);
