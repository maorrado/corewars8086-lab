#!/bin/sh
# usage: mk.sh <name> <bp_zom20a> <bp_bd> <comment>
src=../../revisions/rev0/B.asm
out=$1_B.asm
sed -e "s/^    mov bp, 3400h$/    mov bp, $3/" \
    -e "s/^    mov bp, 2000h$/    mov bp, $2/" \
    -e "s/^    mov dx, \[4A17h\]$/    lea dx, [bp + 0FFBh]          ; A042: main path BP=0 -> 0FFBh; zombie paths carry K in BP low byte/" \
    -e "s/^    and dx, 0$/    and dx, 000FFh                ; A042: keep low byte (FB+K)/" \
    -e "s/^    or dx, 0FFBh$/    or dh, 0Fh                    ; A042: FAR_SEG = 0F00h + low byte/" \
    $src > $out
sed -i "s/^; agent2 label form.*/&\n; A042 (wave 9): captured zombies on their own anchor lattice: $4\n; Main path unchanged in effect (BP=0 -> FAR_SEG 0FFBh); same size and instruction counts as rev0./" $out
