$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$records = Get-Content (Join-Path $PSScriptRoot 'corrections-seven-manifest.json') -Raw | ConvertFrom-Json
$export = Join-Path $PSScriptRoot '../../outputs/Monster-Korrekturen-7'
New-Item -ItemType Directory -Force (Join-Path $export 'Originale'),(Join-Path $export '128px') | Out-Null
$sheet = [System.Drawing.Bitmap]::new(1400,780)
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::White)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$font = [System.Drawing.Font]::new('Arial',16)
$index=0
try {
 foreach ($r in $records) {
  Copy-Item -LiteralPath $r.source -Destination (Join-Path $export "Originale/$($r.name).png")
  $src=[System.Drawing.Image]::FromFile($r.source)
  $bmp=[System.Drawing.Bitmap]::new(128,128)
  $bg=[System.Drawing.Graphics]::FromImage($bmp)
  try {
   $bg.Clear([System.Drawing.Color]::White)
   $bg.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
   $scale=[Math]::Min(128.0/$src.Width,128.0/$src.Height)
   $w=[int]($src.Width*$scale); $h=[int]($src.Height*$scale)
   $bg.DrawImage($src,[int]((128-$w)/2),[int]((128-$h)/2),$w,$h)
   $bmp.Save((Join-Path $export "128px/$($r.name).png"),[System.Drawing.Imaging.ImageFormat]::Png)
   $x=($index%4)*350; $y=[int][Math]::Floor($index/4)*390
   $g.DrawImage($src,$x+10,$y+10,330,330)
   $g.DrawString($r.name,$font,[System.Drawing.Brushes]::Black,$x+12,$y+348)
  } finally { $bg.Dispose();$bmp.Dispose();$src.Dispose() }
  $index++
 }
 $sheet.Save((Join-Path $export 'Vorschau.png'),[System.Drawing.Imaging.ImageFormat]::Png)
} finally { $g.Dispose();$sheet.Dispose();$font.Dispose() }
