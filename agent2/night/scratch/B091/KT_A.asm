bits 16

; Good_Test V6 warrior 1 (friend-provided; reconstructed source in
; study-notes/good-test-v6/source/). agent2 label form: hard-coded internal
; offsets replaced by label arithmetic with the original operand widths.
; agent2 variant: removed the [7A00h] redirect patch (ablation)
; agent2 night A031 variant E1 (base rev0 = V6nohunt A): A spends one of its own
; (previously unused) INT 86h charges right after the zom20a INT 87h on a block of
; 64 FF 1F CC CC decoys at 0FF80h..007Fh (wraps through 0000h). It is the first
; FF1FCCCC match for forward searchers starting at 0000h..007Ch (OpcodeHunter1,
; ADDvanced, ATO1 from ~001Ah) and for backward searchers from 0FFFFh
; (segment_fault1, PastRAMa), and it absorbs repeated searches (one dword each).
; No code is ever loaded below 400h or above 0FC00h; the only lattice point in the
; block is 0052h (B band 4 first anchor), written by B later than this block.
; Band math rewritten with 16-bit DIV (same AX, 3 turns fewer) and the no-op jmp
; removed, so phoenix_init is reached on the same turn as in rev0.

; A031 K = E1 + A022 SD (phoenix_init mov cx,10; dead mov dx,[4A17h] dropped; db 0CCh,0CCh after the worker).
; B091 KT = A031 K + A015 A_t800 (A phoenix mov dx,04000h -> 03C00h: A trail per generation BP-DX = 800h; MOVSW-family defense).

start:
    mov si, ax
    push cs
    pop es
    mov ax, [4A17h]
    mov [9769h], ax
    mov ax, 0F2E2h
    mov dx, 0C381h
    mov bx, 026FFh
    mov cx, 04A17h
    int 087h
    mov di, 0FF80h
    mov ax, 01FFFh
    mov dx, 0CCCCh
    int 086h
    mov ax, si
    xor dx, dx
    mov cx, 03C00h
    div cx
    mul cx
    add ax, 02CA2h
    add si, strict word worker - start

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
    mov dx, 03C00h
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
