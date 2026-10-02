// Minimal 16-bit 8086 disassembler (Intel syntax) for reading survivors/zombies.
// usage: node dis86.mjs <binary> [startOffsetHex]   (also exported: disasm(bytes, start, org))
import fs from "node:fs";

const R8 = ["al", "cl", "dl", "bl", "ah", "ch", "dh", "bh"];
const R16 = ["ax", "cx", "dx", "bx", "sp", "bp", "si", "di"];
const SEG = ["es", "cs", "ss", "ds"];
const EA = ["bx+si", "bx+di", "bp+si", "bp+di", "si", "di", "bp", "bx"];
const ALU = ["add", "or", "adc", "sbb", "and", "sub", "xor", "cmp"];
const SHF = ["rol", "ror", "rcl", "rcr", "shl", "shr", "(bad)", "sar"];
const JCC = ["jo", "jno", "jb", "jae", "jz", "jnz", "jbe", "ja", "js", "jns", "jp", "jnp", "jl", "jge", "jle", "jg"];
const h = (v, n = 4) => v.toString(16).toUpperCase().padStart(n, "0") + "h";
const s8 = (v) => (v > 127 ? v - 256 : v);

export function disasm(b, start = 0, org = 0) {
  const out = [];
  let i = start;
  while (i < b.length) {
    const at = i;
    let op = b[i++];
    const rd8 = () => b[i++] ?? 0;
    const rd16 = () => { const v = (b[i] ?? 0) | ((b[i + 1] ?? 0) << 8); i += 2; return v; };
    let prefix = "";
    if (op === 0xf2 || op === 0xf3) { prefix = op === 0xf3 ? "rep " : "repne "; op = rd8(); }
    const modrm = (w) => {
      const m = rd8(); const mod = m >> 6, reg = (m >> 3) & 7, rm = m & 7;
      let ea;
      if (mod === 3) ea = (w ? R16 : R8)[rm];
      else if (mod === 0 && rm === 6) ea = `[${h(rd16())}]`;
      else {
        const d = mod === 1 ? s8(rd8()) : mod === 2 ? rd16() : 0;
        ea = `[${EA[rm]}${mod === 0 ? "" : mod === 1 ? (d < 0 ? "-" + h(-d, 2) : "+" + h(d, 2)) : "+" + h(d)}]`;
      }
      return { mod, reg, rm, ea };
    };
    const sz = (w, mod) => (mod === 3 ? "" : w ? "word " : "byte ");
    let t;
    if (op < 0x40 && (op & 7) < 6) {
      const alu = ALU[op >> 3], f = op & 7, w = f & 1;
      if (f < 4) { const m = modrm(w); const r = (w ? R16 : R8)[m.reg]; t = f & 2 ? `${alu} ${r},${m.ea}` : `${alu} ${m.ea},${r}`; }
      else t = w ? `${alu} ax,${h(rd16())}` : `${alu} al,${h(rd8(), 2)}`;
    } else if (op < 0x20 && (op & 7) >= 6) t = `${(op & 1) ? "pop" : "push"} ${SEG[op >> 3]}`;
    else if (op >= 0x40 && op < 0x60) t = `${["inc", "dec", "push", "pop"][(op - 0x40) >> 3]} ${R16[op & 7]}`;
    else if (op >= 0x70 && op < 0x80) { const d = s8(rd8()); t = `${JCC[op - 0x70]} ${h((org + i + d) & 0xffff)}`; }
    else if (op >= 0x80 && op <= 0x83) { const w = op & 1; const m = modrm(w); const imm = op === 0x81 ? h(rd16()) : op === 0x83 ? h(s8(rd8()) & 0xffff) : h(rd8(), 2); t = `${ALU[m.reg]} ${sz(w, m.mod)}${m.ea},${imm}`; }
    else if (op === 0x84 || op === 0x85) { const w = op & 1; const m = modrm(w); t = `test ${m.ea},${(w ? R16 : R8)[m.reg]}`; }
    else if (op === 0x86 || op === 0x87) { const w = op & 1; const m = modrm(w); t = `xchg ${m.ea},${(w ? R16 : R8)[m.reg]}`; }
    else if (op >= 0x88 && op <= 0x8b) { const w = op & 1; const m = modrm(w); const r = (w ? R16 : R8)[m.reg]; t = op & 2 ? `mov ${r},${m.ea}` : `mov ${m.ea},${r}`; }
    else if (op === 0x8c || op === 0x8e) { const m = modrm(1); t = op === 0x8c ? `mov ${m.ea},${SEG[m.reg & 3]}` : `mov ${SEG[m.reg & 3]},${m.ea}`; }
    else if (op === 0x8d) { const m = modrm(1); t = `lea ${R16[m.reg]},${m.ea}`; }
    else if (op === 0x8f) { const m = modrm(1); t = `pop word ${m.ea}`; }
    else if (op === 0x90) t = "nop";
    else if (op > 0x90 && op < 0x98) t = `xchg ax,${R16[op & 7]}`;
    else if (op === 0x98) t = "cbw"; else if (op === 0x99) t = "cwd";
    else if (op === 0x9a) { const o = rd16(), s = rd16(); t = `call far ${h(s)}:${h(o)}`; }
    else if (op === 0x9b) { if (b[i] === 0x9b) { i++; t = "NRG (9B 9B)"; } else t = "(lone 9B: fatal)"; }
    else if (op === 0x9c) t = "pushf"; else if (op === 0x9d) t = "popf"; else if (op === 0x9e) t = "sahf"; else if (op === 0x9f) t = "lahf";
    else if (op >= 0xa0 && op <= 0xa3) { const a = h(rd16()); t = [`mov al,[${a}]`, `mov ax,[${a}]`, `mov [${a}],al`, `mov [${a}],ax`][op - 0xa0]; }
    else if (op >= 0xa4 && op <= 0xaf && op !== 0xa8 && op !== 0xa9) t = { 0xa4: "movsb", 0xa5: "movsw", 0xa6: "cmpsb", 0xa7: "cmpsw", 0xaa: "stosb", 0xab: "stosw", 0xac: "lodsb", 0xad: "lodsw", 0xae: "scasb", 0xaf: "scasw" }[op];
    else if (op === 0xa8) t = `test al,${h(rd8(), 2)}`; else if (op === 0xa9) t = `test ax,${h(rd16())}`;
    else if (op >= 0xb0 && op < 0xb8) t = `mov ${R8[op & 7]},${h(rd8(), 2)}`;
    else if (op >= 0xb8 && op < 0xc0) t = `mov ${R16[op & 7]},${h(rd16())}`;
    else if (op === 0xc2) t = `ret ${h(rd16())}`; else if (op === 0xc3) t = "ret";
    else if (op === 0xc4 || op === 0xc5) { const m = modrm(1); t = `${op === 0xc4 ? "les" : "lds"} ${R16[m.reg]},${m.ea}`; }
    else if (op === 0xc6 || op === 0xc7) { const w = op & 1; const m = modrm(w); t = `mov ${sz(w, m.mod)}${m.ea},${w ? h(rd16()) : h(rd8(), 2)}`; }
    else if (op === 0xca) t = `retf ${h(rd16())}`; else if (op === 0xcb) t = "retf";
    else if (op === 0xcc) t = "int3 (CC)"; else if (op === 0xcd) t = `int ${h(rd8(), 2)}`; else if (op === 0xcf) t = "iret";
    else if (op >= 0xd0 && op <= 0xd3) { const w = op & 1; const m = modrm(w); t = `${SHF[m.reg]} ${sz(w, m.mod)}${m.ea},${op & 2 ? "cl" : "1"}`; }
    else if (op === 0xd7) t = "xlatb";
    else if (op >= 0xe0 && op <= 0xe3) { const d = s8(rd8()); t = `${["loopnz", "loopz", "loop", "jcxz"][op - 0xe0]} ${h((org + i + d) & 0xffff)}`; }
    else if (op === 0xe8) { const d = rd16(); t = `call ${h((org + i + d) & 0xffff)}`; }
    else if (op === 0xe9) { const d = rd16(); t = `jmp ${h((org + i + d) & 0xffff)}`; }
    else if (op === 0xea) { const o = rd16(), s = rd16(); t = `jmp far ${h(s)}:${h(o)}`; }
    else if (op === 0xeb) { const d = s8(rd8()); t = `jmp short ${h((org + i + d) & 0xffff)}`; }
    else if (op === 0xf5) t = "cmc";
    else if (op === 0xf6 || op === 0xf7) { const w = op & 1; const m = modrm(w); const n = ["test", "(bad)", "not", "neg", "mul", "imul!", "div", "idiv!"][m.reg]; t = m.reg === 0 ? `test ${sz(w, m.mod)}${m.ea},${w ? h(rd16()) : h(rd8(), 2)}` : `${n} ${sz(w, m.mod)}${m.ea}`; }
    else if (op >= 0xf8 && op <= 0xfd) t = ["clc", "stc", "cli", "sti", "cld", "std"][op - 0xf8];
    else if (op === 0xfe || op === 0xff) { const w = op & 1; const m = modrm(w); const n = ["inc", "dec", "call", "call far", "jmp", "jmp far", "push", "(bad)"][m.reg]; t = `${n} ${m.reg >= 2 && m.reg <= 5 ? "" : sz(w, m.mod)}${m.ea}`; }
    else t = `db ${h(op, 2)}  ; (invalid/unsupported)`;
    const bytes = [...b.slice(at, i)].map((x) => x.toString(16).padStart(2, "0")).join(" ");
    out.push({ at: org + at, bytes, text: prefix + t, len: i - at });
  }
  return out;
}

if (import.meta.url.endsWith(process.argv[1]?.split(/[\\/]/).pop() ?? "")) {
  const b = fs.readFileSync(process.argv[2]);
  const st = process.argv[3] ? parseInt(process.argv[3], 16) : 0;
  for (const l of disasm(b, st)) console.log(`${l.at.toString(16).padStart(4, "0")}: ${l.bytes.padEnd(20)} ${l.text}`);
}
