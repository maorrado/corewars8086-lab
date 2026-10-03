# Preregistered holdout 4 — V6-based variants (written before any holdout-4 run)

Date: 2026-10-03. Base: Good_Test V6 (friend-provided), label-form source
`agent2/src/v6/V6A.asm`/`V6B.asm` assembling byte-identically to the originals.
Selection evidence: screen 4 (`agent2/results/s4-*.json`).

## Arms (team name `CAND`; hashes recorded in result `armHashes`)
- V6dn (primary): V6 + planted `EB F9` decoys at FFECh (A) / FFE8h (B), own
  backward b/d searches start at FFE0h, and A's `[7A00h]` redirect patch removed.
- V6nohunt (secondary): only the `[7A00h]` patch removed.
- V6dec (secondary): only the decoys.
- V6 (original binaries), zchain4, m050 (references).

## Fields (fresh salts `agent2-holdout4-*`, 40 battles per cohort)
H1–H6 exactly as in holdout 1. H7: 40 cohorts, each = original Good_Test V6 +
two random 2025 teams, 2025 Zombies (head-to-head stress).

## Decision rule (fixed in advance)
V6dn is a measured improvement over V6 if the cohort-paired difference pooled
over H1+H2+H3 is > 0 with a 95% interval excluding 0, the H1 point estimate is
>= 0, no field H1–H7 has an interval entirely below 0, and H7 point estimate
>= -0.01. Otherwise the result is reported as "no established improvement over V6".
