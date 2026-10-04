# Day-2 leader search brief (2026-10-04)

Repository root `C:\Maor\CodeGuru\corewars8086-agent2` (bash: `/c/Maor/CodeGuru/corewars8086-agent2`), run every command there.
Goal: improve OUR pair rev1 so it scores more per battle in fields that contain strong far-call leaders
(V6, V4, V6Guard, V6nohunt, zchain3/zchain4, zrl03, ah02) WITHOUT losing on the plain 2025 / strong fields.
Work only on our own pair's design (placement, timing, zombie capture/routing, startup, steps, robustness).
Do not write separate counter programs aimed at our own pair.

## Base = rev1 (KPHL)
Sources `agent2/day2/q/revisions/rev1/A.asm` (214 B) and `B.asm` (222 B). Architecture, engine facts and the night's
results: read `agent2/night/BRIEF.md` sections "How rev0 works" and "Verified engine facts", the rev1 change list in
`agent2/night/NIGHT_REPORT.md` section 2, and skim `agent2/night/FINDINGS.md` for what was already tried (do not repeat
rejected ideas blindly). Good_Test V6 is friend-provided code; keep that attribution in comments.

## Where rev1 stands on the screen field L (mean team score per battle, 30 battles per cohort)
plain 2025 0.710, strong 0.694; one leader + 2 random 2025 teams: vs V4 0.493, V6Guard 0.465, V6nohunt 0.498, V6 0.580,
zchain4 0.769, zchain3 0.837, zrl03 0.696, ah02 0.720; two leaders 0.482; three leaders 0.475. ALL 0.628.
Weakest: V6-family leaders (same lattice 52h, same hook cells [4A17h]/[5D13h], same zombie search patterns).
Leader binaries: agent2/night/refs/{V6,V4,V6Guard,zchain4}/A|B, agent2/night/revisions/rev0 (V6nohunt),
agent2/frontier-20261003/arms/{zchain3,combo_zrl03,combo_ah02}/A|B (disassemble with dis86 to study them).

## Rules
- Write ONLY in `agent2/day2/scratch/<YOUR_ID>/`. Never edit final/, agent2/night/, agent2/day2/q/ internals, tools. No git.
- Never run bench/java yourself. All battles go through the queue:
  `node agent2/day2/q/submit.mjs --agent <ID> --kind screen --asmA <file> --asmB <file> --note "<change>"` (omit a side = rev1's)
  then `node agent2/day2/q/wait.mjs <jobId>` (returns within ~9 min; PENDING -> call again).
  Screen = candidate vs rev1 on field L (58 cohorts x 30 battles, paired). Groups: 2025, strong, leader1, leader2, leader3.
  Noise: half-width of ALL about 0.007-0.015; per-cohort diffs of 0.03 are 1 battle.
  `--kind trace` gives death attribution (who wrote the fatal bytes) for a candidate (omit both sides = rev1 itself).
- Budget: at most 4 screen/trace jobs per agent. Assemble locally first (<= 256 bytes each):
  `node agent2/tools/nasm-node.cjs agent2/day2/scratch/<ID>/build <files.asm>`; disassemble: `node agent2/tools/dis86.mjs <bin> [hexOff]`.
- Honest reporting: a screen is only a "promising candidate". Promising = ALL >= +0.010 and group 2025 not below -0.010.
  The coordinator re-tests promising candidates on a fresh confirmation field.
