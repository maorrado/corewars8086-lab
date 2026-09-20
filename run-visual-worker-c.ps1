$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$ids = @(
    '1Bh0qjqYx4xuDyXzNYgtatlZ4kPhhsPmj',
    '1NSYW3wmGmiZeQqhRKJCzNUgW9ku6GxYD',
    '1CAziHkLDiW17nDxKH0Vj_5mDAocfIcxS',
    '1qHq1Xmy-l2ozo3m3raa5dR6pdpIzcy1L'
)
foreach ($id in $ids) {
    if (-not (Test-Path -LiteralPath "visual-index/$id/index.json")) {
        & .\.venv\Scripts\python.exe build_visual_index.py "videos/$id.mp4" "visual-index/$id"
        if ($LASTEXITCODE -ne 0) { throw "visual indexing failed for $id" }
    }
}
