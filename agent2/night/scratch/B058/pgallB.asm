bits 16
; B058 counter probe: generic V6-architecture anchor bomber. A V6-style anchor must sit at
; in-page offset 02h+10h*k (return-IP low byte A4h needs IP=..A2h; FAR_SEG*16 shifts in 10h steps),
; so this writes CCCCh at EVERY address = 2 (mod 10h): 8 writes per 10-instruction loop,
; full 64 KiB pass = 5120 rounds per warrior; partner starts 8000h later.
start:
    mov ax, 0CCCCh
    mov si, 08002h
bomb:
    mov [si], ax
    mov [si + 10h], ax
    mov [si + 20h], ax
    mov [si + 30h], ax
    mov [si + 40h], ax
    mov [si + 50h], ax
    mov [si + 60h], ax
    mov [si + 70h], ax
    add si, 0080h
    jmp short bomb
