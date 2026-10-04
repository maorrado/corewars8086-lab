bits 16
; Synthetic page-lattice bomber, one arena word per3 turns. No private access.
start:
    push cs
    pop es
    mov ax, 0CCCCh
    mov di, 0032h
paint:
    stosw
    add di, 000FEh
    jmp short paint

