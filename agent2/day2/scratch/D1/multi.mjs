import { score, BASE } from "./scan.mjs";
const variants = JSON.parse(process.argv[2]);
const zs = (process.argv[3] ?? "44").split(",").map(Number); const zbs = (process.argv[4] ?? "n,800").split(",").map(x => x === "n" ? null : Number(x));
for (const [name, v] of Object.entries(variants)) {
  const t = score({ ...BASE, ...v }, { zs, zbs, R: +(process.argv[5] ?? 200000) });
  console.log(name.padEnd(14), "runs", t.runs, "A", t.A, "B", t.B, "zA", t.zA, "zB", t.zB, "first", t.early.slice(0, 4).join(","));
}
