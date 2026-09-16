$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$records = Get-ChildItem (Join-Path $PSScriptRoot 'item-icon-renders') -Filter '*.json' | ForEach-Object { Get-Content $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json }
$target=Join-Path $PSScriptRoot '../renderer/src/assets/item-icons'
$originals=Join-Path $PSScriptRoot '../../outputs/Item-Icons-Originale'
New-Item -ItemType Directory -Force $target,$originals | Out-Null
$sheet=[Drawing.Bitmap]::new(960,([int][Math]::Ceiling($records.Count/6.0)*180))
$g=[Drawing.Graphics]::FromImage($sheet);$g.Clear([Drawing.Color]::White)
$font=[Drawing.Font]::new('Arial',10)
$i=0
try{
 foreach($r in $records){
  Copy-Item -LiteralPath $r.source -Destination (Join-Path $originals "$($r.key).png")
  $src=[Drawing.Image]::FromFile($r.source);$bmp=[Drawing.Bitmap]::new(128,128);$bg=[Drawing.Graphics]::FromImage($bmp)
  try{
   $bg.Clear([Drawing.Color]::White);$bg.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
   $scale=[Math]::Min(128.0/$src.Width,128.0/$src.Height);$w=[int]($src.Width*$scale);$h=[int]($src.Height*$scale)
   $bg.DrawImage($src,[int]((128-$w)/2),[int]((128-$h)/2),$w,$h)
   $bmp.Save((Join-Path $target "$($r.key).png"),[Drawing.Imaging.ImageFormat]::Png)
   $x=($i%6)*160;$y=[int][Math]::Floor($i/6)*180
   $g.DrawImage($bmp,$x+16,$y,128,128)
   $g.DrawString($r.label,$font,[Drawing.Brushes]::Black,[Drawing.RectangleF]::new($x+4,$y+132,152,45))
  }finally{$bg.Dispose();$bmp.Dispose();$src.Dispose()}
  $i++
 }
 $sheet.Save((Join-Path $PSScriptRoot '../previews/item-icons.png'),[Drawing.Imaging.ImageFormat]::Png)
}finally{$g.Dispose();$font.Dispose();$sheet.Dispose()}
Write-Output "Prepared $i item category icons and original copies."
