bits 16
; B061 measurement code (local simulator only): IND_cgx123123 warrior 1 (2025 survivors-online, disassembled)
; converted from the MOVSW family (anchor xxA3, A5 trigger) to the MOVSB family (anchor xxA2, A4 trigger),
; template prefixed with movsw (rev0-style A4 -> A5 -> rep movsw chain). Everything else byte-identical.
start:
    mov cl, 09h            ; was 08h: template is one byte longer
    mov bx, 0100h
    mov si, ax
    add si, strict byte tmpl - start
    rep movsw
    mov cl, 07h
    mov ax, 0B0A2h         ; was 0B0A3h
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
    movsw                  ; new: A4 trigger copies this byte, then it copies the rep movsw
    rep movsw
    sub sp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 07h
    xor si, si
    stosw
    dec di
    jmp [bx]
