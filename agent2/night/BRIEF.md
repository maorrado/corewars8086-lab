# Night research brief (shared by all 100 roles) — 2026-10-03

Repository root: `C:\Maor\CodeGuru\corewars8086-agent2` (run every command from there; bash paths
`/c/Maor/CodeGuru/corewars8086-agent2`). Branch `agent2/research-2026-10-03`. CoreWars8086 v6 engine.

## Goal
A survivor pair that scores more per battle across varied opponent fields AND is more robust to codes that
exploit its weaknesses. A duel win alone is not enough. No "absolute immunity" claims.

## Hard rules
- Write ONLY inside your scratch dir `agent2/night/scratch/<YOUR_ID>/`. Never edit `final/`, `agent2/night/shared-best.json`,
  `agent2/night/revisions/`, other agents' scratch, tools, or the daemon. No git commit/push.
- NEVER run `bench.mjs`, `java`, the tracer or any battle yourself. All battles go through the queue:
  `node agent2/night/submit.mjs --agent <YOUR_ID> --kind screen --asmA <file> --asmB <file> --note "<what changed>"`
  then `node agent2/night/wait.mjs <jobId>` (returns within ~9 min; if it prints PENDING just call it again).
  Omit --asmA or --asmB to use the current base warrior for that side.
- Every warrior must assemble to <= 256 bytes. Assemble locally first: `node agent2/tools/nasm-node.cjs agent2/night/scratch/<ID>/build <files.asm>`
  (prints size + SHA-256). Disassemble any binary: `node agent2/tools/dis86.mjs <binary> [hexOffset]`.
- Budget: at most 4 queue jobs per agent (screen/threat/trace). Do not resubmit identical binaries (the daemon dedups anyway).
- Do not change game rules, round limits, scoring or zombie counts. Counter-codes run only inside this local simulator.
- Provenance: Good_Test V6 is friend-provided code; V6nohunt/V6Guard are small edits of it. Keep that attribution in comments.
- Report honestly: a screen result is only a "promising candidate", never a confirmed improvement.

## Base revision
Read `agent2/night/shared-best.json` before each job; write the revision number you used in your report.
If the revision changes while you work, finish the running job, then (if you continue) port your change to the new
base and re-screen. Revision 0 = **V6nohunt**: sources `agent2/night/revisions/rev0/A.asm`, `B.asm`
(A 194 B sha 6861894f…, B 202 B sha 8579e2c2…). References (binaries in `agent2/night/refs/<name>/A|B`, some .asm):
V6 (friend original), V4 (V6 with B step 2800h/2000h), V6Guard (Codex: keeps the [7A00h] patch but skips it when the
pointer is CCCCh; A.asm there), zchain4 (our Chimera lineage, best on the plain 2025 field, weak vs leaders; A.asm/B.asm there).

### How rev0 works (V6 architecture)
- Both warriors: quantize load address high byte by 3Ch into a band, add a phase, AL=A2 → target IP xxA2.
  Copy an 18-byte worker template (9 words) into the private stack (DS=SS private), set SS=CS (arena), pointer cell
  in private memory = (target IP, FAR_SEG 0FFBh obfuscated as `and dx,0 / or dx,0FFBh`), SP = target + gap,
  `stosw` writes `FF 1F` (call far [bx]) at the anchor, `call far [bx]`. The anchor then calls itself, pushing
  4 bytes per turn (IP word `A4 xx`, CS word `FB 0F`) downward until the trail reaches the anchor; the `A4`
  (MOVSB) landing on the anchor triggers a rebuild of the worker from the private template right after the
  anchor; the worker does `sub sp,dx; sub [bx],bp; mov di,[bx]; mov cl,9; xor si,si; stosw; dec di; call far [bx]`
  → next generation. Trail length per generation = BP−DX = 400h. Anchor arena offset = IP−50h → in-page 52h.
