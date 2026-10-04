import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const frozen = path.join(here, 'holdout/frozen');
const root = path.join(repo, 'experiments/claude-e1p3-holdout-20261001');
const manifestFile = path.join(frozen, 'manifest.json');
const hashBytes = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const hash = file => hashBytes(fs.readFileSync(file));
const manifestBytes = fs.readFileSync(manifestFile);
if (hashBytes(manifestBytes) !== fs.readFileSync(`${manifestFile}.sha256`, 'utf8').trim()) throw new Error('holdout manifest checksum mismatch');
const manifest = JSON.parse(manifestBytes);
const design = manifest.design;
for (const item of manifest.files) {
  if (!fs.existsSync(item.path) || fs.statSync(item.path).size !== item.bytes || hash(item.path) !== item.sha256)
    throw new Error(`frozen input changed: ${item.path}`);
}
const scores = Object.fromEntries(design.arms.map(arm => [arm, []]));
const resultRecords = [];
for (let panel = 1; panel <= 8; panel++) {
  const id = `panel-${String(panel).padStart(2, '0')}`;
  for (const arm of design.arms) {
    const configFile = path.join(frozen, `${id}-${arm}.json`);
    const resultFile = path.join(root, 'accelerated', `${id}-${arm}`, 'result.json');
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
    if (hash(configFile) !== result.configSha256) throw new Error(`config identity mismatch: ${id}-${arm}`);
    if (result.aggregate?.battles !== design.battlesPerArm / design.panels || result.runs?.length !== 50)
      throw new Error(`wrong/incomplete panel size: ${id}-${arm}`);
    if (result.researchExecution?.mode !== 'isolated-persistent-serial'
        || result.researchExecution.overlays?.length !== 0
        || result.researchExecution.baseEngine?.sha256 !== manifest.engine.sha256)
      throw new Error(`holdout did not use pinned original no-overlay engine: ${id}-${arm}`);
    if (JSON.stringify(result.config.seeds) !== JSON.stringify(config.seeds)
        || JSON.stringify(result.config.cohorts) !== JSON.stringify(config.cohorts)
        || result.config.battles !== config.battles)
      throw new Error(`run does not match frozen panel: ${id}-${arm}`);
    scores[arm].push(result.aggregate.teamPerBattle);
    resultRecords.push({ panel:id, arm, config:{path:configFile,bytes:fs.statSync(configFile).size,sha256:hash(configFile)},
      result:{path:resultFile,bytes:fs.statSync(resultFile).size,sha256:hash(resultFile)}, planSha256:result.researchExecution.planSha256 });
  }
}
const summaries = Object.fromEntries(Object.entries(scores).map(([arm, values]) => [arm, values.reduce((sum,x)=>sum+x,0)/values.length]));
const critical = design.confidence.criticalValue;
function compare(candidate, reference) {
  const deltas=scores[candidate].map((value,index)=>value-scores[reference][index]);
  const mean=deltas.reduce((sum,x)=>sum+x,0)/deltas.length;
  const sd=Math.sqrt(deltas.reduce((sum,x)=>sum+(x-mean)**2,0)/(deltas.length-1));
  const margin=critical*sd/Math.sqrt(deltas.length);
  return {candidate,reference,delta:mean,conservativeFamilywiseCI:[mean-margin,mean+margin],criticalValue:critical,
    classification:mean-margin>0?'higher-under-holdout-protocol':mean+margin<0?'lower-under-holdout-protocol':'inconclusive',
    pairedPanelDeltas:deltas.map((delta,index)=>({panel:`panel-${String(index+1).padStart(2,'0')}`,delta}))};
}
const comparisons=[];
for(const candidate of design.arms.filter(arm=>arm!=='m049'&&arm!=='m050'))
  for(const reference of ['m049','m050']) comparisons.push(compare(candidate,reference));
if(design.arms.includes('relay-a')||design.arms.includes('relay-b')||design.arms.includes('relay-ab'))
  comparisons.push(compare(design.arms.find(arm=>arm.startsWith('relay-')),'e1p3'));
const output={status:'COMPLETE_FRESH_HOLDOUT',recordedAt:new Date().toISOString(),manifestSha256:hashBytes(manifestBytes),
  design,pooledPointsPerAppearance:summaries,comparisons,panelScores:Object.fromEntries(Object.entries(scores).map(([arm,values])=>[arm,values])),
  interpretation:'All holdout battles ran on the exact pinned deterministic v6 JAR with no gameplay overlays. Nominal conservative t intervals use eight randomized panel means; they are familywise-conservative for the predeclared contrasts, not universal or unseen-opponent proof.',
  limitation:'Fresh independent seeds and new random regroupings of the same 75 published 2025 online-stage teams and same four Zombies. Not a verified historical 2025 final roster or unseen-opponent validation.',
  files:resultRecords};
const outputPath=path.join(root,'analysis.json');
fs.writeFileSync(outputPath,`${JSON.stringify(output,null,2)}\n`,{flag:'wx'});
console.log(JSON.stringify({status:output.status,pooledPointsPerAppearance:summaries,comparisons:comparisons.map(({candidate,reference,delta,conservativeFamilywiseCI,classification})=>({candidate,reference,delta,conservativeFamilywiseCI,classification})),outputPath,outputSha256:hash(outputPath)},null,2));
