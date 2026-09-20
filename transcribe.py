import argparse
import hashlib
import json
import time
from pathlib import Path

from faster_whisper import WhisperModel


PROMPT = (
    "הדרכה בעברית על CodeGuru Xtreme ו-CoreWars 8086. "
    "מונחים טכניים: survivor, zombie, registers, opcodes, STOSW, PUSH, "
    "AB50, INT 86h, INT 87h, NRG, AX, BX, CX, DX, SI, DI, SP, IP, NASM."
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--videos", type=Path, default=Path("videos"))
    parser.add_argument("--output", type=Path, default=Path("transcripts"))
    parser.add_argument("--model", default="turbo")
    parser.add_argument("--beam-size", type=int, default=1)
    parser.add_argument("--cpu-threads", type=int, default=4)
    parser.add_argument("--only", nargs="*")
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    model = WhisperModel(
        args.model,
        device="cpu",
        compute_type="int8",
        cpu_threads=args.cpu_threads,
        num_workers=1,
    )
    seen_hashes: dict[str, str] = {}
    files = sorted(args.videos.glob("*.mp4"))
    if args.only:
        by_name = {path.name: path for path in files}
        by_stem = {path.stem: path for path in files}
        files = []
        for requested in args.only:
            path = by_name.get(requested) or by_stem.get(requested)
            if path is None:
                raise FileNotFoundError(f"Requested video not found: {requested}")
            files.append(path)

    for path in files:
        digest = sha256(path)
        if digest in seen_hashes:
            print(f"SKIP duplicate {path.name} == {seen_hashes[digest]}", flush=True)
            continue
        seen_hashes[digest] = path.name
        json_path = args.output / f"{path.stem}.json"
        text_path = args.output / f"{path.stem}.txt"
        if json_path.exists() and text_path.exists():
            print(f"SKIP existing {path.name}", flush=True)
            continue

        started = time.time()
        print(f"START {path.name}", flush=True)
        segments, info = model.transcribe(
            str(path),
            language="he",
            beam_size=args.beam_size,
            best_of=1,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 500},
            initial_prompt=PROMPT,
            condition_on_previous_text=True,
            word_timestamps=False,
        )
        payload_segments = []
        lines = []
        for segment in segments:
            item = {"start": segment.start, "end": segment.end, "text": segment.text.strip()}
            payload_segments.append(item)
            lines.append(f"[{segment.start:09.2f} --> {segment.end:09.2f}] {item['text']}")
        payload = {
            "source": path.name,
            "sha256": digest,
            "model": args.model,
            "language": info.language,
            "language_probability": info.language_probability,
            "duration_seconds": info.duration,
            "elapsed_seconds": time.time() - started,
            "segments": payload_segments,
        }
        json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        text_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(
            f"DONE {path.name} media={info.duration:.1f}s elapsed={payload['elapsed_seconds']:.1f}s "
            f"segments={len(payload_segments)}",
            flush=True,
        )


if __name__ == "__main__":
    main()
