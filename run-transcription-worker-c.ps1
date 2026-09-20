$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
& .\.venv\Scripts\python.exe transcribe.py `
    --output transcripts-complete `
    --model small `
    --beam-size 1 `
    --cpu-threads 3 `
    --only `
    1NSYW3wmGmiZeQqhRKJCzNUgW9ku6GxYD `
    1qHq1Xmy-l2ozo3m3raa5dR6pdpIzcy1L `
    1j-TzON7V19IW7-9we1y4U1OZhw7E6J7- `
    1M5A-QAv3Z4S1A8z0dsOApgKVnzI0s8Cw `
    1pMfixUICw2Pis1JCMtujyXhr3h4XaTvY
if ($LASTEXITCODE -ne 0) { throw 'transcription worker failed' }
