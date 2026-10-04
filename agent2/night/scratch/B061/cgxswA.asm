bits 16
; B061 control: IND_cgx123123 warrior 1 re-assembled from the disassembly (must equal the original binary)
start:
    mov cl, 08h
    mov bx, 0100h
    mov si, ax
    add si, strict byte tmpl - start
    rep movsw
    mov cl, 07h
    mov ax, 0B0A3h
    push es
    pop ds
    push cs
    pop ss
    push cs
    pop es
    mov di, ax
    mov [bx], ax
    mov word [bx+02h], 1000h
    mov sp, ax
    add sp, 0400h
    nop
    xor si, si
    mov dx, 3200h
    mov bp, 3500h
    mov ax, 1FFFh
    stosw
    dec di
    jmp [bx]
tmpl:
    rep movsw
    sub sp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 07h
    xor si, si
    stosw
    dec di
    jmp [bx]
