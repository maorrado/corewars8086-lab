$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$ids = @(
    '1_zgyGUlxX3cHzc0XAVamwnYQTwZR0GtS',
    '1QXt98lxpzWJJIOuRzN393_5pMpWEFvOF',
    '1iM72YJmTTmk3bB1e4ngeIBFaH1EttVEJ',
    '1q0Gq6DKsCxaYynoVgb4yj6t8-4_XG0pT'
)
foreach ($id in $ids) {
    if (-not (Test-Path -LiteralPath "visual-index/$id/index.json")) {
        & .\.venv\Scripts\python.exe build_visual_index.py "videos/$id.mp4" "visual-index/$id"
        if ($LASTEXITCODE -ne 0) { throw "visual indexing failed for $id" }
    }
}
