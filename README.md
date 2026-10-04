# CoreWars8086 / CodeGuru Xtreme lab

This private repository preserves the complete working lab used to study the
2025 CodeGuru Xtreme material and develop, benchmark, and validate survivor
pairs for CoreWars8086.

It includes the source code, experiment configurations and results, lecture
transcripts and notes, downloaded videos, extracted frames, visual indexes,
candidate survivors, and the simulator sources used for deterministic runs.
Large media and binary artifacts are stored with Git LFS.

## Current code and research map

Updated 2026-10-04 after integrating `agent2/research-2026-10-03` into
`codex/optimize-2025-survivors`.

- [`strong-codes/README.md`](strong-codes/README.md) is the code catalog: exact
  sources and binaries, measured candidates, and clearly marked historical pairs.
  DET2 leads Claude's mixed confirmation field; this is not proof of universal
  superiority or immunity to targeted opponents.
- [`final/README.md`](final/README.md) describes the committed **zchain3** pair.
  m049 and m050 are no longer in `final/`; their exact pairs are retained in
  `strong-codes/12_Chimera_m049_historical/` and
  `strong-codes/11_Chimera_m050_historical/`.
- [`study-notes/codex-research-20261004/README.md`](study-notes/codex-research-20261004/README.md)
  indexes Codex's V6 Guard search, independent comparisons, tournament tests,
  and the failed KPHLGuard signature-camouflage experiment.
- Claude's reports, protocols and results are in `agent2/REPORT.md`,
  `agent2/night/`, and `agent2/day2/`. Start the latest confirmation review at
  `agent2/day2/leaders/CONFIRM-RESULTS.md`.

Older reports retain their historical m049/m050 conclusions. They are experiment
records, not the current code-selection index. Unknown 2026 rules and Zombie code
still require adaptation and new validation. No candidate is guaranteed strongest
against every opponent.

## Clone on another computer

Install Git and Git LFS, then run:

```powershell
git lfs install
git -c core.longpaths=true -c core.autocrlf=false clone --branch codex/optimize-2025-survivors https://github.com/maorrado/corewars8086-lab.git
cd corewars8086-lab
git config core.longpaths true
git config core.autocrlf false
git lfs pull
```

The Python virtual environment is intentionally not versioned because it is
machine-specific. Recreate `.venv` on the destination computer as needed.

For Codex Handoff, save this repository as a Codex project on both connected
computers. Both saved projects must point to the same repository (and the same
subdirectory, if a subdirectory is selected).

## Vendored repositories

The exact upstream URLs and source commit IDs are recorded in
[`repos/SOURCES.md`](repos/SOURCES.md). The repositories are stored as ordinary
files in this repository so the deterministic simulator modifications remain
available in every clone.
