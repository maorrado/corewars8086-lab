$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
& .\.venv\Scripts\python.exe transcribe.py `
    --output transcripts-complete `
    --model small `
    --beam-size 1 `
    --cpu-threads 3 `
    --only `
    1xgB1C-Dss2onAJie0OAETlLZWpjTmWyT `
    1suqb-3WmgKxMMh3mla6LFjgxwMZZhBU7 `
    1uUQ_fKFwafvbmew5nn8fn-31JLqNzriC `
    1MK8Ro-dygnanTt9RJJ05z37QpRQOetTH `
    1waEAQoBa8FlzUAddBbTOlS9qKsEu_QzK
if ($LASTEXITCODE -ne 0) { throw 'transcription worker failed' }
