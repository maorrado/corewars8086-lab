import argparse
import bisect
import json
import math
from pathlib import Path

import av
from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat


def signature(image: Image.Image) -> Image.Image:
    return image.resize((96, 54), Image.Resampling.BILINEAR).convert("L")


def difference(left: Image.Image, right: Image.Image) -> float:
    diff = ImageChops.difference(left, right)
    return ImageStat.Stat(diff).mean[0] / 255.0


def stamp(image: Image.Image, second: float, width: int = 480) -> Image.Image:
    ratio = width / image.width
    thumb = image.resize((width, round(image.height * ratio)), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(thumb)
    label = f"{int(second // 3600):02d}:{int(second % 3600 // 60):02d}:{int(second % 60):02d}"
    box = draw.textbbox((0, 0), label)
    draw.rectangle((4, 4, box[2] + 12, box[3] + 12), fill="black")
    draw.text((8, 8), label, fill="white", font=ImageFont.load_default())
    return thumb


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("video", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--interval", type=float, default=5.0)
    parser.add_argument("--change-threshold", type=float, default=0.018)
    parser.add_argument("--max-gap", type=float, default=30.0)
    parser.add_argument("--sheet-columns", type=int, default=4)
    parser.add_argument("--sheet-rows", type=int, default=4)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    frames_dir = args.output / "keyframes"
    sheets_dir = args.output / "sheets"
    frames_dir.mkdir(exist_ok=True)
    sheets_dir.mkdir(exist_ok=True)

    container = av.open(str(args.video))
    duration = float(container.duration / av.time_base)
    times = [min(duration - 0.05, i * args.interval) for i in range(math.ceil(duration / args.interval))]
    existing = []
    for path in frames_dir.glob("*.jpg"):
        try:
            second = float(path.stem)
        except ValueError:
            continue
        if 0 <= second < duration:
            existing.append((second, path))
    existing.sort()
    kept = [
        {"time": second, "difference": None, "file": path.name}
        for second, path in existing
    ]
    resume_time = existing[-1][0] if existing else None
    previous_signature = None
    previous_kept_time = resume_time if resume_time is not None else -args.max_gap
    stream = container.streams.video[0]

    start_index = 0
    if resume_time is not None:
        # A worker may be interrupted after writing a keyframe but before it can
        # write index.json. Resume at the next five-second sample instead of
        # decoding a multi-hour recording from the beginning again. Rebuild the
        # comparison signature from the un-stamped source frame at the last
        # retained timestamp; using the saved JPEG would include our timestamp
        # overlay and create a false visual change.
        print(f"resuming after {resume_time:.2f}s with {len(kept)} retained frames", flush=True)
        container.seek(int(max(0.0, resume_time - 2.0) * av.time_base), backward=True)
        for frame in container.decode(stream):
            if float(frame.time or 0.0) + 0.05 >= resume_time:
                previous_signature = signature(frame.to_image().convert("RGB"))
                break
        if previous_signature is None:
            raise RuntimeError(f"Could not seek to resume frame at {resume_time:.2f}s")
        start_index = bisect.bisect_right(times, resume_time + 0.001)

    targets = iter(enumerate(times[start_index:], start=start_index))
    if start_index >= len(times):
        index, second = len(times) - 1, times[-1]
        processed_last = True
        frame_iter = ()
    else:
        index, second = next(targets)
        processed_last = False
        frame_iter = container.decode(stream)
    for frame in frame_iter:
        frame_second = float(frame.time or 0.0)
        if frame_second + 0.05 < second:
            continue
        image = frame.to_image().convert("RGB")
        current_signature = signature(image)
        score = 1.0 if previous_signature is None else difference(previous_signature, current_signature)
        keep = score >= args.change_threshold or second - previous_kept_time >= args.max_gap
        if keep:
            filename = f"{second:09.2f}.jpg"
            stamped = stamp(image, second)
            stamped.save(frames_dir / filename, quality=86, optimize=True)
            kept.append({"time": second, "difference": score, "file": filename})
            previous_kept_time = second
        previous_signature = current_signature
        if index % 120 == 0:
            print(f"sampled {index + 1}/{len(times)} kept={len(kept)}", flush=True)
        try:
            index, second = next(targets)
        except StopIteration:
            processed_last = True
            break

    if not processed_last or index != len(times) - 1:
        raise RuntimeError(f"Decoded only {index + 1}/{len(times)} requested sample times")

    per_sheet = args.sheet_columns * args.sheet_rows
    sample = Image.open(frames_dir / kept[0]["file"])
    sheet_count = math.ceil(len(kept) / per_sheet)
    for stale_sheet in sheets_dir.glob("sheet-*.jpg"):
        stale_sheet.unlink()
    for sheet_index in range(sheet_count):
        batch = kept[sheet_index * per_sheet : (sheet_index + 1) * per_sheet]
        sheet = Image.new(
            "RGB",
            (sample.width * args.sheet_columns, sample.height * args.sheet_rows),
            "#202020",
        )
        for cell, item in enumerate(batch):
            image = Image.open(frames_dir / item["file"])
            x = (cell % args.sheet_columns) * sample.width
            y = (cell // args.sheet_columns) * sample.height
            sheet.paste(image, (x, y))
        sheet.save(sheets_dir / f"sheet-{sheet_index + 1:04d}.jpg", quality=90, optimize=True)

    payload = {
        "source": args.video.name,
        "duration_seconds": duration,
        "sample_interval_seconds": args.interval,
        "change_threshold": args.change_threshold,
        "max_gap_seconds": args.max_gap,
        "sampled_frames": len(times),
        "keyframes": kept,
        "sheet_count": sheet_count,
    }
    (args.output / "index.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps({k: payload[k] for k in ("source", "duration_seconds", "sampled_frames", "sheet_count")}), flush=True)


if __name__ == "__main__":
    main()
