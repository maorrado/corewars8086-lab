# Day 2 field check - results (protocol: PROTOCOL.md, committed before the run in 3c20e99)

Fresh salt agent2-day2-field-1; 352 field cohorts + 75 no-Zombie cohorts, 40 battles each (17,080 battles per arm, 5 arms).
Persistent driver; 40 sampled jobs re-run on the original cold JVM: 40/40 scores.csv byte-identical.
Full numbers: analysis.txt / analysis.json.

Mean team score per battle: pooled (2025+strong+2024live) rev1 0.7327, zchain4 0.7291, KPH 0.7283, rev0 0.7167, V6 0.7111.
2025: zchain4 0.762, rev1 0.749, KPH 0.740, rev0 0.731, V6 0.727. Strong: rev1 0.683, KPH 0.683, rev0 0.632, V6 0.611, zchain4 0.537.

- Primary KPH - rev1: -0.0044 [-0.0111,+0.0022] -> rule not met; rev1 stays.
  locpatA hypothesis confirmed as a trade-off: removing it gains 2024live +0.015 [0.002,0.027] but loses 2025 -0.010 [-0.016,-0.003].
- rev1 - rev0: +0.0160 [+0.0022,+0.0299] (z=2.5) -> rule met (2025 +0.019, strong +0.051, nozombie +0.010 all lo>0; 2024live -0.019 n.s.).
  This is the third fresh field for rev1 vs rev0 (d93vd +0.033 met, svxch +0.003 not met, this +0.016 met).
- rev1 - V6 (friend original): +0.0216 [+0.0075,+0.0357] -> rule met (2024live -0.016 n.s.).
- rev1 - zchain4: +0.0037 [-0.0158,+0.0232] n.s.: zchain4 better on plain 2025 (-0.013 n.s.), rev1 far better on strong (+0.146).
final/ (zchain3) is not changed: rev1 is not shown better than the zchain lineage on the pooled field.
