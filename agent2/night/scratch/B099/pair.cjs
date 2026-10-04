// Paired per-cohort comparison of two jobs with the same cohort spec (same base values expected).
// usage: node pair.cjs <jobX> <jobY>   -> X minus Y by group, with normal 95% CI over cohorts
const [x, y] = process.argv.slice(2).map(id => require(`../../queue/done/${id}.json`).result);
const key = c => c.cohort ?? c.key ?? JSON.stringify(c);
const rows = (r) => r.perCohort ?? r.cohorts ?? [];
const ym = new Map(rows(y).map(c => [key(c), c]));
const by = {}; let baseMismatch = 0;
for (const c of rows(x)) { const d = ym.get(key(c)); if (!d) continue;
  if (Math.abs(c.base - d.base) > 1e-9) baseMismatch++;
  const g = c.group ?? c.threat ?? 'all'; (by[g] ??= []).push([key(c), c.cand - d.cand]); (by.ALL ??= []).push([key(c), c.cand - d.cand]); }
console.log('base mismatches', baseMismatch);
for (const [g, a] of Object.entries(by)) { const v = a.map(t => t[1]); const n = v.length, m = v.reduce((s, t) => s + t, 0) / n;
  const sd = Math.sqrt(v.reduce((s, t) => s + (t - m) ** 2, 0) / Math.max(1, n - 1)), h = 1.96 * sd / Math.sqrt(n);
  console.log(g.padEnd(10), 'n', n, 'diff', m.toFixed(4), `[${(m - h).toFixed(4)},${(m + h).toFixed(4)}]`, 'W/L', v.filter(t => t > 1e-9).length + '/' + v.filter(t => t < -1e-9).length,
    g === 'ALL' ? '' : a.filter(t => Math.abs(t[1]) > 1e-9).map(t => t[0] + ':' + t[1].toFixed(3)).join(' ')); }
