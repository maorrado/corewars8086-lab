import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Config-only preparation. This script does not launch a benchmark.
const here = path.dirname(fileURLToPath(import.meta.url));
const base = JSON.parse(fs.readFileSync(path.join(here, '../independent-b-exact-worker-copy/holdout-control-v3.json'), 'utf8'));
const shared = {
  battles: 20,
  threads: 1,
  seeds: ['direct-copy-screen-20260930-a'],
  cohorts: base.cohorts,
  zombies: base.zombies,
  java: base.java,
  jar: base.jar,
};
const variants = {
  control: ['../../../../build/m050-repro/ab_pad_a', '../../../../build/m050-repro/ab_pad_b'],
  candidate: ['../../../../build/codex-goal-20260930-telemetry-direction/direct-copy-a', '../../../../build/codex-goal-20260930-telemetry-direction/direct-copy-b'],
};
for (const [variant, warriors] of Object.entries(variants)) {
  const config = {
    experimentId: `codex-goal-direct-copy-${variant}-screen-20260930`,
    outputPath: `../../../../experiments/codex-goal-20260930/telemetry-direction/direct-copy-${variant}-screen.json`,
    runDirectory: `../../../../build/official-runs/codex-goal-20260930/telemetry-direction/direct-copy-${variant}-screen`,
    ...shared,
    candidate: { name: 'COD_pair', warriors },
  };
  fs.writeFileSync(path.join(here, `direct-copy-${variant}-screen.json`), `${JSON.stringify(config, null, 2)}\n`);
}
