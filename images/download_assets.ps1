$baseUrl = "https://banuinayah.netlify.app"
$files = @(
    "musik.mp3",
    "bg-opening.jpg",
    "foto-cover.jpg",
    "foto-utama.jpg",
    "foto-cowo.jpg",
    "foto-cewe.jpg",
    "foto-penutup.jpg",
    "logo-bri.png",
    "foto-1.jpg",
    "foto-2.jpg",
    "foto-3.jpg",
    "foto-4.jpg",
    "foto-5.jpg",
    "foto-6.jpg"
)

# Create assets folder if needed (though we download them in the root directory since the HTML references them relatively in the root)
# Let's verify paths in HTML. Yes, HTML uses:
# src="musik.mp3", src="foto-cover.jpg", src="foto-utama.jpg", src="foto-cowo.jpg", src="foto-cewe.jpg", src="foto-penutup.jpg", src="logo-bri.png"
# and in CSS: url('bg-opening.jpg')
# and in gallery: src="foto-1.jpg" etc.
# So we download all of them directly to the root of the project directory.

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $targetPath = Join-Path $PSScriptRoot $file
    Write-Host "Downloading $url to $targetPath..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $targetPath -ErrorAction Stop
        Write-Host "Success: $file"
    } catch {
        Write-Warning "Failed to download $file : $_"
    }
}
