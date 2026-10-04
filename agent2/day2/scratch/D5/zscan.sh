# args: zmode list-of-phases
zm=$1; shift
for ph in "$@"; do node solo2.mjs "[mkA({phase:0x$ph}), mkB()]" "A$ph" $zm; done
