# Night findings (compiled by the coordinator after each wave)

## Wave 1
All wave-1 roles used revision 0 (V6nohunt). Screen = candidate minus base on field S (ALL diff [lo,hi]). Sources live in each agent's `agent2/night/scratch/<ID>/` and full reports in `report.json` there.

### A001 (B startup / band-math trim)
- A1 (A only: startup 56 -> 49 turns, 16-bit DIV band math, dead code removed, worker bytes identical; A 111 B, sha d0909c23): screen y60bs ALL +0.0055 [-0.0053,+0.0163]; 2025 +0.0169 [0.0067,0.0270] W/L 12/2; strong -0.025; multi -0.011. Below bar.
- A1+B2 (both trimmed; B 188 B, sha 1e223a7c): screen z8zgy ALL +0.0145 [-0.0008,+0.0298]; threat +0.035; multi -0.060 [-0.095,-0.024]. Rejected (multi).
- B2 only: screen 2ryqj ALL +0.0067 [-0.0058,+0.0192]; multi -0.044 [-0.066,-0.023]. Rejected (multi).
- Threats: faster startup loses vs several V6-family copies: verified-in-other (threat 038rf, 3 copies: lead_V6 -0.052, lead_V6Guard -0.028). Startup savings help on the 2025 field: hypothesis (A1 2025 group only).
- Note: the v6 engine throws on AAM/AAD; use DIV.

### A002 (shorten/reorder B initializer)
- No candidate, no jobs (session stopped). Card still open.

### A003 (zom20a INT 87h timing)
- C1 (reorder only: A runs INT87 before the [4A17h]->[9769h] copy; B writes [4A17h] at instr 6 instead of 3; A sha 20ab6af2, B sha 142eeac8, sizes 194/202): screen u1meu ALL +0.0046 [-0.0026,+0.0119], no negative group; threat 19llx (2 copies) ALL +0.0142 [0.0000,0.0284]; threat 5hja6 (3 copies) ALL +0.0151 [-0.0149,0.0451]. Not promoted; zero-byte add-on worth combining with a future winner.
- [4A17h] hook-cell race vs V6 family (they also write at B instr 3): verified-in-current (19llx, 5hja6), small (+0.015).
- Losing zom20a INT87 race to Fishandpoultry2/HDS_YOY2: not-reproduced (static; base already patches first at instr 10 vs 15/22). Do not move INT87 later than instr 15.
- zom20a mimic decoys (Grindo/callfart): hypothesis here (see B052 for verification).
- Theft of [9769h]/[5D13h] by write timing: not-reproduced (static; we write later than all competitors).

### A004 (generation geometry / period)
- C1 equal first gap 3B0h both: screen irlaj ALL -0.0231; strong -0.15 [-0.245,-0.055]; multi -0.135. Rejected.
- C2 7-word rebuild both: screen ou61i ALL -0.0297 [-0.0560,-0.0035]; strong -0.163 (0/7). Rejected.
- C3 A first-copy CX 8: screen yx4ug ALL +0.0012; C4 B first-copy CX 7: screen ujom1 ALL -0.0021. Neutral.
- Shorter period hurts vs strong field: verified-in-current (ou61i). Equalized first generation hurts: verified-in-current (irlaj). Screen noise for 1-turn edits is low: confirmed (yx4ug, ujom1). Do not spend more jobs on rebuild length or first-gap equalization.

