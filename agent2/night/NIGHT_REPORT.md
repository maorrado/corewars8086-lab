# Night research report (2026-10-03 / 2026-10-04)

Branch `agent2/research-2026-10-03`, CoreWars8086 v6 engine (unmodified deterministic JAR, sha256
`31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d`), local simulator only.
Written by the night reporter (COORD-final) after the queue was idle (`agent2/night/queue/pending` empty).
Nothing under `final/` was touched and nothing was committed.

## 1. Bottom line

- The night promoted one revision: **rev1 = KPHL** (promotion confirm `20261004040436817-COORD-combine-confirm-d93vd`).
- The **final fresh confirmation** (`20261004043747457-COORD-final-confirm-svxch`, salt `agent2-night-confirm-final-1`,
  never used for selection) **did NOT replicate the field-score gain**: rev1 vs rev0 pooled (2025+strong+2024live)
  **+0.0034 [-0.0234, +0.0301]** (z=2.5), and the 2024 live group is **significantly worse** (-0.0486 [-0.0893, -0.0080]).
- What did replicate is the **robustness gain against the threat library**: threat group +0.0495 [0.0187, 0.0802]
  (promotion confirm) and **+0.0690 [0.0385, 0.0995]** (final confirm), both with the lower bound above 0.
- Pooling both confirms of rev1 (222 cohorts, 2 x 7,680 battles per arm): pooled +0.0181 [-0.0012, +0.0374] (z=2.5),
  i.e. **no confirmed overall per-battle improvement over rev0**.
- Result: **rev1 (KPHL) is kept as the final pair because it is confirmed more robust against the 16 library threat teams in two independent
  confirmations and is not worse on the pooled field.** It is **not** a confirmed overall score improvement. If the
  requirement is "confirmed higher per-battle score on the plain field", no such pair exists after this night, and rev0
  (V6nohunt) stays equally good on the field. On the 2024 live field, rev0 scored higher in the final confirmation.

## 2. Final best pair (rev1, KPHL)

- Files: `agent2/night/revisions/rev1/A.asm`, `B.asm` (sources), `agent2/night/revisions/rev1/A`, `B` (binaries).
- Sizes / SHA-256:
  - A: **214 bytes**, `1e9efbcb54cb79f1da0ecaaf41f84418043ff97c93bdef2c1f2eba9a430d262a`
  - B: **222 bytes**, `dd73fad407df01a6890dbab26b895320bc1a81ff4c3ed35b9a3a584b2daee1c7`
  - Source files: A.asm sha256 `01df0c96b7ead700f96c09e879c2a457cb86e33ee11a2aa534c7aa7dc33ac277`,
    B.asm sha256 `bf14dba26c99ec10ca208f929c454496c4bf272602d35d052d7911e0c228f38c`.
  - Reassembly check: the daemon assembled these exact .asm files for the final confirm
    (`agent2/night/cand-build/20261004043747457-COORD-final-confirm-svxch/candA|candB`) and got the hashes above;
    `agent2/night/scratch/RECHECK/rev1chk/manifest.json` records the same.
- Assemble: `node agent2/tools/nasm-node.cjs <outdir> agent2/night/revisions/rev1/A.asm agent2/night/revisions/rev1/B.asm`
- Provenance: Good_Test V6 is friend-provided code (original binaries `study-notes/good-test-v6/original-binaries`);
  V6nohunt (rev0) is an agent2 edit of it; all rev1 edits are agent2 night roles (A022, A026, A031, A038, B064, B082,
  B084, B089, B092, B094, B099), combined by the night combination coordinator.
- What changed vs rev0:
  - A: E1 (A031: after the zom20a INT 87h, one INT 86h writes 64 decoys `FF 1F CC CC` at 0FF80h..007Fh);
    SD (A022: template copy `mov cx,10`, dead `mov dx,[4A17h]` dropped, `db 0CCh,0CCh` after the worker);
    locpatA (B082/A038: zom20a capture starts at DI = 15*[1243h] and searches `F2 81 C3 E1` -> `FF 26 17 4A`);
    band math with a memory divisor; phoenix_init still on turn 22. The dead `zombie_entry/zombie_scan` tail is still
    present and unreachable.
  - B: Z1 (A026: captured zombies spend their INT 86h charges on `FF 1F CC CC` decoy blocks); SD; p0f13 (B064/B084:
    `mov [0CC13h],bx` steal, both b/d searches use `0F EB F9 CC` -> `0F FF 26 13`); h34 (B089: CX=0 zombie path
    `mov bp,3400h` -> `7000h`).

### Warrior A source (copy-paste; assembles to 214 bytes, sha256 1e9efbcb...)

```nasm
; COMBINE (night combination coordinator, 2026-10-04, base rev0): KPHL = KP + h34 (B099 KPH_B) + locpatA (B092 KL_A). A = KL_A unchanged; B = B099 KPH_B.
; Good_Test V6 is friend-provided code; V6nohunt and all night edits by agent2 roles (see FINDINGS.md).
bits 16

; B092 KL (warrior A): A031 K (E1 INT86 decoy block + A022 SD template edits) combined with the
; domain-2 defense A038 locpatA (B082 location start DI = 15*[1243h] + A038 window F2 81 C3 E1 -> FF 26 17 4A).
; Provenance: Good_Test V6 warrior 1 is friend-provided code (reconstructed source in
; study-notes/good-test-v6/source/); V6nohunt = agent2 edit (removed [7A00h] patch); E1/SD/locA2/locpatA are
; agent2 night edits (A031, A022, B082, A038); this merge = agent2 night role B092.
; Turn budget: locpatA startup (INT87 at instr 11) + E1 block (4 instr) + band math with a memory divisor
; (div/mul word [kq] instead of mov cx,3C00h; div cx; mul cx: same AX, one instruction fewer) + add si;
; phoenix_init still starts at turn 22 (as in rev0, K and locpatA). Data moved to the end (no jmp needed).
; B = A031 K_B (A026 Z1 + SD) unchanged.

start:
    mov si, ax                      ; 1
    mov bx, 026FFh                  ; 2
    mov cx, 04A17h                  ; 3
    mov ax, [1243h]                 ; 4  zom20a's v1 = hi(L*10E1h)
    mov dx, [4A17h]                 ; 5
    mov [9769h], dx                 ; 6  Registered_Winners hook cell
    mul word [si + k15 - start]     ; 7  ax = 15*v1
    xchg ax, di                     ; 8
    les ax, [si + z20a_data - start]; 9  ax = 81F2h, es = 1000h (arena)
    mov dx, 0E1C3h                  ; 10
    int 087h                        ; 11 F2 81 C3 E1 -> FF 26 17 4A, forward from DI
    mov di, 0FF80h                  ; 12 E1: 64 x FF 1F CC CC at 0FF80h..007Fh
    mov ax, 01FFFh                  ; 13
    mov dx, 0CCCCh                  ; 14
    int 086h                        ; 15
    mov ax, si                      ; 16 band math: floor(si/3C00h)*3C00h + 2CA2h
    xor dx, dx                      ; 17
    div word [si + kq - start]      ; 18
    mul word [si + kq - start]      ; 19
    add ax, 02CA2h                  ; 20
    add si, strict word worker - start ; 21

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 10
    rep movsw
    push ss
    pop ds
    mov bx, 002C0h
    push cs
    pop ss
    mov [bx], ax
    and dx, 0
    or dx, 0FFBh
    mov [bx + 2], dx
    xor si, si
    mov di, ax
    mov es, dx
    mov sp, di
    add sp, 00100h
    mov cx, 9
    mov dx, 04000h
    mov bp, 04400h
    mov ax, 01FFFh
    stosw
    dec di
    call far [bx]
worker:
    movsw
    rep movsw
    sub sp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 9
    xor si, si
    stosw
    dec di
    call far [bx]
    db 0CCh, 0CCh

zombie_entry:
    mov bx, ax
    mov dx, 0CCCCh

zombie_scan:
    add bx, 00100h
    cmp word [bx], 0CCCCh
    je short zombie_scan

    mov cl, 4

candidate_check:
    mov al, [bx + 1]
    sub al, 0Fh
    cmp al, 10h
    ja short next_candidate
    mov si, [bx]
    cmp si, 0FFCh
    je short next_candidate
    cmp si, [bx + 4]
    je short found_candidate

next_candidate:
    inc bx
    loop candidate_check
    jmp short zombie_scan

found_candidate:
    mov di, [bx - 2]
    sub si, 01000h
    add si, si
    add si, si
    add si, si
    add si, si
    sub di, 2
    add di, si
    mov [di], dx
    jmp short zombie_scan

z20a_data:
    dw 081F2h, 01000h
k15:
    dw 15
kq:
    dw 03C00h
```

### Warrior B source (copy-paste; assembles to 222 bytes, sha256 dd73fad4...)

