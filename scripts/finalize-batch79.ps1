param([switch]$Refresh)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$records = Get-Content (Join-Path $PSScriptRoot 'generated79-manifest.json') -Raw | ConvertFrom-Json
$target = Join-Path $PSScriptRoot '../renderer/src/assets/monster-portraits'
$sheet = New-Object System.Drawing.Bitmap 1280,1600
$sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
$sheetGraphics.Clear([System.Drawing.Color]::White)
$font = New-Object System.Drawing.Font 'Arial',9
$index = 0
try {
 foreach ($record in $records) {
  $destination = Join-Path $target ($record.id.ToString() + '.png')
  if ($Refresh -or -not (Test-Path -LiteralPath $destination)) {
   $source = [System.Drawing.Image]::FromFile($record.source)
   $bitmap = New-Object System.Drawing.Bitmap 128,128
   $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
   try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($source,0,0,128,128)
    $bitmap.Save($destination,[System.Drawing.Imaging.ImageFormat]::Png)
   } finally { $graphics.Dispose(); $bitmap.Dispose(); $source.Dispose() }
  }
  $portrait = [System.Drawing.Image]::FromFile($destination)
  try {
   if ($portrait.Width -ne 128 -or $portrait.Height -ne 128) { throw "Wrong size: $destination" }
   $x = ($index % 8) * 160
   $y = [math]::Floor($index / 8) * 160
   $sheetGraphics.DrawImage($portrait,$x+16,$y,128,128)
   $sheetGraphics.DrawString("$($record.id) $($record.name)",$font,[System.Drawing.Brushes]::Black,$x+3,$y+130)
  } finally { $portrait.Dispose() }
  $index++
 }
 $sheet.Save((Join-Path $PSScriptRoot '../previews/monster79-contact.png'),[System.Drawing.Imaging.ImageFormat]::Png)
} finally { $sheetGraphics.Dispose(); $sheet.Dispose(); $font.Dispose() }
Write-Output "Validated and imported $index portraits at 128 x 128."
