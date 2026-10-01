#!/bin/bash
# Ablation of the engine speedups: BatchRunner, 1 thread, the 10 verification cases (500 wars).
# Each flag restores the ORIGINAL code of one change. Every run is also byte-checked.
cd /c/Users/ronyr/codeguru-work/corewars8086-lab
JAR=repos/corewars8086-6.0.0-ablation/target/corewars8086-6.0.0-jar-with-dependencies.jar
ALL="multicaster memevents count fill random regions"
flags() { local out=""; for f in "$@"; do out="$out -Dcw.orig.$f=true"; done; echo "$out"; }
ROUNDS=${1:-2}
for r in $(seq 1 $ROUNDS); do
  echo "== round $r"
  JVM_OPTS="" node build/speedup/verify.mjs batch $JAR 1 | tail -1 | sed 's/^/all-new: /'
  JVM_OPTS="$(flags $ALL)" node build/speedup/verify.mjs batch $JAR 1 | tail -1 | sed 's/^/all-orig: /'
  for f in $ALL; do
    JVM_OPTS="$(flags $f)" node build/speedup/verify.mjs batch $JAR 1 | tail -1 | sed "s/^/revert-only-$f: /"
    others=$(for g in $ALL; do [ "$g" != "$f" ] && echo -n "$g "; done)
    JVM_OPTS="$(flags $others)" node build/speedup/verify.mjs batch $JAR 1 | tail -1 | sed "s/^/apply-only-$f: /"
  done
done