```nasm
; COMBINE (night combination coordinator, 2026-10-04, base rev0): KPHL = KP + h34 (B099 KPH_B) + locpatA (B092 KL_A). A = KL_A unchanged; B = B099 KPH_B.
; Good_Test V6 is friend-provided code; V6nohunt and all night edits by agent2 roles (see FINDINGS.md).
; B099 (wave 10, domain 9 R5-cost): KPH = B094 KP + B089 h34 (CX=0 zombie path mov bp,3400h -> 7000h, 1 byte).
; Good_Test V6 is friend-provided; V6nohunt by agent2; K by A031 (E1+SD+Z1 by A031/A022/A026); p0f13 by B064/B084; KP by B094; h34 by B089.
; B094 (wave 9, domain 4 R5-cost): KP = A031 K (E1+SD+Z1) + B084 p0f13 B edits ported onto K_B (Z1+SD).
; Good_Test V6 is friend-provided; V6nohunt by agent2; Z1 by A026, SD by A022, E1/K by A031; p0f by B064, p0f13 by B084.
; p0f13 edits: startup push cs/pop es -> mov [0CC13h],bx + les di,[si+es_ptr] (INT87 stays instr 12); both b/d searches
;   (startup and zom20a path) use window 0F EB F9 CC -> 0F FF 26 13 (patched tail = jmp [0CC13h]).
; Port note: in the zom20a path DX is now 0CCF9h after INT87, so Z1's int 86h there would write FF 1F F9 CC junk
;   over E1's A block (0FF80h..007Fh). It is replaced by mov dx,0CCCCh (same instruction count, no INT86 there);
;   E1's A block already covers 0FF80h..007Fh. The b/d (CX=0) path INT86 block is unchanged.
bits 16

; Good_Test V6 warrior 2 (friend-provided; reconstructed source in
; study-notes/good-test-v6/source/). agent2 label form: hard-coded internal
; offsets replaced by label arithmetic with the original operand widths.
; agent2 night A026 variant Z1 (base rev0 = V6nohunt B): captured zombies spend
; their own INT 86h charge (2 per zombie, unused before) on FF 1F CC CC decoy
; blocks for the FF1FCCCC INT87 searchers.
;  - zom20a path (CX!=0): after its b/d INT87, mov ax,1FFFh; int 86h with
;    DI=0, DF=1, DX=CCCCh -> block 0FF04h..0003h (no code is ever loaded below
;    400h or above FC00h; page FFh and 00h:00-03 hold no anchor of our 400h
;    lattice at 52h).
;  - b/d path (CX=0): the worthless 0E070E17 CC counter-bomb INT87 is replaced
;    by a block next to the zombie's own body (BX = own load address + 3):
;    [X+68h, X+168h), X = (BX and FC00h). Inside the zombie's MIN_GAP zone
;    and on pages 4k / 4k+1 outside in-page 52h-67h of pages 4k, so it can
;    hit neither loaded code nor any anchor/worker of our lattice.
;  - zombie band math uses 16-bit DIV (same AX, 2 instructions fewer), so both
;    zombie paths reach phoenix_init on the same turn as in rev0.
; B's own startup is unchanged.

; A031 K = A026 Z1 (zombie INT86 blocks) + A022 SD (phoenix_init mov cx,10; dead mov dx,[4A17h] dropped; db 0CCh,0CCh after the worker). B startup unchanged.

start:
    mov si, ax
    lea bx, [word si + zombie_entry - start]
    mov [4A17h], bx
    mov [5D13h], bx
    mov [0CC13h], bx
    les di, [si + es_ptr - start]
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh
    mov cx, 01326h
    std
    int 087h
    cld
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 10h
    mov al, 0A2h
    add si, strict word worker - start
    jmp short phoenix_init

es_ptr:
    dw 0000h, 01000h

zombie_entry:
    xor di, di
    std
    mov bp, 7000h            ; B099: B089 h34 (CX=0 captured-b/d phase 34h -> 70h)
    jcxz zombie_fallback
    mov bp, 2000h
    push cs
    pop es
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh
    mov cx, 01326h
    int 087h
    mov ax, 01FFFh
    mov dx, 0CCCCh          ; B094: was int 086h (DX would be 0CCF9h); keeps the instruction count
    jmp short zombie_common

zombie_fallback:
    mov di, bx
    and di, 0FC00h
    add di, 0164h
    mov ax, 01FFFh
    mov dx, 0CCCCh
    int 086h

zombie_common:
    cld
    call get_ip

get_ip:
    pop si
    sub si, strict word get_ip - start
    mov ax, si
    xor dx, dx
    mov cx, 03C00h
    div cx
    mul cx
    add ax, bp
    mov al, 0A2h
    add si, strict word worker - start

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 10
    rep movsw
    push ss
    pop ds
    mov bx, 0280h
    push cs
    pop ss
    mov [bx], ax
    and dx, 0
    or dx, 0FFBh
    mov [bx + 2], dx
    xor si, si
    mov di, ax
    mov es, dx
    mov sp, di
    add sp, 00600h
    mov cx, 8
    mov dx, 02400h
    mov bp, 02C00h
    mov ax, 01FFFh
    stosw
    dec di
    call far [bx]

worker:
    movsw
    rep movsw
    sub sp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 9
    xor si, si
    stosw
    dec di
    call far [bx]
    db 0CCh, 0CCh
```

### Binaries as hex (for a byte-level check)

- A (214 B): `89c6bbff26b9174aa143128b16174a89166997f7a4d20097c484ce00bac3e1cd87bf80ffb8ff1fbacccccd8689f031d2f7b4d400f7a4d40005a22c81c67700160731ffb90a00f3a5161fbbc0020e17890783e20081cafb0f89570231f689c78ec289fc81c40001b90900ba0040bd0044b8ff1fab4fff1fa5f3a529d4292f8b3fb10931f6ab4fff1fcccc89c3bacccc81c30001813fcccc74f6b1048a47012c0f3c10770d8b3781fefc0f74053b7704740543e2e7ebd98b7ffe81ee001001f601f601f601f683ef0201f78915ebc1f28100100f00003c`
- B (222 B): `89c68d9c4200891e174a891e135d891e13ccc47c3eb80febbaf9ccbb0fffb92613fdcd87fc89f088e030e4b53cf6f5f6e588c480c410b0a281c6cb00eb550000001031fffdbd0070e31bbd00200e07b80febbaf9ccbb0fffb92613cd87b8ff1fbacccceb1289df81e700fc81c76401b8ff1fbacccccd86fce800005e81ee7b0089f031d2b9003cf7f1f7e101e8b0a281c6cb00160731ffb90a00f3a5161fbb80020e17890783e20081cafb0f89570231f689c78ec289fc81c40006b90800ba0024bd002cb8ff1fab4fff1fa5f3a529d4292f8b3fb10931f6ab4fff1fcccc`

### Night start (rev0, V6nohunt), for reference

- `agent2/night/revisions/rev0/A.asm` / `B.asm`; A 194 B `6861894f3c1992cd6c6baa5b2a746178082f5b4b0a1d9969b9a326fe03d86c89`,
  B 202 B `8579e2c2212d72a413a6daacfe3b91ceb72be648bfc085bfeed9430eeaf6657a`.

## 3. Final confirmation (fresh field) - numbers

