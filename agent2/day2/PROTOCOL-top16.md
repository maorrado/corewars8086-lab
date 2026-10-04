# Early versions of the 16 teams that reached the 2025 final - preregistered confirmation (2026-10-04)

Name: "online-stage (early) versions of the 16 2025 finalists". NOT a replay of the 2025 final: the binaries are the
published online-stage survivors (official-2025/survivors-online; 32/32 SHA-256 identical to Codex's roster file,
verified against https://codeguru.blob.core.windows.net/public/cgx2025/survivors/online.zip; 17 of them exceed the
final's 256-byte limit), the Zombies are the online-stage pack zom20a-d (official-2025/zombies-live; sha256 prefixes
a950e618, af6394c0, 3d3f2099, 923dd6ab); the final's new Zombies and final-version binaries are not available.
Engine: unmodified v6.0.0 deterministic JAR sha256 31639072...318d via the A2Batch persistent driver; 4 teams per battle
(candidate + 3 finalists), zombie speed 2 (engine default), 2 warriors per team.

Exploratory run (already done, used for nothing but this decision to confirm): agent2/day2/fin16.json (salt
agent2-day2-finalists16-1, 180 cohorts x 40 battles; no-Zombie 60 x 40).
Confirmation (fresh salt agent2-day2-top16-confirm-1): every one of the C(16,3) = 560 opponent triples once, 20 battles
each (11,200 battles per arm) with z2025; the same 560 triples, 10 battles each, without Zombies. Same seeds for every arm.
Arms (each run separately against the same opponents and seeds): CC3, DET2, rev1, V6nohunt, zchain4, V6.
Primary questions (z = 2.5, cohort = triple): (1) DET2 - V6nohunt, (2) CC3 - DET2, on the Zombie run.
A difference is called confirmed only if its z=2.5 interval excludes 0. Everything else is reported as descriptive.
No promotion or final/ change follows from this test alone.
