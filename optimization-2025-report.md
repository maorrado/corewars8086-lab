# Chimera optimization against the official 2025 field

## Outcome

`w003` is the current champion and is promoted byte-for-byte as `final/ChimeraA.asm` and `final/ChimeraB.asm`.

| Protocol | Pair | Battles | Team | Survivor A | Survivor B |
|---|---|---:|---:|---:|---:|
| Untouched 2025 holdout (15 teams, 5 cohorts, 3 seeds) | Chimera `w003` | 750 | 0.583333 | 0.278000 | 0.305333 |
| Same holdout | `Registered_Winners` | 750 | 0.508889 | 0.239778 | 0.269111 |
| All 75 official 2025 teams (25 cohorts, 2 seeds) | Chimera `w003` | 2,500 | 0.608200 | 0.292733 | 0.315467 |
| Same all-2025 protocol | `Registered_Winners` | 2,500 | 0.538800 | 0.252400 | 0.286400 |
| Same all-2025 protocol | old Phoenix pair | 2,500 | 0.472800 | 0.236533 | 0.236267 |
| Same all-2025 protocol | `TOM_ATO` | 2,500 | 0.298800 | 0.214800 | 0.084000 |

On the paired 50-run all-2025 comparison, Chimera exceeded `Registered_Winners` in 32 runs, tied 2, and lost 16. The mean paired difference was +0.069400 team points per battle; a run-level 95% t interval is [+0.015157, +0.123643]. The smaller 15-run holdout difference was +0.074444, with 11 wins and 4 losses; its run-level interval crosses zero because the holdout has only 15 aggregate observations.

These measurements show a repeatable advantage under the tested 2025 engine, Zombies, cohorts, and seeds. They do not prove that no future 2026 survivor can beat Chimera.

## Strategy

Both survivors quantize their initial load address into 0x3C00-spaced replication bands and run the protected private-stack Phoenix loop through segment `0x0FFC`. Survivor A uses phase `0x10`; Survivor B uses phase `0x2C`. Their pointer cells are separate (`0x0200` and `0x0240`), and both use a 0x0200 stack gap with 0x3800 stack motion.

Both search backward with `INT 87h` for the `EB F9 CC CC` tail used by the live 2025 Zombie B/D loops. They replace it with an indirect jump through cell `0x5D13`. Survivor A owns that hook and routes a captured Zombie into a position-independent entry that rejoins the Phoenix replication engine at a third phase, `0x34`. Thus the stolen process becomes another spatially separated replicator instead of a one-shot bomb.

## Search history

- `x001-x012`: broad Chimera families: band width, initial phases, shared/split hooks, forward/backward theft, and replication gap.
- `y001-y016`: local search around the best broad result.
- `z001-z012`: isolated phase, band, gap, and margin changes around `y007`.
- `w001-w006`: combinations of the independently promising changes. `w003` won with balanced survivor scores.
- `v001-v010`: fine sweep around `w003` using fresh seeds. The unchanged control `v001` remained first; gaps 0x100/0x180/0x280 and adjacent A/B/Zombie phases did not improve it.

The reproducible experiment JSONs contain every command, engine and input hash, cohort, opponent, Zombie, seed, raw score, team score, and per-survivor score. `experiment-log.md` is the generated index.

## Arena inspection

The saved round-4,000 inspection versus `Registered_Winners`, `GoonSquad`, and `TrojanByte` shows the expected repeated 0x3C00 band structure and a live Phoenix worker executing from protected segment `0x0FFC`. In this particular seed, Chimera A died at round 1,178 while Chimera B and replicated/stolen code continued; this is consistent with the aggregate data, where either survivor can carry an individual battle but both contribute materially across seeds. The screenshot and register dump are `experiments/w003-arena-round4000.png` and `.json`.

## Reproduction

1. Start the local simulator server at `http://127.0.0.1:8123/page.html`.
2. Assemble the promoted sources with `node assemble.mjs build/final final/ChimeraA.asm final/ChimeraB.asm`.
3. Regenerate the 2025 split with `node generate-2025-evaluation-configs.mjs`.
4. Run the all-field validation with `node official-sweep.mjs config-2025-all-template.json build/chimera w003`.
5. Regenerate the ledger with `node generate-experiment-log.mjs`.

The promoted binaries are 157 bytes and 117 bytes. Their SHA-256 hashes are:

- Chimera A: `3e3897d9337c405380e8ff225fb75adc5ca578136f376835af22c34f17c295c7`
- Chimera B: `f1db39972aca89b1e4224dab492102501dfcbf9f0709e0c8661621ede62a1e57`
