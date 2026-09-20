import argparse
from pathlib import Path

from capstone import CS_ARCH_X86, CS_MODE_16, Cs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("paths", nargs="+", type=Path)
    args = parser.parse_args()
    decoder = Cs(CS_ARCH_X86, CS_MODE_16)
    decoder.skipdata = True
    for path in args.paths:
        code = path.read_bytes()[:512]
        print(f"\n=== {path} ({len(code)} bytes) ===")
        for instruction in decoder.disasm(code, 0):
            raw = instruction.bytes.hex(" ")
            print(f"{instruction.address:04x}: {raw:<24} {instruction.mnemonic:<9} {instruction.op_str}")


if __name__ == "__main__":
    main()
