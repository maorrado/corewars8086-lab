// Submit a job to the night evaluation queue. Prints the job id.
// usage: node agent2/day2/q/submit.mjs --agent A007 --kind screen|threat|trace --asmA path [--asmB path] [--binA path] [--binB path]
//        [--threats '[{"key":"zomb_Grindo"},{"name":"myCounter","asmA":"...","asmB":"..."}]'] [--copies 1-3] [--cohortsPerThreat 2-12] [--mixAll]
//        [--note "text"]   (omitted A or B = current base revision's warrior)
import fs from "node:fs";
const a = process.argv.slice(2); const o = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const agent = o("--agent"), kind = o("--kind");
if (!agent || !/^[A-Za-z0-9_-]+$/.test(agent)) throw new Error("--agent required");
if (!["screen", "threat", "trace", "confirm"].includes(kind)) throw new Error("bad --kind");
if (kind === "confirm" && !agent.startsWith("COORD")) throw new Error("confirm jobs are coordinator-only");
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
const id = `${stamp}-${agent}-${kind}-${Math.random().toString(36).slice(2, 7)}`;
const job = { id, agent, kind, submittedAt: new Date().toISOString(), note: o("--note") ?? "" };
for (const k of ["asmA", "asmB", "binA", "binB", "salt"]) if (o("--" + k)) { job[k] = o("--" + k); if (k !== "salt" && !fs.existsSync(job[k])) throw new Error("missing " + job[k]); }
if (o("--threats")) job.threats = JSON.parse(o("--threats"));
if (o("--copies")) job.copies = Number(o("--copies"));
if (o("--cohortsPerThreat")) job.cohortsPerThreat = Number(o("--cohortsPerThreat"));
if (a.includes("--mixAll")) job.mixAll = true;
if (kind === "threat" && !job.threats) throw new Error("threat jobs need --threats");
fs.writeFileSync(`agent2/day2/q/queue/pending/${id}.json.tmp`, JSON.stringify(job, null, 1));
fs.renameSync(`agent2/day2/q/queue/pending/${id}.json.tmp`, `agent2/day2/q/queue/pending/${id}.json`);
console.log(id);
