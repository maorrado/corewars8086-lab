# Chimera m049 historical reference

This is the exact former champion from commit `914a251`, retained as a reference
and opponent. It is not the current final pair.

| Warrior | Bytes | Binary SHA256 |
|---|---:|---|
| A | 189 | `106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973` |
| B | 117 | `7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77` |

Both sources were reassembled and matched these hashes. m049 removes the older
New_Best bootstrap signature by reordering the pointer-cell initialization.
That counters one known pattern, not all possible signature searches.
The m049 versus m050 timing and matchup tradeoff is documented in the historical
optimization report. See `../README.md` for newer research.
