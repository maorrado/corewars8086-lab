$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath 'C:\Users\ronyr\Codex\2026-05-02\2025\scratch\corewars8086-lab'

& '.\.venv\Scripts\python.exe' transcribe.py `
  --output transcripts-complete `
  --model small `
  --beam-size 1 `
  --cpu-threads 3 `
  --only `
  1TQsSha_0badzPWr1nWP1U-sdCbficlTh `
  1QXt98lxpzWJJIOuRzN393_5pMpWEFvOF `
  1iM72YJmTTmk3bB1e4ngeIBFaH1EttVEJ `
  1q0Gq6DKsCxaYynoVgb4yj6t8-4_XG0pT
if ($LASTEXITCODE -ne 0) { throw 'transcription worker failed' }
