for k in -4 -3 -2 -1 1 2 3 4 5 6 7 8; do
  ph=$(( 0x2c + 4*k )); ph=$(( (ph + 256) % 256 ))
  for o in V6 V6Guard rev0; do node enum.mjs "[mkA({phase:$ph}), mkB()]" $o 200000 "Aphase$(printf %x $ph)" | head -1; done
done
