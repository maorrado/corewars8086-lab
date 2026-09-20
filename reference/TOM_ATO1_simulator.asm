bits 16

; Byte-exact simulator-ready reconstruction of the published TOM_ATO1 binary.
; The original binary contains the same 121-byte body three times and starts
; by jumping to the second copy.

jmp short second_copy

%macro atom_body 0
    push ds
    push es
    pop ds
    mov cx, 020h
    db 0E2h, 0FEh
    mov bp, ax
    mov si, 0120h
    lodsw
    mov dx, ax
    lodsw
    xchg bp, ax
    pop ds
    push ss
    pop es
    mov si, ax
    add si, 0D8h
    mov cl, 00Fh
    rep movsw
    push es
    pop ds
    mov al, dl
    sub ah, 001h
    mov bx, 0100h
    mov [bx], ax
    mov [bx + 2], bp
    sub [bx], dx
    add word [bx], 0A6h
    push cs
    pop ss
    mov es, bp
    mov di, [bx]
    mov sp, di
    add sp, 02F49h
    add sp, dx
    mov si, 018h
    movsw
    movsw
    sub di, 003h
    xor si, si
    mov ax, 0A5A5h
    mov cl, 00Ah
    mov bp, 02F49h
    add bp, 086h
    mov dx, 02Bh
    call far [bx]
    movsw
    rep movsw
    sub word [bx], 0700h
    mov di, [bx]
    mov sp, di
    add sp, bp
    movsw
    movsw
    sub di, 003h
    xor si, si
    mov cl, 00Ah
    call far [bx + si]
    sub sp, dx
    call far [bx + si]
%endmacro

atom_body

second_copy:
atom_body
atom_body
