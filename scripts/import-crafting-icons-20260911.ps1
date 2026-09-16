param([string]$Manifest = 'scripts/crafting-generated-20260911.json')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$entries=(Get-Content -LiteralPath $Manifest -Raw | ConvertFrom-Json).items
$originalDir=Join-Path (Split-Path $PWD -Parent) 'outputs/Crafting-Icons-2026-09-11'
New-Item -ItemType Directory -Force $originalDir | Out-Null
foreach($entry in $entries){
 $target=Join-Path $PWD "renderer/src/assets/item-exact-icons/$($entry.itemId).png"
 if(Test-Path -LiteralPath $target){continue}
 Copy-Item -LiteralPath $entry.source -Destination (Join-Path $originalDir "$($entry.itemId).png")
 $source=[Drawing.Image]::FromFile($entry.source);$icon=[Drawing.Bitmap]::new(128,128);$g=[Drawing.Graphics]::FromImage($icon)
 try{$g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic;$g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::HighQuality;$g.DrawImage($source,0,0,128,128);$icon.Save($target,[Drawing.Imaging.ImageFormat]::Png)}finally{$g.Dispose();$icon.Dispose();$source.Dispose()}
}
$cols=7;$cell=160;$rows=[int][Math]::Ceiling($entries.Count/$cols);$sheet=[Drawing.Bitmap]::new($cols*$cell,$rows*175);$g=[Drawing.Graphics]::FromImage($sheet);$g.Clear([Drawing.Color]::FromArgb(255,250,241));$font=[Drawing.Font]::new('Segoe UI',9)
try{for($i=0;$i -lt $entries.Count;$i++){$e=$entries[$i];$x=($i%$cols)*$cell;$y=[int][Math]::Floor($i/$cols)*175;$icon=[Drawing.Image]::FromFile((Join-Path $PWD "renderer/src/assets/item-exact-icons/$($e.itemId).png"));try{$g.DrawImage($icon,$x+16,$y,128,128)}finally{$icon.Dispose()};$g.DrawString("$($e.itemId) $($e.name)",$font,[Drawing.Brushes]::Black,[Drawing.RectangleF]::new($x+5,$y+130,150,40))};$sheet.Save((Join-Path $PWD 'previews/crafting-new-20260911.png'),[Drawing.Imaging.ImageFormat]::Png)}finally{$font.Dispose();$g.Dispose();$sheet.Dispose()}
Write-Output "$($entries.Count) crafting illustrations imported/checked."
