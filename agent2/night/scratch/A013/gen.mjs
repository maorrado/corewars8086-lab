// A013: generate B variants where captured zombies get their own DX/BP (and optionally gap).
// Main-path B behaviour: same instruction count and same parameter values as rev0;
// FAR_SEG obfuscation moved from DX to CX so DX/BP can be preloaded per path.
import fs from "node:fs";
const base = fs.readFileSync("../../revisions/rev0/B.asm", "utf8");
function make(name, zdx, zbp) {
  let s = base;
  const hdr = `; A013 variant ${name}: captured zombies (speed 2) use DX ${zdx}, BP ${zbp}; B main path keeps DX 2400h / BP 2C00h.\n; Base: rev0 V6nohunt B (Good_Test V6 friend-provided, small agent2 edits).\n`;
  s = s.replace("bits 16\n", "bits 16\n" + hdr);
  // main path: preload dx/bp right before the jump (moved from phoenix_init: same instruction count)
  s = s.replace("    add si, strict word worker - start\n    jmp short phoenix_init\n",
    "    add si, strict word worker - start\n    mov dx, 02400h\n    mov bp, 02C00h\n    jmp short phoenix_init\n");
  // zombie path: preload own values just before falling into phoenix_init
  s = s.replace("    add si, strict word worker - start\n\nphoenix_init:\n",
    `    add si, strict word worker - start\n    mov dx, ${zdx}\n    mov bp, ${zbp}\n\nphoenix_init:\n`);
  // FAR_SEG via CX instead of DX
  s = s.replace("    mov dx, [4A17h]\n", "    mov cx, [4A17h]\n");
  s = s.replace("    and dx, 0\n    or dx, 0FFBh\n    mov [bx + 2], dx\n", "    and cx, 0\n    or cx, 0FFBh\n    mov [bx + 2], cx\n");
  s = s.replace("    mov es, dx\n", "    mov es, cx\n");
  s = s.replace("    mov cx, 8\n    mov dx, 02400h\n    mov bp, 02C00h\n", "    mov cx, 8\n");
  fs.writeFileSync(`${name}_B.asm`, s);
}
make("z1000", "01C00h", "02C00h");   // zombie trail 1000h: same dwell in rounds as B at speed 2
make("z400", "02800h", "02C00h");    // zombie trail 400h
make("ctl", "02400h", "02C00h");     // control: zombie same as base (layout-only change)
make("zup", "0CC00h", "0D400h");     // zombies step upward 2C00h, trail 800h (high relative speed vs A and B)
