bits 16

; agent2 zchain A: b01d A (Claude e1p3/e1p4 lineage, see agent2/src/ref/README.md)
; + zombie chain: the captured zom20b/d spends its INT 87h to capture zom20a through
;   zom20a's unique live-loop bytes 41 93 E2 F2 (inc cx; xchg ax,bx; loop -14),
;   replacing them with FF 26 <CELL2> (jmp [CELL2]). zom20a then performs the
;   original F3 A5 06 1F counter search and joins the replication engine.

%define FAR_SEG  0FFCh
%define PTR_CELL 00200h
%define CELL2    05D15h

start:
    mov si, ax
    add ax, zombie_entry - start
    mov [05D13h], ax
    push cs
    pop es
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 05D13h
    std
    int 087h
    cld
    mov word [0FF90h], 018FFh
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

    times 2 db 0CCh

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
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 054h
    mov al, 0A2h
    add si, worker - start
    jmp short captured_init

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
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 02Ah
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
    lea sp, [di + 00200h]
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
