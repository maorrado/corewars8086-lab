bits 16
; agent2 lattice sweep: zchain3 A with FAR_SEG 0FFAh (combo_zrl03 A lineage) (research candidate, see agent2/src/ref/README.md)
; + zombie chain: the captured zom20b/d spends its INT 87h on zom20a's unique live
;   loop bytes 41 93 E2 F2 -> FF 26 <CELL2>; captured zom20a sets ES to the arena,
;   performs the original F3 A5 06 1F counter search and joins the replicator.
; Original zrl03 header:
; combo_zrl03 / A
; = b01d A + early decoy-immune zombie capture (A and B search in the same round)
;   + anchors at in-page offset 32h instead of 62h (FAR_SEG 0FF9h)

%define FAR_SEG  0FFAh
%define PTR_CELL 00200h
%define ZCELL    0CC13h
%define CELL2    0CC15h

start:
    mov si, ax
    add ax, zombie_entry - start
    mov [ZCELL], ax
    mov word [0FFECh], 0F9EBh
    les dx, [si + srch_data - start]
    mov ax, 0EB0Fh
    std
    int 087h
    cld
    mov word [0FF90h], 018FFh
    nop
    nop
    nop
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 010h
    mov al, 0A2h
    add si, worker - start
    jmp short phoenix_init

srch_data:
    dw 0CCF9h, 01000h

zombie_entry:
    call .get_ip

.get_ip:
    pop si
    sub si, .get_ip - start
    lea ax, [si + zombie2_entry - start]
    mov [CELL2], ax
    push cs
    pop es
    xor di, di
    mov ax, 09341h
    mov dx, 0F2E2h
    mov bx, 026FFh
    mov cx, CELL2
    int 087h
    mov dl, 054h
    jmp short captured_band

zombie2_entry:
    push cs
    pop es
    xor di, di
    mov ax, 0A5F3h
    mov dx, 01F06h
    mov bl, 0CCh
    std
    int 087h
    cld
    call .get_ip2

.get_ip2:
    pop si
    sub si, .get_ip2 - start
    mov dl, 02Ah

captured_band:
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, dl
    mov al, 0A2h
    add si, worker - start

captured_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    push ss
    pop ds
    mov bx, 00280h
    push cs
    pop ss
    jmp short phoenix_pointer_ready

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
    nop
    nop

phoenix_pointer_ready:
    mov [bx], ax
    mov word [bx + 2], FAR_SEG
    xor si, si
    mov di, ax
    mov ax, FAR_SEG
    mov es, ax
    lea sp, [di + 0200h - 16*(0FFCh - FAR_SEG)]
    mov cx, 8
    mov dx, 03800h
    mov bp, 03C00h
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
