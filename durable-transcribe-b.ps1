$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
& (Join-Path $PSScriptRoot 'run-transcription-worker-b.ps1') 1>> (Join-Path $PSScriptRoot 'logs-durable-transcribe-b.out') 2>> (Join-Path $PSScriptRoot 'logs-durable-transcribe-b.err')