Job `20261004043747457-COORD-final-confirm-svxch`, salt `agent2-night-confirm-final-1`, base revision 1, 7,680 battles
per arm, 6 arms (cand = rev1, base = rev1 (identical, diff exactly 0 as a check), rev0, V6Guard, zchain4, V6), 2025 Zombie pack except
in the no-Zombie group. Groups: 2025 (75 cohorts), strong (21), 2024live (15), threat (48 = 16 library threats x 3),
multi (8), nozombie (25). Pooled = 2025+strong+2024live, interval z=2.5; group intervals z=1.96. Diff = rev1 minus the
reference, per-battle team score, paired by cohort and seed.

Mean team score per battle:

| arm | 2025 | strong | 2024live | threat | multi | nozombie |
|---|---|---|---|---|---|---|
| rev1 (KPHL) | 0.7526 | 0.6583 | 0.6625 | 0.6367 | 0.3668 | 0.5787 |
| rev0 (V6nohunt) | 0.7379 | 0.6584 | 0.7111 | 0.5677 | 0.3258 | 0.5642 |
| V6Guard | 0.7343 | 0.6457 | 0.7100 | 0.5674 | 0.3310 | 0.5712 |
| zchain4 | 0.7490 | 0.5419 | 0.6914 | 0.5580 | 0.2072 | 0.5463 |
| V6 | 0.7316 | 0.6374 | 0.7167 | 0.5651 | 0.3419 | 0.5592 |

rev1 minus reference (W/L = cohorts won/lost):

| vs | pooled (z=2.5) | 2025 | strong | 2024live | threat | multi | nozombie |
|---|---|---|---|---|---|---|---|
| rev0 | +0.0034 [-0.0234,+0.0301] 47/55 | +0.0147 [-0.0094,+0.0389] | -0.0000 [-0.0615,+0.0614] | **-0.0486 [-0.0893,-0.0080]** 4/10 | **+0.0690 [+0.0385,+0.0995]** 35/12 | +0.0410 [-0.0356,+0.1176] 5/3 | +0.0145 [-0.0069,+0.0359] |
| V6Guard | +0.0084 [-0.0182,+0.0349] 54/52 | +0.0183 [-0.0060,+0.0426] | +0.0127 [-0.0454,+0.0707] | **-0.0475 [-0.0897,-0.0053]** | **+0.0692 [+0.0401,+0.0984]** | +0.0358 [-0.0403,+0.1119] | +0.0075 [-0.0157,+0.0307] |
| zchain4 | +0.0206 [-0.0111,+0.0522] 60/45 | +0.0036 [-0.0229,+0.0301] | **+0.1164 [+0.0508,+0.1820]** | -0.0289 [-0.0928,+0.0351] | **+0.0787 [+0.0262,+0.1311]** | **+0.1596 [+0.0570,+0.2622]** 8/0 | +0.0323 [-0.0198,+0.0845] |
| V6 | +0.0108 [-0.0161,+0.0378] 51/54 | +0.0210 [-0.0032,+0.0452] | +0.0209 [-0.0391,+0.0809] | **-0.0542 [-0.0978,-0.0106]** 3/11 | **+0.0716 [+0.0413,+0.1019]** | +0.0248 [-0.0394,+0.0891] | +0.0195 [-0.0061,+0.0451] |

By library threat, rev1 minus rev0 (3 cohorts each, z=1.96): cgx123123 +0.167 [0.080,0.253] 3/0; BinaryBandits +0.176
[0.035,0.318] 3/0; callfart +0.133 [0.112,0.155] 3/0; Grindo +0.171 n.s.; AnotherBit +0.064 n.s.; V4 +0.083 [0.057,0.110] 3/0;
V6Guard +0.069 [0.036,0.103] 3/0; V6 +0.050 n.s.; zrl03 +0.069 [-0.001,0.138] 3/0; ah02 +0.224 [0.198,0.250] 3/0;
Baltika9 +0.008; LowKey +0.008; zchain4 -0.013; IND_BRA -0.015; CodeKiller -0.033; TrojanByte -0.058 (all n.s.).

Verification against the original engine (cold JVM, `--parallel=false`, scores.csv compared byte for byte):
- `node agent2/tools/verify-original.mjs agent2/night/results/nightC-agent2-night-confirm-final-1.json 30 night-final 8`
  -> **30/30 byte-identical** (sample: cand 3, base 6, rev0 5, V6Guard 1, zchain4 12, V6 3 runs); report
  `agent2/results/verify-nightC-agent2-night-confirm-final-1-night-final.json`.
- `node agent2/tools/verify-original.mjs agent2/night/results/nightC-agent2-night-confirm-final-1-nz.json 10 night-final 8`
  -> **10/10 byte-identical**; report `agent2/results/verify-nightC-agent2-night-confirm-final-1-nz-night-final.json`.

## 4. Comparison with the promotion confirmation and the two confirms pooled

Promotion confirm `20261004040436817-COORD-combine-confirm-d93vd` (salt `agent2-night-confirm-combine-1`, base was rev0,
so "base" = rev0 there):

