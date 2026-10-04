
## Wave 5
All agents used revision 0 (V6nohunt). Base in every screen = rev0.

### A021 (trail CS-word lethality / lattice)
- F7 (A and B: or dx,0FFBh -> 0FF7h; CS word F7 0F, lattice 52h -> 12h; A 194 B sha 71ee02e2, B 202 B sha a211ec68): screen a0xw2 ALL -0.0261 [-0.0529,+0.0008]; strong -0.125 [-0.243,-0.007] 1/6. Rejected.
- N0B (ablation: or dx,0FFBh -> 100Bh, CS word 0B 10 = sled, anchors +100h so the first trail is 100h shorter): screen 7eku1 ALL -0.0370 [-0.0719,-0.0021]; strong -0.188; multi -0.039. Rejected.
- N0Bg (N0B + add sp 100h -> 200h (A), 600h -> 700h (B), gap equal to rev0): screen 0dlmm ALL -0.0004 [-0.0325,+0.0319]; strong -0.110 n.s.; multi -0.103 (2 cohorts); threat lf8gu (2 copies of V6-family leaders) +0.024 [-0.035,+0.084]. Ablation only.
- F6 (or dx,0FFBh -> 0FF6h, lattice 02h; = B055 lat_m50): built, not screened.
- More lethal CS word (F6/F7) adds kills: not-reproduced (static Cpu.java + a0xw2; the lattice cost dominates). CS-word lethality worth points: not-reproduced (0dlmm, lf8gu). Shorter first-generation SP-to-anchor gap costs points: verified-in-current (7eku1 vs 0dlmm, single pair). Other lethal CS word on the 52h lattice with full IP range: not-reproduced (static: only FB 0F works). Card closed; keep FAR_SEG 0FFBh.

