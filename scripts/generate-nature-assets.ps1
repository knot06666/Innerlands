Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "..\public\nature"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-Canvas($name, [System.Drawing.Color]$top, [System.Drawing.Color]$bottom) {
  $width = 1600
  $height = 1000
  $bitmap = New-Object System.Drawing.Bitmap $width, $height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $rect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $top, $bottom, 90
  $graphics.FillRectangle($brush, $rect)
  $brush.Dispose()
  return @{ Bitmap = $bitmap; Graphics = $graphics; Width = $width; Height = $height; Path = (Join-Path $outDir $name) }
}

function Save-Canvas($canvas) {
  $canvas.Bitmap.Save($canvas.Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Graphics.Dispose()
  $canvas.Bitmap.Dispose()
}

function Add-Mist($g, $width, $height, $opacity) {
  for ($i = 0; $i -lt 7; $i++) {
    $alpha = [Math]::Max(18, $opacity - ($i * 8))
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($alpha, 245, 250, 250))
    $y = 120 + ($i * 90)
    $g.FillEllipse($brush, -220 + ($i * 110), $y, $width + 320, 160)
    $brush.Dispose()
  }
}

function Add-Tree($g, $x, $base, $scale, [System.Drawing.Color]$color) {
  $brush = New-Object System.Drawing.SolidBrush $color
  $trunk = New-Object System.Drawing.RectangleF ($x - 8 * $scale), ($base - 170 * $scale), (16 * $scale), (170 * $scale)
  $g.FillRectangle($brush, $trunk)
  for ($i = 0; $i -lt 4; $i++) {
    $w = (150 - $i * 26) * $scale
    $h = (120 - $i * 14) * $scale
    $y = $base - (110 + $i * 62) * $scale
    $points = @(
      (New-Object System.Drawing.PointF $x, ($y - $h)),
      (New-Object System.Drawing.PointF ($x - $w / 2), $y),
      (New-Object System.Drawing.PointF ($x + $w / 2), $y)
    )
    $g.FillPolygon($brush, $points)
  }
  $brush.Dispose()
}

function Add-Mountain($g, $points, [System.Drawing.Color]$color) {
  $brush = New-Object System.Drawing.SolidBrush $color
  $g.FillPolygon($brush, $points)
  $brush.Dispose()
}

function Add-Glow($g, $x, $y, $size, [System.Drawing.Color]$color) {
  for ($i = 6; $i -gt 0; $i--) {
    $alpha = 12 + (7 - $i) * 8
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($alpha, $color.R, $color.G, $color.B))
    $diameter = $size * $i
    $g.FillEllipse($brush, $x - $diameter / 2, $y - $diameter / 2, $diameter, $diameter)
    $brush.Dispose()
  }
}

$c = New-Canvas "mist-forest.png" ([System.Drawing.Color]::FromArgb(160, 182, 181)) ([System.Drawing.Color]::FromArgb(24, 43, 48))
for ($i = 0; $i -lt 16; $i++) { Add-Tree $c.Graphics (80 + $i * 105) 980 (0.8 + ($i % 4) * 0.13) ([System.Drawing.Color]::FromArgb(38, 65, 59)) }
Add-Mist $c.Graphics $c.Width $c.Height 86
Save-Canvas $c

$c = New-Canvas "morning-meadow.png" ([System.Drawing.Color]::FromArgb(234, 220, 181)) ([System.Drawing.Color]::FromArgb(96, 139, 101))
Add-Glow $c.Graphics 1180 210 110 ([System.Drawing.Color]::FromArgb(255, 230, 175))
$grass = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(90, 128, 87))
$c.Graphics.FillEllipse($grass, -220, 660, 2040, 520)
$grass.Dispose()
for ($i = 0; $i -lt 80; $i++) {
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(70, 245, 248, 224)), 2
  $x = ($i * 37) % 1600
  $c.Graphics.DrawLine($pen, $x, 760 + ($i % 7) * 20, $x + 22, 700 + ($i % 5) * 18)
  $pen.Dispose()
}
Save-Canvas $c

$c = New-Canvas "clouded-sea.png" ([System.Drawing.Color]::FromArgb(138, 158, 168)) ([System.Drawing.Color]::FromArgb(28, 57, 70))
$sea = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(48, 90, 105))
$c.Graphics.FillRectangle($sea, 0, 540, 1600, 460)
$sea.Dispose()
for ($i = 0; $i -lt 11; $i++) {
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(72, 230, 238, 238)), 3
  $y = 590 + $i * 38
  $c.Graphics.DrawBezier($pen, -80, $y, 430, $y - 50, 980, $y + 50, 1680, $y - 12)
  $pen.Dispose()
}
Add-Mist $c.Graphics $c.Width $c.Height 42
Save-Canvas $c

