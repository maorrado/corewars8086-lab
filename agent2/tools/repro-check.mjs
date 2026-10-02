// Re-run the first N cohorts of an archived official-benchmark config from this checkout
// and compare raw scores.csv text with the archived result, byte for byte.
// usage: node repro-check.mjs <archived-config.json> <archived-result.json> <nCohorts> <tag>
import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process";
const [cfgPath, resPath, nStr, tag] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const OLD = "C:\Maor\CodeGuru\corewars8086-lab";
const remap = (p) => p.startsWith(OLD) ? path.join(root, p.slice(OLD.length)) : p;
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const res = JSON.parse(fs.readFileSync(resPath, "utf8"));
const walk = (o) => { for (const k in o) { if (typeof o[k] === "string") o[k] = remap(o[k]); else if (o[k] && typeof o[k] === "object") walk(o[k]); } };
walk(cfg);
cfg.cohorts = cfg.cohorts.slice(0, Number(nStr));
// binaries for candidate came from the other checkout's build dir: use my rebuilt copies by hash
const map = JSON.parse(fs.readFileSync(path.join(root, "agent2/build/ref/manifest.json"), "utf8"));
const crypto = await import("node:crypto");
const byHash = new Map(map.map(m => [m.binarySha256, m.output]));
const want = res.runs[0].inputs[cfg.candidate.name].map(x => x.sha256);
cfg.candidate.warriors = want.map(h => { if (!byHash.has(h)) throw new Error("no local binary for " + h); return byHash.get(h); });
cfg.java = path.join(root, "tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe");
cfg.jar = path.join(root, "repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar");
cfg.outputPath = path.join(root, `agent2/repro/${tag}.json`);
cfg.runDirectory = path.join(root, `agent2/runs/repro-${tag}`);
cfg.experimentId = `agent2-repro-${tag}`;
const newCfg = path.join(root, `agent2/repro/${tag}.config.json`);
fs.writeFileSync(newCfg, JSON.stringify(cfg, null, 2));
execFileSync("node", [path.join(root, "official-benchmark.mjs"), newCfg], { stdio: "inherit" });
const mine = JSON.parse(fs.readFileSync(cfg.outputPath, "utf8"));
let ok = 0;
for (const r of mine.runs) {
  const old = res.runs.find(x => x.cohortId === r.cohortId && x.seed === r.seed);
  const same = old && old.rawScoreText === r.rawScoreText;
  if (same) ok++;
  console.log(`${r.cohortId} ${r.seed.slice(0, 30)} archived=${old?.candidate.teamRaw} mine=${r.candidate.teamRaw} identical=${same}`);
}
console.log(`identical ${ok}/${mine.runs.length}`);
