package il.co.codeguru.corewars8086.memory;

/**
 * Implements the RealModeMemory interface using a buffer.
 *
 * @author DL
 */
public class RealModeMemoryImpl extends AbstractRealModeMemory {

    /**
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

    /** Listener to memory events */
    private MemoryEventListener listener;

    /** Actual memory data */
    private byte[] m_data;

    /**
     * Constructor.
     */
    public RealModeMemoryImpl() {
        m_data = new byte[RealModeAddress.MEMORY_SIZE];
    }

    /**
     * Reads a single byte from the specified address.
     *
     * @param address    Real-mode address to read from.
     * @return the read byte.
     * 
     * @throws MemoryException  on any error. 
     */
    public byte readByte(RealModeAddress address) {
        return m_data[address.getLinearAddress()];		
    }

    /**
     * Writes a single byte to the specified address.
     *
     * @param address    Real-mode address to write to.
     * @param value      Data to write.
     * 
     * @throws MemoryException  on any error. 
     */
    public void writeByte(RealModeAddress address, byte value) {
        m_data[address.getLinearAddress()] = value;
        if (listener != null) {
            listener.onMemoryWrite(address);
        }
    }

    /**
     * Reads a single byte from the specified address, in order to execute it.
     *
     * @param address    Real-mode address to read from.
     * @return the read byte.
     * 
     * @throws MemoryException  on any error. 
     */
    public byte readExecuteByte(RealModeAddress address) {
        return m_data[address.getLinearAddress()];		
    }	

    /**
     * @return Returns the listener.
     */
    public MemoryEventListener getListener() {
        return listener;
    }
    /**
     * @param listener The listener to set.
     */
    public void setListener(MemoryEventListener listener) {
        this.listener = listener;
    }
}
