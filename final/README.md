# Chimera m050 — promoted 2025 candidate pair

`ChimeraA.asm` and `ChimeraB.asm` are the exact promoted sources. They assemble
to 189 and 117 bytes, below the 2025 final's 256-byte limit. The compiled
binaries are byte-identical to the measured `m050` candidate.

| File | Size | Binary SHA-256 |
|---|---:|---|
| `ChimeraA` | 189 | `0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44` |
| `ChimeraB` | 117 | `06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782` |

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
different step and stack gap to reduce overlap with A. `m049` retained all
`m048` phases, constants, and worker loops, but moved each Phoenix-init
`MOV BX` before `PUSH CS; POP SS`. This removes the exact `0E 17 BB 00`
signature targeted by `New_Best` without changing code size, instruction count,
or the register state entering the rest of the initializer.

`m050` removes one redundant startup `XOR DI,DI` from each survivor. B receives
`DI=0` from the engine and does not change it before `INT 87h`; A now computes
the captured-Zombie entry address through `BX`, leaving the same initial zero in
`DI`. Two skipped `CC` bytes preserve each binary's exact size and the later
code placement. Across two independent all-2025 holdouts totaling 15,000
battles per pair, `m050` scored 0.669344 versus 0.663922 for `m049`: a
`+0.005422` gain (about 0.82% relative), with a paired-run 95% interval of
`[+0.000109,+0.010735]`. It also improved on fresh tune and synthetic-future
gates and tied the 500-battle targeted counter gate at team level.

This promotion is based on the measured broad-field gates above, not a claim
that m050 dominates every opponent. In a separate 1,600-battle `New_Best`
comparison, m050 scored 0.417000 per battle while m049 scored 0.471458
(`experiments/m050-search/m050-v-new-best-fresh.json` and
`experiments/m050-search/m049-v-new-best-fresh.json`). Keep this known
matchup regression in any later champion decision.

The measured scores, statistical comparisons, search history, limitations, and
reproduction commands are in `../optimization-2025-report.md`; every official
run is indexed by `../experiment-log.md`.
