bits 16

%macro ab50_body 0
    push ds
    pop ss
    mov sp, ax
    add sp, 5555h
    push ds
    pop es
    mov di, ax
    add di, active_generated - program_start
    mov ax, 0AB50h
    push ax
    stosw
%endmacro

program_start:
    jmp active
front_decoy:
    ab50_body
active:
    ab50_body
active_generated:
back_decoy:
    ab50_body
