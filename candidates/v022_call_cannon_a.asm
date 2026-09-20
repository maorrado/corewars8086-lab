bits 16

start:
    ; Plant a two-byte recursive far-call loop.  Each scheduled opcode pushes
    ; CS and the return IP into the arena, so the live head emits four bytes
    ; per round while the far pointer itself remains in team-private memory.
    mov bp, ax
    push es
    pop dx
    push ds
    pop es
    mov di, bp
    add di, 2D13h
    mov ax, 01FFFh
    stosw
    sub di, 2
    push dx
    pop ds
    mov bx, 0200h
    mov [bx], di
    mov [bx + 2], cs
    push cs
    pop ss
    mov sp, bp
    add sp, 6A09h
    call far [bx]

