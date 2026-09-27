# Post-m049 adversarial audit

This directory preserves the selected raw configurations and official-v6
result JSONs from the `Registered_Winners` / `Code_Jokers4Life` investigation.
It also contains the old-browser diagnostic runs that explained why a visible
browser result did not generalize to the 2025 judge.

The result JSONs are immutable audit records and therefore retain their
original machine-local absolute paths.  To rerun them in another clone, remap
the candidate sources to `candidates/generated/chimera-jokers-defense/`, keep
the recorded cohorts/seeds/battle counts, and write to a new output file rather
than editing the archived record.

Key conclusions:

- On a controlled 6,000-battle official-v6 comparison, m049 scored
  `0.5277503583` and `Registered_Winners` scored `0.3719172183`.
- Across four Code_Jokers-containing cohorts, two seeds and 1,600 battles,
  m049 scored `0.5122917225`; Code_Jokers scored `0.061875`.
- Direct Code_Jokers signatures improved the targeted screen, but every
  broader shared-signature candidate lost heavily on preselected sentinel
  cohorts.  No candidate met the non-regression gate, so `final/` stayed m049.

The aggregate decision and exact rejected-candidate hashes are recorded in
`../post-m049-adversarial-audit-2026-09-27.json` and
`../../candidates/generated/chimera-jokers-defense/README.md`.
