# Phoenix — final 2025 candidate pair

`PhoenixA.asm` and `PhoenixB.asm` are the exact sources promoted after the
controlled train/holdout search. Both assemble to 81 bytes, below the 2025
final's 256-byte limit, and no qualification-stage signature is inserted.

| File | Binary SHA-256 |
|---|---|
| `PhoenixA` | `0338ea3387c314547a355885af3c722989bfd60ca4f64abf11e4d2473f927dd2` |
| `PhoenixB` | `d029ee02c516bbeca597a99acd0afa5f5ad566f76b38d25a89781bca86883f6a` |

Rebuild from the lab root with:

```powershell
node assemble.mjs build/final final/PhoenixA.asm final/PhoenixB.asm
```

The opening code copies the 17-byte worker into the private stack and switches
`DS` there. It then builds a far pointer in that private segment and redirects
`SS:SP` into the arena. Repeated `CALL FAR [BX]` writes return-address material
until the selected low byte becomes executable `MOVSB`; this seeds `MOVSW` and
`REP MOVSW`, copies the protected worker into the arena, moves the stack and
target, and repeats. A and B use different high-byte target bands (`4Dh` and
`8Dh`) and different private pointer cells (`0200h` and `0240h`).

The final measured scores and limitations are in `../final-report.md`; every
individual run, command and hash is indexed by `../experiment-log.md`.
