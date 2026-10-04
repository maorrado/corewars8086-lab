# Night run checkpoint (2026-10-03)

- Start state: branch agent2/research-2026-10-03, commit 7d6ea54 before the night infrastructure; infrastructure commit 8c9167f.
- Previous task state: holdouts 1-6 complete and committed; no battle process was running before the night run.
- Base revision 0 = V6nohunt (A 6861894f… 194 B, B 8579e2c2… 202 B), see shared-best.json.
- Evaluation daemon: `node agent2/night/daemon.mjs > agent2/night/daemon.log` (single process, 8 threads). Stop with `touch agent2/night/STOP`.
  Restart is safe: jobs in queue/taken without a done/ file must be moved back to queue/pending.
- Orchestration: Workflow run wf_c17581db-8e2, script
  C:\Users\ronyr\.claude\projects\C--Maor-CodeGuru-corewars8086-agent2\e6993316-f502-4b9d-ad90-c209ff287316\workflows\scripts\corewars-night-arena-100-wf_fc42a08c-a2b.js
  Resume: Workflow({scriptPath: <script>, resumeFromRunId: "wf_c17581db-8e2"}) (completed agents return cached results).
- Per-agent outputs: agent2/night/scratch/<ID>/report.json; wave findings agent2/night/FINDINGS.md; promotions NOTICES.md.
