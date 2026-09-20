bits 16

start:
    ; Survivor 1 executes first inside the group and stores its AX at ES:0.
    ; Read that address, mark this CPU as the alternate path, and join the
    ; leader at its shared common entry point.
    push ds
    push es
    pop ds
    mov bx, [0]
    pop ds
    mov dx, 1
    add bx, common_offset
    jmp bx

common_offset equ 3

