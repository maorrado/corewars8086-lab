import java.lang.management.ManagementFactory;

/**
 * Deferred startup/class-loading probe. Does not construct a competition,
 * read warrior directories, run battles, mutate the engine, or attach to a JVM.
 * Compare external process wall time with these internal timings. Class loading
 * is not battle-method JIT warm-up, so this cannot alone estimate batching gain.
 */
public final class RuntimeEnvelopeProbe {
    public static void main(String[] args) throws Exception {
        String mode = args.length == 0 ? "cold" : args[0];
        if (args.length > 1 || !(mode.equals("cold") || mode.equals("classes"))) {
            throw new IllegalArgumentException("usage: RuntimeEnvelopeProbe [cold|classes]");
        }
        long before = System.nanoTime();
        long uptimeAtEntry = ManagementFactory.getRuntimeMXBean().getUptime();
        if (mode.equals("classes")) {
            String[] classes = {
                "com.google.devtools.common.options.OptionsParser",
                "il.co.codeguru.corewars8086.cli.Options",
                "il.co.codeguru.corewars8086.cli.HeadlessCompetitionRunner",
                "il.co.codeguru.corewars8086.war.Competition",
                "il.co.codeguru.corewars8086.war.CompetitionIterator",
                "il.co.codeguru.corewars8086.war.WarriorRepository",
                "il.co.codeguru.corewars8086.war.War",
                "il.co.codeguru.corewars8086.cpu.Cpu",
                "il.co.codeguru.corewars8086.memory.RealModeMemoryImpl"
            };
            for (String name : classes) Class.forName(name);
        }
        double internalMillis = (System.nanoTime() - before) / 1000000.0;
        System.out.printf(java.util.Locale.ROOT,
            "mode=%s,uptimeAtEntryMs=%d,internalMs=%.3f,uptimeAtExitMs=%d%n",
            mode, uptimeAtEntry, internalMillis,
            ManagementFactory.getRuntimeMXBean().getUptime());
    }
}
