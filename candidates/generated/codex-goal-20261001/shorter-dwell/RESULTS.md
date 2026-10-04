# Completed screen: all four reduced-trail candidates rejected

The 714-pair original-engine mechanism fixture passed, but mechanical validity
did not translate into competitive strength. All five arms finished the fixed
500-battle protocol: 25 newly shuffled triples covering all 75 published 2025
teams, one new shared seed, identical names/settings and exact m050 control.
No arm was stopped early or extended after seeing its scores.

Manifest SHA-256:
`4a6ed9ce480098cf78e812d6e42659a232e86472fc03379e99eba08e0bf3eabd`.
The integrity audit completed all 125 blocks / 2,500 battle executions.
Analysis SHA-256:
`12fb5f7f656a1ef266fb979a729cc42309bb22c4647204fbaa39ee1a6143cc99`.

| Pair | Points/battle | Delta vs m050 | Descriptive 95% cohort interval |
| --- | ---: | ---: | --- |
| m050 | .695333334 | — | — |
| Both, 512-byte trail | .439999999 | -.255333335 | [-.336915364, -.173751306] |
| B only, 512 | .567000000 | -.128333334 | [-.181715403, -.074951265] |
| Both, 256 | .326000002 | -.369333332 | [-.456376010, -.282290655] |
| B only, 256 | .565666666 | -.129666668 | [-.193897932, -.065435404] |

None passes the positive-mean gate. No fresh holdout or final promotion for
these versions. Their negative direction is consistent with older short-trail
screens, now verified for the exact current m050 and identical candidate names.

Important mechanism limitation: BP remains a multiple of 0400h, so each warrior
visits only 64 anchor positions. Reduced 0200h/0100h paint widths cover only
half/a quarter of the arena per steady complete orbit; more frequent visits do
not fill the missing residue classes. This arithmetic does not prove it is the
sole causal explanation of the score losses. A separate coverage-dwell design
changes BP as well as DX to test shorter exposure with full spatial coverage;
it is not a confirmed improvement and must receive fresh testing.
