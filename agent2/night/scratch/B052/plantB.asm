bits 16
; B052 dynamic zom20a-mimic counter (test case). INT 86h writes 64 copies of E2 F2 81 C3
; (the end of zom20a's live loop, the pattern rev0 A searches with INT 87h forward from 1000:0000)
; at arena 0000h-00FFh, so A's single INT 87h charge always hits a decoy first; then idles.
start:
    push cs
    pop es
    xor di, di
    mov ax, 0F2E2h
    mov dx, 0C381h
    int 86h
idle:
    jmp short idle
