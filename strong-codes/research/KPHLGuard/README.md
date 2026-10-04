# KPHLGuard signature camouflage experiment

This pair is preserved for research, **not recommended as a robust defense**.
Lineage: friend-provided V6, Claude KPHL, then Codex's one-byte change per warrior
from `XOR DI,DI` to `SUB DI,DI` in the bootstrap. Size and instruction count stay
unchanged, and the worker loop is unchanged.

| Controlled test | KPHL points | KPHLGuard points | Battles per pair |
|---|---:|---:|---:|
| Old bootstrap signature hunter | 0 | 138 | 200 |
| Adapted hunter with one search byte changed | 138 | 0 | 200 |
| Frozen 75-team published 2025 field | 2246.833327 | 2246.833327 | 3000 |

The hunters are authored simulator test fixtures, not actual competition teams.
The second test reuses the first test's four seeds, input ordering and opponent
names. It demonstrates that changing the visible signature does not remove the
pre-bootstrap attack surface. No new universal-strength claim follows from the
first row or the field tie.

Sources and release binaries are linked in `package.json`. Full package and
updated evidence: `../../../candidates/generated/kphl-guard-20261004/`.
Adaptive counter evidence:
`../../../.arena/kphl-defense-20261004/adaptive-counter/report.json`.
Do not promote this pair without a new architectural defense and fresh evidence.
