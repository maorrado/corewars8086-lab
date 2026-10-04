; D1 (agent2 day2 role D1, base rev1 KPHL) variant cL: coupled phoenix with a V6-compatible template.
; Good_Test V6 is friend-provided code (warrior 1/2 reconstructed in study-notes/good-test-v6/source/);
; V6nohunt and all night edits are agent2 roles (see agent2/night/FINDINGS.md); this edit is agent2 day2 D1.
; Mechanism (trace dayTR-1e9efbcb54-dd73fad407, emulator agent2/day2/scratch/D1/absim.mjs reproduces the traced
;   self-kill rounds 32598/52953/65875/69725/109868/114282): the worker's sub sp,dx carries the SP excess of an EARLY
;   trigger into the next generation (d_new = d_trig + trail), so B and the captured zombies run decoupled ('free')
;   fronts that trail A's front by 4-80 bytes when A self-triggers and overwrite A's worker during its rebuild.
; Change: after V6's unchanged worker prefix (sub sp,dx .. dec di, byte-identical so co-anchored V6-family and
;   own rebuilds still write the same bytes at P+4..P+15), one lea re-derives SP from the new anchor every
;   generation: SP = BX + DI (+d8) with DI = new IP + 1 and the private cell BX placed so that SP = anchor + trail.
;   A, B and captured zombies share one byte-identical template (only the private cell offset differs).
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
    mov cx, 11              ; D1: template copy 22 bytes (worker grew)
    rep movsw
    push ss
    pop ds
    mov bx, 007AFh             ; D1: cell offset sets B's trail (800h) via lea
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
    lea sp, [bx + di]       ; D1: SP = cell(BX) + new IP + 1 = anchor + trail (coupled)
    call far [bx]
    db 0CCh, 0CCh
