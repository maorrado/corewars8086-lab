# Chimera optimization against the official 2025 field

## Outcome

`m045` is the promoted pair in `final/ChimeraA.asm` and
`final/ChimeraB.asm`. It is a balanced hybrid of the two statistically tied
asymmetric finalists: survivor A uses the eight-word first copy from `l056`,
while survivor B keeps the `l022` phase and motion.

| Protocol | Pair | Battles | Team | Survivor A | Survivor B |
|---|---|---:|---:|---:|---:|
| Fresh final holdout, 5 cohorts x 10 new seeds | **Chimera `m045`** | 5,000 | **0.578600** | **0.289200** | **0.289400** |
| Same final holdout | `l022` | 5,000 | 0.578333 | 0.287500 | 0.290833 |
| Same final holdout | `l056` | 5,000 | 0.578867 | 0.276033 | 0.302833 |
| Same final holdout | old champion `w003` | 5,000 | 0.555067 | 0.283333 | 0.271733 |
| All 75 official 2025 teams, 25 cohorts x 2 seeds | **Chimera `m045`** | 2,500 | **0.637267** | **0.308733** | **0.328533** |
| Same all-2025 protocol | `l022` | 2,500 | 0.635400 | 0.306567 | 0.328833 |
| Same all-2025 protocol | `l056` | 2,500 | 0.625467 | 0.301767 | 0.323700 |
| Same all-2025 protocol | old champion `w003` | 2,500 | 0.608000 | 0.298600 | 0.309400 |
| Fresh tuning validation, 20 cohorts x 2 seeds | **Chimera `m045`** | 1,600 | **0.621771** | **0.298281** | **0.323490** |
| Same tuning protocol | `l022` | 1,600 | 0.621979 | 0.299531 | 0.322448 |

The final 5,000-battle paired holdout comparison against `w003` gives a mean
improvement of `+0.023533` team points per battle (about 4.24% relative), with
a run-cluster 95% t interval of `[+0.000101, +0.046966]`. The all-2025
improvement is `+0.029267`; its 95% interval is
`[-0.000797, +0.059331]`. Thus the new pair has a measured repeatable
holdout advantage over the former champion, but the all-field interval remains
just wide enough to include zero.

`m045`, `l022`, and `l056` are statistically tied on the second holdout.
`m045` was selected because it preserves the same team score, is essentially
identical to `l022` on both tune and all-2025, and gives the most even final
holdout contribution from the two survivors. This evidence does not prove that
no unknown 2026 survivor can beat it.

## Strategy

Both survivors quantize their initial load address into `0x3C00`-spaced bands
and run a protected private-stack Phoenix loop through segment `0x0FFC`.
Survivor A uses phase `0x10`, target step `0x3C00`, stack motion `0x3800`, and
an eight-word first replication. Survivor B uses phase `0x2C`, a wider
`0x4400` target step, `0x4000` stack motion, and a `0x0280` initial stack gap.
Their private pointer cells are separate (`0x0200` and `0x0240`).

Both search backward with `INT 87h` for the `EB F9 CC CC` tail used by the
live 2025 Zombie B/D loops and replace it with an indirect jump through cell
`0x5D13`. Survivor A owns that hook and routes a captured Zombie into a
position-independent entry at phase `0x34`, where it joins the protected
replication engine. The stolen process therefore becomes another spatially
separated replicator rather than a one-shot writer.

## Search history

- `x001-x012`, `y001-y016`, `z001-z012`, `w001-w006`, and `v001-v010`
  produced the former `w003` champion through broad and local searches over
  bands, phases, hooks, theft direction, gaps, and stack motion.
- `k001-k037` tested new Zombie/opponent signatures, heavy writers, target low
  bytes, far segments, steps, gaps, and bands. Apparent 200-battle gains did
  not survive 1,600-battle validation.
- `l001-l057` separated A and B motion, phase, segment, copy-count, and gap
  parameters. `l022` and `l056` emerged as complementary finalists.
- `m001-m054` performed a focused sweep around those finalists. Phase `0x26`
  (`m014`) scored 0.651771 on tune but collapsed to 0.541333 on holdout, a
  concrete overfitting example. Phase `0x30` (`m021`) also failed holdout.
- The four A/B hybrids were then measured. `m045` matched the best holdout
  score, slightly led the all-2025 field, and was the most balanced pair.

Every official-engine result JSON records the command, engine/config and input
hashes, cohort, opponents, Zombies, seed, raw score, team score, and both
per-survivor scores. `experiment-log.md` is the generated index, and the
`comparison-*.json` files contain the paired differences and confidence
interval inputs.

## Arena inspection

The saved round-4,006 inspection versus `Registered_Winners`, `GoonSquad`, and
`TrojanByte` shows near-arena-wide colored replication bands and a live Chimera
A worker executing from protected segment `0x0FFC`. All four Zombies had died
by round 1,273; Chimera B died at round 3,549 while A and the replicated/stolen
code continued. The screenshot and exact register/message dump are
`experiments/m045-arena-round4000.png` and `.json`.

## Reproduction

1. Start the local simulator server at `http://127.0.0.1:8123/page.html`.
2. Assemble with
   `node assemble.mjs build/final final/ChimeraA.asm final/ChimeraB.asm`.
3. Regenerate the 2025 cohort split with
   `node generate-2025-evaluation-configs.mjs`.
4. Re-run an official template with `official-sweep.mjs` and an explicitly
   recorded `SWEEP_TAG`, `SWEEP_BATTLES`, and `SWEEP_SEEDS`.
5. Regenerate the ledger with `node generate-experiment-log.mjs`.

The promoted binaries are 157 and 117 bytes. Their SHA-256 hashes are:

- Chimera A: `1394d70274e2a5bf7ec239df7a82127c469712bc34fac9194731c128a8aad606`
- Chimera B: `7a6248d21c64a9896c190e79a83b47bac21166f6eaba604dc5dd06c46cac4138`
