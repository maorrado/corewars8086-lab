# Original m050 death diagnostic

This isolated listener replays the original median 50-war fixture, using the
unchanged deterministic engine JAR and Competition APIs. It is a diagnosis of
the baseline's memory exceptions, not a score-improvement experiment. Source
and compiled driver require root review before execution. No engine source,
runtime overlay, original fixture, or final warrior is edited.

The initial no-IP source is retained byte-for-byte under `archive/`, alongside
the untouched original `classes/` and `replay-plan.json`. The current source
adds the missing explicit IP field. `build-reviewed-diagnostic.mjs` compiles
only into `reviewed-classes/` and writes `replay-plan-reviewed.json`, which
links and hashes the original plan and archived source. The word "reviewed"
identifies this revision; root review and execution are still pending.

The original `build-diagnostic.mjs` compiled the observer and wrote `replay-plan.json`.
It checks the original JAR, all 12 input binaries, and both archived CSV hashes.
It never launches Java battles. The generated plan contains complete absolute
input/output paths and the exact invocation. It retains the existing survivor
and Zombie directories: the original engine sorts survivors but does not sort
the Zombie directory listing, so recreating those directories is unnecessary.

## Invocation after review

From the repository root, the ordinary engine options are passed to the new
main class. Prefer `node candidates/generated/codex-goal-20261001/word-trigger/diagnostic/run-replay.mjs`
after root review: it checks all frozen evidence, reserves fresh outputs with
`wx`, invokes the exact original-only command, validates the 50-war event/seed
sequence and explicit IP fields, and requires raw score/telemetry byte equality.
It records PASS/FAILED, process status, output hashes and any failure in
`replay-reviewed/execution.json`. Failed outputs are preserved. The launcher
has been authored but not run.

The equivalent direct command below is documentation only and has not run:

```powershell
$diagnosticDir = 'C:\Maor\CodeGuru\corewars8086-lab\candidates\generated\codex-goal-20261001\word-trigger\diagnostic'
$engineJar = 'C:\Maor\CodeGuru\corewars8086-lab\repos\corewars8086-6.0.0-deterministic\target\corewars8086-6.0.0-jar-with-dependencies.jar'
$fixtureDir = 'C:\Maor\CodeGuru\corewars8086-lab\tools\engine-acceleration-20261001\measurements\differential-v1\baseline-r1-forward-median'
& 'C:\Maor\CodeGuru\corewars8086-lab\tools\temurin8-jre\jdk8u504-b01-jre\bin\java.exe' `
  '-Ddiagnostic.names=COD_pair1,COD_pair2' '-Ddiagnostic.radius=16' `
  -cp "$diagnosticDir\reviewed-classes;$engineJar" DeathDiagnosticMain `
  --headless --comboSize 4 --battlesPerCombo 50 `
  --seed claude-synthesis-fresh-2-d65bf5b1ac31c1cb8543bb10 `
  --threads 1 --parallel=false `
  --warriorsDir "$fixtureDir\survivors" --zombiesDir "$fixtureDir\zombies" `
  --outputFile "$diagnosticDir\replay-reviewed\scores.csv" `
  --telemetryFile "$diagnosticDir\replay-reviewed\telemetry.csv"
```

For an archived execution, use the executable/argument array in
`replay-plan-reviewed.json`, capture stdout as bytes into its `diagnosticsJsonl` path,
and capture stderr separately. Avoid Windows PowerShell's legacy text
redirection if a UTF-8 JSONL file is expected. Every output must be new; the
driver refuses existing score/telemetry files. No accelerated class directories
belong on the classpath: the observer rejects a non-original engine JAR or a
War/Warrior/Cpu/physical-memory class loaded from a different location.

Required replay acceptance: all 50 wars complete and both raw CSVs equal their
archived counterparts byte-for-byte. Expected original hashes:

- scores.csv: `f46338d74ec80c97d6aac38485b680d24e13429c3396063f1745c0c24160a5d4`
- telemetry.csv: `170204360645a7ef90d6457f8f94ddf87f3463a0e4e78bd38eb6a2f5924bb011`

## Diagnostic interpretation

The default watched names are COD_pair1 and COD_pair2. Set the comma-separated
`diagnostic.names` property to inspect other exact warrior names. The code
window is IP minus/plus `diagnostic.radius` bytes (default 16, bounded 1..64).
No per-opcode or per-round memory scan is added.

JSONL includes competition start/completion, watched births/deaths, and war
ends. Birth and immediate death snapshots include AX/BX/CX/DX/SI/DI/BP/SP,
CS/IP/SS/DS/ES, FLAGS/DF, energy, both bomb counts, DS:BX pointer words, DS:SI and
ES:DI words, SS:SP, a CS:IP byte window, and DS:0000..001F. Death records embed
the birth snapshot and identify the zero-based war, original war seed, current
round, load offset, and current-warrior index. Registers are unsigned decimal;
memory windows are hexadecimal bytes with their segment/offset/linear start.

The death callback precedes `Warrior.kill()`, so `aliveAtCallback` normally
remains true. The interpreter may already have advanced IP or changed CX/SP
before throwing. The snapshot is not an instruction-start trace and does not
identify a corrupting writer by itself. Diagnostic memory reads use only
`War.getMemory()`'s physical-core read methods, including at addresses forbidden
to the dying warrior; readable snapshot bytes do not imply CPU access rights.
No registers, arena bytes, permissions, scheduling state, or RNG are changed by
the observer. The original score writer is retained; only its console status
message is redirected to stderr to keep stdout valid JSONL.
