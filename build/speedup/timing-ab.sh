#!/bin/bash
# Interleaved timing of the ways to run the same 10 verification cases (500 wars).
# Every round runs every variant once, so thermal drift hits all variants alike.
cd /c/Users/ronyr/codeguru-work/corewars8086-lab
ORIG=repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar
FAST=repos/corewars8086-6.0.0-fast/target/corewars8086-6.0.0-jar-with-dependencies.jar
ROUNDS=${1:-3}
for r in $(seq 1 $ROUNDS); do
  echo "== round $r"
  node build/speedup/verify.mjs check $ORIG --threads 4 | tail -1 | sed 's/^/orig-perjvm-t4: /'
  node build/speedup/verify.mjs check $FAST --threads 4 | tail -1 | sed 's/^/fast-perjvm-t4: /'
  node build/speedup/verify.mjs batch $FAST 8 | tail -1 | sed 's/^/fast-batch-t8: /'
  node build/speedup/verify.mjs batch $FAST 4 | tail -1 | sed 's/^/fast-batch-t4: /'
done
echo "== repeat test: every case 3x in one JVM"
node build/speedup/verify.mjs batch $FAST 8 3 | tail -1
