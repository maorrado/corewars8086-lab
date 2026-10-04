import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../../..");
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const sha = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const slash = value => value.split(path.sep).join("/");
const resolve = file => path.resolve(here, file);
const protocol = read(resolve("protocol.json"));
if (fs.existsSync(resolve("input-manifest.json")) || fs.existsSync(resolve("results")) || fs.existsSync(resolve("runs"))) {
  throw new Error("Refusing to re-freeze an existing or started screen");
}
const required = new Set(["protocol.json", "README.md", "freeze-inputs.mjs", "analyze.mjs",
  "../README.md", "../build/manifest.json",
  "../../lea-confirmation/panel-1-c090.json", "../../lea-confirmation/panel-1-m050.json",
  "../../lea-confirmation/manifest.json", "../../lea-confirmation/preregistered-randomness.json",
  "../../lea-confirmation/protocol.mjs",
  slash(path.relative(here, path.join(root, "official-benchmark.mjs")))]);
const configs = protocol.arms.map(arm => {
  const file = arm + ".json";
  required.add(file);
  const config = read(resolve(file));
  for (const item of [config.java, config.jar, ...config.candidate.warriors,
    ...config.cohorts.flatMap(c => c.opponents.flatMap(o => o.warriors)),
    ...config.zombies.map(z => z.path)]) required.add(item);
  const got = config.candidate.warriors.map(file => sha(resolve(file)));
  if (JSON.stringify(got) !== JSON.stringify(protocol.candidateHashes[arm])) throw new Error(arm + ": unexpected candidate bytes");
  return { arm, path: file, sha256: sha(resolve(file)), candidateHashes: got };
});
const sourceBuildManifest = read(resolve("../build/manifest.json"));
for (const entry of sourceBuildManifest) {
  const source = path.resolve(entry.input);
  const binary = path.resolve(entry.output);
  if (sha(source) !== entry.sourceSha256 || sha(binary) !== entry.binarySha256) throw new Error("Assembly provenance drift");
  required.add(slash(path.relative(here, source)));
  required.add(slash(path.relative(here, binary)));
}
const inputs = [...required].sort().map(file => ({
  path: file, bytes: fs.statSync(resolve(file)).size, sha256: sha(resolve(file))
}));
process.stdout.write(JSON.stringify({
  schemaVersion: 1, suite: protocol.id, frozenAt: new Date().toISOString(),
  protocolSha256: sha(resolve("protocol.json")), configs, sourceBuildManifest, inputs,
  engine: { path: read(resolve("c090.json")).jar, sha256: sha(resolve(read(resolve("c090.json")).jar)) },
  statement: "Read-only freeze snapshot authored before execution; no outcomes used; only the caller saves this JSON."
}, null, 2) + "\n");

