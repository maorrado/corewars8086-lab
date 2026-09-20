bits 16

start:
    mov bx, ax
    push ds
    pop ss
    push ds
    pop es
    mov sp, bx
    add sp, 2347h       ; destination + two bytes
    mov di, sp
    mov ax, 0AB50h
    push ax             ; seed 50 AB at destination
    jmp sp              ; execute the relocated self-extending carpet

