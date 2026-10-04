# STOSB imp B: rejected at broad-field screen

The corrected 31-byte assembly preserved the reviewed instruction sequence.
Binary SHA256: `647ffbcfb8964406a7bb42a250dff81622917b68e22d0df95a02f0983336fb42`.
The first assembler failure was the unsupported size-assertion expression, not
a simulated battle result. The frozen generator separately enforces size and
the exact original m050 B opener and new launcher bytes.

Both frozen arms ran sequentially using the validated isolated accelerated
engine lane: 25 senior opponent triples, one fresh seed, 20 battles/triple,
500 battles per arm. Exact m050 A remained unchanged and the candidate name
was COD_pair for both. Inputs, process counts and raw scores were audited.

| Pair | Team points/battle | A | B |
| --- | ---: | ---: | ---: |
| Exact m050 control | 0.644666666 | 0.268166667 | 0.376500002 |
| Exact m050 A + STOSB imp B | 0.400666668 | 0.341333333 | 0.059333334 |

Paired mean delta: -0.243999998 (-37.85% relative). Descriptive 25-cohort
95% interval: [-0.300220629, -0.187779367]. Cohorts: 2 positive, 22 negative,
1 tied. This is not a new champion or a useful broad-field lead. No holdout or
final/ promotion. The improved A subtotal does not compensate for B's loss;
do not infer a specific cause of death from these aggregate scores alone.

Full results and frozen runtime/input snapshots:
`experiments/codex-goal-20261001/accelerated-stosb-imp/{control,imp}/`.
Re-audit from the repository root:

```powershell
node tools/engine-acceleration-20261001/audit-derived.mjs pair experiments/codex-goal-20261001/accelerated-stosb-imp/imp experiments/codex-goal-20261001/accelerated-stosb-imp/control
```
