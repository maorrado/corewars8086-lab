import fs from "node:fs";

const dir = "candidates/generated/good-test-v6-optimization";
const baseline = fs.readFileSync(`${dir}/V6_2.asm`, "utf8");
for (const [id, mainBand, fallbackBand] of [
  ["minus2", "1E00h", "3200h"],
  ["plus2", "2200h", "3600h"],
]) {
  const output = baseline
    .replace("mov bp, 3400h", `mov bp, ${fallbackBand}`)
    .replace("mov bp, 2000h", `mov bp, ${mainBand}`);
  if (output === baseline || output.includes("mov bp, 3400h") || output.includes("mov bp, 2000h")) {
    throw new Error(`Expected BP band constants not found for ${id}`);
  }
  const authored = `; Codex-authored V6-derived experiment: B spawn-band ${id}.\n; Only the two zombie-entry BP band constants are changed.\n; Benchmark before calling this an improvement.\n` + output;
  fs.writeFileSync(`${dir}/V6_2_bp_${id}.asm`, authored, { flag: "wx" });
}
