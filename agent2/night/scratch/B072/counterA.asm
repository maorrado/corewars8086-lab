bits 16
; B072 counter-code "zdeny" A (test case only; domain 2 zombie competition).
; Body = agent2 zchain4 A (our Chimera/zrl03 lineage, agent2/night/refs/zchain4/A.asm).
; Change vs zchain4 A: A's single INT 87h no longer kills a b/d tail; instead it
; steals zom20a FIRST: forward search for zom20a's live-loop end E2 F2 81 C3 at the
; 8th instruction (rev0 A does the same search at its 10th instruction), replacing
; it with FF 26 13 CC = jmp [0CC13h] (ZCELL, already written at instruction 3).
; Every captured zombie (zom20a, or b/d via B's 0F EB F9 CC capture) enters
; zombie_entry, spends its own INT 87h on capturing the OTHER live b/d tail
; (0F EB F9 CC -> 0F FF 26 13), then joins the replicator in its own band.
; Three nops keep the startup length (13 instructions before the band math) equal to zchain4 A.
; Effect on rev0: A's INT 87h finds no zom20a (no capture, no b/d chain), B's
; startup backward EB F9 CC CC search is absorbed by the [0FFECh] decoy.

%define FAR_SEG  0FFBh
%define PTR_CELL 00200h
%define ZCELL    0CC13h

start:
    mov si, ax
    add ax, zombie_entry - start
    mov [ZCELL], ax
    les ax, [si + z20a_data - start]
    mov dx, 0C381h
    mov bx, 026FFh
    mov cx, ZCELL
    int 087h
    mov word [0FFECh], 0F9EBh
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

z20a_data:
    dw 0F2E2h, 01000h

zombie_entry:
    mov bp, 05400h
    jcxz .go
    mov bp, 02A00h
.go:
    call .get_ip

.get_ip:
    pop si
    sub si, .get_ip - start
    push cs
    pop es
    xor di, di
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh
    mov cx, 01326h
    std
    int 087h
    cld
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ax, bp
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
