import { score, BASE } from "./scan.mjs";
const [key, from, to, stp, zsS = "40,44,48", zbsS = "n,800", R = "200000"] = process.argv.slice(2);
const zs = zsS.split(",").map(Number); const zbs = zbsS.split(",").map(x => x === "n" ? null : Number(x));
for (let v = Number(from); v <= Number(to); v += Number(stp)) {
  const t = score({ ...BASE, [key]: v }, { R: Number(R), zs, zbs });
  console.log(key, "0x" + v.toString(16), "runs", t.runs, "A", t.A, "B", t.B, "zA", t.zA, "zB", t.zB, "first", t.early.slice(0, 3).join(","));
}
