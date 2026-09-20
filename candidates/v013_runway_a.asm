bits 16

start:
    ; Pre-build a 512-byte executable AB50 runway.  Once execution reaches it,
    ; STOSW keeps extending the front while PUSH AX paints a distant rear.
    push ds
    pop ss
    mov sp, ax
    add sp, 3333h
    push ds
    pop es
    mov di, ax
    add di, runway - start
    mov ax, 0AB50h
    mov dx, ax
    int 86h
    int 86h
runway:

