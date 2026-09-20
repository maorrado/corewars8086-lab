bits 16

start:
    ; Relocate a tiny recursive far-call worker.  Its pointer lives in the
    ; team-private ES block (used through DS), while SS is deliberately moved
    ; into the arena.  Every recursion scatters a return IP and CS pair.
    mov bp, ax
    push es
    pop dx
    push cs
    pop es
    mov si, bp
    add si, worker - start
    mov bx, bp
    add bx, 2D13h
    mov di, bx
    mov cx, (worker_end - worker + 1) / 2
    rep movsw
    push dx
    pop ds
    mov [0], bx
    mov [2], cs
    push cs
    pop ss
    mov sp, bp
    add sp, 6A09h
    jmp bx

worker:
    sub sp, 01FBh
    call far [0]
worker_end:
    nop

