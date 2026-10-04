# V6 Guard — confirmed research baseline

Original V6 belongs to the user's friend. Arena researcher a003 added a six-byte
conditional pointer guard in A and rebased its internal labels. B is unchanged.
This is not a new AI architecture or a claim that the original code was ours.

Use `V6GuardA.asm` and `V6GuardB.asm` as the two separate warriors. Flat binaries
`V6GuardA` and `V6GuardB` are the exact scored files (227/202 bytes). The sources
were independently reassembled in `reassembled/` and both SHA256 hashes match.
See `manifest.json` for identities and evidence; no change was made to `final/`.

## Change

A used to read a supposed Zombie pointer at arena address `7A00h`, then patch
through it unconditionally. The guard adds `cmp bx,0CCCCh` / `je no_zombie_pointer`.
When the arena-fill sentinel remains, it skips six unjustified patch operations.
The two guard instructions then save four startup turns net. Non-sentinel values
retain the original patch path, delayed by two turns. This does not validate every
possible pointer, and the old path can still be unsafe for corrupt non-sentinels.
The worker, paint cadence, relocation geometry, and B binary are unchanged.

## Confirmed primary result

Two untouched holdouts, frozen choice before either ran; each has 3,000 battles
per version against the same seeded four-team contexts from 75 published2025
teams, using four2025 Zombies and the unmodified deterministic v6 engine.

| Holdout | Original V6 points | V6 Guard points |
| --- | ---: | ---: |
| Alpha | 2,154.16667 | 2,178.33334 |
| Beta | 2,147.33334 | 2,157.50000 |
| Total6,000 per version | 4,301.50001 | 4,335.83334 |

Relative score improvement: **+0.798%**. Absolute paired difference:+0.005722
score/battle (+0.5722 percentage points),95% paired Student interval
[+0.001701,+0.009744]. There are150 cohort/seed units:55 higher,65 tied,30 lower.
Beta alone has a confidence interval crossingzero; the prespecified gate is two
positive directions and a positive pooled interval, not two individually
significant tests. No claim of100% certainty or superiority in every matchup.

Modern-reference stress:+0.006875 in400 battles/version; historical2024 stress:
+0.000893 in560/version; no-Zombie stress:-0.004167 in200/version. All three
individual intervals crosszero. The first two do not independently establish a
gain; the last remains a small observed tradeoff, not proven equality or immunity.
Historical512-byte opponents are stress inputs, not legal new2025 submissions.

Six selected holdout score CSVs matched the separate original cold CLI byte for
byte (240 repeated battles total). This validates execution, not an additional
independent performance sample. All seeds, plans, identities, results and reviews
are in the parent session directory. Unknown2026 rules and opponents remain open.
