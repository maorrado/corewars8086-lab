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

; B096 (wave 10, domain 6 R5-cost): KdA = K_A + B086 dA idea. Dead zombie tail replaced by a decoy copy of
; K_A bytes 04h..80h (late-executed code + template incl. 20th byte) against backward INT87 signature searches.
; Good_Test V6 friend-provided; V6nohunt/E1/SD/K by agent2 roles; dA idea by B086.
    db 0x89            ; 20th template byte (first byte of the removed zombie_entry; keeps the template copy identical)

decoy:
    db 0xa1, 0x17, 0x4a, 0xa3, 0x69, 0x97, 0xb8, 0xe2, 0xf2, 0xba, 0x81, 0xc3, 0xbb, 0xff, 0x26, 0xb9
    db 0x17, 0x4a, 0xcd, 0x87, 0xbf, 0x80, 0xff, 0xb8, 0xff, 0x1f, 0xba, 0xcc, 0xcc, 0xcd, 0x86, 0x89
    db 0xf0, 0x31, 0xd2, 0xb9, 0x00, 0x3c, 0xf7, 0xf1, 0xf7, 0xe1, 0x05, 0xa2, 0x2c, 0x81, 0xc6, 0x6d
    db 0x00, 0x16, 0x07, 0x31, 0xff, 0xb9, 0x0a, 0x00, 0xf3, 0xa5, 0x16, 0x1f, 0xbb, 0xc0, 0x02, 0x0e
    db 0x17, 0x89, 0x07, 0x83, 0xe2, 0x00, 0x81, 0xca, 0xfb, 0x0f, 0x89, 0x57, 0x02, 0x31, 0xf6, 0x89
    db 0xc7, 0x8e, 0xc2, 0x89, 0xfc, 0x81, 0xc4, 0x00, 0x01, 0xb9, 0x09, 0x00, 0xba, 0x00, 0x40, 0xbd
    db 0x00, 0x44, 0xb8, 0xff, 0x1f, 0xab, 0x4f, 0xff, 0x1f, 0xa5, 0xf3, 0xa5, 0x29, 0xd4, 0x29, 0x2f
    db 0x8b, 0x3f, 0xb1, 0x09, 0x31, 0xf6, 0xab, 0x4f, 0xff, 0x1f, 0xcc, 0xcc, 0x89