### A022 (REP rebuild overrun / stale decoys)
- SD (A and B: phoenix_init mov cx,9 -> 10; db 0CCh,0CCh after the worker; dead mov dx,[4A17h] removed; REP costs 1 turn per word, so the turn count is unchanged; A 192 B sha 255f0fb2, B 200 B sha 36e78a91): screen ffhjf ALL +0.0104 [0.0026,0.0183] 14/2; 2025 +0.016 [0.0017,0.0303]; strong +0.008; threat +0.004; multi 0; 2B2Team cohort +0.167, OpcodeHunter +0.033. Threat a6imo ALL +0.071 [0.031,0.112] 17/2 (2B2Team +0.163, OpcodeHunter +0.042, PastRAMa +0.072, JMP2HELL +0.008 n.s.). Claimed promising.
- SDd (SD + B066 dec0A in A: jmp short phoenix_init -> mov word [0000h],01FFFh; A 196 B sha 103ae804, B = SD_B): screen wu7h9 ALL +0.0168 [-0.0009,+0.0345] 12/3; 2025 +0.031; strong +0.008; threat +0.001; multi 0; 2B2Team +0.400, OpcodeHunter +0.200. No threat job. Claimed promising.
- SDc (ablation: appended bytes CC 90, no FF 1F CC CC anywhere, also removes B's natural tail decoy): screen x2hv2 ALL +0.0013 [-0.0065,+0.0092]; non-searcher cohorts identical to SD; searcher cohorts -0.067 to -0.122.
- REP overrun corrupts cells/worker: not-reproduced (static + x2hv2 vs ffhjf). Stale FF 1F CC CC decoys absorb searchers: verified-in-current (a6imo; ffhjf minus x2hv2 on searcher cohorts +0.07 to +0.17). Removing B's natural tail decoy costs: verified-in-current (x2hv2, repeats B066 padB). dec0A and stale decoys additive: hypothesis (wu7h9, unpaired). JMP2HELL recovered by decoys: not-reproduced (a6imo). SD's non-searcher gain (~+0.006) is real: hypothesis (layout chaos, same in SDc).

### A023 (foreign trails crossing the rebuild window)
- No candidates, no jobs (session stopped early; 4 jobs unused). Re-analysis of trace pkj3o with `scratch/A023/win2.cjs`: 19/161 deaths (12%) are true rebuild-window deaths (6 opponent, 7 opponent+self, 4 self, 2 partner): verified-in-current. Moving/splitting the worker inside the own trail lowers exposure: hypothesis (reasoning only; no layout found). Levers already closed by A004/A019/A020. Helpers: `scratch/A023/win.cjs`, `win2.cjs`, `win3.cjs`.

### A024 (freed bytes / A-side decoys)
- C2 (A only: B057 stripA (dead zombie_entry/zombie_scan tail removed) + band math mov ax,si; xor dx,dx; mov cx,3C00h; div cx; mul cx; add ax,2CA2h (same AX, 3 turns fewer) + 4 decoys mov word [0000h]/[si+4000h]/[si+8000h]/[si+0C000h],1FFFh in the freed turns and the jmp slot; INT87 still instr 10, phoenix_init still turn 22; A 143 B sha 36bf5eee): screen nc1yt ALL +0.0169 [-0.0036,+0.0374] 13/8; 2025 +0.033; strong +0.009; threat -0.003 [-0.013,+0.007]; multi 0; 2B2Team +0.467, OpcodeHunter +0.200. Threat c1v5o ALL +0.085 [0.038,0.132] 17/3 (2B2Team +0.163, OH +0.064, ADDvanced +0.028). Claimed promising.
- C1 (A only: stripA + dec0A; A 130 B sha 9c44362d): screen npxkj ALL +0.0096 [-0.0075,+0.0266]; threat -0.008 [-0.016,-0.0002] 0/4 (CodeKiller, callfart, zrl03, zchain4); threat wv8ov +0.070 [0.029,0.111]. Not claimed (C2 contains it).
- FF 1F CC CC searchers absorbed by low/spread decoys: verified-in-current (83rh4 +0.057 < wv8ov +0.070 < c1v5o +0.085, same cohorts; steps within CIs). 2B2Team1 searches forward from ~A600h, not from 0: verified-in-current (static dis86 + Cpu.java; corrects B066). Stripping A's dead hunter makes a second natural tail decoy: verified-in-current. si-relative decoys self-harm ~1%: hypothesis. Anchor recovery: not-reproduced (closed by A018).

### A025 (INT 86h blocks by A/B)
- Nothing built, no jobs (session stopped after reading). Card still open. Pointer: B068 ogq11 measured opponent early INT86 bombs at ~-0.007/bomb vs rev0 (upper estimate of the offensive value; hypothesis).

### B071 (MOVSW anchor kill, counter-code)
- Nothing built, no jobs (session stopped early). Card still open. Existing test case: `scratch/B051/cMovswA.asm`/`cMovswB.asm` (= B060 movsw53; 3 copies leave base at 0.060, fu9fg). MOVSW trail FF A5 anchor kill: verified-in-current from earlier waves (pkj3o, ~half of deaths). 0F A5 also fatal: hypothesis (static).

### B072 (early zom20a stealer)
- fixA (A only: mov si,ax; les ax,[si+z20a_data] with dw 0F2E2h,1000h; INT 87h moves from instr 10 to 6; [4A17h]->[9769h] copy after it plus 2 nops (startup count unchanged); jmp short phoenix_init skips the data; A 198 B sha 2af9bf68): screen lsu16 ALL +0.0004 [-0.0108,+0.0116] 16/16; 2025 +0.006; strong -0.006; threat -0.004; multi -0.0125 (n=2). Threats: vs zdeny mw9zq +0.114 [0.052,0.177], replicated nwnic +0.070 [0.011,0.128]; vs zchain4 control 0.000; vs 3x zdeny kgfp5 +0.024 n.s.; vs zdeny4 -0.0035 n.s. Not for stand-alone promotion (screen ALL below +0.006); combination material (supersedes A003 C1's A part).
- Counter codes: zdeny `scratch/B072/counterA.asm`/`counterB.asm` (zchain4 body + zom20a steal at its instr 8 + decoy-immune b/d capture + EB F9 decoys; A 212 B, B 122 B); zdeny4 `scratch/B072/zdeny4A.asm` + counterB (pure disarm at instr 4; no timing fix answers it).
- Early zom20a stealer takes rev0's chain: verified-in-current (mw9zq, nwnic). Full denial costs more than the body: hypothesis (unpaired). Instr-4 disarm unanswerable by timing: verified-in-current (nwnic). 3 copies erase the fix: hypothesis (kgfp5). Archived teams steal zom20a early: not-reproduced (static B062/A003 + lsu16). Helper `scratch/B072/pt.cjs`.

### B073 ([4A17h] hook-cell poisoner)
- Counter (test case): poisoner `scratch/B073/counterA.asm`/`counterB.asm` (B051 cMovsw with own cell 7B2Dh; its B instr 5 writes [4A17h]); control `ctlA.asm`/`ctlB.asm` (2 bytes differ in B). Rev0 team score vs ctl/poison: 1 copy 0.266/0.201 (9xz3y; base B 0.173 -> 0.071), 2 copies 0.137/0.091 (wu55u), 3 copies 0.056/0.062 (d05lf, floor).
- reloc (B053 binaries, cell 4A17h -> 0B6E9h): paired vs poison +0.096 [0.043,0.148] (1 copy), +0.047 [0.029,0.064] (2 copies), +0.005 n.s. (3); vs ctl ~0. Protects only by construction.
- bodycell (hook cells inside own bodies; A INT87 instr 10 -> 11, B 12 -> 13; A 201 B sha 33e6a01d, B 213 B sha 08cff086): threat j77yv ALL +0.106 [0.063,0.149] 20/0; poison +0.151 [0.079,0.223]; ctl +0.062 [0.027,0.096]. Not screened (general cost unknown).
- Cell read/write timing: verified-in-current (static + 9xz3y). Single-write poisoner takes the captured Zombies: verified-in-current (9xz3y, wu55u). 3 copies: not-reproduced (floor). Bodycell blocks fixed-cell theft: verified-in-current (j77yv). Residual 1-round [4A17h] channel exposure: hypothesis. [5D13h]/[9769h] writes redirect our Zombies: not-reproduced (static). Helper `scratch/B073/ana.mjs`. Next: screen bodycell.

### B074 (INT86 signature-decoy planter)
- Counter (test case): `scratch/B074/counterA.asm`/`counterB.asm` (zchain4 body + INT86 blocks: 64x E2 F2 81 C3 at 0000h, 64x EB F9 CC CC at FF00h; A 248 B, B 137 B); control `ctlA.asm`/`ctlB.asm` (patterns broken, same timing). Counter team score vs rev0 0.426 (1 copy, uj7ek), 0.286 (2 copies, tpv8m); control 0.401 / 0.224.
- skip probe (tailored, measurement only; A: les di,[si+skip_ptr] so the zom20a search starts at 0100h, INT87 instr 9; B: fix2steal with DI start 0FFE0h -> 0FEF0h; A 200 B, B 212 B): threat 63r0q ALL +0.113 [0.069,0.158]; vs counter +0.173 [0.116,0.230] 11/1; vs control +0.053 [0.003,0.103].
- B054 fix2steal re-test: b4dgp ALL +0.004 n.s.; vs counter -0.005 (defeated by the block below FFE0h).
- Decoy planter wastes rev0's captures: verified-in-current (63r0q, ~0.12/battle in its cohorts; no 2025 team does this). Raw base drop vs planter: hypothesis (unpaired). Blocks below a fixed skip start defeat fix2steal: verified-in-current (b4dgp). p0f immune: hypothesis. Helpers `scratch/B074/mk.cjs`, `per.cjs`.

### B075 (undercut lattice clones)
- No new counter, no jobs. Undercut clones 10h-50h below cost the base: verified-in-current from earlier jobs (B055 ppsmg, 7rw7q; B065 pn6t4). Compounding with 2-3 copies: not-reproduced (B060 fu9fg, 3zlpf). Existing test cases: `scratch/B055/lat_m30_A.asm`/`lat_m30_B.asm`, `scratch/A011/fa_A.asm`/`fa_B.asm`, `scratch/B065/bin`.
