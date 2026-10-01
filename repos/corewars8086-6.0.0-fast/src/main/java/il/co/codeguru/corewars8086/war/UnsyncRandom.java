package il.co.codeguru.corewars8086.war;

import java.util.Random;

/**
 * java.util.Random with the identical, spec-mandated 48-bit LCG, but a plain
 * long instead of an AtomicLong. Each War owns one instance and uses it from a
 * single thread, so the compare-and-swap Random performs on every draw (once
 * per living warrior per round) is pure overhead. Only next(int) and setSeed
 * are overridden; nextInt(int) etc. are inherited unchanged, so every value
 * drawn is bit-for-bit what java.util.Random would return.
 *
 * NOT thread-safe: must stay confined to the thread running its War.
 */
final class UnsyncRandom extends Random {
    private static final long MULTIPLIER = 0x5DEECE66DL;
    private static final long ADDEND = 0xBL;
    private static final long MASK = (1L << 48) - 1;

    // No field initializer on purpose: Random's constructor calls setSeed()
    // before subclass field initializers would run.
    private long state;

    UnsyncRandom() {
        super(0L);
    }

    @Override
    public void setSeed(long seed) {
        state = (seed ^ MULTIPLIER) & MASK;
        super.setSeed(seed); // keeps Random's own bookkeeping (e.g. nextGaussian) consistent
    }

    @Override
    protected int next(int bits) {
        state = (state * MULTIPLIER + ADDEND) & MASK;
        return (int) (state >>> (48 - bits));
    }
}
