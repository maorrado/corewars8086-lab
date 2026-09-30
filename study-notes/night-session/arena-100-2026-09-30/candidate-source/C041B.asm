bits 16

; c041-int86-bomb B: byte-identical to m050's B (ChimeraB-m050.asm).
; Deliberately untouched -- every sibling ablation in this arena run
; (c038's A-only vs A+B-both split, candidate-5's own A-only design) shows
; adding the INT86h detour to B as well nets WORSE than leaving B alone.
; B's job is to be the lean, low-risk replicator; giving it a one-time
; detour only adds crash surface and delay for a mechanism whose own A-side
; benefit is already thin (0.6720 vs 0.6723 baseline gap it's trying to
; close), so any material tax on B is expected to cost more than it can
; possibly recover.
%define FAR_SEG  0FFCh
%define PTR_CELL 00240h

start:
    mov si, ax
    push cs
    pop es
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 05D13h
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
    add ah, 034h
    mov al, 0A2h
    add si, worker - start
    jmp short phoenix_init

    times 2 db 0CCh

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    push ss
    pop ds
    mov bx, PTR_CELL
    push cs
    pop ss
    mov [bx], ax
    mov word [bx + 2], FAR_SEG
    xor si, si
    mov di, ax
    mov ax, FAR_SEG
    mov es, ax
    mov sp, di
    add sp, 00280h
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
