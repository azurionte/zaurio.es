param(
  [switch]$BumpMinor,
  [switch]$BumpMajor
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Split-Path -Parent $scriptDir
$versionFile = Join-Path $appDir "version.js"

if (-not (Test-Path -LiteralPath $versionFile)) {
  throw "No encontré $versionFile"
}

$content = Get-Content -LiteralPath $versionFile -Raw
$majorMatch = [regex]::Match($content, 'major:\s*(\d+)')
$minorMatch = [regex]::Match($content, 'minor:\s*(\d+)')

if (-not $majorMatch.Success -or -not $minorMatch.Success) {
  throw "No pude leer major/minor desde version.js"
}

$major = [int]$majorMatch.Groups[1].Value
$minor = [int]$minorMatch.Groups[1].Value

if ($BumpMajor) {
  $major += 1
  $minor = 0
} elseif ($BumpMinor) {
  $minor += 1
}

$build = Get-Date -Format "ddMMyyHHmm"
$label = "$major.$minor.$build"

$next = @"
window.__DINEROZAURIO_VERSION__ = {
  major: $major,
  minor: $minor,
  build: "$build",
  label: "$label",
};
"@

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($versionFile, $next, $utf8NoBom)
Write-Host "DineroZaurio version -> $label"
