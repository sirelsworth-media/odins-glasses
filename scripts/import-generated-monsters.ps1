param(
  [Parameter(Mandatory = $true)]
  [string]$GeneratedDirectory,
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\renderer\src\assets\monster-portraits")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
Add-Type -Path (Join-Path $PSScriptRoot "PortraitProcessor.cs") -ReferencedAssemblies "System.Drawing"

$sources = [ordered]@{
  2398 = "exec-ddad14ec-3882-404b-aeac-a63113a7311f.png"
  2450 = "exec-41f59674-5437-49f9-9766-2038bd897b5c.png"
  2404 = "exec-7915375e-2bce-4f1c-a375-439142182956.png"
  2405 = "exec-1d81303f-ced7-4cad-a418-083ef3ddf90f.png"
  2406 = "exec-d762e4bc-811f-4bf7-9dcd-0fb0aaad6230.png"
  3816 = "exec-63966ba1-906e-4087-a2fe-1f284ce04b90.png"
  3815 = "exec-594ef924-6033-4ff4-b2e5-847978547a4f.png"
  3810 = "exec-9426162a-3416-4bf6-85ff-5900eadfd4a4.png"
  3811 = "exec-b34f81e6-fca9-4c89-bbdc-72e0c9ece661.png"
  3812 = "exec-340e5776-9c1c-4413-870e-dfa3342fec72.png"
  3813 = "exec-a9c6566b-7bee-44ee-be95-7bb848ee888b.png"
  3814 = "exec-9f0d1bc8-4356-44fa-9705-4f974d5db769.png"
  1062 = "exec-dcefce57-ad63-4924-8d42-54e03833412e.png"
  2210 = "exec-cdbe85ba-06fb-4544-a4bb-97afe658417b.png"
  2380 = "exec-6c37c585-6216-4f02-bcc4-95a1d89978d5.png"
  1588 = "exec-2edf91e9-9402-4c27-a126-1b4d58bdf45c.png"
  1147 = "exec-b62aa617-6b95-4f5c-ad58-7b813c45e964.png"
  1287 = "exec-7eb53af1-50c4-4659-951e-736240c47e0f.png"
  1245 = "exec-aab7fb29-5502-4c74-acc6-6f7ca8cac75f.png"
  1087 = "exec-21dddfb2-b00d-4f1b-abae-32e1191a9944.png"
  1086 = "exec-1915fac0-c387-4c11-a626-a12506fee726.png"
  1244 = "exec-44b06d55-f618-42d6-b214-0eafca4ad99a.png"
  1190 = "exec-8606c498-c8b0-41f6-9a40-cc77fc2f2254.png"
  1038 = "exec-84ccc12a-f88b-431f-bfda-c73b8ee6ad36.png"
  1511 = "exec-36d208bf-d4b3-4cfc-87f9-d66b80e2ebf1.png"
  1246 = "exec-478b5c1a-ce98-408f-bed1-605639696c39.png"
  1285 = "exec-6f5f49b3-4cf6-4323-9afe-c82be81ccfac.png"
  1389 = "exec-4962f550-1811-42b3-acc4-edfa33b5a980.png"
  1150 = "exec-57cdde0e-1d66-44cf-ae62-31e8af5b31d5.png"
  1114 = "exec-bfdb03bb-6c3c-4af7-8710-6d74b21a5aeb.png"
  1117 = "exec-569af8fa-ced0-4b66-b2e2-29eeae00c109.png"
  1127 = "exec-bfe798b5-82f6-4053-8736-7f8adf2565b2.png"
  1269 = "exec-a096858b-544c-4df8-afa1-4cc64840e30f.png"
  1199 = "exec-c10f471b-a0dc-4e12-841e-57bef4da8dae.png"
  1209 = "exec-a27b1de3-36c6-4011-9343-fb38baeb56f3.png"
  1248 = "exec-89167a96-c2a3-435a-bdcd-568acf07c805.png"
  1276 = "exec-48700aed-1ff2-4bee-9df7-635d92a3d048.png"
  1495 = "exec-c2a14da7-6e46-4186-af21-fa8462e24a8f.png"
  1115 = "exec-2e0eb48b-b09f-4242-a1e7-bfade731de5b.png"
  1139 = "exec-babfe743-d2dc-422a-b288-11ab896c96ca.png"
  1262 = "exec-9b325f02-5719-414f-9636-4556664c501f.png"
  1380 = "exec-aeef4b39-e7d0-43a2-8b26-ae51c59c5ade.png"
  1163 = "exec-c04cabdd-7ef2-4a3b-a2ac-73b6623ac90f.png"
  1213 = "exec-f62c6bd9-0fff-458a-9995-916e57b561b5.png"
  1582 = "exec-6bcc8c20-73a8-4cd3-83fb-0e777da101c3.png"
  1155 = "exec-1a558f4e-2dc7-4ae2-8eb4-7d79c8b58ba7.png"
  1156 = "exec-1e2894d2-1985-44bc-8936-5d118b7a673f.png"
  1216 = "exec-9020d1ce-f084-472a-bf5c-c00588667509.png"
  1286 = "exec-997aafbf-b83f-4162-9eae-d80a614cb504.png"
  1321 = "exec-8a65ef52-0f41-4f96-b261-7f5bc7557cbf.png"
}

function Test-BackgroundPixel([System.Drawing.Color]$Color) {
  $maximum = [Math]::Max($Color.R, [Math]::Max($Color.G, $Color.B))
  $minimum = [Math]::Min($Color.R, [Math]::Min($Color.G, $Color.B))
  $brightness = ($Color.R + $Color.G + $Color.B) / 3
  return $brightness -ge 205 -and ($maximum - $minimum) -le 22
}

function Convert-Portrait([string]$SourcePath, [string]$DestinationPath) {
  $source = [System.Drawing.Bitmap]::new($SourcePath)
  try {
    $width = $source.Width
    $height = $source.Height
    $visited = [bool[]]::new($width * $height)
    $queue = [System.Collections.Generic.Queue[int]]::new()

    for ($x = 0; $x -lt $width; $x++) {
      $queue.Enqueue($x)
      $queue.Enqueue((($height - 1) * $width) + $x)
    }
    for ($y = 1; $y -lt $height - 1; $y++) {
      $queue.Enqueue($y * $width)
      $queue.Enqueue(($y * $width) + $width - 1)
    }

    while ($queue.Count -gt 0) {
      $index = $queue.Dequeue()
      if ($visited[$index]) { continue }
      $visited[$index] = $true
      $x = $index % $width
      $y = [Math]::Floor($index / $width)
      if (-not (Test-BackgroundPixel $source.GetPixel($x, $y))) { continue }
      if ($x -gt 0) { $queue.Enqueue($index - 1) }
      if ($x + 1 -lt $width) { $queue.Enqueue($index + 1) }
      if ($y -gt 0) { $queue.Enqueue($index - $width) }
      if ($y + 1 -lt $height) { $queue.Enqueue($index + $width) }
    }

    $cutout = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $left = $width; $top = $height; $right = -1; $bottom = -1
    for ($y = 0; $y -lt $height; $y++) {
      for ($x = 0; $x -lt $width; $x++) {
        $index = ($y * $width) + $x
        if ($visited[$index] -and (Test-BackgroundPixel $source.GetPixel($x, $y))) {
          $cutout.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        } else {
          $color = $source.GetPixel($x, $y)
          $cutout.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $color.R, $color.G, $color.B))
          $left = [Math]::Min($left, $x); $top = [Math]::Min($top, $y)
          $right = [Math]::Max($right, $x); $bottom = [Math]::Max($bottom, $y)
        }
      }
    }

    $cropWidth = $right - $left + 1
    $cropHeight = $bottom - $top + 1
    $scale = [Math]::Min(118 / $cropWidth, 118 / $cropHeight)
    $drawWidth = [Math]::Max(1, [int][Math]::Round($cropWidth * $scale))
    $drawHeight = [Math]::Max(1, [int][Math]::Round($cropHeight * $scale))
    $destination = [System.Drawing.Bitmap]::new(128, 128, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($destination)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $targetX = [int]((128 - $drawWidth) / 2)
        $targetY = [int]((128 - $drawHeight) / 2)
        $sourceRectangle = [System.Drawing.Rectangle]::new($left, $top, $cropWidth, $cropHeight)
        $targetRectangle = [System.Drawing.Rectangle]::new($targetX, $targetY, $drawWidth, $drawHeight)
        $graphics.DrawImage($cutout, $targetRectangle, $sourceRectangle, [System.Drawing.GraphicsUnit]::Pixel)
      } finally { $graphics.Dispose() }
      $destination.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $destination.Dispose() }
    $cutout.Dispose()
  } finally { $source.Dispose() }
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
foreach ($entry in $sources.GetEnumerator()) {
  $sourcePath = Join-Path $GeneratedDirectory $entry.Value
  if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Missing generated image: $sourcePath" }
  [PortraitProcessor]::Convert($sourcePath, (Join-Path $OutputDirectory ($entry.Key.ToString() + ".png")))
}

Write-Output "Imported $($sources.Count) monster portraits."
