// Builds strong-codes/: every pair we worked on, ordered by measured strength (newest/strongest first).
// Each source is reassembled and its SHA-256 must equal the binary that was actually tested.
import fs from "node:fs"; import crypto from "node:crypto"; import { execFileSync } from "node:child_process";
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const N = "agent2/night", D = "agent2/day2";
// [folder, title, date, asmA, asmB, testedBinA, testedBinB, notes]
const P = [
  ["01_CC3", "CC3 - DET2 + shared cell + FF18 anchors + startup reorder (current best)", "2026-10-04 day 2 round 2", `${D}/scratch/COORD2/CC3_A.asm`, `${D}/scratch/COORD2/CC3_B.asm`, `${D}/scratch/COORD2/cand/CC3_A`, `${D}/scratch/COORD2/cand/CC3_B`,
   "DET2 + E2 CF (all streams use private cell 0300h; worker ends with call far [00300h], so merged foreign streams running our worker die) + E6 c18E (anchors and E1 decoys FF 18 instead of FF 1F) + E5 C1 (B startup write order). Confirmed vs DET2 on a fresh field: +0.0096 [0.0011,0.0181] (z=2.5); fresh 2025-only check +0.0044 [0.0009,0.0079]."],
  ["02_DET2", "DET2 - adaptive lattice", "2026-10-04 day 2", `${D}/best/A.asm`, `${D}/best/B.asm`, `${D}/best/A`, `${D}/best/B`,
   "rev1 + B detects a V6-family team (early [4A17h] write) and moves the whole team to lattice 42h, else stays at 52h. Confirmed best: vs rev1 +0.075 [0.046,0.104] (all zombie cohorts, fresh field). Known weak point: a team that writes [4A17h] early triggers the move without V6 present."],
  ["03_MC2", "MC2 - shared pointer cell 0300h", "2026-10-04 day 2", `agent2/day2/scratch/D8/MC2_A.asm`, `agent2/day2/scratch/D8/MC2_B.asm`, `${D}/scratch/COORD/cand/MC2_A`, `${D}/scratch/COORD/cand/MC2_B`,
   "rev1 + worker reads the pointer from absolute [0300h]; merged V6/zchain streams that run our worker die. Passed the same confirmation: vs rev1 +0.066 [0.043,0.089]. Best on the strong field (0.722)."],
  ["04_DETMC", "DETMC - DET2 + MC2 combined", "2026-10-04 day 2", `${D}/scratch/COORD/DETMC_A.asm`, `${D}/scratch/COORD/DETMC_B.asm`, `${D}/scratch/COORD/build/DETMC_A`, `${D}/scratch/COORD/build/DETMC_B`,
   "Both changes together. Passed the confirmation: vs rev1 +0.066 [0.040,0.092]; not better than DET2 alone."],
  ["05_rev1_KPHL", "rev1 (KPHL) - night best", "2026-10-04 night", `${N}/revisions/rev1/A.asm`, `${N}/revisions/rev1/B.asm`, `${N}/revisions/rev1/A`, `${N}/revisions/rev1/B`,
   "V6nohunt + night edits (decoys, zombie-capture changes, locpatA). Beats V6nohunt +0.016 and V6 +0.022 on a fresh plain field (day 2 check)."],
  ["06_KPH", "KPH - rev1 without locpatA", "2026-10-04 day 2", `${N}/scratch/B099/KPH_A.asm`, `${N}/revisions/rev1/B.asm`, `${D}/build/KPH_A`, `${N}/revisions/rev1/B`,
   "Better than rev1 on the 2024 live field (+0.015) but worse on 2025 (-0.010); not better overall."],
  ["07_V6nohunt_rev0", "V6nohunt (rev0)", "2026-10-03", `${N}/revisions/rev0/A.asm`, `${N}/revisions/rev0/B.asm`, `${N}/revisions/rev0/A`, `${N}/revisions/rev0/B`,
   "Friend's V6 with the [7A00h] hunter redirect removed. Beat V6 in day-1 holdouts."],
  ["08_zchain4", "zchain4 (Chimera line)", "2026-10-03", `${N}/refs/zchain4/A.asm`, `${N}/refs/zchain4/B.asm`, `${N}/refs/zchain4/A`, `${N}/refs/zchain4/B`,
   "Strongest on the plain 2025 field alone in some checks, but collapses when strong teams are present (strong field 0.58)."],
  ["09_zchain3", "zchain3 (Chimera, the pair in final/)", "2026-10-03", `agent2/src/zchain3/ChimeraA.asm`, `agent2/src/zchain3/ChimeraB.asm`, `agent2/frontier-20261003/arms/zchain3/A`, `agent2/frontier-20261003/arms/zchain3/B`,
   "Was in final/ from day 1 (beat m050) until DET2 replaced it on 2026-10-04."],
  ["10_V6Guard", "V6Guard (Codex variant of V6)", "2026-10-03", `${N}/refs/V6Guard/V6GuardA.asm`, `${N}/refs/V6Guard/V6GuardB.asm`, `${N}/refs/V6Guard/A`, `${N}/refs/V6Guard/B`,
   "V6 keeping the [7A00h] patch but skipping it when the pointer is CCCCh. No measurable difference from V6nohunt."],
  ["11_V6_original", "Good_Test V6 (friend-provided original)", "reference", `agent2/src/v6/V6A.asm`, `agent2/src/v6/V6B.asm`, `${N}/refs/V6/A`, `${N}/refs/V6/B`,
   "Friend-provided code (reconstructed label-form source, byte-identical to the original binaries). Reference point."],
];
const rows = [];
fs.mkdirSync("strong-codes", { recursive: true });
for (const [dir, title, date, a, b, ta, tb, notes] of P) {
  const out = `strong-codes/${dir}`; fs.mkdirSync(`${out}/build`, { recursive: true });
  fs.copyFileSync(a, `${out}/A.asm`); fs.copyFileSync(b, `${out}/B.asm`);
  execFileSync("node", ["agent2/tools/nasm-node.cjs", `${out}/build`, `${out}/A.asm`, `${out}/B.asm`]);
  const [ha, hb] = [sha(`${out}/build/A`), sha(`${out}/build/B`)];
  if (ha !== sha(ta) || hb !== sha(tb)) throw new Error(`${dir}: reassembled binary differs from the tested one`);
  for (const x of ["A", "B"]) { fs.copyFileSync(`${out}/build/${x}`, `${out}/${x}`); }
  fs.rmSync(`${out}/build`, { recursive: true });
  const sa = fs.statSync(`${out}/A`).size, sb = fs.statSync(`${out}/B`).size;
  fs.writeFileSync(`${out}/README.md`, `# ${title}\n\nDate: ${date}\n\nA.asm -> A (${sa} bytes, sha256 ${ha})\nB.asm -> B (${sb} bytes, sha256 ${hb})\n\n${notes}\n\nProvenance: Good_Test V6 is friend-provided code; all variants here are edits of it or of our Chimera line (see comments in the sources).\n`);
  rows.push({ dir, title, date, sa, sb, ha: ha.slice(0, 8), hb: hb.slice(0, 8) });
}
fs.writeFileSync("strong-codes/index.json", JSON.stringify(rows, null, 1) + "\n");
console.log(rows.map((r) => `${r.dir} ${r.sa}/${r.sb} ${r.ha}/${r.hb}`).join("\n"));
