$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$ids = @(
    '1uUQ_fKFwafvbmew5nn8fn-31JLqNzriC',
    '1MK8Ro-dygnanTt9RJJ05z37QpRQOetTH',
    '1waEAQoBa8FlzUAddBbTOlS9qKsEu_QzK',
    '1TQsSha_0badzPWr1nWP1U-sdCbficlTh'
)
foreach ($id in $ids) {
    if (-not (Test-Path -LiteralPath "visual-index/$id/index.json")) {
        & .\.venv\Scripts\python.exe build_visual_index.py "videos/$id.mp4" "visual-index/$id"
        if ($LASTEXITCODE -ne 0) { throw "visual indexing failed for $id" }
    }
}
