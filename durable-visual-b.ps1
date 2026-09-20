$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
& (Join-Path $PSScriptRoot 'run-visual-worker-b.ps1') 1>> (Join-Path $PSScriptRoot 'logs-durable-visual-b.out') 2>> (Join-Path $PSScriptRoot 'logs-durable-visual-b.err')

