# DET2 - adaptive lattice

Date: 2026-10-04 day 2

A.asm -> A (214 bytes, sha256 2153532daca9095acc71f0a2bdc7560024fc81972171c02f1b7f8cc41d1b1ce4)
B.asm -> B (233 bytes, sha256 15f5c4dabec14a62af067a9593e3ce6f207167c78b4b6f8e5c89fc4e3e8de8a1)

rev1 + B detects a V6-family team (early [4A17h] write) and moves the whole team to lattice 42h, else stays at 52h. Confirmed best: vs rev1 +0.075 [0.046,0.104] (all zombie cohorts, fresh field). Known weak point: a team that writes [4A17h] early triggers the move without V6 present.

Provenance: Good_Test V6 is friend-provided code; all variants here are edits of it or of our Chimera line (see comments in the sources).
