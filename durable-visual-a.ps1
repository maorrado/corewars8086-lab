$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
& (Join-Path $PSScriptRoot 'run-visual-worker-a.ps1') 1>> (Join-Path $PSScriptRoot 'logs-durable-visual-a.out') 2>> (Join-Path $PSScriptRoot 'logs-durable-visual-a.err')

