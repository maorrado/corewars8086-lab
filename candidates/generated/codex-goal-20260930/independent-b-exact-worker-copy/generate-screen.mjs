import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../../../");
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const fromRepo = (file) => path.resolve(repo, file);
const expected = {
  a: "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44",
  oldB: "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782",
  newB: "fa5ae469cc1217d97fcb7d33a77626fa27483ef3f57ce2c7560e16ae6ca8575e",
};
const a = fromRepo("build/m050-repro/ab_pad_a");
const oldB = fromRepo("build/m050-repro/ab_pad_b");
const newB = fromRepo("build/codex-goal-20260930/independent-b-exact-worker-copy/B");
for (const [file, hash] of [[a, expected.a], [oldB, expected.oldB], [newB, expected.newB]]) {
  if (sha256(file) !== hash) throw new Error(`candidate binary hash mismatch: ${file}`);
}
const template = JSON.parse(fs.readFileSync(fromRepo("config-codex-goal-stackxor-ab-tune-20260930.json"), "utf8"));
if (template.cohorts.length !== 25 || template.cohorts.some((c) => c.opponents.length !== 3) || template.candidate.name !== "COD_pair") {
  throw new Error("unexpected 2025-field template");
}
const seed = "codex-goal-independent-b-exactcopy-screen-20260930-8137";
for (const [arm, b] of [["control", oldB], ["variant", newB]]) {
  const config = {
    ...template,
    experimentId: `codex-goal-independent-b-exactcopy-${arm}-screen-20260930`,
    outputPath: fromRepo(`experiments/codex-goal-20260930/independent-b-exact-worker-copy/${arm}-screen.json`),
    runDirectory: fromRepo(`build/official-runs/codex-goal-20260930/independent-b-exact-worker-copy/${arm}-screen`),
    battles: 20,
    threads: 1,
    seeds: [seed],
    java: fromRepo(template.java ?? "tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe"),
    jar: fromRepo(template.jar ?? "repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar"),
    candidate: { ...template.candidate, warriors: [a, b] },
    cohorts: template.cohorts.map((cohort) => ({
      ...cohort,
      opponents: cohort.opponents.map((team) => ({ ...team, warriors: team.warriors.map(fromRepo) })),
    })),
    zombies: template.zombies.map((zombie) => ({ ...zombie, path: fromRepo(zombie.path) })),
  };
  const configPath = path.join(here, `screen-${arm}.json`);
  if (fs.existsSync(configPath) || fs.existsSync(config.outputPath) || fs.existsSync(config.runDirectory)) {
    throw new Error(`refusing to overwrite existing ${arm} screen artifacts`);
  }
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { flag: "wx" });
  console.log(`${arm}: ${configPath}`);
}
