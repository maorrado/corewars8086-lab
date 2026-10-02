# Generated survivor source archive

This tree is an **experiment archive**, not a list of approved champions.
It contains source snapshots from many independent searches, including
rejected and sometimes mechanically invalid drafts. The associated build
outputs, listings, temporary scores, and logs are intentionally not bulk
committed. Do not choose a submission solely from a filename or a screen
score.

Use `final/` for the versioned promoted pair. For a candidate here, first
assemble the exact A/B files, check the binary sizes and SHA-256 against its
own experiment record, then compare it with a frozen reference on fresh paired
seeds and a representative field. Preserve provenance: source under a
`claude-*` or `good-test-*` folder is not automatically Codex-authored.

Known example of an invalid intermediate: the `constseg1` and `constseg2`
Good_Test V6 drafts did not repair hard-coded internal offsets after changing
the layout. The curated valid V6 source/evidence package is instead at
`../../study-notes/good-test-v6/`.

The repository-wide curation state and next-agent workflow are in
`../../study-notes/handover-inventory-20261002.md`.
