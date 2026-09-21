# Chimera m045 — promoted 2025 candidate pair

`ChimeraA.asm` and `ChimeraB.asm` are the exact promoted sources. They assemble
to 157 and 117 bytes, below the 2025 final's 256-byte limit. The compiled
binaries are byte-identical to the measured `m045` candidate.

| File | Size | Binary SHA-256 |
|---|---:|---|
| `ChimeraA` | 157 | `1394d70274e2a5bf7ec239df7a82127c469712bc34fac9194731c128a8aad606` |
| `ChimeraB` | 117 | `7a6248d21c64a9896c190e79a83b47bac21166f6eaba604dc5dd06c46cac4138` |

Rebuild from the lab root with:

```powershell
node assemble.mjs build/final final/ChimeraA.asm final/ChimeraB.asm
```

Both survivors copy a protected worker into private stack memory, quantize
their initial locations into spatially separated arena bands, and repeatedly
use indirect far calls plus `MOVSW`/`REP MOVSW` to seed new workers. A searches
for and redirects the known 2025 Zombie-B/D tail into a third replication
phase. B uses a different step and stack gap to reduce overlap with A.

The measured scores, statistical comparisons, search history, limitations, and
reproduction commands are in `../optimization-2025-report.md`; every official
run is indexed by `../experiment-log.md`.
