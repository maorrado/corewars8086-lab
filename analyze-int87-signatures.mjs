import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const roots = [
  path.join(root, "official-2025", "survivors-online"),
  path.join(root, "official-2025", "survivors-online-young"),
];
const chimera = [
  { name: "ChimeraA", bytes: fs.readFileSync(path.join(root, "build", "final", "ChimeraA")) },
  { name: "ChimeraB", bytes: fs.readFileSync(path.join(root, "build", "final", "ChimeraB")) },
];

function word(bytes, at) {
  return bytes[at] | (bytes[at + 1] << 8);
}

function lastMovImm(bytes, end, opcode) {
  for (let i = end - 3; i >= Math.max(0, end - 48); --i) {
    if (bytes[i] === opcode && i + 2 < end) return { offset: i, value: word(bytes, i + 1) };
  }
  return null;
}

function hexWord(value) {
  return value.toString(16).padStart(4, "0").toUpperCase();
}

function signatureBytes(ax, dx) {
  return Buffer.from([ax & 0xff, ax >> 8, dx & 0xff, dx >> 8]);
}

const records = [];
for (const directory of roots) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const file = path.join(directory, entry.name);
    const bytes = fs.readFileSync(file);
    for (let i = 0; i + 1 < bytes.length; ++i) {
      if (bytes[i] !== 0xcd || bytes[i + 1] !== 0x87) continue;
      const ax = lastMovImm(bytes, i, 0xb8);
      const dx = lastMovImm(bytes, i, 0xba);
      if (!ax || !dx) continue;
      const signature = signatureBytes(ax.value, dx.value);
      const hits = [];
      for (const target of chimera) {
        let from = 0;
        while (from <= target.bytes.length - signature.length) {
          const at = target.bytes.indexOf(signature, from);
          if (at < 0) break;
          hits.push({ target: target.name, offset: at });
          from = at + 1;
        }
      }
      records.push({
        file: path.relative(root, file).replaceAll("\\", "/"),
        int87Offset: i,
        ax: hexWord(ax.value),
        dx: hexWord(dx.value),
        signature: signature.toString("hex").toUpperCase(),
        hits,
      });
    }
  }
}

const unique = new Map();
for (const record of records) {
  const current = unique.get(record.signature) ?? { signature: record.signature, users: [], hits: record.hits };
  current.users.push(record.file);
  if (record.hits.length > current.hits.length) current.hits = record.hits;
  unique.set(record.signature, current);
}
const summary = [...unique.values()].sort((a, b) => b.hits.length - a.hits.length || b.users.length - a.users.length);
const output = { generatedAt: new Date().toISOString(), records, summary };
const outputPath = path.join(root, "experiments", "m050-search", "official-2025-int87-signatures.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`INT87 sites: ${records.length}; unique immediate signatures: ${summary.length}`);
for (const item of summary.filter((entry) => entry.hits.length)) console.log(JSON.stringify(item));
console.log(`wrote ${outputPath}`);
