$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
& (Join-Path $PSScriptRoot 'run-transcription-worker.ps1') 1>> (Join-Path $PSScriptRoot 'logs-durable-transcribe-a.out') 2>> (Join-Path $PSScriptRoot 'logs-durable-transcribe-a.err')

