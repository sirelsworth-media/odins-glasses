param(
 [Parameter(Mandatory = $true)]
 [string]$GeneratedDirectory
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$records = Get-Content (Join-Path $root 'outputs/hires-export-manifest.json') -Raw | ConvertFrom-Json
$corrections = @{}
Get-Content (Join-Path $PSScriptRoot 'corrections-seven-manifest.json') -Raw | ConvertFrom-Json | ForEach-Object { $corrections[$_.id.ToString()] = $_.source }
$target = Join-Path $PSScriptRoot '../renderer/src/assets/monster-details'
New-Item -ItemType Directory -Force $target | Out-Null
foreach ($record in $records) {
 $id = $record.id.ToString()
 $sourceName = if ($corrections.ContainsKey($id)) { Split-Path -Leaf $corrections[$id] } else { Split-Path -Leaf $record.source }
 $sourcePath = Join-Path $GeneratedDirectory $sourceName
 $source = [Drawing.Image]::FromFile($sourcePath)
 $bitmap = [Drawing.Bitmap]::new(480,480)
 $graphics = [Drawing.Graphics]::FromImage($bitmap)
 try {
  if ($source.Width -le 128 -or $source.Height -le 128) { throw "Not an original: $id" }
  $graphics.Clear([Drawing.Color]::White)
  $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $scale = [Math]::Min(480.0/$source.Width,480.0/$source.Height)
  $w = [int][Math]::Round($source.Width*$scale); $h = [int][Math]::Round($source.Height*$scale)
  $graphics.DrawImage($source,[int]((480-$w)/2),[int]((480-$h)/2),$w,$h)
  $bitmap.Save((Join-Path $target "$id.png"),[Drawing.Imaging.ImageFormat]::Png)
 } finally { $graphics.Dispose();$bitmap.Dispose();$source.Dispose() }
}
Write-Output "Created $($records.Count) original-derived 480px portraits (including seven corrections)."
