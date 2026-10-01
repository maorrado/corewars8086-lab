package il.co.codeguru.corewars8086.memory;

/**
 * Implementation of the RealModeMemory interface which limits memory access
 * to given regions of the memory.
 * 
 * @author DL
 */
public class RestrictedAccessRealModeMemory extends AbstractRealModeMemory {

    /**
     * Constructor.
     *  
     * @param memory                Wrapped RealModeMemory implementation.
     * @param readAccessRegions     Reading from these regions is allowed.
     * @param writeAccessRegions    Writing to these regions is allowed.
     * @param executeAccessRegions  Executing these regions is allowed.
     */
    public RestrictedAccessRealModeMemory(
        RealModeMemory memory,
        RealModeMemoryRegion[] readAccessRegions,
        RealModeMemoryRegion[] writeAccessRegions,
        RealModeMemoryRegion[] executeAccessRegions) {

        m_memory = memory;
        m_readAccessRegions = readAccessRegions;
        m_writeAccessRegions = writeAccessRegions;
        m_executeAccessRegions = executeAccessRegions;

        // Regions are immutable (final endpoints, addresses never re-assigned) and
        // these arrays are owned by this object, so their linear bounds can be
        // computed once instead of re-dereferenced on every byte access.
        m_readStarts = starts(readAccessRegions);
        m_readEnds = ends(readAccessRegions);
        m_writeStarts = starts(writeAccessRegions);
        m_writeEnds = ends(writeAccessRegions);
        m_executeStarts = starts(executeAccessRegions);
        m_executeEnds = ends(executeAccessRegions);
    }

    private static int[] starts(RealModeMemoryRegion[] regions) {
        int[] result = new int[regions.length];
        for (int i = 0; i < regions.length; i++) result[i] = regions[i].getStartLinearAddress();
        return result;
    }

    private static int[] ends(RealModeMemoryRegion[] regions) {
        int[] result = new int[regions.length];
        for (int i = 0; i < regions.length; i++) result[i] = regions[i].getEndLinearAddress();
        return result;
    }

    /** Same test as RealModeMemoryRegion.isInRegion, over precomputed bounds. */
    private static boolean isInRegions(int[] starts, int[] ends, int asked) {
        for (int i = 0; i < starts.length; ++i) {
            if (asked >= starts[i] && asked <= ends[i]) {
                return true;
            }
        }
        return false;
    }

    /**
     * Reads a single byte from the specified address.
     *
     * @param address    Real-mode address to read from.
     * @return the read byte.
     * 
     * @throws MemoryException  if reading is not allowed from this address.
     */
    public byte readByte(RealModeAddress address) throws MemoryException {
        // is reading allowed from this address ?
        if (!isInRegions(m_readStarts, m_readEnds, address.getLinearAddress())) {
            throw new MemoryException();
        }

        return m_memory.readByte(address);
    }

    /**
     * Writes a single byte to the specified address.
     *
     * @param address    Real-mode address to write to.
     * @param value      Data to write.
     * 
     * @throws MemoryException  if writing is not allowed to this address. 
     */
    public void writeByte(RealModeAddress address, byte value) throws MemoryException {
        // is writing allowed to this address ?
        if (!isInRegions(m_writeStarts, m_writeEnds, address.getLinearAddress())) {
            throw new MemoryException();
        }

        m_memory.writeByte(address, value);
    }

    /**
     * Reads a single byte from the specified address, in order to execute it.
     *
     * @param address    Real-mode address to read from.
     * @return the read byte.
     * 
     * @throws MemoryException  if reading is not allowed from this address.
     */
    public byte readExecuteByte(RealModeAddress address) throws MemoryException {
        // is reading allowed from this address ?
        if (!isInRegions(m_executeStarts, m_executeEnds, address.getLinearAddress())) {
            throw new MemoryException();
        }

        return m_memory.readExecuteByte(address);
    }

    /**
     * Checks whether or not a given address is within at least a single
     * region in an array of regions.
     * 
     * @param regions    Regions array to match address against.
     * @param address    Address to check.
     * @return whether or not the address is within at least one of the regions.
     */
    private boolean isAddressInRegions(
        RealModeMemoryRegion[] regions, RealModeAddress address) {

        // iterate all regions, attempt to match address
        boolean found = false;
        for (int i = 0; i < regions.length; ++i) {
            if (regions[i].isInRegion(address)) {
                found = true;				
                break;
            }
        }

        return found;		
    }

    /** Wrapped RealModeMemory implementation */
    private final RealModeMemory m_memory;
    /** Reading from these regions is allowed */
    private final RealModeMemoryRegion[] m_readAccessRegions;
    /** Writing to these regions is allowed */
    private final RealModeMemoryRegion[] m_writeAccessRegions;
    /** Executing these regions is allowed */
    private final RealModeMemoryRegion[] m_executeAccessRegions;
    /** Precomputed linear bounds of the regions above (see constructor) */
    private final int[] m_readStarts, m_readEnds;
    private final int[] m_writeStarts, m_writeEnds;
    private final int[] m_executeStarts, m_executeEnds;
}