| rev1 minus | pooled (z=2.5) | 2025 | strong | 2024live | threat | multi | nozombie |
|---|---|---|---|---|---|---|---|
| rev0, promotion confirm d93vd | +0.0328 [+0.0053,+0.0604] 57/44 | +0.0257 [+0.0004,+0.0511] | +0.0665 [+0.0036,+0.1294] | +0.0211 [-0.0207,+0.0629] | +0.0495 [+0.0187,+0.0802] | +0.0221 [-0.0080,+0.0523] | +0.0065 [-0.0139,+0.0269] |
| rev0, final confirm svxch | +0.0034 [-0.0234,+0.0301] 47/55 | +0.0147 | -0.0000 | -0.0486 [-0.0893,-0.0080] | +0.0690 [+0.0385,+0.0995] | +0.0410 | +0.0145 |
| rev0, both pooled (222 cohorts, method below) | **+0.0181 [-0.0012,+0.0374]** 104/99 | +0.0202 [+0.0028,+0.0377] | +0.0332 [-0.0114,+0.0779] | -0.0138 [-0.0451,+0.0176] | **+0.0592 [+0.0376,+0.0809]** 63/30 | +0.0316 [-0.0085,+0.0716] | +0.0105 [-0.0042,+0.0252] |
| V6Guard, d93vd | +0.0329 [+0.0064,+0.0593] | | | | | | |
| V6, d93vd | +0.0346 [+0.0081,+0.0610] | | | | | | |
| zchain4, d93vd | +0.0366 [+0.0000,+0.0732] | | | | | | |

Method for "both pooled": per-cohort paired differences from both result files
(`agent2/night/results/nightC-agent2-night-confirm-combine-1[-nz].json`, arms cand-base; `...-final-1[-nz].json`, arms
cand-rev0), concatenated; pooled interval z=2.5, groups z=1.96 (same formulas as the daemon).

Per library threat, both confirms pooled (6 cohorts each, rev1 minus rev0): zrl03 +0.190 [0.078,0.302] 6/0; ah02 +0.196
[0.169,0.223] 6/0; callfart +0.150 [0.120,0.180] 6/0; Grindo +0.127 [0.018,0.236]; cgx123123 +0.104 [0.034,0.174] 5/0;
BinaryBandits +0.053 n.s. (-0.069 then +0.176); V4 +0.042 n.s.; LowKey +0.038 n.s.; AnotherBit +0.032 n.s.; CodeKiller
+0.027 n.s.; V6 +0.022 n.s.; Baltika9 +0.017 n.s.; V6Guard +0.008 n.s. (-0.054 then +0.069); zchain4 +0.004 n.s.;
TrojanByte -0.021 n.s.; **IND_BRA -0.041 [-0.085,+0.003] 1/5**.

## 5. How much it improved, and by which tests

- Robustness against the 16-team threat library (MOVSW teams, zombie mimics, IND_BRA, V6-family leaders, zrl03/ah02/zchain4):
  **+0.05 to +0.07 per battle**, lower bound > 0 in both fresh confirms (d93vd, svxch). Main sources: zrl03/ah02 (+0.19,
  p0f13 window and [0CC13h] steal), callfart/Grindo (+0.13 to +0.15, locpatA capture), cgx123123 (+0.10).
- Strong field (2024 final + counters + peers): +0.067 (d93vd, lo > 0), then 0.000 (svxch). Not replicated.
- Plain 2025 field: +0.026 (d93vd) and +0.015 (svxch, n.s.); pooled +0.020 [0.003,0.038] at z=1.96, not at z=2.5.
- vs zchain4: strong +0.116 and multi +0.160 (both lo > 0, svxch); 2025 tie.
- Overall pooled field score vs rev0: **not confirmed** (+0.0034 on the final fresh field; +0.018 pooled, lower bound -0.001).

## 6. What is NOT proven

- A higher per-battle score than rev0, V6Guard or V6 on the pooled field (the final replication is a tie).
- That rev1 is not worse on 2024-live-like fields: the final confirm shows a significant loss there (-0.049 vs rev0,
  -0.048 vs V6Guard, -0.054 vs V6); the promotion confirm showed +0.021 n.s. The cause is not traced.
- Any claim about the 2026 field, other Zombie packs, or the real tournament. All numbers come from archived 2023-2025
  fields with the 2025 zom20 pack in the local simulator.
- Any immunity. Several purpose-built counters still reduce rev1 to 0.00-0.06 per battle (section 7).
- Mechanisms behind most single-cohort effects (most were measured, not traced).
- The promotion itself was a single confirm that cleared z=2.5 by +0.005 after a best-of-3 combination screen
  (winner's curse); the stricter preregistered rule used for the KP re-check (second fresh confirm passes, and both confirms pooled
  have lo > 0) would **not** be met by rev1 (pooled lo -0.0012).

## 7. Weaknesses by domain

Classification words: verified-in-current (measured on rev1 or on a KP-family pair that contains the same code),
verified-in-other (measured on rev0 or another pair only), hypothesis, not-reproduced. Status: reduced / remains / newly
created. "Reporter jobs" = four threat jobs run for this report with candidate = rev0 and base = rev1 on night counter codes
(4-8 cohorts x 20 battles per counter, so small samples): `...-COORD-final-threat-yy66e` (set 1), `...-8ifcs` (set 2),
`...-nz8jk` (3 copies), `...-2ajc5` (mixed crowd). Team scores below are rev1 / rev0 per battle.

