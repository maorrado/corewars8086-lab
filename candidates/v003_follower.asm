bits 16

start:
    push ds
    push es
    pop ds
    mov bx, [0]
    pop ds
    mov dx, 1
    add bx, team_entry_offset
    jmp bx

team_entry_offset equ 3

