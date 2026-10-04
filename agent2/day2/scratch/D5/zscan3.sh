for ph in "$@"; do for zm in 1 3; do T0S=50 RR=100000 node solo3.mjs "[mkA({phase:0x$ph}), mkB()]" "A$ph" $zm; done; T0S=0 RR=100000 node solo3.mjs "[mkA({phase:0x$ph}), mkB()]" "A$ph" 0; done
