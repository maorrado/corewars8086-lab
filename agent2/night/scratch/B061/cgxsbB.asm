bits 16
; B061 measurement code (local simulator only): IND_cgx123123 warrior 2 (2025 survivors-online, disassembled),
; MOVSB-family version: only the anchor low byte changes (0A0A3h -> 0A0A2h); template comes from warrior 1.
start:
    mov bx, 0200h
    mov cl, 07h
    mov ax, 0A0A2h         ; was 0A0A3h
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
    nop
    mov ax, 1FFFh
    stosw
    dec di
    jmp [bx]
