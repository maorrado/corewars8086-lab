# Preregistered holdout 6 — V6Guard vs V6nohunt (written before any holdout-6 run)

Date: 2026-10-03. V6Guard (Codex variant, pasted by the user): A 227 B
`71164c8d7308766cd14d64ac6d1342cd1631afce98278fe9dca4d4ab14a3b3f3`, B = original V6
B `8579e2c2…`. V6nohunt (agent2): A 194 B `6861894f…`, same B. No screen is used:
both candidates were selected by earlier, separate processes; this test only
compares them. Fresh salts `agent2-holdout6-*`; fields identical in definition to
holdout 5 (F1 2025 ×8, F2 strong ×8, F3 2024 live ×6, F4 2025 no Zombies ×4,
D = 20 cohorts each with V4 / V6 / zchain4 / combo_zrl03 forced in). 40 battles
per cohort. Arms: V6Guard, V6nohunt, Good_Test_V6, Good_Test_V4, zchain4.

Primary comparison (single, 95%): V6Guard − V6nohunt on pooled F1+F2+F3 cohorts.
- "V6Guard better" if the interval is entirely above 0 and no field F1–F4 or
  leader-present group has a 95% interval entirely below 0;
- "V6nohunt better" in the mirror-image case;
- otherwise "no measurable difference".
Everything else (each vs V6, V4, zchain4) is descriptive. Decisive results get a
sampled `--engine original` check. `final/` is not changed by this test.
