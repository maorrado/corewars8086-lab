param(
    [Parameter(Mandatory = $true)]
    [string]$Worker,
    [Parameter(Mandatory = $true)]
    [string]$OutLog,
    [Parameter(Mandatory = $true)]
    [string]$ErrLog
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$workerPath = Join-Path $PSScriptRoot $Worker
$outPath = Join-Path $PSScriptRoot $OutLog
$errPath = Join-Path $PSScriptRoot $ErrLog

& $workerPath 1>> $outPath 2>> $errPath
if ($LASTEXITCODE -ne 0) {
    throw "Worker failed with exit code $LASTEXITCODE: $Worker"
}
