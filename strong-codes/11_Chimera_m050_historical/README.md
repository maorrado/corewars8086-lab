# Chimera m050 historical reference

This is the exact former `final/` pair from commit `bca49e6`, preserved rather
than deleted. It is no longer the active final pair. See `../README.md` for
newer research candidates and `../../final/README.md` for zchain3.

| Warrior | Bytes | Binary SHA256 |
|---|---:|---|
| A | 189 | `0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44` |
| B | 117 | `06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782` |

Both `A.asm` and `B.asm` were reassembled with the NASM Node driver and matched
these measured hashes. Historical promotion evidence and the known New_Best
regression remain in `../../optimization-2025-report.md`. Historical positive
results are not a recommendation over the newer measured pairs.
