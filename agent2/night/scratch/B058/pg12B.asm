bits 16
; B058 counter probe (domain 8, dense/sparse CC bomber tuned to a page lattice).
; Writes the word CCCCh at in-page offset 12h of every 100h page of the arena,
; 8 pages per 10-instruction loop (full 64 KiB pass = 320 rounds per warrior).
; Partner starts 8000h later so each lattice address is hit about every 160 rounds.
start:
    mov ax, 0CCCCh
    mov si, 08012h
bomb:
    mov [si], ax
    mov [si + 0100h], ax
    mov [si + 0200h], ax
    mov [si + 0300h], ax
    mov [si + 0400h], ax
    mov [si + 0500h], ax
    mov [si + 0600h], ax
    mov [si + 0700h], ax
    add si, 0800h
    jmp short bomb
