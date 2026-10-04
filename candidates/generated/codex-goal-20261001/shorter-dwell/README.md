# Shorter recurring anchor dwell: bounded m050 source design

Status: source generator only, awaiting root review. No assembly, seeds, battle configurations, or battles are created here. Frozen word-trigger/diagnostic artifacts and `final/` remain untouched.

## Question and fixed controls

Does reducing the time spent recursively calling the exposed Phoenix anchor help the exact current m050 despite reducing its paint trail per band? This is a recurring survival/offense tradeoff, not a faster bootstrap claim.

The generator reads exact `final/ChimeraA.asm` and `final/ChimeraB.asm`, preserves their bytes except for one DX-immediate character, and hash-checks those sources and the frozen binaries. It does not copy or modify baseline files. Baseline binary SHA-256:

- A, 189 bytes: `0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44`
- B, 117 bytes: `06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782`

| Arm | A DX / BP | B DX / BP | Recurring trail A / B |
| --- | --- | --- | --- |
| m050 control | 3800 / 3C00 | 4000 / 4400 | 1024 / 1024 bytes |
| both-trail512 | 3A00 / 3C00 | 4200 / 4400 | 512 / 512 bytes |
| b-trail512 | 3800 / 3C00 | 4200 / 4400 | 1024 / 512 bytes |
| both-trail256 | 3B00 / 3C00 | 4300 / 4400 | 256 / 256 bytes |
| b-trail256 | 3800 / 3C00 | 4300 / 4400 | 1024 / 256 bytes |

Register values in the table are hexadecimal. Keep phases A=10h/B=34h/captured=54h, anchor low byte A2h, CS/ES=0FFCh, initial SP gaps A=0200h/B=0280h, all private/initial/steady copy counts, BP, capture behavior, and all remaining source bytes unchanged. Changing A's shared initializer also changes the captured zombie's DX; B-only arms leave that path unchanged. The original m050 comments intentionally remain unchanged in generated source because this is a literal one-character edit; manifest IDs identify variants.

## Mechanical derivation and limits

With the undisturbed anchor at far offset P, its arena offset is P-40h because CS=0FFCh and SS=1000h. The recursive CALL that overwrites its own anchor leaves SP=P-40h. The copied worker subtracts DX from SP and BP from its private anchor pointer, so the next anchor is P'=P-BP, while SP before the worker's tail CALL is P-40h-DX. Their distance is BP-DX. A far CALL pushes four bytes: a 0400h trail takes 256 calls, 0200h takes 128, and 0100h takes 64, counting the worker's first tail CALL and the following recursive calls. The first anchor's initial SP gap is unchanged; the changed dwell begins at subsequent anchors.

BP and intended anchor-offset sequence are unchanged, but timing and arena coverage are not. Each visited band gets less stack paint; visits occur more often, and interactions with partners, captured zombies, enemies, wraparound, and already modified code can change. The anchors are still exposed and corruptible. No inert-memory immunity or same-coverage claim is made. The arithmetic describes the intact loop, not a guarantee after hostile writes.

The motivating original-engine diagnostic replay recorded 30 corrupted-`FF A5 disp16` anchor memory faults among 38 watched deaths in one fixed 50-war fixture. That supports investigating exposure time, not a general prevalence estimate or a known writer identity. Evidence: `../word-trigger/diagnostic/replay-reviewed/execution.json`, SHA-256 `9739aacfdfcdebf5ed0c8271e5de9a1d8cb02f120fd9be3d843ec846a228a38c`; see the diagnostic findings for decoding. Do not overwrite those artifacts.

## Prior work and duplicate check

This mechanism is **not wholly untried**. Prior negative evidence lowers expectations:

- `generate-chimera-sweep.mjs`: `y015` used margin 0200h on both older symmetric BP=3C00h warriors. `experiments/y015-2025-tune-s1.json` reports 0.456944446 team points/battle versus the corresponding 0400h-margin `y001` 0.573611115, 240 battles each. Old phases 1Ch/00h/2Ch, initial gap 0300h, startup and capture differ from m050.
- `generate-chimera-asymmetric.mjs`: `l023` used B BP=4400h/DX=4200h. `experiments/l023-asymmetric-screen.json` reports 0.470833335 versus corresponding 0400h-margin `l004` 0.567500000, 200 battles each. Old B phase 2Ch and gap 0200h, captured phase 34h, and startup/capture differ from current m050.
- These historical comparisons used different candidate name labels (`COD_y015` versus `COD_y001`, `COD_l023` versus `COD_l004`) and older experiment/engine records. Treat them as negative historical screens, not a new same-name causal estimate or directly comparable modern baseline.
- `generate-chimera-focused.mjs` used B margins 0300h/0500h/0600h (`m038`/`m039`/`m040`), not 0100h/0200h. `generate-chimera-extensions.mjs` retained 0400h. `generate-chimera-b-step-extensions.mjs` changed recurring step operators/copy counts, not this fixed-step experiment. Matching DX literals in other variants often came from a changed BP and do not identify the same dwell.
- No 0100h margin or DX=3B00h/4300h source was found in the inspected relevant generated sources. No exact proposed component hash matched the 2,033 existing 117/189-byte files checked under `build/chimera*`, `build/m050*`, and `build/codex-goal*`, or the JSON records searched under `experiments/` and `candidates/generated/`. `build/official-runs` was excluded. This is a scoped duplicate check, not proof about unrecorded experiments.

Accordingly, these are four new exact-current-m050 pairs, but the 512-byte arms are explicitly a transfer/interaction retest of an old negative mechanism. Do not rerun the old `y015`/`l023` binaries. Stop if later provenance identifies an exact proposed pair already tested under the intended protocol.

## Review and invocation

From any working directory:

```powershell
node C:\Maor\CodeGuru\corewars8086-lab\candidates\generated\codex-goal-20261001\shorter-dwell\generate.mjs --check
# Only after root review; creates four source files and one manifest, refusing overwrite:
node C:\Maor\CodeGuru\corewars8086-lab\candidates\generated\codex-goal-20261001\shorter-dwell\generate.mjs --write
```

`--check` is read-only and is the default. `--write` emits four new component sources in `sources/` and `manifest.json`; unchanged A for B-only arms references the hash-guarded baseline. Predicted binary hashes are computed in memory by changing only offset A=0xA1 or B=0x59 of the baseline; they are not assembled binaries or test results. Later assembly must match every predicted byte/hash and unchanged length before any engine use.

Root will separately define and freeze the bounded matched protocol, naming, seeds, cohorts, completion checks, and promotion rule. A same-name paired screen should retain an exact m050 control for every seed/cohort. Historical screen weakness warrants a small screen before any broad validation. A smoke/mechanical pass establishes no score improvement; any screen-selected gain needs fresh matched validation. No adoption or broad superiority claim is authorized by this design.
