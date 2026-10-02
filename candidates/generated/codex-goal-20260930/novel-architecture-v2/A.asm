bits 16

; Probe-and-interdict A: relocate a small hunter, then use occupied-byte
; samples to aim the two heavy bombs. No Phoenix band, far pointer, or
; Zombie signature. A surviving hunter subsequently corrupts occupied words.
%define RELOC_OFFSET 04000h
; The early 127-byte samples miss our own relocated 48-byte body.
%define PROBE_OFFSET 01595h
%define PROBE_STRIDE 0007Fh

start:
    mov bp, ax
    push cs
    pop es
    cld
    mov si, ax
    add si, hunter - start
    mov di, ax
    add di, RELOC_OFFSET
    mov bx, di
    mov cx, (hunter_end - hunter + 1) / 2
    rep movsw
    push cs
    push bx
    retf

hunter:
    mov si, bp
    add si, PROBE_OFFSET
    mov ax, 0CCCCh
    mov dx, ax
    mov cx, 2

find_bomb:
    add si, PROBE_STRIDE
    cmp byte [si], 0CCh
    je find_bomb
    ; BX still points to our relocated body. An INT 86h bomb centered on SI
    ; must not overlap that body, including either 128-byte margin.
    mov di, si
    sub di, bx
    cmp di, hunter_end - hunter + 0080h
    jb find_bomb
    cmp di, 0FF80h
    jae find_bomb
    mov di, si
    sub di, 0080h
    int 086h
    loop find_bomb

find_word:
    add si, PROBE_STRIDE
    cmp byte [si], 0CCh
    je no_hit
    ; A word write at BX-1 would also corrupt the body's first byte.
    mov di, si
    sub di, bx
    cmp di, hunter_end - hunter
    jb no_hit
    cmp di, 0FFFFh
    je no_hit
    mov word [si], 0CCCCh
no_hit:
    db 09Bh, 09Bh
    jmp find_word
hunter_end:
