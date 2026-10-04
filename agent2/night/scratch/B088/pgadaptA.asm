bits 16
; B088 counter-code (local simulator only): adaptive page-lattice CC bomber.
; Derived from B058 pg52 (CCCCh at one in-page offset of every page, 8 pages per loop).
; Instead of a fixed 52h it waits ~10 rounds, reads the public hook cell [4A17h]
; (rev0-family B writes its zombie_entry there at instr 3) and bombs in-page
; 22h + 10h*([4A17h] and 3), i.e. exactly the lattice chosen by B088 mix4
; (FAR_SEG = 0FF8h | ([4A17h] and 3)). Against rev0 (fixed 52h) it hits 1/4 of battles.
start:
    mov cx, 8
wait1:
    loop wait1
    mov si, [4A17h]
    and si, 3
    mov cl, 4
    shl si, cl
    add si, 22h + 0
    mov ax, 0CCCCh
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
