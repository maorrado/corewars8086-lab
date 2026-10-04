// COORD round 2: combine CF (E2) + c18E (E6) + C1 (E5) on DET2.
const fs = require("fs");
const S = "agent2/day2/scratch";
const edit = (src, fn) => { const L = fs.readFileSync(src, "utf8").split("\n"); fn(L); return L.join("\n"); };
const idx = (L, re, from = 0) => { for (let i = from; i < L.length; i++) if (re.test(L[i].replace(/;.*/, ""))) return i; throw new Error("not found " + re); };
const sub = (L, i, a, b) => { if (!L[i].includes(a)) throw new Error(`line ${i}: ${L[i]} lacks ${a}`); L[i] = L[i].replace(a, b); };
const hdr = "; COORD2 combination (day2 round 2): DET2 + E2 CF (cell 0300h, worker call far [00300h]) + E6 c18E (FF 18 anchors/decoys)";
// A: CF_A + c18E A edits (E1 decoy block AX and phoenix_init anchor AX)
const A = edit(`${S}/E2/CF_A.asm`, (L) => {
  const e1 = idx(L, /mov di, 0FF80h/); sub(L, idx(L, /mov ax, 01FFFh/, e1), "01FFFh", "018FFh");
  const ph = idx(L, /^phoenix_init:/); sub(L, idx(L, /mov ax, 01FFFh/, ph), "01FFFh", "018FFh");
  L.unshift(hdr);
});
// B: C1_B (startup reorder) + CF B edits + c18E B edit (phoenix_init anchor AX only)
const B = edit(`${S}/E5/C1_B.asm`, (L) => {
  const ph = idx(L, /^phoenix_init:/);
  sub(L, idx(L, /mov bx, 0280h/, ph), "0280h", "00300h");
  sub(L, idx(L, /mov ax, 01FFFh/, ph), "01FFFh", "018FFh");
  const w = idx(L, /^worker:/); sub(L, idx(L, /call far \[bx\]/, w), "[bx]", "[00300h]");
  L.unshift(hdr + " + E5 C1 (B startup reorder)");
});
fs.writeFileSync(`${S}/COORD2/CC3_A.asm`, A); fs.writeFileSync(`${S}/COORD2/CC3_B.asm`, B);
