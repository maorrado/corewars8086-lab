import java.util.zip.CRC32;
import java.nio.charset.StandardCharsets;

/**
 * Prints one CRC per block of 65,536 consecutive float bit patterns, over every float in
 * [lo, hi), of the strings Float.toString produces (the score files are written with
 * "" + float). Running it on two JDKs and diffing the output shows whether any score value
 * in that range would be written differently. Also covers 0.0f.
 * Usage: java FloatFormatCheck 0.125 1024
 */
public class FloatFormatCheck {
    public static void main(String[] args) {
        float lo = Float.parseFloat(args[0]);
        float hi = Float.parseFloat(args[1]);
        int from = Float.floatToIntBits(lo);
        int to = Float.floatToIntBits(hi);
        System.out.println("zero " + ("" + 0.0f));
        CRC32 crc = new CRC32();
        long count = 0;
        for (int bits = from; bits < to; bits++) {
            String s = "" + Float.intBitsToFloat(bits);
            crc.update(s.getBytes(StandardCharsets.US_ASCII));
            crc.update('\n');
            count++;
            if (((bits - from + 1) & 0xFFFF) == 0 || bits == to - 1) {
                System.out.println(Integer.toHexString(bits) + " " + Long.toHexString(crc.getValue()));
                crc.reset();
            }
        }
        System.err.println("floats checked: " + count);
    }
}
