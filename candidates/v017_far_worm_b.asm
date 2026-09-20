bits 16

start:
    mov bp, ax
    push es
    pop dx
    push cs
    pop es
    mov si, bp
    add si, worker - start
    mov bx, bp
    add bx, 0B6E9h
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
    add sp, 0D5F7h
    jmp bx

worker:
    db 09Bh, 09Bh
    sub sp, 035Bh
    call far [0]
worker_end:
    nop