| domain | weakness | rev1 status | classification and evidence |
|---|---|---|---|
| 1 MOVSW trails | `FF A5` kill of the `FF 1F` anchor (about half of steady-state deaths in rev0) | **remains** (no structural fix in rev1) | verified-in-other: trace pkj3o, A045 ffa5. Verified-in-current: MOVSW twin 1 copy 0.356 / 0.350 (yy66e), 3 copies 0.063 / 0.064 (nz8jk). Partly reduced vs the real cgx123123: +0.167 3/0 (svxch), 3 copies 0.844 / 0.594, 8/0 (nz8jk). TrojanByte -0.058, CodeKiller -0.033 n.s. (svxch). The tested fix A_t800 (KPT) was left out: no-Zombie cost replicated (hi50u -0.050, e1h4o -0.026, 7q3rw -0.031). |
| 2 Zombie mimics | Grindo/callfart `E2 F2 81 C3` copies absorb A's single INT 87h; [1243h] poisoning | **reduced** | verified-in-current: callfart +0.150 [0.120,0.180] 6/0 and Grindo +0.127 [0.018,0.236] over both confirms; KL yuexx +0.056. Early zom20a stealer (B072 zdeny): 0.741 / 0.613, +0.127 [0.006,0.249] (8ifcs). |
| 2 Zombie mimics | B074 INT86 signature-decoy planter wastes captures | **remains** | verified-in-current: 0.573 / 0.587 (yy66e); KP 3xuy5 "planter still wins". |
| 3 Hook cells | fixed-cell [4A17h] poisoners steal captured Zombies | **remains, slightly reduced** | verified-in-current: B073 poisoner 0.219 / 0.169 (+0.05 [0.005,0.095] 3/0, yy66e); B083 poisonE 0.237 / 0.188 (+0.05 [0.015,0.085] 3/0, 8ifcs). rev1 still routes zombies through [4A17h]; the body-cell fix (B073/B083) was not included. |
| 4 b/d decoys | zrl03/ah02 `EB F9 CC CC` decoys consume B's b/d searches; OpcodeHunter2 top decoys | **reduced** | verified-in-current: zrl03 +0.190 6/0, ah02 +0.196 6/0 (both confirms); p0f13 qpbgf, KP 3xuy5; 2 copies of zrl03 fixed by h34 (hecn5). |
| 5 Lattice | same-family clones 10h-50h below the 52h lattice | **remains** | verified-in-current: lat_m30 clone 0.375 / 0.370 (8ifcs); 10h undercut 1 copy 0.302 / 0.338 n.s. (8ifcs), 3 copies 0.143 / 0.092 (+0.052, 7/1, nz8jk; low absolute score). The tested lattice moves (A011, B085, B088 mix4) trade holes and were rejected. |
| 6 Signatures | archived `FF 1F CC CC` searchers (2B2Team, OpcodeHunter, PastRAMa, segment_fault) | **reduced** | verified-in-current: E1/Z1/SD decoys (fm2tw +0.084, vdhwq +0.053, i8gtc +0.061, a6imo +0.071); K w7 confirm 2025 +0.008. KL gives back E1's JMP2HELL gain (j041y -0.171): verified-in-current. |
| 6 Signatures | purpose-built 4-byte INT 87h counters on our initializer/template bytes (nbsig2, dsig, tplsig) | **remains** (score 0) | verified-in-current: rev1 0.000 / rev0 0.000 vs nbsig2, dsig and tplsig (yy66e, 8ifcs); KP q3pyu. The dA decoy fix (KPd qvq5f +0.141) was not included and is used up by 2 counter copies (p3n0l). |
| 7 Trail hunters | far-call trail hunter bombs our anchors | **remains** | verified-in-current: huntV6 0.262 / 0.237 n.s. (yy66e); rev0 y4h5y 0.333 vs 0.875 control. No tested low-cost fix. |
| 8 Bombers | page-lattice CC bomber at in-page 52h | **remains** (score about 0) | verified-in-current: pg52 0.013 / 0.000 (yy66e); KP 1xzx0. mix4 answers it but costs on the field and opens 22h/adaptive holes (os8if, mvmvo). |
| 8 Bombers | IND_BRA | **possibly newly created** (small) | hypothesis: -0.067 3/0 losses (d93vd), -0.015 (svxch); pooled -0.041 [-0.085,+0.003] 1/5. |
| 8 Bombers | early INT 86h bombs at startup | remains (small, about -0.007/bomb) | verified-in-other: ogq11, pkj3o. Not re-tested on rev1. |
| 9 Self-harm | theft self-kill with 2+ [5D13h] routers (b01d/m050 lineage) | **reduced** | verified-in-current: KPH 00vzu +0.146 vs KP +0.055 (yerwq); h34 a4urp +0.192. |
| 9 Self-harm | partner crossfire, captured-zombie trails, own hook-cell writes | remains (each <= 0.004/battle) | verified-in-other: A041, A042 (att.mjs), A044, B059. |
| 10 Multi-copy / combined | 3 copies of V6 | **remains (no change)** | verified-in-current: multiV6 cohorts rev1 0.240/0.196/0.213/0.183 vs rev0 0.188/0.252/0.206/0.219 (svxch); 0.236 vs 0.238 mean (d93vd); KP bcx5j -0.005 n.s. |
| 10 Multi-copy / combined | mixed crowds of library threats | reduced on average, one bad mix | verified-in-current: multiMix svxch +0.11 to +0.20 in three cohorts but **-0.113** in BinaryBandits+TrojanByte+V6Guard; d93vd -0.012 in V4+BinaryBandits+V6Guard (hypothesis: crowds with V6Guard plus a MOVSW team). |
| 10 Multi-copy / combined | crowd of night counters (MOVSW twin + trail hunter + [4A17h] poisoner) | **remains** (about 0.07) | verified-in-current: 0.068 / 0.065 (2ajc5). |
| new | 2024 live field | **newly created** (one of two confirms) | verified-in-current: svxch -0.049 [-0.089,-0.008] 4/10 (also vs V6Guard/V6); d93vd +0.021 n.s.; both -0.014 n.s. Probable source: locpatA (A side), hypothesis: locpatA alone cn666 -0.019 [-0.029,-0.009] 0/9, s5vq3 -0.017; KP/KPT re-checks without locpatA had 2024live +0.027 / +0.039. |
| new | BinaryBandits, V6Guard (flagged at promotion) | not-reproduced | d93vd -0.069 / -0.054, svxch +0.176 / +0.069 (lo > 0). |

