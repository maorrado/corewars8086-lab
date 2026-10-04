// A039 builder: derives candidates from rev0 B.asm
const fs=require('fs');
const base=fs.readFileSync('agent2/night/revisions/rev0/B.asm','utf8');
function edit(s,pairs){for(const [a,b] of pairs){if(!s.includes(a))throw new Error('missing '+a);s=s.replace(a,b)}return s}
const hdr='; offsets replaced by label arithmetic with the original operand widths.\n';
const locB=edit(base,[
 [hdr,hdr+"; A039 variant locB: both b/d EB F9 CC CC searches start at B's own location\n; (startup DI = load address, zombie_entry DI = [4A17h]) instead of DI=0, so\n; we target the first b/d zombie below B rather than the topmost one that every\n; top-down tail consumer (V6 family, MOV_AX_WIN, LowKey, ...) races for.\n"],
 ['start:\n    mov si, ax\n    lea bx, [word si + zombie_entry - start]','start:\n    mov di, ax\n    lea bx, [word di + zombie_entry - start]'],
 ['    cld\n    mov ax, si\n    mov al, ah','    cld\n    mov ax, di\n    mov al, ah'],
 ['    mov al, 0A2h\n    add si, strict word worker - start\n    jmp short phoenix_init','    mov al, 0A2h\n    lea si, [word di + worker - start]\n    jmp short phoenix_init'],
 ['zombie_entry:\n    xor di, di\n','zombie_entry:\n    mov di, [4A17h]\n'],
]);
fs.writeFileSync('agent2/night/scratch/A039/locB.asm',locB);
// combo: B084 p0f13 + locB start-DI
const p=fs.readFileSync('agent2/night/scratch/B084/p0f13B.asm','utf8');
const combo=edit(p,[
 ['; extra instructions. Startup INT 87h stays the 12th instruction.\n','; extra instructions. Startup INT 87h stays the 12th instruction.\n; A039 (wave 8) adds locB: both b/d searches start at B\'s own location (startup DI = load address,\n; zombie_entry DI = [4A17h]) instead of DI=0; les bp (dummy) keeps ES=1000h without touching DI.\n'],
 ['start:\n    mov si, ax\n    lea bx, [word si + zombie_entry - start]','start:\n    mov di, ax\n    lea bx, [word di + zombie_entry - start]'],
 ['    les di, [si + es_ptr - start]','    les bp, [di + es_ptr - start]'],
 ['    cld\n    mov ax, si\n    mov al, ah','    cld\n    mov ax, di\n    mov al, ah'],
 ['    mov al, 0A2h\n    add si, strict word worker - start\n    jmp short phoenix_init','    mov al, 0A2h\n    lea si, [word di + worker - start]\n    jmp short phoenix_init'],
 ['zombie_entry:\n    xor di, di\n','zombie_entry:\n    mov di, [4A17h]\n'],
]);
fs.writeFileSync('agent2/night/scratch/A039/p0f13locB.asm',combo.replace('; B064: ES=1000h (arena), DI=0 (as before)','; ES=1000h (arena); BP is a dummy, DI keeps the load address (A039)'));
