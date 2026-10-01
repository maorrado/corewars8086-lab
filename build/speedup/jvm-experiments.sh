#!/bin/bash
# JVM version / flag experiments, isolated: other JDKs are only invoked by path here,
# nothing in tools/ or in the active run configuration changes.
# Workload: fast BatchRunner, 8 threads, the 10 verification cases x2 (1000 wars),
# every output byte-compared to the original engine's --parallel=false reference.
cd /c/Users/ronyr/codeguru-work/corewars8086-lab
FAST=repos/corewars8086-6.0.0-fast/target/corewars8086-6.0.0-jar-with-dependencies.jar
J8=tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe
J21=/c/Users/ronyr/.vscode/extensions/redhat.java-1.56.0-win32-x64/jre/21.0.12.1-win32-x86_64/bin/java.exe
J25=/c/Users/ronyr/.jdks/openjdk-25.0.1/bin/java.exe
ROUNDS=${1:-2}
run() { # label java opts...
  local label=$1 bin=$2; shift 2
  JAVA_BIN=$bin JVM_OPTS="$*" node build/speedup/verify.mjs batch $FAST 8 2 | tail -1 | sed "s|^|$label: |"
}
for r in $(seq 1 $ROUNDS); do
  echo "== round $r"
  run j8-default $J8
  run j8-notiered $J8 -XX:-TieredCompilation
  run j8-aggressive $J8 -XX:+AggressiveOpts
  run j8-inline15 $J8 -XX:MaxInlineLevel=15 -XX:InlineSmallCode=2500
  run j8-bigyoung $J8 -Xms2g -Xmn1g
  run j21-default $J21
  run j21-parallelgc $J21 -XX:+UseParallelGC
  run j25-default $J25
  run j25-parallelgc $J25 -XX:+UseParallelGC
done
