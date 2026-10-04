# MC2 - shared pointer cell 0300h

Date: 2026-10-04 day 2

A.asm -> A (214 bytes, sha256 cb76c341f4db3af2d33ffa38d543849cf54e3684a2904354d6aba3c81a902ae7)
B.asm -> B (222 bytes, sha256 0a986917237d8ddb6c7de01b0a1f08e32c05d726ecedd9554bddf3e0e3c0a2b7)

rev1 + worker reads the pointer from absolute [0300h]; merged V6/zchain streams that run our worker die. Passed the same confirmation: vs rev1 +0.066 [0.043,0.089]. Best on the strong field (0.722).

Provenance: Good_Test V6 is friend-provided code; all variants here are edits of it or of our Chimera line (see comments in the sources).
