Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$recipes = (Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'renderer/src/data/crafting-recipes.json') | ConvertFrom-Json).recipes
$items = $recipes | Where-Object { $_.profession -eq 'blacksmith' } | Group-Object { [int]$_.output.itemId } | ForEach-Object {
  $recipe = $_.Group[0]
  [pscustomobject]@{ Id = [int]$recipe.output.itemId; Name = [string]$recipe.output.name }
} | Sort-Object Id

$columns = 6
$cellWidth = 190
$cellHeight = 180
$rows = [Math]::Ceiling($items.Count / $columns)
$canvas = New-Object System.Drawing.Bitmap ($columns * $cellWidth), ($rows * $cellHeight)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.Clear([System.Drawing.Color]::FromArgb(247, 244, 235))
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$font = New-Object System.Drawing.Font 'Segoe UI', 11, ([System.Drawing.FontStyle]::Bold)
$idFont = New-Object System.Drawing.Font 'Segoe UI', 8
$borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(213, 205, 187)), 1
$textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(25, 45, 65))
$idBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(100, 110, 120))

for ($index = 0; $index -lt $items.Count; $index++) {
  $column = $index % $columns
  $row = [Math]::Floor($index / $columns)
  $x = $column * $cellWidth
  $y = $row * $cellHeight
  $graphics.DrawRectangle($borderPen, $x, $y, $cellWidth - 1, $cellHeight - 1)
  $iconPath = Join-Path $projectRoot ("renderer/src/assets/item-exact-icons/{0}.png" -f $items[$index].Id)
  if (Test-Path -LiteralPath $iconPath) {
    $icon = [System.Drawing.Image]::FromFile($iconPath)
    $graphics.DrawImage($icon, $x + 31, $y + 8, 128, 128)
    $icon.Dispose()
  }
  $nameRect = New-Object System.Drawing.RectangleF ($x + 8), ($y + 138), ($cellWidth - 16), 24
  $graphics.DrawString($items[$index].Name, $font, $textBrush, $nameRect)
  $graphics.DrawString(("#{0}" -f $items[$index].Id), $idFont, $idBrush, $x + 8, $y + 160)
}

$outputPath = Join-Path $projectRoot 'previews/forge-icon-audit.png'
$canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$canvas.Dispose()
$font.Dispose()
$idFont.Dispose()
$borderPen.Dispose()
$textBrush.Dispose()
$idBrush.Dispose()
Write-Output $outputPath
