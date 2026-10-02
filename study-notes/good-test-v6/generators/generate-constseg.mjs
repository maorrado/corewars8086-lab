import fs from "node:fs";

const dir = "candidates/generated/good-test-v6-optimization";
for (const id of ["V6_1", "V6_2"]) {
  const input = fs.readFileSync(`${dir}/${id}.asm`, "utf8");
  const output = input
    .replace(/^    mov dx, \[4A17h\]\r?\n/gm, "")
    .replace(/^    and dx, 0\r?\n    or dx, 0FFBh\r?\n/gm, "    mov dx, 0FFBh\n");
  if (output === input || /mov dx, \[4A17h\]|and dx, 0|or dx, 0FFBh/.test(output)) {
    throw new Error(`Unexpected transformation state for ${id}`);
  }
  const withOffsets = output
    .replace("add di, 0099h", "add di, 0091h")
    .replace("add si, 0088h", "add si, 0080h")
    .replace(/add si, 00B9h/g, "add si, 00B1h");
  const authored = `; Codex-authored V6-derived experiment: constseg-3.\n; Change: assign the already-required fixed segment directly to DX.\n; All hard-coded internal entry offsets were adjusted for the eight-byte shrink.\n; Not a promotion claim; compare this binary against the exact V6 baseline.\n` + withOffsets;
  fs.writeFileSync(`${dir}/${id}_constseg3.asm`, authored, { flag: "wx" });
}
