bits 16
; Synthetic repeated poisoning of public Zombie pointer cells, not private memory.
start:
    mov word [4A17h], 0
    mov word [0CC13h], 0
    jmp short start