## 8. Multi-counter cohorts (several counter teams together, multi-copy)

- Confirm multi group (4 cohorts of 3 copies of V6 + 4 cohorts of 3 random library threats, 40 battles each):
  final svxch rev1 minus rev0 +0.041 [-0.036,+0.118] 5/3; d93vd +0.022 [-0.008,+0.052] 5/3; pooled +0.032 [-0.009,+0.072].
  - 3x V6: no change (see table above).
  - Mixed library crowds (svxch): callfart+TrojanByte+zchain4 0.650 vs 0.446; zrl03+ah02+LowKey 0.549 vs 0.438;
    CodeKiller+ah02+TrojanByte 0.621 vs 0.463; BinaryBandits+TrojanByte+V6Guard **0.283 vs 0.396**.
  - vs zchain4 the multi group is +0.160 [0.057,0.262] 8/0 (zchain4 collapses in crowds).
- Reporter jobs (rev1 vs rev0, 8 cohorts x 20 battles, 3 copies each, nz8jk): 3x cgx123123 0.844 vs 0.594 (8/0);
  3x 10h-undercut V6 clone 0.143 vs 0.092 (7/1); 3x MOVSW twin 0.063 vs 0.064.
- Mixed night-counter crowd (twin + hunter + poisoner, 12 cohorts, 2ajc5): 0.068 vs 0.065.
- KP-family multi-copy check (bcx5j, 3 copies of V6 / V4 / cgx123123): KP -0.005 [-0.017,+0.006] vs rev0.

## 9. Counts actually performed

- Role cards: 100 (A001-A050 performance, B051-B100 threat domains 1-10).
- Role agents that returned a report: **99 `report.json` files** in `agent2/night/scratch/*/report.json` (A025 has no
  scratch directory). 80 of them used the queue; 19 returned a report without any job (session stopped / nothing built).
- Coordinators: **14 coordinator queue identities**: COORD-w1 ... COORD-w10 (one per wave), COMBINE, COORD-recheck,
  COORD-combine, COORD-final (this reporter).
- Candidates screened: **134 distinct (A,B) binary pairs** in 135 non-test screen jobs (147 distinct pairs over all job kinds).
- Queue jobs: **339** in `agent2/night/queue/done` (334 before this report + 5 by the reporter): screen 136, threat 166,
  trace 16, confirm 21. Of these, 2 were infrastructure tests (TEST) and 2 were daemon duplicates (no battles run).
  0 errors. Ledger `agent2/night/ledger.jsonl` has 339 lines.
