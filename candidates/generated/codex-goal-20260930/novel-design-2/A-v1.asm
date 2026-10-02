bits 16

; Private-template near-hopper A. No far call, far pointer, or stack-in-arena
; return trail. The team still takes the known B/D Zombie when available.
%define FIRST_HOP 0200h
%define ZOMBIE_HOP 0280h
%define HOP_STRIDE 03D01h
%define BODY_WORDS ((body_end - body + 1) / 2)

start:
    mov si, ax
    mov bx, ax
    add bx, zombie_entry - start
    mov [05D13h], bx
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
    jmp short init_template

zombie_entry:
    ; This process is a captured Zombie and owns its own private stack.
    xor di, di
    mov ax, 0A5F3h
    mov dx, 01F06h
    mov bl, 0CCh
    std
    int 087h
    cld
    call .get_ip
.get_ip:
    pop si
    sub si, .get_ip - start
    mov bx, si
    add bx, ZOMBIE_HOP
    add si, body - start

init_template:
    ; DS is the arena on original and captured entry. Keep a durable copy of
    ; the 16-byte moving body in this process's private stack at offset zero.
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
    ; At entry: DS:0000 is the private template; ES=CS=arena; SS remains
    ; private. BX is the next target. Each cycle copies and enters a new body.
    mov di, bx
    xor si, si
    mov cx, BODY_WORDS
    rep movsw
    push bx
    add bx, HOP_STRIDE
    ret
body_end:
    times BODY_WORDS * 2 - (body_end - body) db 090h
