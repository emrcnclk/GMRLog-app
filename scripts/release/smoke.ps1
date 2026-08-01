# D3.20 — Release smoke runner (Windows PowerShell).
# Usage: .\scripts\release\smoke.ps1 [-SkipPerf] [-SkipBackup] [-SkipDocker]
param(
  [switch]$SkipPerf,
  [switch]$SkipBackup,
  [switch]$SkipDocker
)

$ErrorActionPreference = 'Continue'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $Root

if (-not $env:GMRLOG_API_BASE) { $env:GMRLOG_API_BASE = 'http://127.0.0.1:4000/api/v1' }
if (-not $env:REDIS_URL) { $env:REDIS_URL = 'redis://127.0.0.1:6379' }
if (-not $env:DATABASE_URL) { $env:DATABASE_URL = 'postgresql://gmrlog:gmrlog@127.0.0.1:5432/gmrlog?schema=public' }
if (-not $env:S3_ENDPOINT) { $env:S3_ENDPOINT = 'http://127.0.0.1:9000' }
if (-not $env:MEILI_HOST) { $env:MEILI_HOST = 'http://127.0.0.1:7700' }
if (-not $env:MAILPIT_API) { $env:MAILPIT_API = 'http://127.0.0.1:8025' }

$script:AllPass = $true

function Invoke-SmokeStep {
  param([string]$Name, [string]$ScriptPath)
  Write-Host ""
  Write-Host "=== $Name ==="
  & node $ScriptPath
  if ($LASTEXITCODE -ne 0) {
    Write-Host "RESULT $Name FAIL"
    $script:AllPass = $false
  } else {
    Write-Host "RESULT $Name PASS"
  }
}

if (-not $SkipDocker) {
  Write-Host '=== docker-infra ==='
  if (Get-Command docker -ErrorAction SilentlyContinue) {
    docker compose -f infrastructure/docker/docker-compose.yml up -d postgres redis minio meilisearch mailpit
    if ($LASTEXITCODE -ne 0) { $script:AllPass = $false }
  } else {
    Write-Host 'docker not found — skipping compose up'
  }
}

Invoke-SmokeStep infra (Join-Path $Root 'scripts\release\smoke-infra.mjs')
Invoke-SmokeStep health (Join-Path $Root 'scripts\release\smoke-health.mjs')
Invoke-SmokeStep upload (Join-Path $Root 'scripts\release\smoke-upload.mjs')
Invoke-SmokeStep password (Join-Path $Root 'scripts\release\smoke-password.mjs')
Invoke-SmokeStep search (Join-Path $Root 'scripts\release\smoke-search.mjs')
Invoke-SmokeStep queue (Join-Path $Root 'scripts\release\smoke-queue.mjs')
Invoke-SmokeStep security (Join-Path $Root 'scripts\release\smoke-security.mjs')

if (-not $SkipPerf) {
  Invoke-SmokeStep perf (Join-Path $Root 'scripts\release\smoke-perf.mjs')
}

if (-not $SkipBackup) {
  Invoke-SmokeStep backup (Join-Path $Root 'scripts\release\smoke-backup.mjs')
}

Write-Host ""
if ($script:AllPass) {
  Write-Host 'PASS'
  exit 0
}
Write-Host 'FAIL'
exit 1
