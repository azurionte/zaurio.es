param(
  [switch]$BumpMinor,
  [switch]$BumpMajor,
  [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Split-Path -Parent $scriptDir
$toolsDir = Split-Path -Parent $appDir
$bumpScript = Join-Path $scriptDir "bump-dinerozaurio-version.ps1"

if (-not (Test-Path -LiteralPath $bumpScript)) {
  throw "No encontré $bumpScript"
}

$bumpArgs = @()
if ($BumpMajor) {
  $bumpArgs += "-BumpMajor"
} elseif ($BumpMinor) {
  $bumpArgs += "-BumpMinor"
}

& $bumpScript @bumpArgs

if ($SkipDeploy) {
  return
}

Push-Location $toolsDir
try {
  wrangler deploy
} finally {
  Pop-Location
}
