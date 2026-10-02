import fs from "node:fs";

const dir = "candidates/generated/good-test-v6-optimization";
const baseline = fs.readFileSync(`${dir}/V6_1.asm`, "utf8");
for (const count of [6, 8]) {
  const needle = "    mov cl, 4";
  if (baseline.split(needle).length !== 2) throw new Error("Expected exactly one scanner count in V6 A");
  const output = baseline.replace(needle, `    mov cl, ${count}`);
  const authored = `; Codex-authored V6-derived scanner experiment: scan-range-${count}.\n; Only the zombie scanner candidate-window count changes (4 -> ${count}).\n; The V6 B binary is unchanged. This is an experiment, not a claimed promotion.\n` + output;
  fs.writeFileSync(`${dir}/V6_1_scan${count}.asm`, authored, { flag: "wx" });
}
