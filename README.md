# CoreWars8086 / CodeGuru Xtreme lab

This private repository preserves the complete working lab used to study the
2025 CodeGuru Xtreme material and develop, benchmark, and validate survivor
pairs for CoreWars8086.

It includes the source code, experiment configurations and results, lecture
transcripts and notes, downloaded videos, extracted frames, visual indexes,
candidate survivors, and the simulator sources used for deterministic runs.
Large media and binary artifacts are stored with Git LFS.

## Clone on another computer

Install Git and Git LFS, then run:

```powershell
git lfs install
git clone https://github.com/maorrado/corewars8086-lab.git
cd corewars8086-lab
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
