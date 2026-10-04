; B074 counter-code (domain 4 R3): zchain4 (agent2 lineage of combo_zrl03 / b01d) + two INT 86h decoy blocks.
; A: 64 copies of E2 F2 81 C3 (zom20a live-loop end = rev0 A's single forward INT 87h pattern) at arena 0000h-00FFh.
; B: 64 copies of EB F9 CC CC (zom20b/d tail = rev0 B's backward INT 87h pattern) at arena FF00h-FFFFh (also below
;    FFE0h, so a fixed DI=FFE0h start does not skip it). Own searches use 0F EB F9 CC / 41 93 E2 F2 and are immune.
; CONTROL: identical code and timing, decoy patterns broken (E3 F2 81 C3 / EA F9 CC CC).
bits 16
; agent2 zchain3 B = combo_zrl03 B with FAR_SEG 0FFCh
; combo_zrl03 / B
; = b01d B + captures the live zombie loop right after A
;   + anchors at in-page offset 32h instead of 62h (FAR_SEG 0FF9h)

%define FAR_SEG  0FFBh
%define PTR_CELL 00240h

start:
    mov si, ax
    push cs
    pop es
    mov di, 0FF00h
    mov ax, 0F9EAh
    mov dx, 0CCCCh
    int 086h
    mov word [0FFE8h], 0F9EBh
    les dx, [si + srch_data - start]
    mov ax, 0EB0Fh
    mov bx, 0FF0Fh
    mov cx, 01326h
    xor di, di
    std
    int 087h
    cld
    nop
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 070h
    mov al, 0A2h
    add si, worker - start
    jmp short phoenix_init

srch_data:
    dw 0CCF9h, 01000h

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    push ss
    pop ds
    mov bx, PTR_CELL
    push cs
    pop ss
    mov [bx], ax
    mov word [bx + 2], FAR_SEG
    xor si, si
    mov di, ax
    mov ax, FAR_SEG
    mov es, ax
    lea sp, [di + 0280h - 16*(0FFCh - FAR_SEG)]
    mov cx, 9
    mov dx, 04000h
    mov bp, 04400h
    mov ax, 018FFh
    stosw
    dec di
    call far [bx + si]

worker:
    movsw
    rep movsw
    sub sp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 9
    xor si, si
    stosw
    dec di
    call far [bx + si]
