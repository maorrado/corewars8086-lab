import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const root = path.join(repo, 'experiments/claude-e1p3-screen-20261001');
const baselineFile = path.join(repo, 'candidates/generated/claude-e1-confirmation-20261001/analysis.json');
const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const t95df7 = 2.3646242510102993;
const panelScores = [], files = [];
for (let i = 1; i <= 8; i++) {
  const id = String(i).padStart(2, '0');
  const configFile = path.join(root, `configs/panel-${id}-e1p3.json`);
  const priorConfigFile = path.join(repo, `candidates/generated/claude-e1-confirmation-20261001/frozen/panel-${id}-m050.json`);
  const resultFile = path.join(root, `accelerated/panel-${id}-e1p3/result.json`);
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  const priorConfig = JSON.parse(fs.readFileSync(priorConfigFile, 'utf8'));
  const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  if (result.aggregate?.battles !== 1250 || result.configSha256 !== sha(configFile)) throw new Error(`bad panel result/config ${id}`);
  const normalize = c => ({ seeds:c.seeds, battles:c.battles, cohorts:c.cohorts, zombies:c.zombies, threads:c.threads, parallel:c.parallel });
  if (JSON.stringify(normalize(config)) !== JSON.stringify(normalize(priorConfig))) throw new Error(`panel inputs/seeds changed ${id}`);
  const base = baseline.panelScores.find(row => row.panel === `panel-${id}`)?.scores;
  if (!base) throw new Error(`baseline panel missing ${id}`);
  panelScores.push({ panel:`panel-${id}`, e1p3:result.aggregate.teamPerBattle, ...base });
  files.push(...[configFile,resultFile].map(file=>({path:file,bytes:fs.statSync(file).size,sha256:sha(file)})));
}
function contrast(reference) {
  const deltas = panelScores.map(row=>row.e1p3-row[reference]);
  const mean=deltas.reduce((s,x)=>s+x,0)/deltas.length;
  const sd=Math.sqrt(deltas.reduce((s,x)=>s+(x-mean)**2,0)/(deltas.length-1));
  const margin=t95df7*sd/Math.sqrt(deltas.length);
  return {candidate:'e1p3',reference,delta:mean,nominal95PairedPanelCI:[mean-margin,mean+margin],classification:mean-margin>0?'higher-in-this-screen':mean+margin<0?'lower-in-this-screen':'inconclusive',byPanel:deltas.map((delta,i)=>({panel:`panel-${String(i+1).padStart(2,'0')}`,delta}))};
}
const output={status:'COMPLETE_REUSED_SEED_SCREEN',recordedAt:new Date().toISOString(),
  interpretation:'Exploratory only: exact same eight panel/cohort/seed inputs as the completed prior confirmation. It is not fresh holdout evidence and cannot independently verify Claude’s superiority claim.',
  metric:'team points per candidate appearance, not battle-win percentage',baselineManifestSha256:baseline.manifestSha256,
  battles:10000,pooled:Object.fromEntries(['m049','m050','c090','e1','e1p3'].map(key=>[key,panelScores.reduce((s,row)=>s+row[key],0)/8])),
  contrasts:['m049','m050','c090','e1'].map(contrast),panelScores,
  limitation:'Eight panel means are the paired uncertainty units; the reused seeds/panel groupings make these results selection-screen data only. The same 75 online-stage 2025 entrants are not a verified historical final roster.',
  files:[{path:baselineFile,bytes:fs.statSync(baselineFile).size,sha256:sha(baselineFile)},...files]};
const out=path.join(root,'analysis.json');
fs.writeFileSync(out,`${JSON.stringify(output,null,2)}\n`,{flag:'wx'});
console.log(JSON.stringify({status:output.status,pooled:output.pooled,contrasts:output.contrasts.map(({reference,delta,nominal95PairedPanelCI,classification})=>({reference,delta,nominal95PairedPanelCI,classification})),out,sha256:sha(out)},null,2));
