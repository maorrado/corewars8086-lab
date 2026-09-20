bits 16

start:
    ; Faster non-relocating version: the worker remains at the original load
    ; site, but starts painting immediately and uses a full-period odd stride.
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
    add sp, 4B1Dh
    jmp bx

worker:
    sub sp, 02FBh
    call far [0]

