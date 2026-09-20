from pathlib import Path


OUT = Path("candidates/generated")
OUT.mkdir(parents=True, exist_ok=True)


def save(name: str, text: str) -> None:
    (OUT / f"{name}.asm").write_text(text.strip() + "\n", encoding="utf-8")


def prelude(bomb_a: int, bomb_b: int) -> str:
    return f"""
bits 16
start:
    mov bp, ax
    push ds
    pop es
    mov di, bp
    add di, {bomb_a:04X}h
    mov ax, 0CCCCh
    mov dx, 0CCCCh
    int 86h
    add di, {bomb_b:04X}h
    int 86h
"""


for index, stride in enumerate((0x0F31, 0x1F3D, 0x31F7, 0x4FAD), start=1):
    save(
        f"hopper_{index:02d}_{stride:04x}",
        prelude(0x2903 + index * 0x101, 0x8000)
        + f"""
clone:
    db 09Bh, 09Bh
    call get_ip
get_ip:
    pop si
    sub si, get_ip - clone
    mov di, si
    add di, {stride:04X}h
    mov bx, di
    mov cx, (clone_end - clone + 1) / 2
    rep movsw
    jmp bx
clone_end:
""",
    )


for index, (chunk_words, stride) in enumerate(
    ((0x20, 0x0713), (0x40, 0x11F1), (0x80, 0x23F3), (0x100, 0x41ED)),
    start=1,
):
    save(
        f"repbomber_{index:02d}_{chunk_words:03x}_{stride:04x}",
        prelude(0x1801 + index * 0x211, 0x8000)
        + f"""
    mov di, bp
    add di, {stride:04X}h
    mov ax, 0CCCCh
bomb_loop:
    mov cx, {chunk_words:04X}h
    rep stosw
    add di, {stride:04X}h
    db 09Bh, 09Bh
    jmp bomb_loop
""",
    )


for index, (hop, attack, chunk_words) in enumerate(
    ((0x0D71, 0x0800, 0x10), (0x1D4D, 0x1000, 0x20), (0x2F3B, 0x1800, 0x40), (0x43E7, 0x2400, 0x60)),
    start=1,
):
    save(
        f"hybrid_{index:02d}_{hop:04x}_{chunk_words:02x}",
        prelude(0x3101 + index * 0x137, 0x8000)
        + f"""
clone:
    call get_ip
get_ip:
    pop si
    sub si, get_ip - clone
    mov di, si
    add di, {hop:04X}h
    mov bx, di
    mov cx, (clone_end - clone + 1) / 2
    rep movsw
    mov di, bx
    add di, {attack:04X}h
    mov ax, 0CCCCh
    mov cx, {chunk_words:04X}h
    rep stosw
    db 09Bh, 09Bh
    jmp bx
clone_end:
""",
    )

print(f"generated {len(list(OUT.glob('*.asm')))} candidates in {OUT}")
