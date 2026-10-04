# Odd-page strides with short recurring dwell

Source/design only; awaiting root review. Two paired arms and four component sources are planned. No B-only sweep, assembly, entropy, configs, or battles are included. No partial shorter-dwell results were read, and that frozen experiment is untouched.

## Hypothesis and exact change

Test whether short exposed-anchor dwell can retain the baseline's full *ideal stack-trail coverage support* by reducing the stride's greatest common divisor with the 64 KiB arena. This is a general recurring-geometry hypothesis, not an opponent-specific patch or a bootstrap optimization.

| Arm | A BP / DX | B BP / DX | Steady trail per warrior |
| --- | --- | --- | --- |
| Exact m050 control | 3C00 / 3800 | 4400 / 4000 | 0400h = 1024 bytes |
| lower-strides | 3B00 / 3A00 | 4300 / 4200 | 0100h = 256 bytes |
| upper-strides | 3D00 / 3C00 | 4500 / 4400 | 0100h = 256 bytes |

BP/DX entries are hexadecimal. Only their initializer immediates change: two source characters and two binary bytes per component. A's byte offsets are 0xA1/0xA4; B's are 0x59/0x5C. Keep anchor low byte A2h, initial A/B/captured phases 10h/34h/54h, initial SP gaps 0200h/0280h, all copy counts, capture logic, image lengths 189/117, and the exact 17-byte worker `a5f3a529d4292f8b3fb10931f6ab4fff1f`. The same A initializer is used by the captured path, so both paired arms also change its recurring stride/dwell. Initial positions stay fixed; subsequent anchor coordinates/order do not.

The source generator hash-checks immutable `final/ChimeraA.asm`, `final/ChimeraB.asm` and `build/final/ChimeraA/B`. Exact baseline binary SHA-256:

- A: `0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44`
- B: `06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782`

## Coverage derivation

Let the intact far anchor be P, with CS=0FFCh and SS=1000h. Its arena coordinate is `a=P-40h mod 65536`. After the recursive CALL overwrites its own anchor, `SP=a`. The worker sets `SP'=a-DX` and the next anchor to `a'=a-BP`. Therefore the far-CALL trail lies in the circular half-open interval `[a', a'+M)`, where `M=BP-DX`; four bytes are pushed per CALL. These are modeled stack writes only, excluding startup and copy traffic.

The recurring anchor orbit has `N=65536/gcd(BP,65536)` points. These points form one residue class modulo the gcd. Consequently, when `M=gcd`, the N circular intervals tile all 65,536 byte positions exactly once. When `M<gcd`, they leave permanent gaps under this intact steady-loop model, regardless of repeated visits.

For baseline BP=3C00h/4400h, gcd=0400h and N=64. The 0400h trails tile the arena. Retaining those strides but using 0200h/0100h trails paints only 32,768/16,384 unique bytes per recurring orbit; looping faster does not close those geometric holes. This statement concerns each warrior's ideal recurring stack-trail support, not all writes made by the whole team, captured zombies, startup, or enemies.

The new strides are `256*59`, `256*67`, `256*61`, and `256*69`. Each multiplier is odd, so gcd=0100h and N=256. A 0100h trail therefore tiles the full arena once per ideal orbit. Anchor low byte A2h remains fixed; the arena interval starts at low byte 62h, so intervals cross page boundaries. This translation does not affect the tiling proof. `generate.mjs --check` independently enumerates every anchor and every painted byte, including circular wraparound, and asserts 256 anchors and paint multiplicity exactly one at all 65,536 positions for each candidate.

## Cost and limitations

Each new trail needs 64 far CALLs instead of 256, reducing uninterrupted anchor dwell. However, a complete geometric paint orbit still uses 16,384 far CALLs in both baseline and candidates: `64*256 = 256*64`. The candidates add four times as many worker transitions/copies (256 versus 64). With an intact unchanged worker, this increases full-orbit instruction cost and reduces paint throughput by adding movement/copy overhead. It is not a free coverage-rate improvement.

Full support is an eventual finite-orbit property, not equal coverage at a fixed round, survival to complete an orbit, immunity to altered anchors, or improved scores. The new anchor sequences and timing change self/partner/captured collisions and exposure to every opponent. The original bootstrap self-overwrite edge cases still require original-engine validation; identical instruction widths alone do not establish healthy recurrence at all load positions. Preserve existing baseline failures separately from any new failures. Test A, B, and captured-A across load offsets and wraparound before any screen.

## Relevant prior work and duplication check

The stride values themselves are not new. `generate-chimera-focused.mjs` tested B=4300h/4500h (`m004`/`m005`, plus later combinations) and A=3B00h/3D00h (`m041`/`m042`), but with margin 0400h, not 0100h. On the older 200-battle focused screen, team points/battle were 0.490833330, 0.504999995, 0.515833325, and 0.451666660 respectively, versus `m001` 0.548333315. Sources: `experiments/{m001,m004,m005,m041,m042}-focused-screen-501.json`. Those older variants also differ in startup/phases/capture and candidate name labels; they are negative historical screens, not exact modern matched estimates. Their odd-page stride plus 0400h trail revisits each geometric byte four times per complete orbit; the proposed 0100h trail removes that overlap.

`generate-chimera-asymmetric.mjs` also includes odd-page A/B strides on an older base with 0400h margins. `generate-chimera-extensions.mjs` keeps margin 0400h; the targeted m050 step-defense generators use other 0400h-multiple strides. Prior `y015`/`l023` reduced margin to 0200h but did not combine these odd-page strides with 0100h trails on exact m050. The running shorter-dwell screen retains the old BP values and is a separate geometry experiment; its outcomes were not used in this design.

The four predicted component hashes had no matches among 2,033 existing 117/189-byte files checked under `build/chimera*`, `build/m050*`, and `build/codex-goal*`, or in JSON records searched under `experiments/` and `candidates/generated/`. `build/official-runs` was excluded. This scoped negative duplicate check is not proof about unrecorded binaries. Predicted hashes:

- A-lower: `c2c64f994af48d1e82e76071db5d904ae23678a8aafd465dc7a82039a6dc2c2b`
- B-lower: `b40603e61caf3a28d8228a1219319a4badfd5a68666d177617f13268e28e17c1`
- A-upper: `87155e106697229096aef3d27ba632741791bcd8b1fde3d0cd6d6acc4c900ebf`
- B-upper: `ee615b6f885e038c27fe787bc7be21904f502b1b0d948e462f053f950315a1eb`

## Invocation after review

```powershell
# Read-only source, predicted-byte, and finite coverage checks; also the default:
node C:\Maor\CodeGuru\corewars8086-lab\candidates\generated\codex-goal-20261001\coverage-dwell\generate.mjs --check
# Only after root review; refuses existing output:
node C:\Maor\CodeGuru\corewars8086-lab\candidates\generated\codex-goal-20261001\coverage-dwell\generate.mjs --write
```

`--write` creates only four `.asm` component files and a design manifest. Original m050 source comments remain byte-preserved; manifest IDs identify the variants. Predicted binary hashes are obtained by two in-memory immediate-byte patches, not assembly. Later assembly must match every predicted byte/hash and unchanged size before semantic validation. Any subsequent screen/holdout requires a separately reviewed frozen protocol. Neither arithmetic nor a smoke pass is evidence of competitive improvement or permission to replace final files.
