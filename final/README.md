# Chimera m049 — promoted 2025 candidate pair

`ChimeraA.asm` and `ChimeraB.asm` are the exact promoted sources. They assemble
to 189 and 117 bytes, below the 2025 final's 256-byte limit. The compiled
binaries are byte-identical to the measured `m049` candidate.

| File | Size | Binary SHA-256 |
|---|---:|---|
| `ChimeraA` | 189 | `106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973` |
| `ChimeraB` | 117 | `7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77` |

Rebuild from the lab root with:

```powershell
node assemble.mjs build/final final/ChimeraA.asm final/ChimeraB.asm
```

Both survivors copy a protected worker into private stack memory, quantize
their initial locations into spatially separated arena bands, and repeatedly
use indirect far calls plus `MOVSW`/`REP MOVSW` to seed new workers. A searches
for and redirects the known 2025 Zombie-B/D tail into a third replication
phase. The captured Zombie first spends its remaining `INT 87h` charge to
search backward for `F3 A5 06 1F` and overwrite the first byte with `CC`, then
joins the replication engine through its own pointer cell (`0x0280`) at phase
`0x54`. This separates it from A's pointer cell and spatial phase. B uses a
different step and stack gap to reduce overlap with A. `m049` retains all
`m048` phases, constants, and worker loops, but moves each Phoenix-init
`MOV BX` before `PUSH CS; POP SS`. This removes the exact `0E 17 BB 00`
signature targeted by `New_Best` without changing code size, instruction count,
or the register state entering the rest of the initializer. The candidate was
score-identical to `m048` in every paired run of the 1,000-battle tune gate,
960-battle future pool, and a fresh 6,000-battle all-2025 holdout. Against the
demonstrated counter it improved over `m048` in all 32 fresh paired run units
and won the 1,600-battle aggregate matchup.

The measured scores, statistical comparisons, search history, limitations, and
reproduction commands are in `../optimization-2025-report.md`; every official
run is indexed by `../experiment-log.md`.
