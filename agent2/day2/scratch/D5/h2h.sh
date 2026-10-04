for ph in "$@"; do for o in V6 V6Guard rev0 V4 zchain4; do node enum.mjs "[mkA({phase:0x$ph}), mkB()]" $o 200000 "A$ph" | head -1; done; done
