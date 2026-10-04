// Rough cost of self-harm deaths: for each battle with a partner/ourZombie kill, compare the end share
// with the counterfactual where the victim was also alive at the end (nothing else changed).
import fs from "node:fs"; import path from "node:path";
const dir = process.argv[2]; const ours = new Set(["CAND1", "CAND2"]);
let tot = 0, nb = 0; const per = {}; const det = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"))) {
  const L = fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n").map(JSON.parse);
  const ends = Object.fromEntries(L.filter(d => d.warEnd !== undefined).map(d => [d.warEnd, d]));
  for (const d of L) {
    if (d.warEnd !== undefined || d.group !== "CAND") continue;
    const captured = new Set(d.alive.filter(a => a.z && ours.has(a.ipBy)).map(a => a.n));
    const kind = (by) => by === d.name ? "self" : ours.has(by) ? "partner" : by.startsWith("zom") ? (captured.has(by) ? "ourZombie" : "zombie") : (by === "load" || by === "init") ? by : "opp";
    const win = d.bytes.slice(0, 8).filter(b => !b.oob);
    const cand = win.filter(b => kind(b.by) !== "self" && b.r >= 0).sort((a, b) => b.r - a.r);
    const killer = cand.length ? kind(cand[0].by) : "none";
    if (killer !== "partner" && killer !== "ourZombie") continue;
    const e = ends[d.war]; const W = e.winners.split(", ").filter(w => !w.startsWith("zom"));
    const k = W.filter(w => ours.has(w)).length, N = W.length;
    const got = N ? k / N : 0, cf = (k + 1) / (N + 1);
    const loss = cf - got; tot += loss; nb++;
    per[f] = (per[f] ?? 0) + loss;
    det.push(`${f} w${d.war} r${d.round} ${d.name} by ${killer}/${cand[0].by} end r${e.round} winners=[${W.join(",")}] loss~${loss.toFixed(2)}`);
  }
}
det.forEach(x => console.log(x));
console.log("events", nb, "sum loss", tot.toFixed(2), "battles 300 => per battle", (tot / 300).toFixed(4));
console.log(per);
