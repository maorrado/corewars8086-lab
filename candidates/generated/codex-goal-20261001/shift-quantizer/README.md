# B-only shift quantizer screen

## Original-engine semantic fixture before freezing

`validation/QuantizerFixture.java` was compiled against and executed with the
unchanged original deterministic JAR, without acceleration overlays. Actual
Cpu execution passed all 65,536 inputs: target AX and flags match at the end of
the arithmetic block, with eight old versus seven new opcodes. Actual Warrior
execution at 79 legal load offsets (including quantizer boundaries and the
maximum legal load) reached the first far call with identical complete CPU
state and arena/private/shared memory, excluding only the intentionally changed
initial bootstrap bytes. The candidate used exactly one fewer opcode and no
fault occurred. This is an inert mechanical test, not competitive evidence.
Source/class/JAR/binary/runtime hashes and observed output are retained in
`validation/result.json` and required by the screen generator.

## Candidate and field protocol

Research authoring only. A is the exact m050 A binary. B starts from the pinned exact m050 source and changes only:

```asm
; Following MOV AX,SI:
; old: MOV AL,AH / XOR AH,AH / MOV CH,3Ch
    mov cx, 03C08h
    shr ax, cl
; skipped CC padding: 2 -> 3 bytes
```

For every 16-bit load offset in SI, both sequences produce AX = SI >> 8 and CH = 60. The new CL=8 is temporary: `MOV CX,9` overwrites it before the copy. SHR changes arithmetic flags, but the later `ADD AH,34h` overwrites them before the continuation uses them; DF is untouched. This is not a full-state identity at the replacement boundary, nor immunity from adversarial interference. The intended gameplay change is one fewer executed instruction before relocation.

Six emitted bytes become five. One extra skipped CC byte preserves `phoenix_init` at 0x2e, `worker` at 0x64, the downstream 71-byte suffix and total B length of 117 bytes. The generator requires an exact assembled byte splice against frozen m050 B, not merely the expected size. No A-side search or source edits are included.

After source/generator review, the parent may assemble **only** this file into the new `shift-quantizer/build` directory, using the existing assembler. This authoring task does not assemble it:

```powershell
node assemble.mjs candidates/generated/codex-goal-20261001/shift-quantizer/build candidates/generated/codex-goal-20261001/shift-quantizer/B-shift-quantizer.asm
node candidates/generated/codex-goal-20261001/shift-quantizer/generate-screen.mjs --preflight
node candidates/generated/codex-goal-20261001/shift-quantizer/generate-screen.mjs --freeze
```

Preflight requires the one-file assembly manifest and draws no entropy. Freeze claims a new `screen` directory before its single crypto seed draw and preserves failed/interrupted attempts. No automatic redraw is allowed. Excluded seed ranges include all ranges recorded by the frozen bootstrap holdout—synthesis, realistic, LEA, bootstrap screen, camper, imp—and the holdout's own two seeds. No outcomes are loaded.

The two generated configs, `screen/m050.json` and `screen/shift_b.json`, use exactly the frozen senior panel-2 triples: 25 cohorts, all 62 teams represented, 13 distinct repeats, one new seed, 20 battles per cohort, 500 battles per arm. Both use `COD_pair`, identical names/order/opponents/Zombies, one thread, `parallel=false` and no telemetry. Absolute paths point to the original engine JAR and new frozen contender copies. Sources, binaries, configs, prior provenance and reviewed runtime versions are hash-recorded. Existing source manifests/final files are never modified.

After freeze verification, use the reviewed research adapter to prepare each config in a new output directory with the same `int87/classes` and `war/combined/classes` overlays. The existing read-only `audit-derived.mjs pair <shift_b-dir> <m050-dir>` supplies integrity checks and paired cohort metrics; verify the screen manifest/config hashes before interpreting those outputs. `generate-screen.mjs --verify` checks all frozen files without running battles.

The sole screen gate is positive complete matched mean delta against m050. Its 95% cohort interval is descriptive, not a significance or promotion gate. A positive screen requires fresh holdout testing against **both** exact m049 and m050. No pooling with previous results, adaptive extension, champion claim, final promotion or unseen-opponent claim is justified by this screen.
