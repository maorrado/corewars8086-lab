$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
& (Join-Path $PSScriptRoot 'run-transcription-worker-c.ps1') 1>> (Join-Path $PSScriptRoot 'logs-durable-transcribe-c.out') 2>> (Join-Path $PSScriptRoot 'logs-durable-transcribe-c.err')

