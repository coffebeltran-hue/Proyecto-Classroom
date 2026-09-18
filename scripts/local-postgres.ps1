param(
    [ValidateSet('Start', 'Stop', 'Status')]
    [string]$Action = 'Status'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pgCtl = Join-Path $projectRoot '.local/runtimes/postgresql-18.6/pgsql/bin/pg_ctl.exe'
$pgReady = Join-Path $projectRoot '.local/runtimes/postgresql-18.6/pgsql/bin/pg_isready.exe'
$dataPath = Join-Path $projectRoot '.local/postgres/data'
$logPath = Join-Path $projectRoot '.local/postgres/server.log'
if (!(Test-Path -LiteralPath $pgCtl) -or !(Test-Path -LiteralPath $dataPath)) {
    throw 'Local PostgreSQL proof binaries/data are absent. Use the documented Docker Compose setup instead.'
}

switch ($Action) {
    'Start' { & $pgCtl -D $dataPath -l $logPath -o '-h 127.0.0.1 -p 54329' -w start }
    'Stop' { & $pgCtl -D $dataPath -m fast -w stop }
    'Status' { & $pgReady -h 127.0.0.1 -p 54329 -U classroom -d classroom_dev }
}
exit $LASTEXITCODE
