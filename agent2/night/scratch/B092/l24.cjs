// B092: 2024live group means per arm across all confirm jobs
const fs=require('fs');
for (const f of fs.readdirSync('queue/done').filter(f=>f.includes('confirm'))) {
  const j=JSON.parse(fs.readFileSync('queue/done/'+f)); const m=j.result&&j.result.means; if(!m) continue;
  console.log(j.job.salt, j.job.note.slice(0,28).padEnd(28), '|', Object.entries(m).map(([k,v])=>k+':'+v['2024live']).join(' '));
}
