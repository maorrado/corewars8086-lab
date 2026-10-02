bits 16

; Complementary private-template near-hopper B, with a different initial
; location and coprime orbit through the 64 KiB arena.
%define FIRST_HOP 0300h
%define HOP_STRIDE 04273h
%define BODY_WORDS ((body_end - body + 1) / 2)

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
    mov bx, si
    add bx, FIRST_HOP
    add si, body - start

init_template:
    push ss
    pop es
    xor di, di
    mov cx, BODY_WORDS
    rep movsw
    push ss
    pop ds
    push cs
    pop es
    cld
    jmp short body

body:
    mov di, bx
    xor si, si
    mov cx, BODY_WORDS
    rep movsw
    push bx
    add bx, HOP_STRIDE
    ret
body_end:
    ; The copied body is 15 bytes. Its final byte is a backup near RET.
    times BODY_WORDS * 2 - (body_end - body) db 0C3h
