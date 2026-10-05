param([string]$Root = (Split-Path -Parent $PSScriptRoot))

Add-Type -AssemblyName System.Drawing

function New-OdinsIcon([int]$size, [float]$contentScale = 1) {
  $master = [System.Drawing.Image]::FromFile((Join-Path $Root 'assets\raven-detective-master.png'))
  $bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#001831'))
  $contentSize = [int][Math]::Round($size * $contentScale)
  $offset = [int][Math]::Round(($size - $contentSize) / 2)
  $graphics.DrawImage($master, $offset, $offset, $contentSize, $contentSize)
  $graphics.Dispose(); $master.Dispose()
  return $bitmap
}
$source = New-OdinsIcon 512
$sourcePath = Join-Path $Root 'assets\icon-512.png'
$source.Save($sourcePath, [System.Drawing.Imaging.ImageFormat]::Png)
$source.Dispose()

$densitySizes = @{ 'mdpi' = 48; 'hdpi' = 72; 'xhdpi' = 96; 'xxhdpi' = 144; 'xxxhdpi' = 192 }
foreach ($entry in $densitySizes.GetEnumerator()) {
  $directory = Join-Path $Root "android\app\src\main\res\mipmap-$($entry.Key)"
  $icon = New-OdinsIcon $entry.Value
  foreach ($name in 'ic_launcher.png','ic_launcher_round.png') { $icon.Save((Join-Path $directory $name), [System.Drawing.Imaging.ImageFormat]::Png) }
  $icon.Dispose()
  $foreground = New-OdinsIcon ([int]($entry.Value * 2.25)) 0.75
  $foreground.Save((Join-Path $directory 'ic_launcher_foreground.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $foreground.Dispose()
}

Get-ChildItem (Join-Path $Root 'android\app\src\main\res') -Recurse -Filter 'splash.png' | ForEach-Object {
  $existing = [System.Drawing.Image]::FromFile($_.FullName)
  $width = $existing.Width; $height = $existing.Height; $existing.Dispose()
  $splash = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($splash)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#001831'))
  $iconSize = [Math]::Max(96, [Math]::Round([Math]::Min($width, $height) * 0.34))
  $icon = New-OdinsIcon $iconSize
  $graphics.DrawImage($icon, [Math]::Round(($width - $iconSize) / 2), [Math]::Round(($height - $iconSize) / 2), $iconSize, $iconSize)
  $graphics.Dispose(); $icon.Dispose()
  $splash.Save($_.FullName, [System.Drawing.Imaging.ImageFormat]::Png); $splash.Dispose()
}

Write-Output 'Generated desktop and Android raven icons.'
