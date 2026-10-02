// Generate isolated classpath overlays. Original source/JAR are never written.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '../..');
const origin = path.join(root, 'repos/corewars8086-6.0.0-deterministic');
const jar = path.join(origin, 'target/corewars8086-6.0.0-jar-with-dependencies.jar');
const expectedJar = '31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
if (hash(fs.readFileSync(jar)) !== expectedJar) throw new Error('Original engine changed');
const packagePath = 'il/co/codeguru/corewars8086';
const paths = ['cpu/Cpu.java', 'memory/RestrictedAccessRealModeMemory.java', 'memory/RealModeMemoryImpl.java'];
const originals = Object.fromEntries(paths.map(file => [file, fs.readFileSync(path.join(origin, 'src/main/java', packagePath, file), 'utf8').replace(/\r\n/g, '\n')]));
function replaceOnce(text, before, after) {
  if (text.split(before).length !== 2) throw new Error(`Nonunique/missing patch anchor: ${before}`);
  return text.replace(before, after);
}
const modified = { ...originals };
modified['memory/RealModeMemoryImpl.java'] = replaceOnce(modified['memory/RealModeMemoryImpl.java'], '    /** Listener to memory events */', `    /**
     * Internal exact-implementation INT87 read-only scan. The caller proves
     * the complete non-wrapping segment readable for this instruction.
     * Every comparison reads current memory; no bytes or matches are cached.
     */
    int findCurrentSegmentPattern(short segment, short initialOffset,
                                  boolean backwards, short first, short second) {
        final int base = (segment & 0xFFFF) << 4;
        final int firstWord = first & 0xFFFF;
        final int secondWord = second & 0xFFFF;
        final int step = backwards ? -1 : 1;
        int offset = initialOffset & 0xFFFF;
        for (int i = 0; i <= 0xFFFF; ++i, offset = (offset + step) & 0xFFFF) {
            final int low = (m_data[base + offset] & 0xFF)
                | ((m_data[base + ((offset + 1) & 0xFFFF)] & 0xFF) << 8);
            if (low == firstWord) {
                final int high = (m_data[base + ((offset + 2) & 0xFFFF)] & 0xFF)
                    | ((m_data[base + ((offset + 3) & 0xFFFF)] & 0xFF) << 8);
                if (high == secondWord) return offset;
            }
        }
        return -1;
    }

    /** Listener to memory events */`);
modified['memory/RestrictedAccessRealModeMemory.java'] = replaceOnce(modified['memory/RestrictedAccessRealModeMemory.java'], '    /** Wrapped RealModeMemory implementation */', `    /**
     * Optional INT87 fast path. -2 means unsupported: the CPU must execute
     * the original ordered reads, including their original fault behavior.
     * Validate permissions anew every call; region arrays can be mutable.
     */
    public int findCurrentSegmentPattern(short segment, short initialOffset,
                                         boolean backwards, short first, short second) {
        if (getClass() != RestrictedAccessRealModeMemory.class
                || m_memory == null || m_memory.getClass() != RealModeMemoryImpl.class
                || m_readAccessRegions == null) return -2;
        final int base = (segment & 0xFFFF) << 4;
        if (base + 0xFFFF >= RealModeAddress.MEMORY_SIZE) return -2;
        final RealModeAddress begin = new RealModeAddress(segment, (short)0);
        final RealModeAddress end = new RealModeAddress(segment, (short)0xFFFF);
        for (RealModeMemoryRegion region : m_readAccessRegions) {
            // Do not bypass custom permission predicates or their side effects.
            if (region == null || region.getClass() != RealModeMemoryRegion.class) return -2;
        }
        for (RealModeMemoryRegion region : m_readAccessRegions) {
            if (region.isInRegion(begin) && region.isInRegion(end)) {
                return ((RealModeMemoryImpl)m_memory).findCurrentSegmentPattern(
                    segment, initialOffset, backwards, first, second);
            }
        }
        return -2;
    }

    /** Wrapped RealModeMemory implementation */`);
modified['cpu/Cpu.java'] = replaceOnce(modified['cpu/Cpu.java'], 'import il.co.codeguru.corewars8086.memory.RealModeMemory;', 'import il.co.codeguru.corewars8086.memory.RealModeMemory;\nimport il.co.codeguru.corewars8086.memory.RestrictedAccessRealModeMemory;');
modified['cpu/Cpu.java'] = replaceOnce(modified['cpu/Cpu.java'], `            m_state.setBomb2Count((byte)(bombCount - 1));

            for (int i = 0; i <= 0xFFFF; ++i) {`, `            m_state.setBomb2Count((byte)(bombCount - 1));

            if (m_state.getClass() == CpuState.class
                    && m_memory.getClass() == RestrictedAccessRealModeMemory.class) {
                int match = ((RestrictedAccessRealModeMemory)m_memory).findCurrentSegmentPattern(
                    m_state.getES(), m_state.getDI(), m_state.getDirectionFlag(),
                    m_state.getAX(), m_state.getDX());
                if (match != -2) {
                    if (match >= 0) {
                        RealModeAddress address1 = new RealModeAddress(m_state.getES(), (short)match);
                        RealModeAddress address2 = new RealModeAddress(m_state.getES(), (short)(match + 2));
                        // Keep ordered writes and all permission checks/listeners.
                        m_memory.writeWord(address1, m_state.getBX());
                        m_memory.writeWord(address2, m_state.getCX());
                    }
                    return;
                }
            }

            for (int i = 0; i <= 0xFFFF; ++i) {`);

for (const [variant, sources] of [['source-control', originals], ['int87', modified]]) {
  const destination = path.join(import.meta.dirname, variant);
  if (fs.existsSync(destination)) throw new Error(`Refusing to overwrite ${destination}`);
  fs.mkdirSync(path.join(destination, 'classes'), { recursive: true });
  const written = [];
  for (const [file, source] of Object.entries(sources)) {
    const target = path.join(destination, 'src', packagePath, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, source, { flag: 'wx' });
    written.push(target);
  }
  const javac = path.join(root, 'tools/temurin8-jdk/jdk8u504-b01/bin/javac.exe');
  const args = ['-encoding', 'UTF-8', '-source', '8', '-target', '8', '-cp', jar, '-d', path.join(destination, 'classes'), ...written];
  const child = spawnSync(javac, args, { encoding: 'utf8', windowsHide: true });
  const result = { variant, engineSha256: expectedJar, javaCompiler: javac, args,
    sourceHashes: written.map((file, i) => ({ path: file, sha256: hash(fs.readFileSync(file)), originalSha256: hash(originals[paths[i]]) })),
    exitCode: child.status, stdout: child.stdout, stderr: child.stderr };
  fs.writeFileSync(path.join(destination, 'build.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  if (child.status !== 0) throw new Error(JSON.stringify(result));
  console.log(`Built isolated ${variant}`);
}