- Total battles:
  - Method requested (sum over done/*.json, excluding duplicates, of battlesPerArm x arms; screens and threats counted as
    2 arms, confirms as 5 or 6 arms, traces as their battle count): **1,372,520 battles**.
  - Battles actually executed (sum of `battles` over every plan result in `agent2/night/results/*.json`; the screen base
    plan `nightS-base-rev0` and threat base plans are run once and reused, which the first method counts repeatedly):
    **1,147,440 battles** in 472 plan runs.
  - Not included above: the cold-JVM verification in this report (30 + 10 runs x 40 battles = 1,600 battles).
- Confirmations run: **21** (w1, w2, w3 x2, w4 x2, w5 x2, w6, w7 x2, w8 x2, w9 x2, w10 x2, recheck-KP, recheck-KPT,
  combine, final); salts in `agent2/night/confirm/salts.json`.
- Promotions: **1** (rev0 -> rev1 KPHL after d93vd). The preregistered KP/KPT re-checks (71fab, 7q3rw) both failed:
  KP pooled +0.0115 [-0.0057,+0.0286]; KPT pooled +0.0220 [-0.0029,+0.0468] with nozombie -0.031.

### All confirmations (candidate minus base, pooled z=2.5)

| wave | candidate | job | pooled | decision |
|---|---|---|---|---|
| 1 | fix2steal | 73y2h | +0.0058 [-0.0037,+0.0154] | no |
| 2 | zph | mc03n | +0.0092 [-0.0120,+0.0304] | no |
| 3 | A_t800 | hi50u | +0.0012 [-0.0176,+0.0200] | no (nozombie -0.050) |
| 3 | L0 | tdhdw | -0.0130 [-0.0311,+0.0051] | no |
| 4 | E2 | 15igt | -0.0212 [-0.0441,+0.0018] | no |
| 4 | hz | xkwd0 | -0.0172 [-0.0380,+0.0037] | no |
| 5 | C2 | n7xxg | +0.0098 [-0.0023,+0.0219] | no |
| 5 | SDd | psy2k | +0.0085 [-0.0003,+0.0174] | no |
| 6 | Z1 | 013sr | +0.0091 [-0.0022,+0.0204] | no |
| 7 | p0f13 | 6aetq | +0.0044 [-0.0061,+0.0150] | no |
| 7 | K | a26f6 | +0.0087 [-0.0049,+0.0222] | no |
| 8 | h34 | 8jsb6 | -0.0061 [-0.0207,+0.0085] | no |
| 8 | locpatA | cn666 | +0.0045 [-0.0070,+0.0159] | no (2024live -0.019) |
| 9 | KH | 81s5c | +0.0041 [-0.0158,+0.0239] | no |
| 9 | KP | ubyb2 | +0.0211 [+0.0037,+0.0385] | no (multi -0.013) |
| 10 | KPH | nn663 | +0.0112 [-0.0121,+0.0345] | no |
| 10 | KPT | e1h4o | +0.0228 [-0.0030,+0.0486] | no (nozombie -0.026) |
| recheck | KP | 71fab | +0.0115 [-0.0057,+0.0286] | no |
| recheck | KPT | 7q3rw | +0.0220 [-0.0029,+0.0468] | no |
| combine | KPHL | d93vd | +0.0328 [+0.0053,+0.0604] | **promoted (rev1)** |
| final | KPHL vs rev0 | svxch | +0.0034 [-0.0234,+0.0301] | replication failed on the field; threat +0.069 replicated |

## 10. Locations and reproduction

- Brief, rules and engine facts: `agent2/night/BRIEF.md`; per-wave findings `agent2/night/FINDINGS.md`; promotions
  `agent2/night/NOTICES.md`; preregistered re-check `agent2/night/protocol-recheck-KP.md`; run state `agent2/night/CHECKPOINT.md`.
- Current base: `agent2/night/shared-best.json` (revision 1, history with rev0). Revisions: `agent2/night/revisions/rev0|rev1/`.
- References: `agent2/night/refs/{V6,V4,V6Guard,zchain4}/A|B` (V6 A 221 B sha 3fa67bed..., V6Guard A 227 B sha 71164c8d...,
  zchain4 A 233 B sha 07c238b2... / B 122 B sha 2fb8f412...; V6/V6Guard B = rev0 B 8579e2c2...).
- Threat library: `agent2/night/threats/library.json`; fields: `agent2/night/fields/S.json` (screen field), confirm fields
  generated from the salt by `agent2/night/daemon.mjs` with `agent2/tools/fields.mjs`.
- Jobs: `agent2/night/queue/done/<jobId>.json` (full results), `agent2/night/ledger.jsonl` (one line per job),
  plans `agent2/night/plans/<planId>.json`, raw results `agent2/night/results/<planId>.json`, assembled candidates
  `agent2/night/cand-build/<jobId>/`, per-run directories `agent2/runs/<planId>-persistent/`, traces `agent2/night/scratch/_trace/`.
- Role sources and reports: `agent2/night/scratch/<ID>/` (report.json, .asm, builds). Combination sources:
  `agent2/night/scratch/COMBINE/`. Counter codes used here: `scratch/B067/huntA|B.asm`, `B058/pg52A|B.asm`,
  `B076/counterA|B.asm`, `B051/cMovswA|B.asm`, `B073/counterA|B.asm`, `B074/counterA|B.asm`, `B086/counterA|B.asm`,
  `B056/nbsig2A|B.asm`, `B055/lat_m30_A|B.asm`, `A011/fa_A|B.asm`, `B072/counterA|B.asm`, `B083/poisonEA|EB.asm`.
- Final confirm: plan ids `nightC-agent2-night-confirm-final-1` and `-nz`; verification reports
  `agent2/results/verify-nightC-agent2-night-confirm-final-1-night-final.json` and `...-nz-night-final.json`.

Commands (run from `C:\Maor\CodeGuru\corewars8086-agent2`):

```sh
# evaluation daemon (single process, 8 threads; stop with: touch agent2/night/STOP)
node agent2/night/daemon.mjs >> agent2/night/daemon.log 2>&1
# screen a candidate against the current base (omit --asmA/--asmB to use the base warrior)
node agent2/night/submit.mjs --agent A001 --kind screen --asmA path/A.asm --asmB path/B.asm --note "what changed"
# threat job (library keys or own counter code)
node agent2/night/submit.mjs --agent A001 --kind threat --threats '[{"key":"zomb_Grindo"},{"name":"x","asmA":"a.asm","asmB":"b.asm"}]' --copies 1 --cohortsPerThreat 6
# confirmation (coordinator only; every salt can be used once, see agent2/night/confirm/salts.json)
node agent2/night/submit.mjs --agent COORD-final --kind confirm --salt agent2-night-confirm-final-1 --asmA agent2/night/revisions/rev1/A.asm --asmB agent2/night/revisions/rev1/B.asm
# wait for / print a job, and summarize a confirm by group and threat
node agent2/night/wait.mjs <jobId> [--full]
node agent2/night/scratch/COORD-w3/sum.cjs <jobId>
# re-run a sample of a result with the original cold JVM and compare scores.csv byte for byte
node agent2/tools/verify-original.mjs agent2/night/results/nightC-agent2-night-confirm-final-1.json 30 night-final 8
node agent2/tools/verify-original.mjs agent2/night/results/nightC-agent2-night-confirm-final-1-nz.json 10 night-final 8
# re-run an existing plan exactly (same seeds) without the queue
node agent2/tools/bench.mjs agent2/night/plans/nightC-agent2-night-confirm-final-1.json --threads 8
```

## 11. Recommendations for the next session

1. Treat rev1 as "robustness improved, field tie". Before using it, run one more fresh confirm focused on the 2024 live
   field (several partitions), and test KP+h34 without locpatA (KPH) against KPHL on that field to check whether locpatA causes
   the 2024live loss.
2. The open holes with zero or near-zero score (signature counters, page-lattice bomber, MOVSW twin crowds, trail hunter)
   are not touched by rev1; dA (signature decoys) and a no-Zombie-neutral MOVSW defense are the most concrete candidates.
