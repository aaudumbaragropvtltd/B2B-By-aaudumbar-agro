Add-Type -AssemblyName System.Drawing

$src = "C:\Users\rsevm\.gemini\antigravity-ide\brain\ddc2e834-6fff-4131-863a-289aa4e9e626\.user_uploaded\media_1789389977266.jpg"
$orig = [System.Drawing.Image]::FromFile($src)

function Resize-Image($sourceImg, $width, $height, $destPath, $format) {
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $graph = [System.Drawing.Graphics]::FromImage($bmp)
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graph.DrawImage($sourceImg, 0, 0, $width, $height)
    $graph.Dispose()
    
    $bmp.Save($destPath, $format)
    $bmp.Dispose()
    Write-Host "Created: $destPath ($width x $height)"
}

# 1. 1024x1024 PNG logo
Resize-Image $orig 1024 1024 "d:\b2b-bharat\public\logo.png" ([System.Drawing.Imaging.ImageFormat]::Png)
Resize-Image $orig 1024 1024 "d:\b2b-bharat\public\logo-circle.jpg" ([System.Drawing.Imaging.ImageFormat]::Jpeg)

# 2. 512x512 App Icon & Public Icons
Resize-Image $orig 512 512 "d:\b2b-bharat\public\icon-512.png" ([System.Drawing.Imaging.ImageFormat]::Png)
Resize-Image $orig 512 512 "d:\b2b-bharat\public\icon.png" ([System.Drawing.Imaging.ImageFormat]::Png)
Resize-Image $orig 512 512 "d:\b2b-bharat\app\icon.png" ([System.Drawing.Imaging.ImageFormat]::Png)

# 3. 192x192 Icon (Google Recommended multiple of 48: 192x192 = 48 * 4)
Resize-Image $orig 192 192 "d:\b2b-bharat\public\icon-192.png" ([System.Drawing.Imaging.ImageFormat]::Png)

# 4. 180x180 Apple Touch Icon
Resize-Image $orig 180 180 "d:\b2b-bharat\public\apple-touch-icon.png" ([System.Drawing.Imaging.ImageFormat]::Png)
Resize-Image $orig 180 180 "d:\b2b-bharat\app\apple-icon.png" ([System.Drawing.Imaging.ImageFormat]::Png)

# 5. 48x48 Favicon (Google Search Favicon standard)
Resize-Image $orig 48 48 "d:\b2b-bharat\public\favicon-48.png" ([System.Drawing.Imaging.ImageFormat]::Png)
Resize-Image $orig 32 32 "d:\b2b-bharat\public\favicon-32.png" ([System.Drawing.Imaging.ImageFormat]::Png)

# Create Favicon.ico from 48x48
$bmp48 = New-Object System.Drawing.Bitmap 48, 48
$g48 = [System.Drawing.Graphics]::FromImage($bmp48)
$g48.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g48.DrawImage($orig, 0, 0, 48, 48)
$g48.Dispose()
$iconHandle = $bmp48.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$fsPublic = New-Object System.IO.FileStream "d:\b2b-bharat\public\favicon.ico", ([System.IO.FileMode]::Create)
$icon.Save($fsPublic)
$fsPublic.Close()
$fsApp = New-Object System.IO.FileStream "d:\b2b-bharat\app\favicon.ico", ([System.IO.FileMode]::Create)
$icon.Save($fsApp)
$fsApp.Close()
$bmp48.Dispose()
Write-Host "Created: public\favicon.ico and app\favicon.ico"

# 6. OpenGraph 1200x630 Social Banner with centered Logo on clean modern branded gradient
$ogBmp = New-Object System.Drawing.Bitmap 1200, 630
$ogGraph = [System.Drawing.Graphics]::FromImage($ogBmp)
$ogGraph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$ogGraph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$ogGraph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Modern subtle gradient background
$rect = New-Object System.Drawing.Rectangle 0, 0, 1200, 630
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(15, 23, 42)), ([System.Drawing.Color]::FromArgb(30, 41, 59)), 45.0
$ogGraph.FillRectangle($brush, $rect)
$brush.Dispose()

# Draw Logo centered at (600 - 225 = 375, 50) with size 450x450
$logoSize = 450
$logoX = [int]((1200 - $logoSize) / 2)
$logoY = 90
$ogGraph.DrawImage($orig, $logoX, $logoY, $logoSize, $logoSize)

$ogGraph.Dispose()
$ogBmp.Save("d:\b2b-bharat\public\og-image.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$ogBmp.Save("d:\b2b-bharat\public\og-image.png", [System.Drawing.Imaging.ImageFormat]::Png)
$ogBmp.Save("d:\b2b-bharat\app\opengraph-image.png", [System.Drawing.Imaging.ImageFormat]::Png)
$ogBmp.Dispose()
Write-Host "Created: OG Social Banners (1200x630)"

$orig.Dispose()
Write-Host "All logo and favicon assets successfully generated!"
