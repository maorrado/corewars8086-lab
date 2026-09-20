import argparse
from pathlib import Path

import av


def frame_at(container: av.container.InputContainer, second: float):
    container.seek(int(second * av.time_base), backward=True)
    for frame in container.decode(video=0):
        if float(frame.time or 0.0) + 0.05 >= second:
            return frame.to_image().convert("RGB")
    raise RuntimeError(f"No frame at {second:.2f}s")


def parse_time(value: str) -> float:
    parts = [float(part) for part in value.split(":")]
    if len(parts) == 1:
        return parts[0]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    raise ValueError(value)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("video", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("times", nargs="+")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    container = av.open(str(args.video))
    for value in args.times:
        second = parse_time(value)
        image = frame_at(container, second)
        name = f"{int(second // 3600):02d}-{int(second % 3600 // 60):02d}-{second % 60:05.2f}.png"
        image.save(args.output / name)
        print(name, image.size, flush=True)


if __name__ == "__main__":
    main()
