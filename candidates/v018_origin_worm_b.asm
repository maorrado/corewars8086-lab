bits 16

start:
    mov bp, ax
    push es
    pop ds
    mov bx, bp
    add bx, worker - start
    mov [0], bx
    mov [2], cs
    push cs
    pop ss
    mov sp, bp
    add sp, 0C4E3h
    jmp bx

worker:
    db 09Bh, 09Bh
    sub sp, 04F7h
    call far [0]

