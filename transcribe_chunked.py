import argparse
import hashlib
import json
import math
import time
from pathlib import Path

import av
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


def atomic_json(path: Path, payload: dict) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    temporary.replace(path)


def media_duration(path: Path) -> float:
    with av.open(str(path)) as container:
        return float(container.duration / av.time_base)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--videos", type=Path, default=Path("videos"))
    parser.add_argument("--output", type=Path, default=Path("transcripts-complete"))
    parser.add_argument("--model", default="small")
    parser.add_argument("--beam-size", type=int, default=1)
    parser.add_argument("--cpu-threads", type=int, default=3)
    parser.add_argument("--chunk-seconds", type=float, default=900.0)
    parser.add_argument("--only", nargs="+", required=True)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    chunks_root = args.output / ".chunks"
    chunks_root.mkdir(exist_ok=True)

    by_name = {path.name: path for path in args.videos.glob("*.mp4")}
    by_stem = {path.stem: path for path in args.videos.glob("*.mp4")}
    paths = []
    for requested in args.only:
        path = by_name.get(requested) or by_stem.get(requested)
        if path is None:
            raise FileNotFoundError(f"Requested video not found: {requested}")
        paths.append(path)

    model = WhisperModel(
        args.model,
        device="cpu",
        compute_type="int8",
        cpu_threads=args.cpu_threads,
        num_workers=1,
    )

    for path in paths:
        final_json = args.output / f"{path.stem}.json"
        final_text = args.output / f"{path.stem}.txt"
        if final_json.exists() and final_text.exists():
            print(f"SKIP existing {path.name}", flush=True)
            continue

        digest = sha256(path)
        duration = media_duration(path)
        chunk_count = math.ceil(duration / args.chunk_seconds)
        chunk_dir = chunks_root / path.stem
        chunk_dir.mkdir(exist_ok=True)
        print(
            f"START {path.name} duration={duration:.1f}s chunks={chunk_count}",
            flush=True,
        )

        for index in range(chunk_count):
            start = index * args.chunk_seconds
            end = min(duration, (index + 1) * args.chunk_seconds)
            chunk_path = chunk_dir / f"{index:04d}.json"
            if chunk_path.exists():
                try:
                    saved = json.loads(chunk_path.read_text(encoding="utf-8"))
                    if (
                        saved.get("source_sha256") == digest
                        and saved.get("model") == args.model
                        and saved.get("start") == start
                        and saved.get("end") == end
                    ):
                        print(
                            f"SKIP chunk {index + 1}/{chunk_count} "
                            f"{start:.1f}-{end:.1f}",
                            flush=True,
                        )
                        continue
                except (json.JSONDecodeError, OSError):
                    pass

            started = time.time()
            print(
                f"CHUNK {index + 1}/{chunk_count} {start:.1f}-{end:.1f}",
                flush=True,
            )
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
                clip_timestamps=[start, end],
            )
            payload_segments = [
                {
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text.strip(),
                }
                for segment in segments
            ]
            chunk_payload = {
                "source": path.name,
                "source_sha256": digest,
                "model": args.model,
                "language": info.language,
                "language_probability": info.language_probability,
                "start": start,
                "end": end,
                "elapsed_seconds": time.time() - started,
                "segments": payload_segments,
            }
            atomic_json(chunk_path, chunk_payload)
            print(
                f"DONE chunk {index + 1}/{chunk_count} "
                f"elapsed={chunk_payload['elapsed_seconds']:.1f}s "
                f"segments={len(payload_segments)}",
                flush=True,
            )

        chunks = [
            json.loads((chunk_dir / f"{index:04d}.json").read_text(encoding="utf-8"))
            for index in range(chunk_count)
        ]
        all_segments = [segment for chunk in chunks for segment in chunk["segments"]]
        payload = {
            "source": path.name,
            "sha256": digest,
            "model": args.model,
            "language": chunks[0]["language"],
            "language_probability": min(
                chunk["language_probability"] for chunk in chunks
            ),
            "duration_seconds": duration,
            "elapsed_seconds": sum(chunk["elapsed_seconds"] for chunk in chunks),
            "chunk_seconds": args.chunk_seconds,
            "chunk_count": chunk_count,
            "segments": all_segments,
        }
        atomic_json(final_json, payload)
        lines = [
            f"[{item['start']:09.2f} --> {item['end']:09.2f}] {item['text']}"
            for item in all_segments
        ]
        temporary_text = final_text.with_suffix(final_text.suffix + ".tmp")
        temporary_text.write_text("\n".join(lines) + "\n", encoding="utf-8")
        temporary_text.replace(final_text)
        print(
            f"DONE {path.name} media={duration:.1f}s "
            f"elapsed={payload['elapsed_seconds']:.1f}s "
            f"segments={len(all_segments)}",
            flush=True,
        )


if __name__ == "__main__":
    main()
