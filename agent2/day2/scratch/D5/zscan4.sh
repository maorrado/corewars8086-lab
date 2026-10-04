for ph in "$@"; do T0S=43,45,47 RR=100000 node solo3.mjs "[mkA({phase:0x$ph}), mkB()]" "A$ph" 1; done