### A005 (partner crossfire / B trail length)
- C1 B DX 2800h (400h trail incl. zombies): screen wmuvx ALL -0.0092; multi -0.085. Rejected.
- C2 B own stream 400h, zombies 800h (B 207 B): screen hs7k5 ALL +0.0116 [-0.0127,+0.0358]; multi -0.104 [-0.173,-0.034]; threat 6igxq ALL -0.100 [-0.151,-0.049]. Rejected.
- Partner crossfire (B's 800h trail kills A mid-rebuild): verified-in-current (trace nd583 = B051 pkj3o), ~1-2% of deaths, max gain ~0.004. Startup phase controls it: not-reproduced (phase drifts; model phase-sim.mjs). 400h B trail loses vs V6 family: verified-in-current (6igxq). Zombie DX effect: hypothesis.

### B051 (MOVSW trail kill at anchor)
- B051-movsw43 (both partners MOVSW, AL A3h, FAR_SEG 0FFAh): screen f5g4d ALL -0.0508 [-0.0945,-0.0071]; strong -0.266. Rejected.
- MOVSW trail kills the FF 1F anchor (FF A5 = jmp [di+d16] -> memory exception): verified-in-current, trace pkj3o: 80-82 of 161 deaths (cgx123123, CodeKiller, Baltika9, TrojanByte, K0F1M). MOVSB trails harmless at anchor: verified-in-current. Family switch fixes it: not-reproduced (moves the hole to the MOVSB crowd).
- Counter codes: `scratch/B051/cMovswA.asm`/`cMovswB.asm` (rev0 MOVSW twin, base 0.339 vs control 0.415, ~1.8 SE, job pgt9t; hypothesis), `scratch/B051/cMovsw43A.asm`/`cMovsw43B.asm` (weak).
- Trace note: bytes[] starts at the faulting instruction, not IP-4.

### B052 (zom20a capture fragility)
- B052-nocapA (ablation, capture off): capture worth ~0.13-0.22/battle with 2025 Zombies (threat ieo63, jsljj).
- B052-fixB (CX=0 zombie path repeats zom20a capture; B 198 B): screen 0raq9 ALL +0.0035 [-0.0065,+0.0134]; threat gotf4 +0.0025. Rejected (no effect). Removing the 0E070E17 CC counter-bomb costs nothing measurable.
- Grindo/callfart decoys consume A's single zom20a INT87: verified-in-current (ieo63: capture value -0.10/-0.075 vs -0.22 control). 14-byte INT86 planter removes all capture value: verified-in-current (jsljj: -0.004 vs -0.131). zom20a -> b/d chain dependency: hypothesis. AnotherBit as decoy: not-reproduced. Grindo2 direct zom20b patch: hypothesis.
- Counter codes: `scratch/B052/plantA.asm`/`plantB.asm` (INT86 planter, strong), `scratch/B052/decoyA.asm`/`decoyB.asm` (static mimic; control plainA/plainB).

### B053 (hook cell [4A17h] sharing)
- reloc-hook-B6E9 (cell 4A17h -> 0B6E9h in A and B): screen uunhx ALL +0.0024 [-0.0044,+0.0092]; threat gqsy1 ALL +0.015 [-0.020,0.050]. Rejected.
- Captured zombies routed through fixed [4A17h]: verified-in-current (static + trace nightTR-6861894f3c-8579e2c221). Only the V6 family writes [4A17h]; sharing costs nothing measurable: not-reproduced. [5D13h]/[9769h] redirecting our zombies: not-reproduced. Purpose-built [4A17h] poisoner: hypothesis (left to B073). Helpers: scratch/B053/scan.mjs, zstat.mjs.

### B054 (b/d EB F9 CC CC decoys, zrl03/ah02)
- fixB (B: mov di,0FFE0h before startup INT87 and in zombie_entry; B 206 B): screen fqy6n ALL +0.0073 [-0.0018,+0.0164]; multi -0.026. Superseded.
- fix2steal (B only; push cs/pop es -> les di,[si+decoy_skip] with dw 0FFE0h,1000h so INT87 stays instr 12; zombie_entry xor di,di -> mov di,0FFE0h; adds mov [0CC13h],bx to steal the zrl03/ah02 hook cell; B 212 B, sha e0afe47d): screen yolqz ALL +0.0100 [-0.0041,+0.0241]; 2025 -0.0038; strong +0.020; threat +0.027 (lead_zrl03 +0.167, lead_ah02 +0.222); multi +0.0125. Sent to confirmation (see Coordinator wave 1).
- zrl03/ah02 decoys consume B's two backward b/d searches: verified-in-current only against a decoy-only variant (threat ojb8m: +0.150 [0.070,0.230]). Real zrl03 decoys cost rev0: not-reproduced (ojb8m -0.020; zrl03 consumes the tails first). [CC13h] written once by zrl03/ah02 so it can be stolen: verified-in-other (selrj, screen yolqz cohorts). Extra EB F9 CC CC copies (OpcodeHunter2, Thefrogs1) change which search hits the live tail: hypothesis.
- Brief correction: the live zom20b/d tail is the 2nd from the top (+14Ch), not the 3rd.
- Counter variants: `scratch/B054/zrl/` (zrl03 nosearch = decoy-only, nodecoy).

### B055 (lattice undercut)
- lat_m30 (FAR_SEG 0FFBh -> 0FF8h in A and B, lattice 52h -> 22h): screen oauc2 ALL -0.0105 [-0.0339,+0.0129]; 2025 -0.026 [-0.051,-0.002]; threat 3mty0: zrl03 +0.108, zchain4 -0.067. Rejected.
- Same-family clone 10h/30h/50h below takes ~0.07-0.10/battle from base: verified-in-current (ppsmg, 7rw7q). rev0 gains vs a clone 10h above: verified-in-current (ppsmg). Shifting the lattice moves the hole: verified-in-other (7rw7q). 60h undercut still works: not-reproduced (confounded). zchain4 shares the 52h lattice: hypothesis contradicted (lat_m30 lost vs zchain4).
- Counter codes: `scratch/B055/lat_m30_A.asm`/`lat_m30_B.asm` (strongest, 30h below), `scratch/B055/lat_m10_*.asm`. Keep FAR_SEG >= 0FF6h (0FF5h breaks on page-00 wrap).

### Coordinator wave 1 (COORD-w1)
- Eligible (screen ALL >= +0.006, threat/multi >= -0.02): only B054 fix2steal. Rejected on the gate: A001 A1+B2 (multi -0.060), A001 B2 (multi -0.044), A005 C2 (multi -0.104), B054 fixB (multi -0.026); A001 A1 (+0.0055) and A003 C1 (+0.0046) below the bar.
- fix2steal re-check: screen yolqz numbers match the queue result (rev0, ALL +0.00998 [-0.00414,+0.0241]); source reassembles to 212 B, sha e0afe47d... equal to the screened binary; diff vs rev0 B.asm is exactly the described change. Note: zombie_entry DI=0FFE0h also changes the start of the CX=0 fallback 0E070E17 search (harmless per B052).
- Confirm 20261003191245696-COORD-w1-confirm-73y2h (salt agent2-night-confirm-w1-1, 7680 battles/arm, base rev0, no rev0 arm): vs base pooled(2025+strong+2024live) +0.0058 [-0.0037,+0.0154] (z=2.5); 2025 +0.0033; strong +0.0217; 2024live -0.0036; threat +0.0283 [0.0062,0.0505]; multi +0.0258; nozombie -0.0010 [-0.0055,+0.0035]. By threat: lead_zrl03 +0.256, lead_ah02 +0.127, lead_V6 -0.017, bomb_IND_BRA -0.017. Vs V6Guard pooled +0.0067, vs V6 +0.0110, vs zchain4 +0.0201 (2025 -0.0089).
- Decision: NOT promoted (pooled lo -0.0037 <= 0). fix2steal is a robust, non-negative add-on whose gain is concentrated on zrl03/ah02 cohorts; candidate for a combination with A003 C1 (zero-byte reorder) in a later wave. Base stays rev0.

## Wave 2
All wave-2 roles used revision 0 (V6nohunt). Same notation as wave 1. Job ids are shortened to their suffix (full ids in each report.json and in `agent2/night/queue/done/`).

### A006 (template copy counts CX 9 vs 8)
- No candidate, no jobs (session stopped after reading sources). Related edits already neutral in A004 (yx4ug +0.0012, ujom1 -0.0021). Only a static copied-byte check remains open.

### A007 (A step BP 4400h / DX 4000h)
- A_s27 (A phoenix mov dx,6800h / mov bp,6C00h): screen ryqef ALL -0.0191 [-0.0425,+0.0043]; lead_V6 -0.094, LowKey -0.217. Rejected.
- A_sm3 (A dx 0F000h / bp 0F400h, upward): screen vwr14 ALL -0.0172 [-0.0423,+0.0079]; strong -0.049, multi -0.056. Rejected.
- A_s13 (A dx 3000h / bp 3400h): screen sgjgr ALL +0.0074 [-0.0177,+0.0325]; multi -0.017; follow-up threat asnxm (2 copies V6/V6Guard/V4/zchain4) ALL -0.0234 [-0.0519,+0.0050], lead_V4 -0.035 [-0.069,-0.002]. Best of 3 noisy draws; not claimed promising, not sent to confirmation.
- Step-dependent crossfire model (msim.mjs) predicts gains vs V6 crowds: not-reproduced (ryqef, vwr14, asnxm). Step is a chaotic parameter (+-0.1 per cohort, screen half-width ~0.025): verified-in-current. Sharing 4400h with V6 family is exploitable: not-reproduced (asnxm). Keep 4400h/4000h; do not spend more jobs on A's step alone.

### A008 (B step BP 2C00h / DX 2400h)
- s24 (B bp 2400h / dx 1C00h): screen dexm5 ALL -0.0000 [-0.0366,+0.0365]; multi -0.117. Rejected.
- s34 (B bp 3400h / dx 2C00h): screen y2pgb ALL +0.0054 [-0.0314,+0.0421]; 2025 -0.020; threat k145x (3 copies V6 family) ALL +0.028 [-0.008,+0.064]. Below bar.
- sD4 (B bp D400h / dx CC00h, upward): screen lbl1g ALL -0.0009 [-0.0329,+0.0310]; strong +0.090 [0.021,0.158]; smulti-mix -0.178. Rejected.
- V4 2800h step worse than 2C00h: verified-in-other (holdout 5). Multi-group loss of other steps: not-reproduced (k145x). Step trades 2025 (~-0.02) vs strong (~+0.07): hypothesis (consistent across all 3 screens, untraced). Crossfire depends on B step: hypothesis (model phase-sim.mjs, <=0.004 at stake). Keep 2C00h.

### A009 (band phases)
- s100 / s200 / s300 (all streams shifted down 100h/200h/300h; lattice 352h/252h/152h mod 400h; 4 bytes each): screens tn359 -0.0023, ehn6q -0.0237, xzyuh -0.0174; strong -0.139 / -0.133 / -0.163 (W/L 1/6, 1/6, 0/7). Rejected.
- s400 (same-lattice control, down 400h): screen nofsj ALL +0.0206 [-0.0081,+0.0493]; multi -0.036 [-0.052,-0.020] (both cohorts negative). Fails multi gate; no mechanism, likely noise.
- Off-lattice (not 52h mod 400h) phases lose on strong field: verified-in-current (tn359, ehn6q, xzyuh vs control nofsj). Lane separation via phase: not-reproduced (analytic + psim.mjs). Own first trails overwrite zombie template: hypothesis. Noise note: trajectory-changing edits spread about +-0.02 in screen ALL.

### A010 (band divisor 3Ch)
- d40 (mov ch,3Ch -> 40h in A, B and B zombie path): screen 82nv3 ALL -0.0001 [-0.0393,+0.0391]; threat 7wyhs ALL -0.096 [-0.184,-0.008], LowKey -0.375. Rejected.
- d20 (divisor 20h): screen yvvpq ALL +0.0066 [-0.0267,+0.0398]; multi -0.047. Fails multi gate; threat 3vrga +0.003 (cgx123123 +0.113, zchain4 +0.101, LowKey -0.138, callfart -0.064).
- Divisor changes trade single opponents, ~0 net: verified-in-other (3vrga, 7wyhs). 3Ch favours us vs LowKey: verified-in-other. Divisor-dependent crossfire: hypothesis (band-sim.mjs, <=0.004). Screen field S cannot resolve placement edits (half-width ~0.035): verified-in-current.

### B056 (initializer signature search, domain 6)
- B056-reorder (A and B phoenix_init: mov bx,imm; push cs; pop ss -> push cs; mov bx,imm; pop ss; zero bytes): screen fqpr7 exactly 0 (all 50 cohorts bit-identical). Defense only; not promoted.
- New_Best original signature 0E 17 BB 00 vs rev0: not-reproduced (i8i0e NB_orig diff 0). Purpose-built 4-byte INT87 search on 0E 17 89 07: verified-in-current (i8i0e: base 0.000/battle, reorder +0.342). Reorder only moves the weak spot: verified-in-current (x4a43: 17 89 07 83 kills both, 0.0063). Archived 2023-2025 searchers match rev0: not-reproduced (static scan.mjs + fqpr7). FF 1F CC CC anchor searchers: hypothesis.
- Counter codes: `scratch/B056/nbsigA.asm`/`nbsigB.asm` (kills rev0), `scratch/B056/nbkillA.asm`/`nbkillB.asm`, `scratch/B056/nbsig2A.asm`/`nbsig2B.asm` (beats rev0 and reorder), `scratch/B056/nborigA.asm`/`nborigB.asm` (New_Best original).

### B057 (anchor hunters, domain 7)
- stripA (A only: delete the unreachable zombie_entry/zombie_scan tail 7Eh-C1h; A 126 B, sha 3591d1fa): screen brk24 ALL +0.0038 [-0.0030,+0.0105]; threat bqibu exactly 0 vs V6 and cgx123123. Inertness ablation, below bar.
- zombie_scan active in rev0: not-reproduced (unreachable since V6nohunt; brk24, bqibu). Hunter mechanism real but net-negative when active: verified-in-other (holdouts 4/5). The 68 dead bytes in A can be reclaimed at no measured cost.

### B058 (bombers vs anchor / startup)
- fs8 probe (= B055 lat_m30, FAR_SEG 0FF8h): not proposed; screen oauc2 -0.0105.
- IND_BRA hits anchor: not-reproduced (foy12: IND_BRA scores 0). Early INT86 heavy bombs kill us at startup: verified-in-current (trace pkj3o re-read, ~2% of deaths, no cheap fix). Page-lattice CC bomber at in-page 52h wipes rev0: verified-in-current (foy12: base 0.025 vs 0.8625 control; ktxof causal: anchor at 22h +0.677 vs pg52, -0.819 vs pg22). FAR_SEG shift/randomization closes the hole: not-reproduced (7v9o9: all-offset bomber pgall leaves base 0.519).
- Counter codes: `scratch/B058/pg52A.asm`/`pg52B.asm` (very strong), `scratch/B058/pgallA.asm`/`pgallB.asm` (any FAR_SEG), `scratch/B058/pg22A.asm`/`pg22B.asm`, `scratch/B058/pg12A.asm`/`pg12B.asm` (control).

### B059 (self-harm by captured zombies)
- zph (B only, zero bytes: zombie_entry mov bp,2000h -> 5C00h and mov bp,3400h -> 7000h; B 202 B, sha e85a4bf6): screen 956md ALL +0.0370 [+0.0126,+0.0615]; 2025 +0.0547 [0.0218,0.0875] W/L 18/5; strong +0.043; threat +0.011; multi -0.001. Threat 333pz (2 copies) ALL +0.015 [-0.022,+0.051]; lead_V6Guard -0.010, lead_zrl03 -0.086 (n=4). Paired trace 4sf0x: 148 deaths vs 161, the 3 base B startup self-kills gone. Sent to confirmation (see Coordinator wave 2).
- zph2 (robustness variant, phases 9C00h / B000h): screen ki0sb ALL +0.0046 [-0.0243,+0.0335]; 2025 +0.022. Below bar.
- Captured zombie's first anchor/trail lands on B's not-yet-run startup code: verified-in-current (trace pkj3o 3/161 deaths, absent in 4sf0x). Own hook-cell writes ([9769h], [4A17h], [5D13h]) overwrite own code: verified-in-current (1/161). A's anchor stosw over its own dec di: verified-in-current (negligible). Captured-zombie steady-state kills: verified-in-other (rare). Partner crossfire: verified-in-current (A005).
- Helpers: `scratch/B059/selfharm.mjs`, `zdeaths.mjs`. sum-trace2 mislabels V6-family steady deaths as wild-cs (checks 0FFCh, family uses 0FFBh).

### B060 (multi-copy compounding)
- lat_m30 as defense (FAR_SEG 0FF8h in A and B, B055 binaries): threat 02rhx (3 copies) ALL +0.024 [-0.020,+0.068]; vs 3x MOVSW twin +0.081, vs 3x cgx123123 -0.117 [-0.149,-0.084]; screen oauc2 -0.0105. Not a fix.
- 2-3 copies of a MOVSW V6 twin (AL A3h) compound the anchor kill: verified-in-current (fu9fg 3 copies base 0.060 vs control 0.242; 3zlpf 2 copies 0.177 vs 0.301). Undercut clones compound: not-reproduced (fu9fg, 3zlpf). Mixed counter field super-additive: not-reproduced (xqlui). 3x real cgx123123: not-reproduced (fu9fg, base 0.608). Lattice undercut as defense: verified-in-other (02rhx; trades holes).
- Counter code: `scratch/B060/movsw53_A.asm`/`movsw53_B.asm` (= B051 cMovsw). Helper: `scratch/B060/pert.mjs`.

### Coordinator wave 2 (COORD-w2)
- Re-check of the only claimed promising candidate, B059 zph: screen 956md result in queue/done matches the report (base rev0, cand 0.6826 vs base 0.6456, ALL +0.03701 [0.01255,0.06147], groups as listed). Screened source cand-build/.../candB.asm is byte-identical to scratch/B059/zph_B.asm; binary 202 B, sha e85a4bf6... (also equals scratch/B059/build/zph_B). Diff vs rev0 B: exactly the two mov bp immediates (binary bytes 34h->70h, 20h->5Ch); A = base.
- Gate check of other screens >= +0.006: A009 s400 (multi -0.036) and A010 d20 (multi -0.047) fail the multi gate. A007 A_s13 (+0.0074, multi -0.017) passes the numeric gate but was not claimed promising by its agent and its dedicated follow-up threat job was negative (asnxm -0.023, lead_V4 -0.035 with CI below 0); not sent to confirmation.
- Confirm 20261003201604540-COORD-w2-confirm-mc03n (salt agent2-night-confirm-w2-1, 7680 battles/arm, base rev0, so no separate rev0 arm; tested hashes A 6861894f / B e85a4bf6): vs base pooled(2025+strong+2024live) +0.0092 [-0.0120,+0.0304] (z=2.5), W/L 46/55; 2025 -0.0032 [-0.0214,+0.0150]; strong +0.0271; 2024live +0.0461 [-0.0087,+0.1009]; threat +0.0105 [-0.0094,+0.0303]; multi -0.0010 [-0.0150,+0.0129]; nozombie +0.0010 [-0.0010,+0.0030]. By threat: movsw_cgx123123 +0.100, movsw_Baltika9 +0.063, lead_V4 +0.078, lead_V6 +0.031 (all 3/0); zomb_AnotherBit -0.043 (0/3), lead_zrl03 -0.050 (0/3, matches 333pz), lead_zchain4 -0.058 (n.s.). Vs V6Guard pooled +0.0117 [-0.0101,+0.0335]; vs V6 +0.0156 [-0.0066,+0.0378]; vs zchain4 +0.0035 [-0.0333,+0.0403] (2025 -0.0198, strong +0.090, multi +0.119).
- Decision: NOT promoted (pooled lo -0.0120 <= 0; threat, multi and nozombie gates pass). The screen's 2025 gain (+0.055) did not replicate on the fresh 2025 partitions (-0.003), so the screen value was mostly luck, as B059's own zph2 control suggested. zph is a cheap, non-negative zero-byte add-on (removes a traced self-kill) that can join a combination with B054 fix2steal and A003 C1 in a later wave; watch lead_zrl03 (-0.05 here), which fix2steal targets. Base stays rev0.

## Wave 3
All wave-3 roles used revision 0 (V6nohunt). Same notation as earlier waves; job ids shortened to their suffix (full ids in each report.json and in `agent2/night/queue/done/`).

### A011 (lattice undercut of V6-family crowds)
- fa (FAR_SEG `or dx,0FFBh` -> 0FFAh in A and B, lattice 52h -> 42h; A 194 B sha 69dd274a, B 202 B sha c9cbe903): screen l10ch ALL -0.0188 [-0.0562,+0.0186]; 2025 -0.015, strong -0.077, multi +0.132 (smulti-V6x3 +0.258). Threat 466df (2 copies) ALL +0.102 [-0.006,+0.211]: lead_V6 +0.310, V6Guard +0.343, V4 +0.196, zchain4 +0.255 (4/0 each); zrl03 -0.169, ah02 -0.321 (0/4). Rejected.
- f9 (FAR_SEG 0FF9h, lattice 32h = the zrl03 lattice): screen pcyuz ALL -0.0139 [-0.0409,+0.0131]; 2025 -0.022, strong -0.059. Threat wn8cm ALL +0.065 [0.012,0.118]; V6 +0.225, V6Guard +0.185, V4 -0.073. Rejected.
- 10h undercut beats 2+ copies of 52h V6-family teams: verified-in-other (466df, wn8cm). Any lattice below 52h costs on plain 2025/strong: verified-in-other (l10ch, pcyuz, B055 oauc2; 22h/32h/42h all negative). zrl03/ah02 (32h) undercut a 42h lattice: verified-in-other (466df). Single-copy V6 leaders undercut rev0: not-reproduced. zchain4 lattice relation: hypothesis (non-monotonic). Keep 0FFBh; do not test more single-offset shifts. Untested idea: split lattice (A 52h, B 42h).
- Counter code: `scratch/A011/fa_A.asm`/`fa_B.asm` (strong vs 2+ V6-family copies).

### A012 (lattice offset for captured zombies only)
- No candidate, no jobs (session stopped after reading). Card still open.

### A013 (captured-zombie trail/step)
- B-only restructure (zombie path preloads its own DX/BP, FAR_SEG built in CX; B 208 B): z1000 (zombie DX 1C00h, trail 1000h) screen ufu9y ALL -0.1613 [-0.2022,-0.1203]; z400 (DX 2800h) screen urea1 -0.0142 [-0.0398,+0.0113] (callfart -0.239); zup (DX CC00h/BP D400h, upward) screen kx45u -0.0328 [-0.0613,-0.0042]. All rejected.
- Zombies with the same rounds/generation as B kill B with their trail: verified-in-other (trace 46uvt: 66/210 deaths by zombie-written bytes vs 13/161 in base). Retuned zombie trail/step helps: not-reproduced (urea1, kx45u). callfart sensitivity to the B layout change: hypothesis (constant -0.239 in all three; layout control `scratch/A013/ctl_B.asm` built, never screened). Keep zombie DX 2400h/BP 2C00h; card closed.

### A014 (A/B lockstep)
- L0 (A only: phoenix mov dx,4000h -> 2400h, mov bp,4400h -> 2C00h, i.e. B's step and 800h trail; 194 B sha cc1f23a2): screen yinzl ALL +0.0070 [-0.0157,+0.0297]; 2025 -0.0196; strong +0.059; threat +0.020; multi +0.054 [0.002,0.106]. Threat mf5ee ALL +0.079 [0.043,0.116] (lead_V6 +0.102, V4 +0.138, V6Guard +0.169, all 4/0). Claimed promising; sent to confirmation (see Coordinator wave 3).
- L1 (L0 + band coordination via team-shared ES:[0], A band = B band + 8000h; A 199 B, B 203 B): screen jasvo ALL -0.0127 [-0.0461,+0.0207]; strong -0.107. Rejected.
- L4 (A dx 3C00h only) is the A015 A_t800 binary; screen lqqx9 was a daemon duplicate of q84cd, credited to A015.
- Lockstep removes partner crossfire: hypothesis (model lock-sim.mjs only). Shared-memory offset improves on same-step: not-reproduced (jasvo vs yinzl). A on B's step beats V6-family leads: verified-in-current (mf5ee). Gain comes from the 800h trail alone: not-reproduced (lqqx9 lead_V6 -0.128). L0 regresses on 2025: hypothesis (yinzl -0.020).

### A015 (A trail length)
- A_t800 (A only: mov dx,04000h -> 03C00h, trail 800h; 194 B sha 4bf226d9): screen q84cd ALL +0.0156 [-0.0132,+0.0445]; 2025 +0.015; strong -0.068 (2/5); threat +0.052 [0.012,0.093]; multi +0.021. Threat 21my5 ALL +0.050 [0.003,0.097] (cgx123123 +0.163, zrl03 +0.125, 4/0). Claimed promising; sent to confirmation.
- A_t500 (dx 03F00h): screen uq7c2 ALL -0.0331 [-0.0592,-0.0069]; strong -0.113. A_t300 (dx 04100h): screen mxo2j ALL -0.0307 [-0.0532,-0.0082]. Rejected.
- Shorter trail pays for itself: not-reproduced (mxo2j). Trail length a smooth trade-off: not-reproduced (300h/500h/800h non-monotonic). 800h trail beats cgx123123 and zrl03: verified-in-current (q84cd, 21my5; mechanism untraced). 800h loses to V6: not-reproduced (21my5). 800h loses on strong field: hypothesis (q84cd -0.068 n.s.). Longer A trail adds partner crossfire: not-reproduced (model).

### B061 (MOVSW anchor kill, domain 1)
- Measurement only: twin probe (mov al,0A2h -> 0A3h, = B051 cMovsw53) in threats 1u12p, ar196, ucv7k; cgx123123 converted to MOVSB (threat vyob8). No candidate.
- Exactly 5 2025 teams are MOVSW anchor killers (CodeKiller, cgx123123, Baltika9, TrojanByte, K0F1M): verified-in-current (static + traces pkj3o/4sf0x). cgx123123 costs base ~0.15/battle when present: verified-in-current (1u12p +0.163 4/0; vyob8 +0.151). CodeKiller/Baltika9 net cost: not-reproduced. TrojanByte/K0F1M exploit: not-reproduced. Large net field cost: not-reproduced (~0.006-0.01). Lucas/SHRek (2024 final) take extra points via our MOVSB residue: hypothesis (ucv7k +0.277/+0.138 4/0, untraced). Switching family: not-reproduced (OtoGlida -0.417, Code_Killers -0.438). Byte-level FF A5 anchor fix: not-reproduced (analysis).
- Counter codes: `scratch/B061/cgxsbA.asm`/`cgxsbB.asm` (cgx in MOVSB family), `scratch/B061/cgxswA.asm` (byte-identical cgx re-assembly). Twin: `scratch/B061/twinA.asm`/`twinB.asm`.

### B062 (zombie mimics / capture value, domain 2)
- Ablations only: nocapA (A mov dx,0C381h -> 0C3C3h) screen kb8e8 ALL -0.1476 [-0.1830,-0.1123]; nochainB (B zombie_entry mov ax,0F9EBh -> 0F9E9h) screen bfglh ALL -0.0315 [-0.0520,-0.0111].
- Capture value ~0.19 in clean 2025 cohorts (~0.11 zom20a, ~0.05 b/d chain), ~0.06 with Grindo/callfart, ~0 vs V6 family: verified-in-current (kb8e8, bfglh, mrkpn, quf5c). Grindo/callfart decoys absorb A's INT87: verified-in-current (mrkpn real 0.100 vs decoys-broken 0.210). Field cost ~0.009/battle on 2025, 0 on 2024/2023. Alternative 4-byte pattern escapes mimics: not-reproduced (static). INT87 competitors Fishandpoultry/HDS_YOY: not-reproduced. b/d tail competitors: hypothesis. Only fix would be location-based capture (<= +0.01); low priority. Any edit delaying A's INT87 or B's chain is expensive.
- Control binaries: `scratch/B062/grindo_nd/` (Grindo with decoys broken).

### B063 (hook-cell theft, domain 3)
- notheft (ablation: A mov [9769h],ax -> [4A17h]; B mov [5D13h],bx -> [4A17h]): screen zv7iz ALL +0.0078 [-0.0040,+0.0195]; threat htvd5 ALL -0.083 (RegWinners -0.115, b01d -0.121); threat q97wr (b01d+e1p4+segfault mix) +0.198. Not a candidate.
- zph (= B059 binary, B sha e85a4bf6) on the q97wr composition: threat ew9rp +0.291 [0.219,0.362] 12/0.
- Only the V6 family writes [4A17h]; [9769h] is used only by Registered_Winners; [5D13h] only by our lineage: verified-in-current (hookscan.mjs). Steal writes are worth keeping: verified-in-current (htvd5). Theft self-kill with two 5D13h-lineage peers: verified-in-current (q97wr base B 0.057/battle; fixed by zph in ew9rp). Two-thief timing explanation: hypothesis. [4A17h] overwritten before read: not-reproduced (static). Steal writes add per-cohort chaos: verified-in-current (zv7iz).

### B064 (b/d decoys, domain 4)
- p0f (B only: both b/d searches use 0F EB F9 CC with replacement 0F FF 26 17 -> tail jmp [0CC17h]; adds mov [0CC17h],bx; push cs/pop es -> les di,[si+es_ptr] with dw 0,1000h; INT87 stays instr 12; B 211 B sha c83d1fc0): screen 8mp8r ALL +0.0065 [-0.0072,+0.0203]; 2025 +0.003; strong +0.032; threat +0.002; multi -0.004. Threat uue4q ALL +0.035 [0.010,0.059] (OpcodeHunter +0.044, Thefrogs +0.047). Claimed promising (marginal); verified but not selected (third by screen ALL).
- skipB (= B054 fix2steal) threat gi5xk +0.029; nocapB (B mov dx,0CCCCh -> 0C3C3h) threat ov1jc: b/d chain worth ~0.05 in IND_BRA control cohorts.
- OpcodeHunter2 top-address decoys kill the whole b/d capture: verified-in-current (ov1jc 7/8 identical, gi5xk, uue4q). Thefrogs moving EB F9 CC CC copies: verified-in-current (uue4q +0.047; single job). Static copies in OpcodeHunter2/sapir_nogakfar1: hypothesis. zrl03/ah02 decoys: verified-in-other (B054). Total B-side decoy cost ~0.004/battle on 2025.

### B065 (lattice undercut, domain 5)
- Probes only: probe_lat22 (= B055 lat_m30) threats lxcij -0.059, m58nr -0.087, pn6t4 +0.022 (lead_zrl03 +0.136); probe_lat62 (FAR_SEG 0FFCh) threat f2kqk -0.004.
- zrl03/ah02 at 32h undercut rev0: verified-in-current (pn6t4: base 0.435 vs real zrl03, 0.528 at 52h, 0.674 at 62h; ~0.005 on field S ALL). OpcodeHunter2 lattice undercut: not-reproduced (lxcij, m58nr, f2kqk). Other official same-family undercutters: not-reproduced (static lattice.txt). rev0 undercuts the 62h V6-family crowd: verified-in-other. "10h-60h below wins" for all MOVSB replicators: hypothesis.
- Counter codes: `scratch/B065/bin/OH2_lat{02,22,42,52,62,82}` (OpcodeHunter2 with fixed lattice), `scratch/B065/bin/zrl03_lat52_*`, `zrl03_lat62_*`.

### Coordinator wave 3 (COORD-w3)
- Claimed promising: A015 A_t800, A014 L0, B064 p0f, B063 zph (= B059 binary). All screens were against rev0 = current base, so no re-screen was needed.
- Re-check (queue results via wait.mjs, screened sources in cand-build/, reassembly with agent2/tools/nasm-node.cjs):
  - A_t800: screen q84cd matches the report (cand 0.6613 vs base 0.6456, ALL +0.01563 [-0.0132,+0.04447], groups as listed). cand-build source = scratch/A015/A_t800.asm; reassembles to 194 B, sha 4bf226d9... (= screened). Diff vs rev0 A: one comment line + mov dx,04000h -> 03C00h. A014 L4_A.asm is the same code (comment-only difference); lqqx9 is a daemon duplicate of q84cd.
  - L0: screen yinzl matches (cand 0.6526, ALL +0.00701 [-0.01568,+0.02969]). Source = scratch/A014/L0_A.asm; 194 B, sha cc1f23a2... (= screened). Diff vs rev0 A: mov dx,04000h -> 02400h, mov bp,04400h -> 02C00h (+ comment).
  - p0f: screen 8mp8r matches (cand 0.6522, ALL +0.00653 [-0.00719,+0.02025]). Source = scratch/B064/p0fB.asm; 211 B, sha c83d1fc0... (= screened). Diff vs rev0 B is exactly the described change; INT87 is still the 12th instruction. Verified but not selected (third by screen ALL, max 2).
  - zph: not re-confirmed. Same binary was already confirmed in wave 2 (mc03n, pooled +0.0092 [-0.0120,+0.0304]); a second confirmation of the same binary would be a repeated draw. B063's ew9rp (+0.291 on the b01d+e1p4+segfault mix) is new evidence for including zph in a combination, not for a re-run.
- Selected (screen ALL >= +0.006, threat/multi >= -0.02): A_t800 (+0.0156) and L0 (+0.0070). Note: both change A's phoenix DX and are mutually exclusive.
- Confirm 20261003211616632-COORD-w3-confirm-hi50u (A_t800, salt agent2-night-confirm-w3-1, 7680 battles/arm, base rev0, no separate rev0 arm): vs base pooled +0.0012 [-0.0176,+0.0200] (W/L 48/55); 2025 -0.0023; strong +0.0023; 2024live +0.0175; threat +0.0279 [0.0031,0.0526]; multi +0.0234; nozombie -0.0500 [-0.1099,+0.0099] (W/L 9/15). By threat: cgx123123 +0.171, Baltika9 +0.150, LowKey +0.125, CodeKiller +0.092, TrojanByte +0.054 (all 3/0); lead_zrl03 -0.072, lead_zchain4 -0.046 (n.s.). Vs V6Guard pooled +0.0012, vs V6 +0.0065, vs zchain4 +0.0191 (strong +0.111). Decision: NOT promoted (pooled lo <= 0; nozombie diff -0.050 < -0.01).
- Confirm 20261003211616757-COORD-w3-confirm-tdhdw (L0, salt agent2-night-confirm-w3-2): vs base pooled -0.0130 [-0.0311,+0.0051] (W/L 47/54); 2025 -0.0206 [-0.0370,-0.0041]; strong -0.0069; 2024live +0.0161; threat +0.0061; multi +0.0227; nozombie -0.0317 [-0.0722,+0.0089]. By threat: lead_V6 +0.092, V4 +0.075, V6Guard +0.119, zchain4 +0.089 (all 3/0); zomb_callfart -0.168 (0/3), zomb_AnotherBit -0.064 (0/3), cgx123123 -0.097 (n.s.). Vs V6Guard -0.0134, vs V6 -0.0082, vs zchain4 -0.0176. Decision: NOT promoted (pooled lo <= 0; 2025 loss confirmed; nozombie -0.032).
- Lessons: (1) A's trail/step edits trade the plain field for specific opponents. The 800h trail's MOVSW-family gains replicate (cgx123123 +0.17 in screen, threat job and confirm), and L0's V6-family gains replicate, but neither moves the pooled field. (2) Both A-phoenix edits lost on the no-Zombie field (-0.050, -0.032), so part of A's value at 4000h/4400h shows up when there is no capture. Check nozombie in screens of A-step edits before claiming them. (3) L0's 2025 loss in the screen (-0.020) replicated (-0.021). Base stays rev0.
- Helper: scratch/COORD-w3/sum.cjs (prints a confirm result by group and threat).

## Wave 4
All wave-4 roles used revision 0 (V6nohunt). Same notation as earlier waves; job ids shortened to their suffix (full ids in each report.json and in `agent2/night/queue/done/`).

### A016 (B/zombie merge timing)
- E2 (B only: zombie_entry mov bp,3400h -> 09400h (b/d) and mov bp,2000h -> 06800h (zom20a); B 202 B sha 229e1588): screen dbb6r ALL +0.0201 [-0.0113,+0.0515]; 2025 +0.016; strong +0.037; threat +0.022 (zrl03 +0.261, V4 +0.206, TrojanByte -0.2); multi -0.003. Trace wp7fs: 150 deaths vs 161 (pkj3o), B 73 vs 80, B CS-0000 startup self-kill gone, 26 joint B/zombie same-anchor death groups. Claimed promising; sent to confirmation.
- E4 (bp 3400h -> 04400h, 2000h -> 0C000h; sha 6a7155b0): screen 4mpph ALL +0.0173 [-0.0083,+0.0429]; threat +0.029; multi -0.019 (0/2). Same direction as E2; not claimed.
- L63 (bp 3400h -> 0B800h, 2000h -> 0E400h; late merge, sha 07e7323f): screen 9eoj2 ALL -0.0142 [-0.0360,+0.0076]; strong -0.035. Rejected (contrast).
- SP/anchor residue misalignment: not-reproduced (static + pkj3o, 243/267 deaths SP=2 mod 4, rest external). Captured-zombie first anchor in B's startup code: verified-in-current (pkj3o, = B059; absent in wp7fs). B/zombie same-step merge, lead m = 35*(P-10h)/4 mod 64: verified-in-current (pkj3o, wp7fs). Merging hurts via joint kills: not-reproduced (wp7fs, dbb6r). Template corruption kills B + both zombies: verified-in-current (pkj3o, 2/160 battles; writer unidentified).
- Helpers: `scratch/A016/align3.mjs`, `spmis.mjs`, `gen.mjs`.

### A017 (anchor encoding vs signature searchers)
- c18 (A and B: phoenix_init mov ax,01FFFh -> 018FFh, live anchor FF 18 = call far [bx+si]; A 194 B sha 90f4ab2c, B 202 B sha 26a3b772): screen 12ks2 ALL +0.0137 [-0.0124,+0.0397]; only 4/50 cohorts changed (2B2Team +0.600, OpcodeHunter +0.233, EmoMutants -0.167); threat 1i4j6 +0.095 [0.024,0.166] 15/4; threat v9fo1 (2024) +0.029 [-0.021,+0.078]. Claimed promising; verified, not selected (fourth by screen ALL).
- c18x (c18 + guard byte after the anchor: stosw; stosb; dec di; dec di; template 10 words; A 198 B, B 206 B): screen snvrv ALL +0.0035 [-0.0294,+0.0364]; strong -0.038 [-0.061,-0.015]. Rejected (timing).
- FF 1F CC CC searchers hit the live anchor: verified-in-current (12ks2, 1i4j6, v9fo1). FF 18 searchers (EmoMutants2, segment_fault final) hit FF 18: verified-in-other (the cost of c18). ModRM change fixes the FF A5 MOVSW kill: not-reproduced. FF-byte-only writes differ between encodings: not-reproduced. Guard byte at no cost: hypothesis (confounded with timing).
- Helpers: `scratch/A017/scan87.mjs`, `immscan.mjs`.

### A018 (anchor recovery word)
- rw (A and B: stosw; dec di -> stosw; stosw; sub di,3 in init and worker; template copy cx 9 -> 10, B first rebuild 8 -> 9; A 200 B, B 208 B): screen gbff6 ALL -0.0151 [-0.0506,+0.0204]; strong -0.076; multi -0.097. Rejected.
- rwt (rw + timing compensation: A add sp,100h -> 0FCh, DX 4000h -> 4004h; B add sp,600h -> 5FCh, DX 2400h -> 2404h): screen swv6d ALL -0.0013 [-0.0286,+0.0260]; multi -0.081; threat c3v6s (Gamma/Underflow) +0.003; trace fg6of 163 deaths vs 161. Rejected (DL=4 sends the recovery call to anchor+4).
- FF CC anchor hit recoverable: not-reproduced (traces; the CC CC words also overwrite anchor+2). Harmless 00 10 anchor hit: verified-in-current (pkj3o 1/161; ceiling ~+0.002/battle). 00 1F / 10 1F recoverable: not-reproduced (fg6of). FF A5 MOVSW kill: not-reproduced (unchanged, 80 vs 78). Recovery word self-harm: not-reproduced. Card closed.
- Helper: `scratch/A018/faults.cjs`.

### A019 (worker copy count / period)
- W8 (A and B worker mov cl,9 -> 8): screen bbhin ALL -0.0118 [-0.0323,+0.0086]; multi -0.039; lead_V6 -0.22. W10 (mov cl,9 -> 10): screen ooe05 ALL -0.0167 [-0.0437,+0.0102]; multi -0.054. Both rejected.
- Shorter rebuild exposure gains overall: not-reproduced (bbhin, A004 ou61i). The 275-turn period is a local optimum: verified-in-current (bbhin, ooe05; V4/zrl03 gain in both directions = desync). Template/copy inconsistency: not-reproduced (static). Free instruction-level shortening: hypothesis (static, none found). Card closed; keep mov cl,9.

### A020 (rebuild window)
- P7 (A and B worker mov cl,9 -> 7; phoenix DX 4000h -> 3FF8h (A), 2400h -> 23F8h (B) to keep the 275-turn period): screen c2qq6 ALL -0.0389 [-0.0738,-0.0040]; strong -0.206; trace oyb2n 157 deaths, rebuild-window deaths 41 vs 40. Rejected.
- R1 (worker reorder: sub sp,dx moved after xor si,si): screen 8bqu7 ALL 0.0000 [-0.0032,+0.0032], 47/50 cohorts identical. Neutral.
- Reorder cuts exposure: not-reproduced (analytic + 8bqu7). Rebuild deaths scale with copy lag: not-reproduced (oyb2n; most are fresh hits, ceiling ~5% of deaths). A004 C2 strong loss due to the shorter period: not-reproduced (P7 also -0.206). Card closed.
- Helpers: `scratch/A020/phase.cjs`, `lag.cjs`, `ipstat.cjs`.

### B066 (INT87 signature decoys, domain 6)
- dec0A (A only: the 1-turn no-op jmp short phoenix_init -> mov word [0000h],01FFFh, decoy FF 1F CC CC at arena 0000h; A 198 B sha 2fadd3de): threat 83rh4 ALL +0.057 [0.021,0.093] 13/3 (2B2Team +0.106, OpcodeHunter +0.047, ADDvanced +0.019). Not screened by B066; coordinator screen ivs2p (see Coordinator wave 4) ALL +0.0071 [-0.0055,+0.0197].
- padB (ablation: B + db 090h, 203 B): screen twd8z ALL -0.0058 [-0.0118,+0.0003]; threat hzq6i -0.042 0/12; neutered-searcher control asd0g -0.011. Rejected.
- FF 1F CC CC searchers (2025 OpcodeHunter1, 2B2Team, ADDvanced; 2024 live PastRAMa, ATO1, JMP2HELL2, segment_fault1; 2023 several) match rev0 B's arena tail and the dwell anchors: verified-in-current (scan.mjs, hzq6i). This corrects B056's unpadded scan. B's tail acts as a natural decoy: verified-in-current (padB). 2B2Team scores mostly via the search: verified-in-current (asd0g 0.067 vs 0.233). Decoy at 0000h intercepts: verified-in-current (83rh4). Purpose-built signature counters: verified-in-other (B056).
- Control binaries: `scratch/B066/bin/OHn1`/`OHn2` (OpcodeHunter neutered), `TBn1`/`TBn2` (2B2Team neutered). Scanner `scratch/B066/scan.mjs`.

### B067 (trail hunters, domain 7)
- hz (A: writes its zombie_entry address to [4A19h] at startup, INT87 moves from instr 10 to 12, dead zombie_scan spares 0FFBh instead of 0FFCh; B: zombie_fallback (b/d, CX=0) does its INT 87h then cld; jmp [4A19h]; A 202 B sha 352d9d4d, B 209 B sha 654adcb7): screen s8pzc ALL +0.0176 [-0.0081,+0.0432]; 2025 +0.000; strong +0.033; threat +0.041 [-0.000,+0.083]; multi -0.008. Control hzOff (bomb write -> nop nop, A sha b82b560a) screen xcl3y ALL -0.0373 [-0.0605,-0.0141]; paired hz minus hzOff +0.055. Threat pbt3f: cgx +0.088, Baltika9 +0.069, CodeKiller -0.152 (n=4). Claimed promising (low confidence); sent to confirmation.
- Purpose-built far-call trail hunter kills rev0: verified-in-current (y4h5y, base 0.333 vs 0.875 against the no-bomb control). ido_itay2 costs points: not-reproduced (y4h5y). Trail hunters common in 2022-2025: not-reproduced (static, 693 binaries). lead_V6's own hunter active: hypothesis (static). Captured zombies hunting offensively: verified-in-current (s8pzc vs xcl3y).
- Counter codes: `scratch/B067/huntA.asm`/`huntB.asm` (huntV6, very strong vs rev0; add to the threat library), `scratch/B067/hoffA.asm`/`hoffB.asm` (no-bomb control), `scratch/B067/bin/ido1`, `ido2fb` (weak). Helpers: scanpool.mjs, scanimm.mjs, deaths.mjs, pair.mjs, mkhz.cjs.

### B068 (bombers, domain 8)
- Measurement only (candidate = base in all 4 threat jobs). Early INT86 bombs: verified-in-current (ogq11: Underflow 0.7625 vs NOP control 0.8458, ~-0.007/bomb, field <= 0.01-0.02). Dense CC sweep R1DDLE: verified-in-current (sgkrp -0.227 vs idle; lrfq6 -0.13), but an easier-than-average field opponent. tson 13-step bomber family: verified-in-current (mcyhv -0.054). Field-level bomber hole: not-reproduced (obs2.mjs additive model, 21,660 battles). EARLY86 class deficit caused by INT86: hypothesis. Domain closed.
- Control binaries: `scratch/B068/bin/UF_no86_1/2`, `RD_idle_1/2`, `TS_nop_1/2`. Helpers: scan.mjs, obs2.mjs, tsum.mjs.

### B069 (theft self-kill / startup self-harm, domain 9)
- zph (= B059 binary, B sha e85a4bf6) threats: r53y6 (2 copies of each [5D13h] router) +0.200 [0.142,0.257] 19/1; dz1uy (m050+Synthesis+1 random) +0.269 [0.185,0.353] 12/0; q2hkx (single router) +0.039 [0.006,0.073]. E2 (A016 binary) on the r53y6 cohorts: vwuoq +0.069 [0.018,0.121].
- Theft self-kill with 2+ [5D13h] routers (base B 0.00-0.14/battle): verified-in-current (r53y6, dz1uy; all five router teams). Router collapse caused by B059's startup collision: hypothesis (startup-mc.mjs says too rare; likely same-phase crossfire/merge). Startup self-writes in ordinary battles ~2.8%: verified-in-current (Monte Carlo + pkj3o). Hook-cell/zombie-trail writes corrupting zombie_entry: hypothesis. Single router triggers the collapse: not-reproduced (q2hkx). Recommendation: zph into the next combination, not a stand-alone promotion (already failed mc03n).
- Helpers: `scratch/B069/startup-mc.mjs`, `mc_zph.txt`, `mc_e2.txt`.

### B070 (combined attacks, domain 10)
- Re-tests only: A_t800 vs MOVSW crowd (1a8ek) +0.188 [0.110,0.265] 11/0; fix2steal vs zrl03+ah02 (g3tr7) -0.024 n.s.; zph vs Grindo+2B2Team+Baltika9 (22av5) -0.025 n.s.; nocapA in a decoy crowd (vaxe1) -0.017 n.s.
- Distinct MOVSW killers compound: verified-in-current (1a8ek base 0.354; field cost <= 0.002). Zombie-decoy crowd worse than Grindo alone: not-reproduced (vaxe1). zrl03+ah02 compound: not-reproduced (g3tr7). Worst-3 combined cohort: verified-in-current (22av5 base 0.271, sub-additive). Field-level super-additivity: not-reproduced (pool.mjs, 325 cohorts, +0.081 above additive). Clone crowds stand in for distinct crowds: hypothesis (they rank defenses differently). Suggestion: use a distinct MOVSW crowd (cgx+Baltika9+TrojanByte) in the confirmation threat group.
- Helpers: `scratch/B070/pool.mjs`, `fam.mjs`, `single.mjs`, `teams.mjs`.

### Coordinator wave 4 (COORD-w4)
- Claimed promising: A016 E2, A017 c18, B066 dec0A, B067 hz (low confidence), B069 zph (= B059 binary). All screens were against rev0 = current base, so no re-screen for revision reasons was needed.
- Re-check (queue results via wait.mjs; screened sources in cand-build/ compared with the scratch files; reassembly with agent2/tools/nasm-node.cjs into scratch/COORD-w4/build/):
  - E2: screen dbb6r matches the report (cand 0.6657 vs base 0.6456, ALL +0.02011 [-0.01127,+0.0515], groups as listed). cand-build candB.asm = scratch/A016/E2_B.asm; 202 B, sha 229e1588... (= screened). Diff vs rev0 B: exactly the two zombie_entry mov bp immediates (3400h -> 09400h, 2000h -> 06800h) plus comments; A = base.
  - c18: screen 12ks2 matches (cand 0.6593, ALL +0.01367 [-0.0124,+0.03973], 4/50 cohorts changed). Sources = cand-build; A 194 B sha 90f4ab2c, B 202 B sha 26a3b772. Diff vs rev0: only phoenix_init mov ax,01FFFh -> 018FFh in A and in B. Verified, not selected (fourth by screen ALL).
  - hz: screen s8pzc matches (cand 0.6632, ALL +0.01759 [-0.00805,+0.04323]); control xcl3y matches (-0.03729). Sources = cand-build; A 202 B sha 352d9d4d, B 209 B sha 654adcb7. Diff vs rev0 is exactly the described change (A: lea dx,[si+zombie_entry-start]; mov [4A19h],dx at start, cmp si,0FFCh -> 0FFBh; B: zombie_fallback adds int 087h; cld; jmp [4A19h]).
  - dec0A: had no screen. Source reassembles to 198 B, sha 2fadd3de (= B066's claim); diff vs rev0 A is only jmp short phoenix_init -> mov word [0000h],01FFFh. Coordinator screen 20261003223056270-COORD-w4-screen-ivs2p: ALL +0.00711 [-0.0055,+0.01972]; 2025 +0.018 (4/2); strong 0; threat -0.0059 (CodeKiller -0.05, zrl03 -0.033, zchain4 -0.011); multi 0. Passes the numeric bar but ranks below E2 and hz; not selected.
  - zph: not re-confirmed (same binary as mc03n, wave 2). B069's r53y6/dz1uy are evidence for using it in a combination.
- Selected (screen ALL >= +0.006, threat/multi >= -0.02, top 2): E2 (+0.0201) and hz (+0.0176). E4 (+0.0173, multi -0.019) passes numerically but was not claimed and duplicates E2's mechanism.
- Confirm 20261003223125654-COORD-w4-confirm-15igt (E2, salt agent2-night-confirm-w4-1, 7680 battles/arm, base rev0, no separate rev0 arm; tested hashes A 6861894f / B 229e1588): vs base pooled -0.0212 [-0.0441,+0.0018] (W/L 38/65); 2025 -0.0223 [-0.0443,-0.0003]; strong +0.0227; 2024live -0.0767 [-0.1072,-0.0461] (1/13); threat +0.0322 [0.0082,0.0561]; multi +0.0115; nozombie +0.0030. By threat: cgx123123 +0.153, BinaryBandits +0.117, lead_V4 +0.115, V6Guard +0.104, zrl03 +0.092 (all 3/0); TrojanByte -0.093 (0/3), LowKey -0.067 (0/3). Vs V6Guard pooled -0.0160; vs V6 -0.0097 (2024live -0.066); vs zchain4 -0.0020 (strong +0.114). Decision: NOT promoted (pooled lo <= 0; 2025 and 2024live losses).
- Confirm 20261003223125734-COORD-w4-confirm-xkwd0 (hz, salt agent2-night-confirm-w4-2; tested hashes A 352d9d4d / B 654adcb7): vs base pooled -0.0172 [-0.0380,+0.0037] (W/L 36/64); 2025 -0.0247 [-0.0410,-0.0084]; strong +0.0075; 2024live -0.0139; threat -0.0023 [-0.0221,+0.0175]; multi +0.0044; nozombie +0.0033. By threat: BinaryBandits +0.100 (3/0); lead_V6 -0.064 (0/3), Baltika9 -0.117, LowKey -0.042 (0/3). Vs V6Guard -0.0155; vs V6 -0.0124; vs zchain4 -0.0128 (strong +0.099, multi +0.110). Decision: NOT promoted (pooled lo <= 0; 2025 loss confirmed; threat, multi and nozombie gates pass).
- Lessons: (1) Both screens' plain-2025 values (+0.016, +0.000) did not hold on fresh 2025 partitions (-0.022, -0.025); together with zph (+0.055 -> -0.003) this is the third B-zombie edit whose 2025 effect turned negative in confirmation. Placement/zombie-path edits are chaotic on the plain field, and field-S screens with half-width ~0.03 cannot rank them. (2) E2 replicated its threat-group gain (+0.032, V4/V6Guard/zrl03/cgx) but lost 2024live badly (-0.077, 1/13); an early B/zombie merge appears to cost against the 2024 live field. Not traced. (3) hz's threat gain (+0.041 in screen) did not replicate (-0.002). (4) No candidate this night has passed the pooled gate as a single edit; future waves should test combinations (zph + fix2steal + A003 C1, possibly c18 and dec0A, which only touch searcher cohorts) or use larger screens before confirmation. Base stays rev0.

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

### Coordinator wave 5 (COORD-w5)
- Claimed promising: A022 SD, A022 SDd, A024 C2 (B072 fixA is marked promising but screened ALL +0.0004, below the +0.006 bar; recommended for combinations only). All screens were against rev0 = current base, so no re-screen was needed.
- Re-check (wait.mjs --full; scratch sources compared byte-for-byte with cand-build/<job>/cand*.asm; reassembled with agent2/tools/nasm-node.cjs into scratch/COORD-w5/build/):
  - SD: screen ffhjf matches (cand 0.6561 vs base 0.6456, ALL +0.01044 [0.00261,0.01827] 14/2; multi 0). A 192 B sha 255f0fb2, B 200 B sha 36e78a91 (= screened). Diff vs rev0 in A and B: exactly mov cx,9 -> 10 in phoenix_init, mov dx,[4A17h] removed, db 0CCh,0CCh after the worker. Turn-neutral checked in Cpu.java (REP MOVSW does one word per turn, so +1 word = +1 turn, -1 instruction = -1 turn). Verified.
  - SDd: screen wu7h9 matches (cand 0.6624, ALL +0.01678 [-0.00092,0.03447] 12/3; threat +0.001; multi 0). A 196 B sha 103ae804; B = SD_B. Diff vs SD_A: only jmp short phoenix_init -> mov word [0000h],01FFFh. Verified.
  - C2: screen nc1yt matches (cand 0.6625, ALL +0.01689 [-0.00359,0.03737] 13/8; threat -0.003; multi 0). A 143 B sha 36bf5eee; B = rev0. Diff vs rev0 A: band math replaced as described, 4 decoy writes, jmp removed, zombie_entry/zombie_scan tail removed. Band math equivalence checked: floor(si/3C00h)*3C00h + 2CA2h = rev0 AX, including the 8-bit wrap of add ah,2Ch (F000h+2CA2h wraps to 1CA2h in both). Instruction count from INT 87h to phoenix_init is 11 in both. Verified.
- Selected (top 2 by screen ALL, threat/multi >= -0.02): C2 (+0.01689) and SDd (+0.01678). SD (+0.0104) is contained in SDd.
- Confirm 20261003233258954-COORD-w5-confirm-n7xxg (C2, salt agent2-night-confirm-w5-1, 7680 battles/arm, no separate rev0 arm; tested A 36bf5eee / B 8579e2c2): vs base pooled +0.0098 [-0.0023,+0.0219] (W/L 31/26); 2025 +0.0087 [-0.0038,+0.0211]; strong +0.0048; 2024live +0.0225 [-0.0087,+0.0537] 6/1; threat +0.0053 [-0.0001,+0.0107]; multi +0.0063; nozombie +0.0195 [-0.0126,+0.0516]. By threat: max +0.025 (Baltika9, Grindo), min ah02 -0.014. Vs V6Guard pooled +0.0080 [-0.0045,+0.0206]; vs V6 +0.0157 [+0.0032,+0.0281]; vs zchain4 +0.0054 (2025 -0.015, strong +0.124). Decision: NOT promoted (pooled lo <= 0; all other gates pass).
- Confirm 20261003233259151-COORD-w5-confirm-psy2k (SDd, salt agent2-night-confirm-w5-2; tested A 103ae804 / B 36e78a91): vs base pooled +0.0085 [-0.0003,+0.0174] (W/L 27/12); 2025 +0.0114 [+0.0019,+0.0209] 22/6; strong +0.0008; 2024live +0.0050; threat -0.0001 [-0.0062,+0.0060]; multi +0.0089; nozombie +0.0045. Vs V6Guard pooled +0.0120 [+0.0013,+0.0228]; vs V6 +0.0201 [+0.0099,+0.0303]; vs zchain4 +0.0153 (2025 -0.014, strong +0.137). Decision: NOT promoted (pooled lo = -0.0003; all other gates pass).
- Lessons: (1) First wave where both confirmed candidates stayed positive on fresh partitions (+0.0098, +0.0085 pooled; the earlier B-zombie edits all flipped negative). Searcher-decoy edits replicate; their size (~+0.01) is just below what one 7680-battle confirm can resolve at z=2.5. (2) The two are complementary and nearly disjoint in code: C2 changes only A's startup (decoys + stripped tail), SD changes phoenix_init/template in A and B. Next step: one combination C2-A + SD template edits (A: mov cx,10, drop mov dx,[4A17h], db 0CCh,0CCh after the worker; B = SD_B), optionally plus B072 fixA's early INT87 if it fits C2's slot layout. Screen it, then confirm. Do not re-confirm C2 or SDd alone. (3) Both beat V6 on the confirm pooled (lo > 0) and SDd beats V6Guard (lo > 0). Base stays rev0.

## Wave 6
All agents used revision 0 (V6nohunt). Base in every screen = rev0.

### A026 (captured-zombie INT 86h charges)
- Z1 (B only: zom20a path after its INT87: mov ax,1FFFh; int 86h with DI=0, DF=1, DX=CCCCh -> FF 1F CC CC block 0FF04h..0003h; b/d path: 0E070E17 -> CC INT87 replaced by mov di,bx; and di,0FC00h; add di,0164h; mov ax,1FFFh; mov dx,0CCCCh; int 86h -> block [X+68h,X+168h) next to the zombie's own body; zombie band math -> 16-bit DIV (same AX, both zombie paths still reach phoenix_init on the rev0 turn); B 214 B sha 16be94ae): screen 15xh2 ALL +0.0100 [-0.0082,+0.0282] 11/11; 2025 +0.022; strong +0.005; threat -0.006 [-0.025,+0.013]; multi 0; s2025-10 OpcodeHunter +0.200, s2025-15 2B2Team +0.367. Threat i8gtc (2025 searchers) +0.061 [0.017,0.105] 13/5 (OH +0.055, 2B2Team +0.119, ADD +0.009). Threat fz8gf (2024 live) +0.042 [0.007,0.077] 12/4 (PastRAMa +0.096, segment_fault +0.083 4/0, ATO -0.004, JMP2HELL -0.008). Threat ustgi (screen-negative cohorts, fresh) +0.006 [-0.011,+0.023]. Claimed promising.
- Unused zombie INT86 charges (2 per zombie): verified-in-current (static + 15xh2/i8gtc). Captured zom20b/d know own load (BX=load+3; zom20b/d entry does push ds/pop es, so ES = arena): verified-in-current (dis86). Forward-from-0 searchers absorbed by the 0FF04h-0003h block: verified-in-current (i8gtc). Backward-from-FFFFh searcher segment_fault and PastRAMa absorbed (top half; A-side decoys miss these): verified-in-current (fz8gf). Screen-negative TrojanByte/BinaryBandits/IND_BRA/zchain4 cohorts caused by Z1: not-reproduced (ustgi). Zombie INT86 killing other zombies / finishing the b/d chain: not-reproduced (static, MIN_GAP). Fixed block at A600h for 2B2Team1: hypothesis (not built, ~1.4% self-hit).

### A027 (second b/d capture)
- xyB (B only: captured b/d writes (BX+0FDh) xor CCCCh to [4A19h] and patches EB F9 CC CC backward from base+100h with bp 3400h; captured zom20a reads [4A19h] as its INT87 start; B 231 B sha 13778e28): screen 6o11d ALL -0.0226 [-0.0397,-0.0055] 13/24; strong -0.047; threat -0.012; multi -0.029. Threat evtia -0.066 [-0.105,-0.027] 2/12 (LowKey -0.138, TOM_anonymous -0.100). Rejected.
- ctlB (layout control, location feature off; sha 5cd371b3): threat ity8i -0.0035 [-0.019,+0.012]. xyK (kill Y instead of capture; sha 23cb4435): threat r7ssq -0.020 [-0.042,+0.002].
- rev0 lacks the zrl03-style two-step: not-reproduced (static: B startup INT87 + captured zom20a already do it). Capturing lower zombie Y adds value: not-reproduced (6o11d, evtia). Two captured b/d zombies collide on the same bp 3400h anchor: hypothesis (xyB -0.066 vs xyK -0.020 vs ctl -0.003). Early tail consumers MOV_AX_WIN/LowKey/TOM_anonymous2 take the top tail first: verified-in-current (static; no measured loss, ity8i). Card closed; if revisited, give each captured b/d its own lattice offset first. Helper `scratch/A027/scancell.mjs` ([4A19h] unused in all pools).

### A028 (0E070E17 counter-bomb)
- Nothing built, no jobs (stopped after a static scan; `scratch/A028/scan4.mjs`). Card still open, but A026 Z1 already removes this INT87 from the b/d path (B052: worth nothing).

### A029 (NRG)
- N1 (A and B: dead turns -> NRG; A jmp short -> 9B 9B, dead mov dx,[4A17h] -> 9B 9B; A 192 B sha 99d56227, B 200 B sha 589c23ab): screen 18141 ALL +0.0019 [-0.0025,+0.0063]; only 15/50 cohorts changed. Rejected.
- B31 (N1 + 31-NRG burst in A after band math, +30 turns before phoenix_init; A 252 B sha 7ed55df3): screen wcji2 ALL -0.0105 [-0.0241,+0.0032]; strong -0.060 [-0.100,-0.021]. Rejected.
- D31 (control: same layout, 30 of 31 NRGs -> mov ax,ax; A sha 36490b70): screen lhukp ALL -0.0062 [-0.0242,+0.0118]; strong -0.062 [-0.113,-0.011]; multi -0.057.
- NRG in zombies: not-reproduced (static War.java: zombies ignore energy). NRG in dwell loop/template: not-reproduced (static). Startup NRG burst pays off: not-reproduced (B31-D31 -0.004 +-0.014). Delaying A's phoenix start ~30 turns costs vs strong: verified-in-current (lhukp, wcji2; ~-0.05..-0.06). Free NRG on dead turns: not-reproduced (18141). Opponents gain from NRG: hypothesis. Card closed.

### A030 (INT87 bomb on MOVSW anchors via the spare zombie charge)
- Nothing built, no jobs (session stopped early). Card still open. Note: A026 Z1 now uses the b/d-path spare INT87 slot for an INT86 block; the INT87 charge itself is still free.

### B076 (worker-template signature attack, counter-code)
- Counter tplsig `scratch/B076/counterA.asm`/`counterB.asm` (A 117 B sha 6098599c, B 171 B sha 5aac73bf; INT87 B1 09 31 F6 -> CC CC CC CC before phoenix_init copies the template): base team 0.003 (5n2sl, 1 copy), 0.025 (aiipe), 0.000 at 2 copies (9tabr) and 3 copies (ee7fn). Control `ctlA/ctlB.asm` (searches B1 09 31 F7): base 0.338 / 0.192 / 0.111. Variant tplcom `comA/comB.asm` (29 D4 29 2F): base 0.058 (aiipe).
- Template-signature attack: verified-in-current (5n2sl, 9tabr, ee7fn, aiipe). SDd and C2 equally exposed: verified-in-current (diff exactly 0). Template shared by V6/New_Best/zchain4 lineage, cheap to build: verified-in-current (static scan; only HRZ_Registered_Winners outside the family). Field teams dilute common-window counters: hypothesis (aiipe). Re-encoding template as fix: hypothesis (expected useless). Only constructive fix: never keep the template contiguous (mov ax,imm/stosw), which loses B's natural tail decoy; treated as accepted low-exposure risk. Add tplsig to the threat library.

### B077 (far-call trail hunter, counter-code)
- Nothing built, no jobs (safety classifier stopped the session). Card open. Existing test case `scratch/B067/huntA.asm`/`huntB.asm` (y4h5y: rev0 0.333 vs 0.875 control).

### B078 (page-lattice bomber, counter-code)
- Nothing built, no jobs. Card open. Existing test cases: `scratch/B058/pg52A.asm`/`pg52B.asm`; B068 early INT86 ~-0.007/bomb.

### B079 (domain 9 counter-code)
- Nothing built, no jobs (session stopped). Card open; see B059, B069, A005, A013.

### B080 (domain 10 counter-code)
- Nothing built, no jobs (stopped after reading). Card open; existing counters from B051/B060, B055, A011, B056, B058, B067, B072, B073, B074, B076.

### Coordinator (wave 6)
- Verified Z1: screen 15xh2 and threat jobs i8gtc, fz8gf, ustgi match the report. Binary cand-build/15xh2/candB 214 B sha 16be94ae (= scratch build). Diff vs rev0 B.asm is exactly the described zombie-path edits; B startup unchanged. Band math equivalence checked (floor(si/3C00h)*3C00h + bp, 16-bit wrap same as rev0's add ah). Zombie-path instruction counts to phoenix_init: zom20a 27 = 27, b/d 22 = 22. DX/CX/BX clobbers are reset in phoenix_init. Screened against rev0 (current base), so no re-screen needed.
- No other claimed-promising candidates (A027 xyB, A029 N1/B31/D31 all fail the bar).
- Selected: Z1 (screen ALL +0.0100; threat -0.006; multi 0).
- Confirm 20261004002950293-COORD-w6-confirm-013sr (Z1, salt agent2-night-confirm-w6-1, 7680 battles/arm, no separate rev0 arm since base = rev0; tested A 6861894f (rev0) / B 16be94ae): vs base pooled +0.0091 [-0.0022,+0.0204] (W/L 35/26); 2025 +0.0141 [+0.0014,+0.0268] 28/15; strong -0.0020 [-0.0098,+0.0058]; 2024live -0.0006 [-0.0110,+0.0099]; threat +0.0102 [-0.0031,+0.0234]; multi +0.0018 [-0.0076,+0.0112]; nozombie +0.0010 [-0.0010,+0.0030]. By threat: max LowKey +0.083 (n.s.), zrl03 +0.040, TrojanByte +0.033, callfart +0.022; min BinaryBandits -0.018, V4 -0.017. Vs V6Guard pooled +0.0089 [-0.0041,+0.0219] (strong -0.014); vs V6 +0.0165 [+0.0030,+0.0301]; vs zchain4 +0.0317 [-0.0077,+0.0711] (2025 +0.004, strong +0.147, nozombie -0.017). Decision: NOT promoted (pooled lo = -0.0022 <= 0; threat/multi/nozombie gates pass).
- Lessons: (1) Z1's gain is confined to the 2025 group (+0.014, lo > 0); the 2024live searcher gain seen in fz8gf (segment_fault, PastRAMa) did not show up in the confirm's 2024live group (-0.0006), so that effect is cohort-specific. (2) Third searcher-decoy edit in a row that replicates at about +0.009 pooled and just misses z=2.5 on one confirm. Z1 (B zombie paths), C2 (A startup) and SD (phoenix_init/template) touch disjoint code; the next step stays one combination C2-A + SD + Z1 zombie paths, screened then confirmed, rather than re-confirming any of them alone. Whether their searcher gains add or overlap (all target the same FF1FCCCC searchers) is untested. Base stays rev0.

## Wave 7
All agents used revision 0 (V6nohunt). Base in every screen = rev0.

### A031 (A-own INT 86h decoy block; combination K)
- E1 (A only: after the zom20a INT87, mov di,0FF80h; mov ax,1FFFh; mov dx,0CCCCh; int 86h -> 64 FF 1F CC CC decoys at 0FF80h..007Fh (wraps); band math -> 16-bit DIV (same AX), no-op jmp removed, phoenix_init on rev0's turn; A 198 B sha 40db225b): screen ktggg ALL +0.0106 [-0.0034,+0.0245] 8/6; 2025 +0.019; strong 0 (identical); threat -0.0017; multi +0.036; s2025-10 OH +0.200, s2025-15 2B2Team +0.267. Threat fm2tw (2025 searchers, Z1's i8gtc spec) +0.084 [0.041,0.127] 15/3; threat vdhwq (2024 live, Z1's fz8gf spec) +0.053 [0.016,0.090] 12/4 (JMP2HELL +0.129 4/0, segment_fault +0.058, PastRAMa +0.046, ATO -0.021 n.s.). Claimed promising.
- K (E1 + A022 SD in A; B = A026 Z1_B + SD; A 196 B sha 6d5bbfa6, B 212 B sha c71fe517): screen nwqyk ALL +0.0164 [-0.0043,+0.0371] 17/12; 2025 +0.028; strong +0.010; threat -0.0017; multi +0.032. Searcher gains sub-additive on field S. No threat job. Claimed promising.
- 2025 FF1FCCCC searchers absorbed by an A-own block: verified-in-current (fm2tw, ktggg). 2024 live searchers absorbed: verified-in-current (vdhwq). ATO1 not absorbed (searches before A's INT86 or with another DI): hypothesis. Initializer signature exposure: not-reproduced (static `scratch/A031/sig.mjs`; only B's FF1FCCCC tail matches, and it helps us). Self-harm of the 0FF80h block: not-reproduced (ktggg, static).

### A032 (zom20c capture)
- Nothing built, no jobs (session stopped after reading). zom20c (232 B) = one 2Eh-byte block x8, entry jmp short 005Eh, so a forward search hits decoy copies first: hypothesis (static only). Card open.

### A033 (second b/d capture with order flag)
- yB (B only: captured b/d does lea bp,[bx+0FDh]; xor bp,0CCCCh; xchg [4A19h],bp; first b/d searches EB F9 CC CC backward from its base+100h, bp 3400h; second b/d runs rev0's counter-bomb and its phoenix at bp 9400h; zom20a reads [4A19h] xor CCCCh as INT87 start; B 255 B sha 80ae2c3e): screen vnmqe ALL +0.0133 [-0.0048,+0.0314] 19/17; 2025 +0.006; strong +0.070 (sstrong-1 +0.311, sstrong-5 +0.171); threat -0.001; multi +0.017. Threat epuig (A027 evtia cohorts) +0.0045 n.s.; threat 7f4zg (fresh mixAll b01d+e1p4+m050) +0.254 [0.185,0.322] 12/0. Claimed promising.
- yC (control, zom20a reads the unused [4A1Bh]; B sha b13ee499): screen u5bnq ALL +0.0089 [-0.0088,+0.0266]; strong +0.072. yB - yC = +0.0044 (8 cohorts differ): the gain comes from the first/second b/d split, not from Y capture.
- Y capture in the common case: not-reproduced (static: 5 charges needed, 4 available when k=0). xyB's loss came from the second b/d on bp 3400h: verified-in-current (epuig vs evtia). Multiple [5D13h]-stolen b/d zombies on one anchor: verified-in-current (7f4zg; mechanism not traced). Dropping the counter-bomb from the first b/d costs: not-reproduced (vnmqe).

### A034 (captured zombie in a different role)
- Nothing built, no jobs (session stopped after reading). Card open.

### A035 (lane-locked captured zombies)
- LK (B only: zombie bp 3400h->0CC00h, 2000h->4800h; zombie tail mov bp,0F7B8h; phoenix_init mov dx,2400h -> lea dx,[bp+2400h]; B 206 B sha 96a3fc84): screen k19kd ALL -0.0103 [-0.042,+0.021]; 2025 -0.030. Trace xx1xi: B<-zombie kills 6->2, zombie<-A/B kills 13->2, but A<-zombie 3->10. Rejected.
- LKbd (b/d path only, own INT87 tail copy; B 243 B sha 5ca028e0): screen mwoox ALL -0.0085 [-0.029,+0.011]; 2025 -0.020; multi -0.021 0/2. Trace nja6y: B<-zombie 2. Rejected.
- Drifting zombies cross B: verified-in-current (pkj3o, xx1xi, nja6y; about 6 B deaths per 168 battles, below screen resolution). 1:1 lockstep keeps zombies off B: verified-in-current (traces), no score gain. Locked zom20a raises A deaths: hypothesis (xx1xi, p about 0.05). On-lattice 2:1 lockstep: not-reproduced (arithmetic). callfart loses on any zombie trail change: not-reproduced (k19kd 0, mwoox +0.022). Card closed. Helpers `scratch/A035/lanes.mjs`, `ana.mjs`.

### B081 (MOVSW FF A5 anchor kill)
- Nothing built, no jobs (session stopped). Anchor kill by MOVSW trails: verified-in-current (earlier traces pkj3o/4sf0x). Byte-level re-encoding fix: not-reproduced (static residue analysis). Lattice offset changes MOVSW coverage: not-reproduced (static). A/cgx123123 near-equal speed explains A_t800's cgx gain: hypothesis. Card open.

### B082 (zom20a location leak [1243h])
- locA (A only, first version; [4A17h]->[9769h] copy after INT87; A 205 B sha d8e18c34): screen 62gpp ALL +0.0050 [-0.0044,+0.0145]; s2025-9 RW -0.078. Threat tmbm1 +0.086 [0.034,0.138] 18/3. Superseded.
- locA2 (A only: mov ax,[1243h] at instr 4; [9769h] copy at instr 5-6; mul word [15] -> DI = 15*v1; les ax,[F2E2h,1000h]; INT87 at instr 11; band math 16-bit DIV; 2 nops keep phoenix_init at turn 22; A 204 B sha cfea7b40): screen wtaw2 ALL +0.0057 [-0.0033,+0.0148]; 2025 +0.004; strong -0.005; threat +0.009; multi +0.040; Grindo +0.133. Threat 2r899 +0.107 [0.051,0.163] 15/4 (Grindo +0.146 6/0, B052 planter +0.275 6/0, RW -0.006, lead_V6 +0.013). Defense fix; below the +0.006 selection bar; candidate for a combination (A startup only).
- Grindo E2F281C3 mimics absorb A's INT87: verified-in-current (tmbm1, 2r899). B052 planter removes the zom20a capture: verified-in-current (fixed by locA2). B074 planter answered: hypothesis (tmbm1 +0.058 n.s.). callfart poisons [1243h]: verified-in-current (static, tmbm1 -0.015). [1243h] leak known in 2025 (7 readers, 4 writers): verified-in-current (`scratch/B082/scan1243.cjs`). Late [9769h] copy loses RW captures: hypothesis (62gpp vs wtaw2). INT87 at instr 11 loses to V6: not-reproduced (2r899). AnotherBit is a decoy: not-reproduced. Counter-code: official-2025/survivors-online/GSA_callfart2 (already beats the fix).

### B083 (body-cell hook cells vs [4A17h] poisoners)
- bc2 (A and B: hook cells inside the bodies, les di,[si+arenaptr] layout, B self-patches zombie_entry mov cx; timing unchanged; A 207 B sha c42a2cb0, B 217 B sha 37e1074e): screen y6bql ALL -0.0101 [-0.0190,-0.0012]; strong -0.022 0/5. Threat reu4e +0.062 [0.024,0.100] 14/3 (B073poison +0.194 4/0, B083poisonE +0.119 4/0). Rejected alone.
- bc2ctl (same layout, defense off; A sha d9b52e9c, B sha 189642ae): screen t2n39 ALL -0.0110 [-0.0192,-0.0028]. bc2 - bc2ctl paired +0.0009 +-0.0041: the defense costs nothing; the layout bytes cost about -0.01.
- pad (rev0 + trailing CCh to bc2 sizes): screen ufzyj ALL 0.000.
- Counter-codes: `scratch/B083/poisonEA.asm` / `poisonEB.asm` (B083poisonE, [4A17h] write at instr 3 and 4; team 0.610 vs base) and B073poison. Fixed-cell poisoner steals captures: verified-in-current (reu4e). Early poisoner partly beats bc2's A channel: verified-in-current (reu4e +0.119 vs +0.194; significance of the residual leak: hypothesis). In-body hook cells cost: not-reproduced. bc2 layout bytes cost: verified-in-current (y6bql, t2n39). Size alone: not-reproduced (ufzyj). Sharing [4A17h] with V6 costs: hypothesis. Next: port the cells onto a rebuilt startup (E1/C2 16-bit band math frees turns), screened with a defense-off control.

### B084 (b/d search 0F EB F9 CC + [0CC13h] steal)
- p0f13 (B only: B064 p0f (0F EB F9 CC window on both b/d searches; push cs/pop es -> les di,[si+es_ptr]) with hook cell 0CC17h -> 0CC13h: mov [0CC13h],bx at instr 5, replacement CX 1326h; startup INT87 still instr 12; B 211 B sha 99361147): screen tcluu ALL +0.0178 [-0.0001,+0.0356] 16/12; 2025 +0.002; strong +0.053; threat +0.031 (zrl03 +0.167, ah02 +0.222); multi -0.004. Threat qpbgf +0.079 [0.029,0.128] (zrl03 +0.173 4/0, ah02 +0.200 4/0, decoy-only +0.115, B074 planter -0.073 0/4). Threat rocnd (p0f, same spec): zrl03/ah02 about 0. Replication znzho (12 fresh cohorts): planter -0.024 n.s., B074 ctl -0.044 n.s. Claimed promising (defense fix).
- p0f2c (private 0CC17h cell + [0CC13h] steal, les dx merge; B 212 B sha 5292cec1): not screened.
- zrl03/ah02/zchain4 captures stolen via [0CC13h]: verified-in-current (qpbgf vs rocnd, tcluu). EB F9 decoys skipped by the 0F window: verified-in-current (qpbgf, rocnd). p0f recovers the B074 planter: not-reproduced (rocnd, qpbgf, znzho). Late-search / late-[0CC13h] zchain4-body counters cost about -0.03: hypothesis (znzho).

### B085 (split lattice FAR_SEG 0FF6h)
- SB (B only: or dx,0FFBh -> 0FF6h; B 202 B sha a10b3712): screen txodc ALL -0.0240 [-0.0534,+0.0055]; strong -0.180 0/7; lead_V6 -0.211. Threat d9exx +0.063 [0.017,0.110] (clone22 +0.091, clone42 +0.135 6/0). Rejected.
- SA (A only, same edit; A 194 B sha af53e8cd): screen alu16 ALL -0.0348 [-0.0530,-0.0165]; 2025 -0.030; strong -0.096. Threat dua2j +0.041 [0.008,0.074]. Rejected.
- Undercut clones 10h-50h below 52h take points: verified-in-current (d9exx, dua2j). A 02h partner answers them: verified-in-other (d9exx, dua2j). Split lattice costs on field S: verified-in-other (txodc, alu16). zrl03 answered by the low partner: hypothesis. Low partner beats V6 leaders: not-reproduced. Domain 5: lattice placement trades holes; further undercut defenses must change the kill mechanism. Test arms: `scratch/B055/lat_m30_*.asm`, `scratch/A011/fa_*.asm`.

### Coordinator (wave 7)
- Claimed promising: A031 E1, A031 K, A033 yB, B082 locA2 (defense fix), B084 p0f13 (defense fix). All screens were against rev0 = current base, so no re-screen was needed.
- Verification (wait.mjs + cand-build sources/binaries; cand-build .asm files are byte-identical to the scratch sources):
  - E1: screen ktggg matches (cand 0.6562 vs 0.6456, ALL +0.01056 [-0.00343,+0.02454] 8/6). A 198 B sha 40db225b. Diff vs rev0 A: 4 instructions after INT87 (mov di,0FF80h; mov ax,1FFFh; mov dx,0CCCCh; int 86h), band math -> xor dx,dx; mov cx,3C00h; div cx; mul cx; add ax,2CA2h, jmp short phoenix_init removed. Same AX as rev0 (floor(si/3C00h)*3C00h + 2CA2h equals rev0's high-byte arithmetic, including the wrap); 10 instructions replace 10, so phoenix_init is on rev0's turn. Verified.
  - K: screen nwqyk matches (cand 0.6620, ALL +0.01638 [-0.00434,+0.0371] 17/12; threat -0.0017; multi +0.032). A 196 B sha 6d5bbfa6, B 212 B sha c71fe517. K_A minus E1_A = exactly the SD edits (mov cx,10; dead mov dx,[4A17h] dropped; db 0CCh,0CCh after the worker). K_B minus A026 Z1_B = exactly the same SD edits. Verified.
  - yB: screen vnmqe matches (ALL +0.01332 [-0.00479,+0.03142]). B 255 B sha 80ae2c3e. Diff vs rev0 B is limited to zombie_entry as described. Verified.
  - locA2: screen wtaw2 matches (ALL +0.00572). Below the +0.006 bar, so not eligible.
  - p0f13: screen tcluu matches (cand 0.6634, ALL +0.01775 [-0.00014,+0.03564]; threat +0.031; multi -0.004). B 211 B sha 99361147. Diff vs rev0 B: mov [0CC13h],bx at instr 5 and push cs/pop es -> les di,[si+es_ptr] (dw 0,1000h), search 0F EB F9 CC / replacement 0F FF 26 13 (-> jmp [0CC13h]) on both b/d searches. Startup INT87 stays the 12th instruction. Verified.
- Selected (top 2 by screen ALL, threat/multi >= -0.02): p0f13 (+0.0178) and K (+0.0164). yB (+0.0133) and E1 (+0.0106, contained in K) not confirmed this wave.
- Confirm 20261004010732758-COORD-w7-confirm-6aetq (p0f13, salt agent2-night-confirm-w7-1, 7680 battles/arm, no rev0 arm since base = rev0; tested A 6861894f (rev0) / B 99361147): vs base pooled +0.0044 [-0.0061,+0.0150] 35/28; 2025 +0.0084 [+0.0001,+0.0168] 25/15; strong -0.0001 [-0.030,+0.030]; 2024live -0.0092 [-0.023,+0.005] 2/7; threat +0.0354 [+0.0151,+0.0558] 21/10; multi -0.0031 [-0.030,+0.024]; nozombie 0. By threat: ah02 +0.154, zrl03 +0.142, zchain4 +0.110, CodeKiller +0.058; min V6Guard -0.013. Vs V6Guard pooled +0.0110 [-0.0020,+0.0240]; vs V6 +0.0139 [+0.0010,+0.0269]; vs zchain4 +0.0190 [-0.018,+0.056] (2025 -0.009, strong +0.143, nozombie -0.038). Decision: NOT promoted (pooled lo = -0.0061; threat/multi/nozombie gates pass).
- Confirm 20261004010732854-COORD-w7-confirm-a26f6 (K, salt agent2-night-confirm-w7-2; tested A 6d5bbfa6 / B c71fe517): vs base pooled +0.0087 [-0.0049,+0.0222] 38/30; 2025 +0.0078 [-0.0051,+0.0206] 27/22; strong +0.0001 [-0.0038,+0.0040]; 2024live +0.025 [-0.020,+0.070] 8/4; threat +0.0035 [-0.0018,+0.0087]; multi -0.0008 [-0.0036,+0.0020]; nozombie +0.0115 [-0.0019,+0.0249] 5/1. By threat: max callfart +0.021, min TrojanByte -0.017. Vs V6Guard pooled +0.0109 [-0.0037,+0.0256]; vs V6 +0.0182 [+0.0024,+0.0339]; vs zchain4 +0.0185 [-0.016,+0.053] (2025 -0.009, strong +0.108, nozombie +0.053). Decision: NOT promoted (pooled lo = -0.0049; threat/multi/nozombie gates pass).
- Base stays rev0. Helper: `scratch/coord-w7-eval.cjs` (applies the fixed promotion rule to confirm results).
- Lessons: (1) p0f13's gain is concentrated in the threat group (+0.035, lo > 0: zrl03/ah02/zchain4 steal); on the pooled field it is +0.004 and 2024live leans negative (-0.009, 2/7), so it is a targeted defense, not a field gain. (2) K, the planned searcher-decoy combination (E1 + SD + Z1), replicates at +0.0087 pooled, the same size as Z1, SDd and C2 alone (+0.009, +0.0085, +0.0098): the searcher-decoy edits overlap rather than add on fresh fields, as the sub-additive screen already suggested. Its 2024live (+0.025) and nozombie (+0.0115) gains are new relative to Z1 (from E1's A-own block), but neither is significant. (3) K and p0f13 touch different B code (K: zombie paths + template; p0f13: startup search/hook cell + both b/d search patterns, shared with Z1's b/d path) and gain in different groups (K: 2025/2024live/nozombie; p0f13: threat). The natural next candidate is K with p0f13's B edits ported onto Z1_B (check the b/d-path overlap), screened then confirmed with a larger effect target; a single 7680-battle confirm cannot resolve +0.009 at z=2.5.

## Wave 8

All agents used revision 0 (V6nohunt). Base in every screen = rev0.

### A036 (earlier zom20a capture; location start)
- loc9 (A and B: A = location start DI = 15*[1243h] (B082 idea), les ax,[F2E2h,1000h], INT87 at instr 9, [4A17h]->[9769h] copy removed from A, 1 nop keeps phoenix_init at turn 22; B adds mov [9769h],bx at instr 4 and push cs/pop es/mov ax,F9EBh -> les ax,[F9EBh,1000h] + nop, startup INT87 stays instr 12; A 200 B sha 6efa388b, B 209 B sha a43aa78a): screen 4be1b ALL +0.0017 [-0.0105,+0.0139] 14/15; 2025 +0.006; strong -0.012; threat -0.005; multi +0.053. Threat mwcd9 (B082 2r899 spec) +0.106 [0.053,0.160] 16/3 (Grindo +0.121 6/0, B052plant +0.275 6/0, RW +0.019 n.s.). Threat oepr9 -0.0066 n.s. (zrl03 +0.016, V6Guard -0.022 n.s. 2/5). Trace kuz74 vs pkj3o: zom20a captured 146 vs 144/160. Not promising.
- Earlier capture adds score: not-reproduced (4be1b; capture round 7/10/13 = fixA +0.0004 / loc9 +0.0017 / locA2 +0.0057). rev0 capture round depends on group order: verified-in-current (static, kuz74). B's [4A17h] write limits capture: not-reproduced (static). Clean-cohort zom20a loss from missed captures: not-reproduced (pkj3o/kuz74; ~90% captured, losses after capture). zom20d fixed writes kill captured zom20a then B: verified-in-current (pkj3o, ~2/160). Grindo/B052 absorb A's INT87, location start fixes: verified-in-current (mwcd9). Moving the [9769h] write to B instr 4 loses RW: not-reproduced (mwcd9). Earlier patch costs vs V6Guard: hypothesis (4be1b, oepr9). zrl03 loss: not-reproduced (oepr9). Card closed. Reusable: B writes [9769h] at instr 4 (frees 2 A startup instructions). Helper `scratch/A036/cap2.cjs`.

### A037 (private hook cell + late [4A17h] steal)
- D1 (B: [4A17h] -> [0B6E9h] for hook cell and both mov cx; A: les ax,[si+zdata], mov bp,[0B6E9h] / mov [9769h],bp, INT87 CX 0B6E9h, late mov [4A17h],bp at instr 9, INT87 stays instr 10; A 204 B sha a24d3b07, B 202 B sha 9befc827): screen qrbo8 ALL +0.0006 [-0.0062,+0.0075] 8/13, all groups n.s. Threat 6vw1o +0.063 [0.019,0.107] 15/5 (B073poison +0.138 4/0, B083poisonE +0.144 4/0, V4 +0.042 4/0). Threat 8c6hg (2 copies) +0.016 n.s. Threat lwnbx (12 fresh cohorts): V6Guard -0.049 [-0.092,-0.007] 1/11; V6 +0.026 n.s. Not promoted.
- [4A17h] poisoners steal captures: verified-in-current (6vw1o). [4A17h] race with V4/V6: verified-in-current (6vw1o V4; V6 same sign in 3 jobs, n.s.). D1 regresses vs V6Guard: verified-in-current (lwnbx; mechanism not traced). Adaptive poisoner on 0B6E9h: hypothesis. Next: ablations (B cell only = B053 reloc; no A layout change; steal at instr 5-6). Builder `scratch/A037/mk.cjs`.

### A038 (zom20a search window vs callfart mimics)
- locpatA (A only: B082 locA2 with search F2 81 C3 E1 (dw 081F2h, mov dx,0E1C3h), replacement FF 26 17 4A at zom20a+2Ch so loop E2 F2 -> E2 FF -> jmp [4A17h]; 4 bytes differ from locA2; A 204 B sha 6e9af3ce): screen 2lrd7 ALL +0.0062 [-0.0056,+0.0179] 14/15; 2025 +0.004; strong -0.012 (sstrong-3 -0.117); threat +0.014; multi +0.040. Paired vs locA2 (wtaw2): +0.0004. Threat zz0ny +0.047 [0.019,0.075] 16/4 (callfart +0.081 6/0, Grindo +0.111 6/0). Claimed promising (defense fix).
- patA (A only: rev0 with the same window change; A 194 B sha 24a2d583): screen 4ojix ALL +0.0016 [-0.0070,+0.0103]; threat 4qhxq -0.0007 (callfart +0.033 n.s., Grindo 0, lead_V6 -0.028 [-0.047,-0.009] 0/4). Not promising.
- parB (B only: mov bp,3400h moved after jcxz into zombie_fallback; B sha 13daac57): not screened.
- callfart E2F281C3 mimics absorb A's INT87 and poison [1243h]: verified-in-current (zz0ny, 4qhxq, screens). Grindo copies every window: verified-in-current (static `scratch/A038/scan.mjs`, 4qhxq). AnotherBit decoy: not-reproduced. Other archived code contains F2 81 C3 E1: not-reproduced (scan). Extra loop opcode costs vs V6/strong: hypothesis (4qhxq vs zz0ny; sstrong-3).

### A039 (b/d search start at B's address)
- locB (B only: both b/d searches start at B's load address via mov di,ax / mov di,[4A17h]; +2 bytes; B 204 B sha 9db214f8): screen fby9g ALL +0.0079 [-0.0045,+0.0203] 18/12; 2025 +0.008; strong +0.015; threat +0.010; multi -0.031 [-0.069,+0.008] 0/2. Threat lth21 +0.017 n.s.; threat y93aj (2 copies x 8) +0.0025 n.s. Claimed promising.
- p0f13locB (B084 p0f13 + locB; B 213 B sha ff8f78ff): screen 09b1x ALL +0.0135 [-0.0055,+0.0325]; multi -0.039 [-0.061,-0.017] 0/2; below p0f13 alone (tcluu +0.0178). Not promising.
- One INT87 can capture b/d at an unknown address: not-reproduced (static; period-0x19 copies). Top-searching tail consumers: not-reproduced (lth21). OpcodeHunter2/zrl03 EB F9 decoys avoided: hypothesis (lth21, fby9g; overlaps p0f13). Multi-copy V6 loss: not-reproduced (y93aj). RW takes back [9769h] captures: hypothesis (fby9g s2025-9 -0.133). b/d search-parameter space looks used up. Builder `scratch/A039/mk.cjs`.

### A040 (direct-write zom20b/d capture)
- Nothing built, no jobs (session stopped by a safety classifier during static analysis). Direct-write capture via x612h/x226h: hypothesis (static). Card open. Helpers `scratch/A040/tab*.cjs`.

### B086 (decoy copies of A's late code vs signature counters)
- dA (A only: A 00h-7Eh unchanged; dead zombie tail replaced by a copy of A[04h..7Eh] + A1 17 4A + FF 1F, so every late A window occurs twice, dead copy higher; A 255 B sha c0995aed): screen ooxys ALL +0.0036 [-0.0025,+0.0096] 6/3; 2025 +0.009 4/0; threat -0.003; multi 0. Threat jaslw +0.134 [0.098,0.169] 20/0 (nbsig +0.181, nbkill +0.135, nbsig2 +0.133, tplsig +0.148, dsig +0.204; rev0 0.000 in all; aware 0). Defense fix, below the field bar.
- dAB (dA + 54-byte B decoy of B[8Fh..0C4h] behind the startup jmp; B 256 B sha 6fafb2fd): screen dtfx1 ALL +0.0006 [-0.0084,+0.0096] 14/16. Threat ss87t +0.172 [0.129,0.214] 20/0 (fwdkill +0.183, fwdsig2 +0.244). Not promoted.
- Backward same-signature counters wipe rev0: verified-in-current (jaslw). Distinct A/B signature backward counter: verified-in-current (jaslw dsig). Forward counters: verified-in-current (ss87t, dAB only). Decoy-aware counter: verified-in-current (aware 0 in both; no complete fix fits in 256 bytes). B windows left uncovered by dAB: hypothesis (static `mkc.cjs`). Field cost of decoys: not-reproduced. Counter-codes: `scratch/B086/counterA.asm`+`counterB.asm` (dsig), `awareA.asm`+`counterB.asm`, `fwdkillA.asm`+`fwdkillB.asm`, `fwdsig2A.asm`+`fwdsig2B.asm`. Generators mk/mkb/mkc/mkf.cjs.

### B087 (far-call trail hunter)
- Nothing built, no jobs (session stopped after reading). Trail hunter kills rev0 anchors: verified-in-other (B067 y4h5y). Card open; test case `scratch/B067/huntA.asm` / `huntB.asm`.

### B088 (per-battle mixed anchor lattice)
- mix4 (A and B phoenix_init: and dx,0 -> and dx,3; or dx,0FFBh -> 0FF8h; lattice 22h/32h/42h/52h chosen by [4A17h]&3; 0 bytes, 0 turns; A sha 45d08fff, B sha 61e71c47): screen irh7d ALL -0.0021 [-0.0231,+0.0190]; strong -0.045; threat +0.010; multi +0.103. Threat 52phq: pg52 +0.615 8/0, pg22 -0.175 0/7, pgall16 +0.044. Threat wfvlw: V6Guard +0.103, zchain4 -0.076, zrl03 -0.036. Threat mvmvo: B088_pgadapt -0.547 0/8; R1DDLE -0.016 n.s.; tson 0. Not promoted.
- Static 52h bomber wipes rev0, mixed lattice recovers: verified-in-current (52phq). Mixed lattice opens other offsets: verified-in-current (52phq). All-offset bomber still hurts: verified-in-current (52phq). Adaptive [4A17h]-reading bomber defeats it: verified-in-current (mvmvo). Leader trades: verified-in-current (wfvlw). Real 2025 CC bombers lattice-dependent: not-reproduced (mvmvo). Late [4A17h] writer splits the lattice: hypothesis. Early INT86 bombs: verified-in-other (B058, B068). Counter-code: `scratch/B088/pgadaptA.asm` / `pgadaptB.asm`.

### B089 (split of B059 zph)
- h34 (B only: zombie_entry CX=0 path mov bp,3400h -> 7000h, byte 62h 34h -> 70h; B 202 B sha 57e2beea): screen pfmzf ALL +0.0182 [-0.0007,+0.0370] 23/9; 2025 +0.011; strong +0.025; threat +0.029 [0,+0.059] 7/1 (cgx123123 +0.200, V4 +0.139); multi -0.008. Threat a4urp (r53y6 spec, 2 routers) +0.192 [0.147,0.237] 19/1 (zph +0.200). Threat udhy4 (zrl03/zchain4/ah02/AnotherBit single copy) +0.0021 n.s. (zrl03, zchain4, ah02 exactly 0). Claimed promising (defense fix).
- h20 (B only: CX!=0 path 2000h -> 5C00h; B sha 3ed20a6a): threat i6toy -0.060 [-0.102,-0.017] 3/13. Control, rejected.
- 2-router theft self-kill is caused by the CX=0 path: verified-in-current (a4urp vs i6toy). CX!=0 phase move neutral: not-reproduced (harmful, i6toy). zph's zrl03/AnotherBit losses come from the 2000h half: hypothesis (udhy4, by elimination). General cost of the CX=0 move: not-reproduced (pfmzf). Helper `scratch/B089/members.cjs`.

### B090 (multi-copy counter families)
- Nothing built, no jobs (session stopped by a safety classifier while reading rev0). Multi-copy counters worsen rev0 weaknesses: verified-in-other (B060, B069, B076). Card open.

### Coordinator (wave 8)
- Claimed promising: B089 h34, A039 locB, A038 locpatA (defense fix), B086 dA (defense fix). All screens were against rev0 = current base, so no re-screen was needed.
- Verification (wait.mjs + cand-build sources/binaries):
  - h34: screen pfmzf matches (cand 0.6638 vs 0.6456, ALL +0.01817 [-0.00066,+0.03700] 23/9; threat +0.029; multi -0.008). cand-build candB.asm is byte-identical to scratch/B089/h34_B.asm; B 202 B sha 57e2beea. Binary diff vs rev0 B is one byte (offset 62h, 34h -> 70h), the immediate of mov bp,3400h before jcxz zombie_fallback (CX=0 path). Verified.
  - locpatA: screen 2lrd7 matches (cand 0.6518, ALL +0.00617 [-0.00559,+0.01793] 14/15; threat +0.014; multi +0.040). candA.asm is byte-identical to scratch/A038/locpatA.asm; A 204 B sha 6e9af3ce. Binary diff vs B082 locA2 (sha cfea7b40) is exactly 4 bytes (mov dx imm 0C381h -> 0E1C3h, dw 0F2E2h -> 081F2h). zom20a bytes at +2Bh are E2 F2 81 C3 E1, so the replacement turns the loop into E2 FF -> FF 26 17 4A (jmp [4A17h]). Verified.
  - locB: screen fby9g matches (ALL +0.00789) but multi -0.0306 is worse than the -0.02 gate. Not eligible.
  - dA: screen ooxys matches (ALL +0.00356), below the +0.006 bar. Not eligible (defense fix for combinations).
- Selected: h34 (+0.0182) and locpatA (+0.0062).
- Confirm 20261004015542421-COORD-w8-confirm-8jsb6 (h34, salt agent2-night-confirm-w8-1, 7680 battles/arm, no rev0 arm since base = rev0; tested A 6861894f (rev0) / B 57e2beea): vs base pooled -0.0061 [-0.0207,+0.0085] 39/50; 2025 -0.0067 [-0.0212,+0.0077] 28/31; strong +0.0030; 2024live -0.0158 [-0.0436,+0.0120] 4/10; threat +0.0067 [-0.0117,+0.0251] 22/14; multi -0.0045 [-0.0206,+0.0116]; nozombie +0.002. By threat: max cgx123123 +0.094, TrojanByte +0.083, Grindo +0.067; min BinaryBandits -0.076, lead_V6 -0.047, Baltika9 -0.042. Vs V6Guard pooled -0.0034 [-0.0190,+0.0121]; vs V6 +0.0002 [-0.0143,+0.0147]; vs zchain4 +0.0013 [-0.034,+0.037] (2025 -0.017, strong +0.133, 2024live -0.091). Decision: NOT promoted (pooled lo < 0 and pooled diff negative).
- Confirm 20261004015542517-COORD-w8-confirm-cn666 (locpatA, salt agent2-night-confirm-w8-2; tested A 6e9af3ce / B 8579e2c2 (rev0)): vs base pooled +0.0045 [-0.0070,+0.0159] 34/35; 2025 +0.0081 [-0.0030,+0.0192] 23/21; strong +0.0083; 2024live -0.0192 [-0.0290,-0.0094] 0/9 (significant loss); threat +0.0151 [-0.0005,+0.0308]; multi -0.0005; nozombie +0.003. By threat: callfart +0.135, Grindo +0.100, LowKey +0.025; min -0.008 (several). Vs V6Guard pooled +0.0095 [-0.0034,+0.0224]; vs V6 +0.0142 [+0.0008,+0.0276]; vs zchain4 +0.0021 [-0.034,+0.038] (strong +0.070, 2024live -0.046, multi +0.118). Decision: NOT promoted (pooled lo = -0.0070; threat/multi/nozombie gates pass).
- Base stays rev0. No notice issued.
- Lessons: (1) h34's +0.018 screen did not replicate (-0.006 pooled on the fresh field, 2025 and 2024live both lean negative); like earlier B-zombie edits, its 2025 screen gain was noise. It remains a targeted router defense (a4urp +0.192) whose field value is about 0. (2) locpatA replicates its defense (callfart +0.135, Grindo +0.100 on the confirm threat cohorts) but loses on 2024live in all 9 non-tied cohorts (-0.019, lo < 0). Since locpatA differs from locA2 only in the search window, the 2024live loss probably comes from the location start or the 16-bit band-math startup shared with locA2 (untested); a follow-up should run locA2 vs locpatA on 2024 live cohorts before carrying either into a combination. (3) All four candidates confirmed in waves 7-8 (p0f13, K, h34, locpatA) came in at |pooled| <= 0.009: the pooled gate needs a combination of independent gains, or a larger confirm, to pass.

## Wave 9

All agents used revision 0 (V6nohunt). Base in every screen = rev0.

### A041 (partner trail collision; B/A velocity lockstep)
- LS (B only: phoenix_init mov dx,02400h -> 07FB4h, mov bp,02C00h -> 08800h; B and captured zombies step 8800h, trail 84Ch, 2:1 lockstep with A; B 202 B sha 3cee1a04): screen zwjmn ALL +0.0105 [-0.0240,+0.0450] 22/23; 2025 -0.004; strong +0.060; threat +0.021; multi -0.062 [-0.093,-0.031] 0/2 (fails gate). Threat yx0y7 (2 copies) +0.087 [0.028,0.146] (V6 +0.145 6/0, V4 +0.137, zchain4 -0.060 [-0.106,-0.015] 1/5). Threat 3jtel (3 copies) V6 +0.091 12/0, V6Guard +0.082. Not promising.
- B's 800h trail kills A mid-rebuild: verified-in-current (pkj3o re-count with `scratch/A041/pdeaths.cjs`: 2 normal-lattice partner kills / 168 battles; <= 0.004/battle). Non-fatal A/B collisions cost points: not-reproduced (static, model). Separation by lattice/phase offset: not-reproduced (geometry; only speed lockstep separates). LS removes partner kills: verified-in-current (u3mkr 0 vs 2, n.s.). LS beats V6-family crowds: verified-in-current (yx0y7, 3jtel). LS loses vs zchain4 copies: verified-in-current (yx0y7). LS loses vs V6x3: not-reproduced (3jtel). LS gain from separation vs faster sweep: hypothesis (faster sweep likely). Card closed. Model `scratch/A041/psim.mjs`.

### A042 (captured-zombie lattice offset)
- z62 (B only: zombie_entry bp 3400h/2000h -> 3401h/2001h; phoenix_init lea dx,[bp+0FFBh] / and dx,00FFh / or dh,0Fh; zombies FAR_SEG 0FFCh; B 202 B sha f41637d0): screen a2r69 ALL -0.0713 [-0.1116,-0.0310] 12/31; strong -0.268 0/7. Rejected.
- z42 (same encoding, bp 33FFh/1FFFh, FAR_SEG 0FFAh; B sha 6ae02b0f): screen 6450b ALL -0.1705 [-0.2132,-0.1277] 2/46. Rejected.
- z00 (encoding control, K=0, not screened; B sha 1a4eade2).
- Captured zombies on 52h kill A/B in rev0: not-reproduced (pkj3o with corrected `scratch/A042/att.mjs`: about 1/160). Earlier ana.mjs / B051 fatal-byte attribution (bytes[0] = IP-4 taken as the fatal byte for 1-3 byte instructions): verified-in-current as a TOOL BUG (B <- zombie 1 not 6; zombies <- A/B 2 not 13); re-check A035/B059 trace claims with att.mjs. Zombies 10h below kill partners (rebuild tail overwrite): verified-in-current (cwax5). Zombies 10h above are killed by B: verified-in-current (xsvgz). Keep zombies on FAR_SEG 0FFBh: verified-in-current (a2r69, 6450b). Card closed (also answers A012).

### A043 (shared-memory A/B lane protocol)
- PE4 (A: stosw of load address to team-shared ES:[0] at instr 1, INT87 instr 11, no-op jmp removed; B: les di,[si+es_ptr], reads [0] after INT87, first anchor = A band + 10h; A 193 B sha ccd41d87, B 207 B sha 62c5e458): screen 91kdp ALL +0.0147 [-0.0053,+0.0347] 25/17; 2025 +0.023; strong +0.022; threat +0.002; multi -0.017 (smulti-mix -0.089). Claimed promising (low prior).
- P8C (LANE 0B8A2h; B sha d3774525): screen zek4w ALL +0.0196 [-0.0020,+0.0413]; multi -0.050 (fails gate). Trace ziydv: 166 deaths vs 161, A startup deaths 13 vs 5.
- Pctl (control, own load address; B sha 9da186d0): screen ps0qg ALL -0.0003 [-0.0092,+0.0087]: protocol layout/timing costs nothing.
- Lane choice controls crossfire: not-reproduced (dsim2/3 model, ziydv). Team-shared ES:[0] channel reliable and free: verified-in-current (ziydv, ps0qg) [but see A045: team-shared byte 0 is writable by the previous group's last member via the inclusive region end]. Coupling B to A's band gains: hypothesis (zek4w, 91kdp). 1-byte A layout shift raises zombie-write startup deaths: hypothesis (ziydv).

### A044 (hook-cell self-harm guards)
- GA (A only: cmp word [9767h],0CCCCh / jne guards the [9769h] write; les ax,[si+z20a_data]; INT87 r10, phoenix_init r22; A 206 B sha 9565510e): screen dfpb0 ALL +0.0005 [-0.0037,+0.0046], 11/50 cohorts changed. Defense fix, about 0 value.
- GAB (GA + B guard on [4A17h]/[5D13h]; B 216 B sha d4ae1e91): screen h248k ALL -0.0053 [-0.0156,+0.0051]. GT (control, B guard disabled; B 213 B sha 72bbe661): screen w244e -0.0018. Not promising.
- A's [9769h] write kills own pending code: verified-in-current (pkj3o cgx w5; fixed in trace s5eyb; about 0.18% of battles). B's [4A17h]/[5D13h] writes hit own/partner code: verified-in-current (static MC; guard costs about -0.0035). INT87 replacement self-matches: not-reproduced (static). Own anchor/first trail on pending code: verified-in-other (B059; negligible). zom20b/c/d fixed writes reshuffle A startup deaths after any layout edit: verified-in-current (s5eyb 12 vs 2). Card closed. Zero-turn edits give near-noise-free paired screens.

### A045 (private pointer cell / stack safety)
- cell7FC (A and B: pointer cell mov bx,2C0h/280h -> 7FCh; verification ablation; A sha 9fe819a5, B sha b2c5facd): screen 32p2t ALL -0.0003 [-0.0023,+0.0016], 47/50 cohorts bit-identical. Not an improvement.
- Stack pushes corrupt cell/template: not-reproduced (static + 32p2t). Inclusive stack-region end lets the previous group's last member write our team-shared byte 0: not-reproduced for rev0 (unused); do not store state there. Hijacked streams with DS=private write own cell: hypothesis. MOVSW FF A5 d16 anchor kill via DS=private read fault: verified-in-current (pkj3o/4sf0x, `scratch/A045/ffa5.cjs`: 250/487 CS=0FFBh deaths, about half of steady-state deaths; no cheap DS/cell fix). Segment-choice faults: not-reproduced. Card closed.

### B091 (KT = K + A_t800)
- KT (A: K_A with phoenix_init mov dx,04000h -> 03C00h (1 byte, offset 62h); B = K_B; A 196 B sha af3bf51a, B 212 B sha c71fe517): screen l64tb ALL +0.0252 [-0.0069,+0.0572] 28/17; 2025 +0.033; strong -0.060 (sstrong-5 -0.316, same as A_t800); threat +0.049 [0.005,0.094]; multi +0.032. Additivity KT-(K+A_t800) -0.0068 n.s. Threat u3c11 +0.073 [0.014,0.132] (cgx +0.163, Baltika9 +0.150, zrl03 +0.165); yrx3b MOVSW crowd +0.181 11/0; control i687p (K alone) +0.003. Claimed promising; agent did not recommend confirming (A_t800 nozombie risk).
- MOVSW trails beat rev0, A_t800 fixes: verified-in-current (u3c11, yrx3b). A_t800 survives inside K: verified-in-current. K alone defends MOVSW: not-reproduced (i687p). K and A_t800 add on field S: verified-in-current. A_t800 strong cost: not-reproduced (same cohorts as q84cd). A_t800 nozombie cost: hypothesis (hi50u only). A_t800 vs V6: not-reproduced (u3c11). 800h fixes CodeKiller: not-reproduced (inconsistent). Mechanism: hypothesis.

### B092 (KL = K + locpatA)
- KL (A: K_A with locpatA startup (DI=15*[1243h], window F2 81 C3 E1 -> FF 26 17 4A, INT87 instr 11) + E1 INT86 block + memory-divisor band math, phoenix_init turn 22; B = K_B; A 214 B sha 1e9efbcb): screen r6jx0 ALL +0.0254 [+0.0011,+0.0498] 24/14; 2025 +0.034; strong -0.003; threat +0.024; multi +0.036. Paired KL-K +0.009 (threat +0.025, lo > 0). Threat yuexx +0.056 [0.025,0.086] (Grindo +0.119, callfart +0.081). Threat j041y (2024-live searchers) +0.026 n.s.; vs E1, JMP2HELL -0.171. Claimed promising.
- locpatA re-test s5vq3 (2024-live searchers): -0.0167 [-0.036,+0.003] 4/8, all four threats negative.
- Mimics take A's INT87, locpatA answers: verified-in-current (yuexx). Defense survives inside K: verified-in-current. locpatA 2024live loss is a locpatA defect: hypothesis (half is a high base draw in cn666; s5vq3 leans -0.017). Window change costs vs F24 ATO/Lucas/R_JS: hypothesis (sstrong-3 only). KL gives back E1's JMP2HELL gain: verified-in-current (j041y). AnotherBit decoy: not-reproduced. Helpers `scratch/B092/l24.cjs`, pairS.cjs, pairT.cjs.

### B093 (KH = K + h34)
- KH (A = K_A; B = K_B with CX=0 zombie-path mov bp,3400h -> 7000h, 1 byte (offset 3Eh in K_B); A 196 B sha 6d5bbfa6, B 212 B sha 0da3b1d9): screen bfcms ALL +0.0318 [+0.0069,+0.0567] 28/16; 2025 +0.031; strong +0.033; threat +0.035 [0.0005,0.069]; multi +0.011. Paired KH-K +0.015 (threat +0.037, lo > 0); additivity residual -0.0027. Threat e93n6 (2 routers) +0.189 [0.142,0.236] 18/2; control y1rpn (K alone) +0.010; cost check s2vbd -0.010 n.s. Claimed promising.
- 2-router self-kill persists in K (the 34h phase is the cause, not the counter-bomb): verified-in-current (y1rpn vs e93n6). h34 survives inside K: verified-in-current. h34 general cost in K: not-reproduced (bfcms). h34's confirm losses carry over: not-reproduced (s2vbd). [4A17h] poisoner: verified-in-other (B073/B083/A037). Foreign [5D13h]/[9769h] writes: not-reproduced (static).

### B094 (KP = K + p0f13)
- KP (A = K_A; B = K_B + p0f13: mov [0CC13h],bx + les di,[si+es_ptr], both b/d searches 0F EB F9 CC -> 0F FF 26 13 (jmp [0CC13h]); zom20a-path int 86h -> mov dx,0CCCCh; B 222 B sha b275310b): screen c08bm ALL +0.0295 [+0.0037,+0.0554] 21/17; 2025 +0.017; strong +0.057; threat +0.036 (zrl03 +0.200, ah02 +0.239); multi +0.032. Paired KP-K +0.013 (2025 -0.011 [-0.022,-0.001]). Threat 3xuy5 +0.108 [0.055,0.161]; KP-K on control xufzq +0.083 [0.036,0.130] 20/3. Claimed promising.
- KPf (KP keeping Z1's zom20a INT86 block; B 224 B sha d7963425): screen 6fka1 ALL +0.0239 [-0.0033,+0.0511]; KPf-KP -0.0057 n.s. Same B layout as KP, not independent.
- zrl03/ah02 decoys + [0CC13h] steal still answered inside K: verified-in-current (3xuy5 vs xufzq). K alone leaves the domain-4 hole: verified-in-current (xufzq). zchain4 [0CC13h] theft: verified-in-current (+0.060). B074 INT86 planter still wins: verified-in-current (3xuy5). p0f13 2025 cost inside K: hypothesis (c08bm/6fka1 vs nwqyk). p0f13 2024live lean: not-reproduced (static re-read of w7 confirm). Z1 zom20a-path INT86 still needed with E1: not-reproduced (6fka1).

### B095 (mix4 + p0f13)
- mix4 (B088 binaries re-tested; A sha 45d08fff, B sha 61e71c47): threat n1i8c +0.070 [0.010,0.129] (clone42 +0.188, clone22 +0.015 n.s., zrl03 x2 -0.054 [-0.095,-0.013], V6 x2 +0.131). Field S irh7d (B088) -0.0021.
- MP (mix4_A + p0f13 B with the mix4 phoenix_init edit; B 211 B sha 34f1b566): screen f30mc ALL +0.0021 [-0.0191,+0.0233] 23/21; 2025 -0.021; strong -0.031; threat +0.045 [0.002,0.088]; multi +0.067. MP-p0f13 -0.016 (2025 -0.023, lo < 0). Threat udjgk +0.105 [0.059,0.151] (zchain4 +0.086, zrl03 +0.176); dabce +0.100 [0.043,0.157] (clone22 +0.081, clone42 +0.216). Not promising.
- 10h-undercut clone answered by mixed lattice: verified-in-current (n1i8c, dabce). 30h undercut answered by mix4: not-reproduced (n1i8c). 2-copy V6 helped: verified-in-current. zrl03 undercuts the mixed lattice: verified-in-current (n1i8c). p0f13 repairs mix4's zchain4 loss: verified-in-current (udjgk). Mixed-lattice plain-2025 cost: hypothesis (f30mc). mix4+p0f13 additive on the field: not-reproduced (residual -0.014). Adaptive [4A17h] coin reader: verified-in-other (B088 mvmvo). mix4 conflicts with SD/K (needs mov dx,[4A17h]).

### Coordinator (wave 9)
- Claimed promising: B093 KH, B094 KP (and KPf), B092 KL, B091 KT, A043 PE4. All screens were against rev0 = current base, so no re-screen was needed.
- Verification (wait.mjs + cand-build sources/binaries):
  - KH: screen bfcms matches (cand 0.6775 vs 0.6456, ALL +0.03184 [0.00693,0.05674] 28/16; threat +0.0349; multi +0.0111). candA.asm/candB.asm byte-identical to scratch/B093/KH_A.asm/KH_B.asm; candA sha 6d5bbfa6 = A031 build K_A. Binary diff vs A031 K_B (c71fe517) is one byte, offset 3Eh (34h -> 70h), the high byte of mov bp,3400h on the CX=0 zombie path (the report's "offset 62h" is decimal 62). Verified.
  - KP: screen c08bm matches (cand 0.6752, ALL +0.02953 [0.00365,0.05541] 21/17; threat +0.0365; multi +0.0319). candB.asm byte-identical to scratch/B094/KP_B.asm (222 B, sha b275310b); A = K_A. Source diff vs K_B is exactly the p0f13 edits (as in scratch/B084/p0f13B.asm) plus the zom20a-path int 86h -> mov dx,0CCCCh. Verified.
  - KL (r6jx0 +0.02542), KT (l64tb +0.02519, A diff vs K_A = 1 byte at 62h, 40h -> 3Ch), PE4 (91kdp +0.01472), KPf (6fka1 +0.02386): screen numbers match and cand-build sources equal the scratch files. Verified, not selected (lower ALL; KPf shares KP's B layout).
- Selected: KH (+0.0318) and KP (+0.0295).
- Confirm 20261004024356566-COORD-w9-confirm-81s5c (KH, salt agent2-night-confirm-w9-1, 7680 battles/arm, no rev0 arm since base = rev0; tested A 6d5bbfa6 / B 0da3b1d9): vs base pooled +0.0041 [-0.0158,+0.0239] 49/53; 2025 +0.0117; strong -0.0165 [-0.041,+0.008]; 2024live -0.0056; threat +0.0178 [-0.0046,+0.0402]; multi +0.0141; nozombie +0.0093. By threat: max zchain4 +0.128, LowKey +0.071, callfart +0.069; min AnotherBit -0.058, BinaryBandits -0.042, IND_BRA -0.029. Vs V6Guard pooled +0.0053 [-0.0142,+0.0248] (multi +0.0375 lo>0); vs V6 +0.0108 [-0.0090,+0.0307]; vs zchain4 +0.0120 [-0.021,+0.045] (strong +0.132, 2024live -0.051). Decision: NOT promoted (pooled lo < 0).
- Confirm 20261004024356651-COORD-w9-confirm-ubyb2 (KP, salt agent2-night-confirm-w9-2; tested A 6d5bbfa6 / B b275310b): vs base pooled +0.0211 [+0.0037,+0.0385] 48/33; 2025 +0.0138 [-0.0009,+0.0285]; strong +0.0527 [+0.0067,+0.0988] 13/4; 2024live +0.0132 [-0.0066,+0.0330]; threat +0.0165 [-0.0020,+0.0351]; multi -0.0130 [-0.0578,+0.0318] 2/6; nozombie +0.0033 [-0.0036,+0.0103]. By threat: max zchain4 +0.125, zrl03 +0.092, Baltika9 +0.054; min callfart -0.036, CodeKiller -0.033, V6Guard -0.017. Multi cohorts: multiMix-1 (LowKey/Baltika9/ah02) -0.129, multiMix-2 (zrl03/TrojanByte/V6) +0.108, multiV6 x4 -0.006/-0.031/+0.008/-0.021. Vs V6Guard pooled +0.0223 [+0.0053,+0.0392]; vs V6 +0.0291 [+0.0112,+0.0469] (2025, strong, 2024live, threat all lo > 0); vs zchain4 +0.0234 [-0.012,+0.059] (strong +0.162, multi +0.165, 2025 -0.008). Decision: NOT promoted. It passes the pooled gate (lo > 0, the first confirm to do so) and the threat/nozombie gates, but multi diff -0.0130 is below the fixed -0.01 gate (hi > 0; n = 8 cohorts, driven by one mixed cohort).
- Base stays rev0. No notice issued.
- Lessons: (1) KP is the first candidate whose pooled interval clears 0 on a fresh field (+0.021, lo +0.004), with gains in every pooled group and significant wins over V6Guard and V6. It missed promotion only on the multi gate by 0.003, and that group has 8 cohorts with one -0.129 cohort. The next confirm should re-test KP (or a KP-based combination) on a new salt with more multi cohorts, rather than discard it. (2) KH did not replicate (+0.004 pooled): h34 added on K again gave a 2025/threat screen gain that shrank on a fresh field, the same pattern as h34 alone in wave 8. (3) Natural next combinations on KP: KP + h34 (1 byte, CX=0 path unchanged by p0f13) and KP_B + KT_A (A_t800, MOVSW defense) or KL_A (locpatA); each touches different code. Watch the multi group (mixed V6-family + MOVSW cohorts) in any KP-based screen.

## Wave 10

All agents used revision 0 (V6nohunt). Base in every screen = rev0. No counter codes were submitted.

### A046 (zchain4 x rev0 warrior hybrids)
- HZ (A = zchain4 A with band phase 10h -> 2Ch; B = rev0 B with startup b/d capture switched to zchain4's 0F EB F9 CC -> 0F FF 26 13 (jmp [0CC13h]); A 233 B sha 068672a8, B 202 B sha 1f308fbc): screen sdsgd ALL -0.0430 [-0.0846,-0.0013] 19/30; 2025 -0.045; threat -0.046 (zrl03 -0.172, ah02 -0.256). Rejected.
- HAb (A = rev0 A with zchain4 A replicator settings: cell 200h, gap 1F0h, CX 8, DX 3800h, BP 3C00h; A 194 B sha 0c7f91c2): screen 74i3u ALL -0.0451 [-0.0744,-0.0158]; strong -0.115 (lo < 0); multi -0.069 (lo < 0). Rejected.
- HBb (B = rev0 B with zchain4 B replicator settings: phase 70h, cell 240h, gap 270h, CX 9, DX 4000h, BP 4400h; B 202 B sha 3aa72c68): screen 2boer ALL -0.0610 [-0.1007,-0.0214]; threat -0.094 (zchain4 -0.433); multi -0.104. Rejected.
- zchain4 pair control vs rev0: screen e2glt ALL -0.0160 [-0.0655,+0.0335]; 2025 +0.065 [+0.002,+0.128]; strong -0.154 0/6.
- Shared 52h anchor lattice: verified-in-current (static; not the cause of the losses). Hook-cell clash in a naive pairing: hypothesis (static). Same-phase identical first anchors: hypothesis. zchain4's 2025 edge carried by one warrior or its settings: not-reproduced (sdsgd, 74i3u, 2boer all have 2025 < 0). rev0 strong/leader robustness depends on both warriors' replicator settings: verified-in-current (74i3u, 2boer). zchain4 weak vs strong/leaders: verified-in-current (e2glt). Card closed; if revisited, test zchain4 pair-level features (e.g. the FFE8h decoy) one at a time.

### A047 (zchain4 zombie chain grafted onto rev0)
- G13 (A: zom20a INT87 replaced by backward 0F EB F9 CC search -> jmp [0CC13h]; B: p0f13 B with zombie paths swapped (captured b/d searches 41 93 E2 F2 -> FF 26 17 4A; captured zom20a runs the 0E070E17 counter-bomb); A 200 B sha 9db4b94b, B 211 B sha 22875e51): screen 2vvu6 ALL -0.0328 [-0.0597,-0.0058]; threat csc8c +0.039 n.s. (Grindo +0.152, AnotherBit -0.188 lo<0); trace u6s3z 67 early zom20a deaths vs 15. Rejected.
- G13s (G13 with IP-safe window F2 81 C3 E1 at zom20a+2Ch; B sha d3c89d0f): screen t15f3 ALL -0.0086 [-0.0323,+0.0152]; vs p0f13 (tcluu) -0.026, strong -0.114. Rejected.
- 41 93 E2 F2 window is IP-unsafe (kills zom20a): verified-in-current (u6s3z). AnotherBit carries 41 93 E2 F2: verified-in-current (static + csc8c). Independent b/d capture helps vs Grindo/callfart: verified-in-current (csc8c). Late zom20a capture loses the strong-group race: hypothesis. Graft frees an INT87 charge: not-reproduced (static; rev0 already uses all four). Card closed.

### A048 (A capture through [0CC13h])
- Q (A = rev0 A with zom20a INT87 replacement CX 4A17h -> 0CC13h; B = p0f13 B; A 194 B sha b4f6d22f, B 211 B sha 99361147): screen kaa3g ALL +0.0182 [+0.0003,+0.0361]; paired Q - p0f13 (tcluu) +0.0005. Threat vr230 vs p0f13 control hufbo: V6 -0.025, V6Guard -0.038, poisoners +0.03..+0.06. Not promising (the gain belongs to p0f13).
- QH (Q + h34 on B; B sha e94c80a7): not screened. Threat hecn5 ALL +0.057 [0.005,0.108]; zrl03 x2 +0.242 4/0 (Q and p0f13 both -0.072 0/4 there).
- p0f13 loses to 2 copies of zrl03, h34 fixes it: verified-in-current (hufbo, vr230, hecn5; mechanism inferred). [4A17h] poisoners avoided via [0CC13h]: verified-in-current (vr230 vs hufbo, n=4). V6-race gain from leaving [4A17h]: not-reproduced (leans negative). Decoy-immune CC-high-byte capture: verified-in-other (B064/B084/B094).

### A049 (KP + A003 C1 reorder)
- R (A = K_A with the [4A17h]->[9769h] copy after the zom20a INT87 (INT87 instr 8); B = KP_B with the [4A17h] write moved to instr 6; zero bytes; A 196 B sha c3cfe675, B 222 B sha 99cfdcee): screen cyniq ALL +0.0308 [+0.0054,+0.0561] 24/16; 2025 +0.017; strong +0.068; threat +0.035; multi +0.032. Paired R - KP (c08bm) +0.0012 (SE 0.0032). Threat kk5a2 (R) / daxm6 (KP) / 2hbqp (A-only): V6 +0.018/-0.020/-0.015, V4 +0.058/+0.012/+0.010, V6Guard -0.042 (lo<0)/-0.016/-0.012. Claimed promising; agent recommended keeping plain KP.
- [4A17h] race vs V6 family: verified-in-current (kk5a2, n.s.). Late [4A17h] write loses to V6Guard: verified-in-current (kk5a2). zom20c capture value: hypothesis (static; needs about 3 INT87 charges).

### A050 (captured zombies as page-lattice CC snipers)
- SN_B (B: captured zombies run 6 passes of a CC sniper on in-page A3h/C1h/E3h/03h/32h before phoenix; B 245 B sha cc3b46d3): screen xgbrv ALL -0.0784 [-0.1204,-0.0364]; threat cocnr +0.034 n.s. (cgx +0.179 lo>0). Rejected.
- SN1_B (1 pass; sha d78b350f): screen cocue ALL -0.0402 [-0.0745,-0.0060]. Rejected.
- SN1ctl_B (control: bomb writes -> reads; sha b3f6f10d): screen rsm8l ALL -0.1003 [-0.1278,-0.0727]. Paired SN1 - SN1ctl +0.060 [+0.035,+0.085] 31/8 (threat +0.094).
- Lattice sniper kills far-call replicators on those lattices: verified-in-current (cocnr; cocue vs rsm8l). Zombie phoenix delay is very costly (about -0.10): verified-in-current (rsm8l). Net gain vs CodeKiller/TrojanByte/Baltika9: hypothesis. 2025 MOVSW lattice map: hypothesis (static). The weapon needs a cheaper carrier.

### B096 (KPd = KP + dA decoy)
- KPd (A = K_A with the dead zombie tail replaced by a copy of K_A[04h..80h]; B = KP_B; A 254 B sha aa27db39, B 222 B sha b275310b): screen tjf1k ALL +0.0284 [+0.0028,+0.0540] 22/17; paired KPd - KP -0.0011 [-0.0039,+0.0017], 44/50 cohorts identical. Threat qvq5f (signature counters, 1 copy) +0.141 [0.113,0.169] 24/0 vs KP control q3pyu +0.002; 2 copies p3n0l +0.0005. Claimed promising (defense add-on).
- Signature counters wipe KP: verified-in-current (q3pyu). dA survives inside KP: verified-in-current (qvq5f). Partly answers forward fwdkill: verified-in-current (qvq5f). Two copies exhaust the decoy: verified-in-current (p3n0l). General field cost: not-reproduced (tjf1k vs c08bm). Body-size cost vs Baltika9/CodeKiller: hypothesis. Archived searchers matching our windows: not-reproduced. Uses 254 of 256 A bytes.

### B097 (domain 7, far-call trail hunter)
- Nothing built, no jobs (session stopped by a safety classifier while reading sources). Trail hunter kills rev0 anchors: verified-in-other (B067 y4h5y). A tested low-cost fix exists: not-reproduced (audit of B067/B077/B087). Card closed; do not reassign.

### B098 (KPm = KP + mix4)
- KPm (A/B phoenix_init: mov dx,[4A17h] restored, and dx,3 / or dx,0FF8h; A 200 B sha a7599619, B 226 B sha 2c3cf194): screen os8if ALL +0.0043 [-0.0220,+0.0307]; strong -0.062; paired KPm - KP -0.0252 [-0.0471,-0.0033] (strong -0.120, 2025 -0.019). Rejected.
- KPt (turn control: KPm with lattice immediates restored; A sha 56454016, B sha 966d5770): screen g2moe ALL +0.0206; KPt - KP -0.0089 n.s.
- 52h bomber wipes KP: verified-in-current (1xzx0). mix4 still answers it inside KP: verified-in-current (o3e9k +0.66). Mixed lattice opens 22h/adaptive bombers: verified-in-current (pg22 -0.325, pgadapt -0.548). Mixed-lattice general cost: verified-in-current (os8if vs c08bm and g2moe). IND_BRA lower with mix4: verified-in-current (o3e9k, n=4). KP loses to IND_BRA: hypothesis. mix4's zchain4/zrl03 losses carry into KP: not-reproduced. Early INT86 bombs: verified-in-other (pkj3o, ogq11). Domain 8 closed.

### B099 (KPH = KP + h34)
- KPH (A = K_A; B = KP_B with CX=0 zombie-path mov bp,3400h -> 7000h, binary offset 47h; A 196 B sha 6d5bbfa6, B 222 B sha dd73fad4): screen 33wcc ALL +0.0412 [+0.0096,+0.0727] 27/18; 2025 +0.025; strong +0.047; threat +0.067 [0.013,0.120]; multi +0.017. Paired KPH - KP +0.0116 [-0.0064,+0.0296] (gains sit in cohorts where h34 did not replicate before). Router spec 00vzu +0.146 vs KP yerwq +0.055; 3xuy5 spec h8e7v +0.134 vs KP +0.108. Claimed promising.
- Router self-kill on 3400h: verified-in-current (00vzu). KP already removes part of it: verified-in-other (yerwq). h34 breaks [0CC13h] steals: not-reproduced (h8e7v). h34 general cost: not-reproduced (33wcc). Trail/startup/partner self-harm: verified-in-other (pkj3o, A041, A042, A044; each <= 0.004).

### B100 (KPT = KP + A_t800)
- KPT (A = KT_A = K_A with phoenix_init mov dx,04000h -> 03C00h, offset 62h; B = KP_B; A 196 B sha af3bf51a, B 222 B sha b275310b): screen f1635 ALL +0.0401 [+0.0052,+0.0749] 30/14; 2025 +0.029; strong +0.023; threat +0.068 [0.009,0.127]; multi +0.015. Paired KPT - KP +0.0105 n.s.; additivity residual -0.0051. Threat 9xvn5 (LowKey+Baltika9+ah02 mixAll) +0.219 vs KP control f2ewx +0.085, paired +0.134 [0.080,0.188]; V6-family x2 lxg8w vs daxm6 +0.016 (V6Guard +0.033 lo>0). Claimed promising.
- KP multiMix-1 loss is structural: not-reproduced (f2ewx +0.085). A_t800 answers MOVSW mixed crowds inside KP: verified-in-current (9xvn5). A_t800 costs vs 2-copy V6 family: not-reproduced (lxg8w). Single-copy lead_V6 / sstrong-5 cost: hypothesis (same seeds only). KP x A_t800 interference: not-reproduced. A_t800 nozombie cost: hypothesis (hi50u only).

### Coordinator (wave 10)
- Claimed promising: B099 KPH, B100 KPT, A049 R, B096 KPd (defense fix). All screens were against rev0 = current base, so no re-screen was needed.
- Verification (wait.mjs --full + cand-build sources/binaries):
  - KPH: screen 33wcc matches (cand 0.6868 vs 0.6456, ALL +0.04115 [0.00964,0.07266] 27/18; threat +0.0668; multi +0.0167). cand-build candA.asm/candB.asm byte-identical to scratch/B099/KPH_A.asm/KPH_B.asm. candA sha 6d5bbfa6 = KP's A (c08bm). Binary diff vs KP B (b275310b) is one byte, offset 47h (34h -> 70h); source diff is only mov bp,3400h -> 7000h. Sizes 196/222. Verified.
  - KPT: screen f1635 matches (cand 0.6857, ALL +0.04006 [0.00524,0.07487] 30/14; threat +0.0677; multi +0.0150). candA.asm/candB.asm byte-identical to scratch/B100/KPT_A.asm/KPT_B.asm. candA is byte-identical to KT's A (l64tb) and differs from KP's A by one byte, offset 62h (40h -> 3Ch, mov dx,04000h -> 03C00h); candB sha b275310b = KP_B. Sizes 196/222. Verified.
  - R (cyniq +0.03077 [0.00543,0.05611]) and KPd (tjf1k +0.02842 [0.00284,0.05400]): screen numbers match and cand-build sources equal the scratch files. Verified, not selected (lower ALL; paired vs KP +0.0012 and -0.0011, i.e. their gain is KP's).
- Selected: KPH (+0.0412) and KPT (+0.0401).
- Confirm 20261004033058321-COORD-w10-confirm-nn663 (KPH, salt agent2-night-confirm-w10-1, 7680 battles/arm, no rev0 arm since base = rev0; tested A 6d5bbfa6 / B dd73fad4): vs base pooled +0.0112 [-0.0121,+0.0345] 43/56; 2025 -0.0016 [-0.0201,+0.0170]; strong +0.0640 [+0.0070,+0.1210] 12/9; 2024live +0.0010; threat +0.0444 [+0.0156,+0.0733] 32/16; multi +0.0544 [+0.0162,+0.0926] 7/1; nozombie +0.0052 [-0.0041,+0.0144]. By threat: max zrl03 +0.219, ah02 +0.175, zchain4 +0.100, LowKey +0.092; min CodeKiller -0.042, BinaryBandits -0.025, IND_BRA -0.025, lead_V6 -0.022. Vs V6Guard pooled +0.0119 [-0.0118,+0.0356]; vs V6 +0.0172 [-0.0066,+0.0410]; vs zchain4 +0.0036 [-0.031,+0.038] (2025 -0.031 lo<0, strong +0.121). Decision: NOT promoted (pooled lo < 0; threat/multi/nozombie gates pass).
- Confirm 20261004033058495-COORD-w10-confirm-e1h4o (KPT, salt agent2-night-confirm-w10-2; tested A af3bf51a / B b275310b): vs base pooled +0.0228 [-0.0030,+0.0486] 62/39; 2025 +0.0292 [+0.0064,+0.0519] 43/24; strong +0.0198; 2024live -0.0049; threat +0.0595 [+0.0282,+0.0909] 31/12; multi +0.0313 [-0.0276,+0.0901] 5/3; nozombie -0.0257 [-0.0830,+0.0317] 10/13. By threat: max Baltika9 +0.246, ah02 +0.237, zrl03 +0.163, CodeKiller +0.113; min Grindo -0.050 (0/3, lo<0), callfart -0.050, lead_V6 -0.038, AnotherBit -0.032 (0/3, lo<0). Vs V6Guard pooled +0.0232 [-0.0011,+0.0474]; vs V6 +0.0270 [+0.0021,+0.0520]; vs zchain4 +0.0339 [-0.0007,+0.0684] (strong +0.126, multi +0.144). Decision: NOT promoted (pooled lo = -0.0030 and nozombie -0.0257 below the -0.01 gate).
- Base stays rev0. No notice issued.
- Lessons: (1) KP-based pairs now replicate on fresh fields: KP (ubyb2) +0.021, KPT +0.023, KPH +0.011 pooled, all three with threat > 0 and big wins over zrl03/ah02/zchain4. (2) A_t800's nozombie cost replicated (hi50u -0.050, now -0.026 inside KPT), so A_t800 is not free; it also loses small amounts to the zombie-mimic threats (Grindo, AnotherBit). KPT's MOVSW gains (Baltika9 +0.25, CodeKiller +0.11, cgx +0.10) replicate. (3) h34 inside KP fixed the multi group this time (+0.054, 7/1) but again gave nothing on plain 2025 (-0.002); KPH's strong gain (+0.064) is the opposite of KH's (-0.017). (4) The pooled gate misses are now small (KPT lo -0.003). Next useful work: a nozombie-neutral MOVSW defense to replace A_t800 in KPT (or an A_t800 variant that only changes the trail once the Zombies are captured), and a KP re-confirm on a new salt; KP itself failed only multi by 0.003.
