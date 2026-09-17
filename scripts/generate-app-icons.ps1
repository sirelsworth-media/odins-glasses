param([string]$Root = (Split-Path -Parent $PSScriptRoot))

Add-Type -AssemblyName System.Drawing

function New-RoundedRectangle([System.Drawing.RectangleF]$rectangle, [float]$radius) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $radius * 2
  $arc = [System.Drawing.RectangleF]::new($rectangle.X, $rectangle.Y, $diameter, $diameter)
  $path.AddArc($arc, 180, 90)
  $arc.X = $rectangle.Right - $diameter; $path.AddArc($arc, 270, 90)
  $arc.Y = $rectangle.Bottom - $diameter; $path.AddArc($arc, 0, 90)
  $arc.X = $rectangle.X; $path.AddArc($arc, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-OdinsIcon([int]$size) {
  $bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $scale = $size / 512.0
  $red = [System.Drawing.ColorTranslator]::FromHtml('#CC392B')
  $cream = [System.Drawing.ColorTranslator]::FromHtml('#FFF4DF')
  $gold = [System.Drawing.ColorTranslator]::FromHtml('#F5D581')
  $outer = New-RoundedRectangle ([System.Drawing.RectangleF]::new(0, 0, $size - 1, $size - 1)) (76 * $scale)
  $graphics.FillPath([System.Drawing.SolidBrush]::new($red), $outer)
  $border = New-RoundedRectangle ([System.Drawing.RectangleF]::new(30 * $scale, 30 * $scale, 452 * $scale, 452 * $scale)) (58 * $scale)
  $graphics.DrawPath([System.Drawing.Pen]::new($gold, 13 * $scale), $border)
  $font = [System.Drawing.Font]::new('Arial', 180 * $scale, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $format = [System.Drawing.StringFormat]::new()
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString('OG', $font, [System.Drawing.SolidBrush]::new($cream), [System.Drawing.RectangleF]::new(56 * $scale, 112 * $scale, 400 * $scale, 245 * $scale), $format)
  $linePen = [System.Drawing.Pen]::new($gold, 12 * $scale); $linePen.StartCap = $linePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($linePen, 132 * $scale, 386 * $scale, 380 * $scale, 386 * $scale)
  $sparkPen = [System.Drawing.Pen]::new($cream, 10 * $scale); $sparkPen.StartCap = $sparkPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($sparkPen, 404 * $scale, 64 * $scale, 404 * $scale, 136 * $scale)
  $graphics.DrawLine($sparkPen, 368 * $scale, 100 * $scale, 440 * $scale, 100 * $scale)
  $graphics.Dispose(); $outer.Dispose(); $border.Dispose(); $font.Dispose(); $format.Dispose(); $linePen.Dispose(); $sparkPen.Dispose()
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
  foreach ($name in 'ic_launcher.png','ic_launcher_round.png','ic_launcher_foreground.png') { $icon.Save((Join-Path $directory $name), [System.Drawing.Imaging.ImageFormat]::Png) }
  $icon.Dispose()
}

Get-ChildItem (Join-Path $Root 'android\app\src\main\res') -Recurse -Filter 'splash.png' | ForEach-Object {
  $existing = [System.Drawing.Image]::FromFile($_.FullName)
  $width = $existing.Width; $height = $existing.Height; $existing.Dispose()
  $splash = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($splash)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#F4F0E6'))
  $iconSize = [Math]::Max(96, [Math]::Round([Math]::Min($width, $height) * 0.34))
  $icon = New-OdinsIcon $iconSize
  $graphics.DrawImage($icon, [Math]::Round(($width - $iconSize) / 2), [Math]::Round(($height - $iconSize) / 2), $iconSize, $iconSize)
  $graphics.Dispose(); $icon.Dispose()
  $splash.Save($_.FullName, [System.Drawing.Imaging.ImageFormat]::Png); $splash.Dispose()
}

Write-Output 'Generated Odin’s Glasses desktop and Android icons.'
