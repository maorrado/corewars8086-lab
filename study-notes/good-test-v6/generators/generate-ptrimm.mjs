import fs from "node:fs";

const dir = "candidates/generated/good-test-v6-optimization";
for (const id of ["V6_1", "V6_2"]) {
  const input = fs.readFileSync(`${dir}/${id}.asm`, "utf8");
  const output = input
    .replace(/^    mov dx, \[4A17h\]\r?\n/gm, "")
    .replace(/^    and dx, 0\r?\n    or dx, 0FFBh\r?\n/gm, "")
    .replace(/^    mov \[bx \+ 2\], dx\r?\n/gm,
      "    mov word [bx + 2], 0FFBh\n    mov dx, 0FFBh\n");
  if (output === input || /mov dx, \[4A17h\]|and dx, 0|or dx, 0FFBh|mov \[bx \+ 2\], dx/.test(output)) {
    throw new Error(`Unexpected transformation state for ${id}`);
  }
  const withOffsets = output
    .replace("add di, 0099h", "add di, 0093h")
    .replace("add si, 0088h", "add si, 0082h")
    .replace(/add si, 00B9h/g, "add si, 00B3h");
  const authored = `; Codex-authored V6-derived experiment: ptrimm-1.\n; Change: build the far pointer segment directly in memory and DX.\n; Internal offsets account for the six-byte code shrink.\n; Experimental candidate only; benchmark before claiming an improvement.\n` + withOffsets;
  fs.writeFileSync(`${dir}/${id}_ptrimm1.asm`, authored, { flag: "wx" });
}
