param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$Destination,
  [int]$Size = 256,
  [string]$Background = "0xF8F8F8",
  [double]$Similarity = 0.08
)

$ffmpeg = Get-Command ffmpeg -ErrorAction Stop
$sourcePath = (Resolve-Path -LiteralPath $Source).Path
$destinationPath = [System.IO.Path]::GetFullPath($Destination)
$destinationDirectory = Split-Path -Parent $destinationPath
New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null

$filter = "format=rgba,colorkey=${Background}:${Similarity}:0.025,scale=${Size}:${Size}:flags=lanczos"
& $ffmpeg.Source -y -loglevel error -i $sourcePath -vf $filter -frames:v 1 $destinationPath
if ($LASTEXITCODE -ne 0) { throw "Portrait processing failed for $sourcePath" }