$c = New-Canvas "mountain-wind.png" ([System.Drawing.Color]::FromArgb(182, 198, 205)) ([System.Drawing.Color]::FromArgb(42, 62, 73))
Add-Mountain $c.Graphics @((New-Object System.Drawing.PointF 0, 780), (New-Object System.Drawing.PointF 430, 230), (New-Object System.Drawing.PointF 850, 780)) ([System.Drawing.Color]::FromArgb(75, 96, 105))
Add-Mountain $c.Graphics @((New-Object System.Drawing.PointF 420, 820), (New-Object System.Drawing.PointF 990, 180), (New-Object System.Drawing.PointF 1600, 820)) ([System.Drawing.Color]::FromArgb(54, 78, 88))
Add-Mist $c.Graphics $c.Width $c.Height 48
Save-Canvas $c

$c = New-Canvas "rain-garden.png" ([System.Drawing.Color]::FromArgb(176, 198, 184)) ([System.Drawing.Color]::FromArgb(34, 72, 52))
for ($i = 0; $i -lt 28; $i++) {
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(95, 51 + ($i % 4) * 14, 105, 72))
  $x = ($i * 73) % 1600
  $c.Graphics.FillEllipse($brush, $x - 70, 580 + ($i % 8) * 28, 190, 95)
  $brush.Dispose()
}
for ($i = 0; $i -lt 22; $i++) {
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(160, 232, 210, 198))
  $x = ($i * 109) % 1600
  $c.Graphics.FillEllipse($brush, $x, 520 + ($i % 9) * 36, 18, 18)
  $brush.Dispose()
}
Add-Mist $c.Graphics $c.Width $c.Height 34
Save-Canvas $c

$c = New-Canvas "river-valley.png" ([System.Drawing.Color]::FromArgb(178, 199, 199)) ([System.Drawing.Color]::FromArgb(33, 64, 62))
Add-Mountain $c.Graphics @((New-Object System.Drawing.PointF -80, 820), (New-Object System.Drawing.PointF 360, 280), (New-Object System.Drawing.PointF 760, 820)) ([System.Drawing.Color]::FromArgb(58, 96, 83))
Add-Mountain $c.Graphics @((New-Object System.Drawing.PointF 820, 820), (New-Object System.Drawing.PointF 1240, 300), (New-Object System.Drawing.PointF 1680, 820)) ([System.Drawing.Color]::FromArgb(48, 82, 77))
$river = New-Object System.Drawing.Drawing2D.GraphicsPath
$river.AddBezier(720, 1000, 620, 790, 850, 670, 780, 500)
$river.AddBezier(780, 500, 1020, 650, 1020, 850, 960, 1000)
$river.CloseFigure()
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(102, 176, 190, 188))
$c.Graphics.FillPath($brush, $river)
$brush.Dispose()
Save-Canvas $c

$c = New-Canvas "desert-stars.png" ([System.Drawing.Color]::FromArgb(26, 33, 55)) ([System.Drawing.Color]::FromArgb(106, 82, 63))
for ($i = 0; $i -lt 120; $i++) {
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(150, 245, 238, 210))
  $x = ($i * 97) % 1600
  $y = 35 + (($i * 53) % 420)
  $c.Graphics.FillEllipse($brush, $x, $y, 3 + ($i % 3), 3 + ($i % 3))
  $brush.Dispose()
}
$sand = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(167, 130, 93))
$c.Graphics.FillEllipse($sand, -260, 700, 2120, 520)
$sand.Dispose()
Save-Canvas $c

$c = New-Canvas "tropical-rainforest.png" ([System.Drawing.Color]::FromArgb(105, 152, 128)) ([System.Drawing.Color]::FromArgb(18, 60, 43))
for ($i = 0; $i -lt 24; $i++) {
  Add-Tree $c.Graphics (40 + $i * 72) 1050 (0.72 + ($i % 5) * 0.09) ([System.Drawing.Color]::FromArgb(27, 87, 54))
}
for ($i = 0; $i -lt 34; $i++) {
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(110, 72, 139, 82))
  $x = ($i * 61) % 1600
  $c.Graphics.FillEllipse($brush, $x - 80, 470 + ($i % 11) * 35, 230, 130)
  $brush.Dispose()
}
Add-Mist $c.Graphics $c.Width $c.Height 28
Save-Canvas $c
