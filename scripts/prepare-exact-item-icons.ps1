$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$manifest = Get-Content (Join-Path $PSScriptRoot 'item-exact-icon-specs.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$target = Join-Path $PSScriptRoot '../renderer/src/assets/item-exact-icons'
$originals = Join-Path $PSScriptRoot '../../outputs/Item-Icons-Exact-Originale-2026-09-05'
New-Item -ItemType Directory -Force $target,$originals | Out-Null
foreach ($item in $manifest.items) {
  if (-not (Test-Path -LiteralPath $item.source)) { throw "Missing image source: $($item.source)" }
  $safeName = ($item.name -replace '[^A-Za-z0-9-]+','-').Trim('-').ToLowerInvariant()
  Copy-Item -LiteralPath $item.source -Destination (Join-Path $originals "$($item.itemId)-$safeName.png") -Force
  $src = [Drawing.Image]::FromFile($item.source)
  $bmp = [Drawing.Bitmap]::new(128,128)
  $graphics = [Drawing.Graphics]::FromImage($bmp)
  try {
    $graphics.Clear([Drawing.Color]::FromArgb(255,255,250,241))
    $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($src,0,0,128,128)
    $bmp.Save((Join-Path $target "$($item.itemId).png"),[Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose(); $bmp.Dispose(); $src.Dispose()
  }
}
Write-Output "Prepared $($manifest.items.Count) exact item icons."
