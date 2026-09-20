import argparse
import math
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("frames", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--columns", type=int, default=4)
    parser.add_argument("--rows", type=int, default=4)
    parser.add_argument("--start-page", type=int, default=1)
    parser.add_argument("--end-page", type=int)
    args = parser.parse_args()
    files = sorted(args.frames.glob("*.jpg")) + sorted(args.frames.glob("*.png"))
    if not files:
        raise SystemExit("no frames")
    sample = Image.open(files[0])
    width, height = sample.size
    page_size = args.columns * args.rows
    args.output.mkdir(parents=True, exist_ok=True)
    page_count = math.ceil(len(files) / page_size)
    start = max(0, args.start_page - 1)
    end = page_count if args.end_page is None else min(page_count, args.end_page)
    for page in range(start, end):
        batch = files[page * page_size : (page + 1) * page_size]
        sheet = Image.new("RGB", (width * args.columns, height * args.rows), "black")
        for index, path in enumerate(batch):
            image = Image.open(path).convert("RGB")
            sheet.paste(image, ((index % args.columns) * width, (index // args.columns) * height))
        sheet.save(args.output / f"sheet-{page + 1:04d}.jpg", quality=88, optimize=True)
        print(args.output / f"sheet-{page + 1:04d}.jpg", flush=True)


if __name__ == "__main__":
    main()
