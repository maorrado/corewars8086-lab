bits 16

; Chimera zchain3 A (2026-10-03, agent2) - promoted over m050 on holdout evidence.
; Lineage: m050 (Codex) -> e1p3/e1p4/b01d (Claude; LEA fusions, A decoy word,
; timing NOPs) -> combo_zrl03 (planted EB F9 decoys, "0F EB F9 CC" two-step
; capture of the higher zom20b/d, captured-entry via ZCELL) -> agent2:
;   * zombie chain: the captured zom20b/d spends its INT 87h on zom20a's unique
;     live-loop bytes 41 93 E2 F2 -> FF 26 <CELL2> (jmp [CELL2]); captured zom20a
;     sets ES to the arena, performs the F3 A5 06 1F counter search and joins
;     the replicator at its own band phase;
;   * FAR_SEG kept at 0FFCh (combo_zrl03 used 0FF9h).
; Evidence: agent2/REPORT.md, agent2/results/decision-summary.json.

%define FAR_SEG  0FFCh
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