- A: gap 100h, CX 9, DX 4000h, BP 4400h, phase 2Ch, cell 2C0h. Startup: reads [4A17h] (B's entry), copies it
  to [9769h] (Registered_Winners' hook cell), INT 87h forward search `E2 F2 81 C3` (zom20a live loop end) →
  `FF 26 17 4A` = jmp [4A17h] (captures zom20a into B's zombie_entry). A still contains dead code
  `zombie_entry/zombie_scan` (a trail hunter) that nothing reaches in rev0.
- B: writes its zombie_entry address to [4A17h] and [5D13h] (5D13h = hook cell of m050/b01d lineage → steals
  their captured zombies), INT 87h backward from DI=0 `EB F9 CC CC` → `FF 26 17 4A` (zom20b/d tail; the first
  match from the top is usually a decoy copy). zombie_entry: CX≠0 (zom20a) → another backward b/d search with
  phase BP=2000h; CX=0 (a captured b/d) → backward search `0E 07 0E 17` → CC (counter-bomb on many 2025
  initializers) with BP=3400h. Then call/pop, quantize, `add ax,bp`, phoenix with cell 280h, gap 600h, CX 8,
  DX 2400h, BP 2C00h. Captured zombies run at Zombie speed 2.

### Verified engine facts (v6 source + traces)
- Arena 64 KiB at 1000h filled CCh; each warrior private 2 KiB stack (zero-filled), team-shared 1 KiB at ES.
  Team members load consecutively (A executes just before B each round). Score = alive members / alive survivors.
- INT 86h: 2 charges per process (incl. captured zombies), 64 dword writes of DX:AX from ES:DI. INT 87h: 1 charge,
  searches the full 64 KiB from ES:DI through the caller's restricted memory (ES must be the arena or it faults),
  replaces first match of AX,DX with BX,CX. NRG = `9B 9B`; energy decays 1 per 5 rounds; extra opcode
  probability min(16,1+log2 E)/16. REP does one iteration per turn. CC/INT3, segment prefixes, 60h-6Fh invalid.
- Trail families: a 2-byte-call replicator's trigger byte lands at a fixed address residue: MOVSB designs put A4 at
  addr≡2 (mod 4), MOVSW designs A5 at ≡3. Our anchors (≡2) are immune to MOVSB-family trails and are killed by
  MOVSW-family trails (`FF A5` = jmp [di+d16]). Switching only one partner's family was catastrophic (−0.17);
  switching both was neutral.
- Lattice: a generation at anchor P pushes exactly [P,P+400h); streams on the same 400h lattice only collide at a
  shared point. Being 10h–60h BELOW a crowd's lattice wins strongly vs that crowd (our trail covers their whole
  worker region), 10h above loses. V6 family lattice in-page 52h, Chimera/m050 62h, combo_zrl03 32h.
- Zombies (2025 pack zom20a-d, speed 2): zom20a writes one word ([1243h]); its live loop has unique bytes
  41 93 E2 F2 / E2 F2 81 C3 (but HRZ_Grindo_Holics, GSA_callfart, AVI_AnotherBitInTheWall carry copies);
  zom20b/d write 16 fixed words (x612h / x226h), four EB F9 CC CC tails each (live one 3rd from the top);
  zom20c hides its loop among 8 identical copies. Capture value ~0.1 points/battle.
- Death attribution (m050, earlier): ~46% anchor overwritten during dwell, ~21% during rebuild, ~15% cascades,
  ~9% zombies, ~6% startup. For rev0's lineage the top point-takers in the 2025 field were Grindo_Holics,
  cgx123123, OpcodeHunter, callfart, GhostBytes, ADDvanced, Baltika9.
- Tried and rejected earlier (do not repeat blindly): planting EB F9 decoys in V6 (+0.011 field but −0.054 when
  V6 is an opponent); shorter/longer dwell and coverage-dwell in Chimera (large losses); mixed-family partners.

## Queue job kinds (daemon runs one job at a time, 8 threads, unmodified v6 JAR)
- `screen`: candidate vs current base on the fixed screen field S (50 cohorts × 30 battles = 1,500 battles/arm:
  25 cohorts 2025 field, 7 strong (2024 final+counters+Chimera peers), 16 single-threat cohorts, 2 multi-copy).
  Paired by cohort+seed. Noise: SE of ALL ≈ 0.004–0.008. Treat ALL diff > +0.006 with no badly negative group as promising.
- `threat`: forced counter opponents: `--threats '[{"key":"zomb_Grindo"},{"name":"myCounter","asmA":"path","asmB":"path"}]'
  --copies 1..3 --cohortsPerThreat 2..12 [--mixAll]` — library keys in `agent2/night/threats/library.json`
  (movsw_Baltika9 movsw_TrojanByte movsw_cgx123123 movsw_CodeKiller movsw_LowKey movsw_BinaryBandits zomb_Grindo
  zomb_callfart zomb_AnotherBit bomb_IND_BRA lead_V6 lead_V4 lead_V6Guard lead_zchain4 lead_zrl03 lead_ah02).
  Reports candidate−base by threat and the threat team's own score vs each.
  To measure a NEW counter code against the current base, submit `threat` with omitted --asmA/--asmB
  (candidate = base) — the "vsBase" threat team score shows how strong your counter is.
- `trace`: death attribution for a candidate (8 cohorts × 20 battles): phases and who wrote the fatal bytes.
- Results also land in `agent2/night/queue/done/<jobId>.json` (`wait.mjs <id> --full` for everything).

## Promotion (coordinator only, after each wave)
Promising screens are re-tested by an independent coordinator on a FRESH confirmation field (never used for
selection): 2025 ×3 partitions, strong ×3, 2024 live ×1, every library threat ×3, multi-copy cohorts, and a
no-Zombie field; arms candidate, base, rev0, V6Guard, zchain4, V6. Promote only if the pooled (2025+strong+2024live)
difference vs base has a z=2.5 interval above 0, the threat / multi / no-Zombie groups are not worse than −0.01,
and the candidate is not below rev0. New revisions are announced in `agent2/night/NOTICES.md`.

## Your report (structured output)
revisionUsed, jobs (ids), candidates (sources in your scratch, hashes, sizes, exact change, screen numbers by
group, where it helped / regressed), threat findings (classification: verified-in-current / verified-in-other /
hypothesis / not-reproduced, with the job evidence), recommendation for the coordinator (promote-candidate or not).
