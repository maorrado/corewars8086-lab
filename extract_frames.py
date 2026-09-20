import argparse
from pathlib import Path

import av


parser = argparse.ArgumentParser()
parser.add_argument("video", type=Path)
parser.add_argument("output", type=Path)
parser.add_argument("seconds", nargs="+", type=float)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)

container = av.open(str(args.video))
for second in args.seconds:
    container.seek(int(second * av.time_base))
    frame = next(container.decode(video=0))
    frame.to_image().save(args.output / f"{second:08.2f}.png")
