Add-Type -AssemblyName System.Drawing
$basePath = "c:\UTEQ\CASA ABIERTA\PROJECT NEMESIS\project-nemesis\src\assets\sprites\nemesis\"
$files = Get-ChildItem $basePath -Filter "*.png"
foreach ($f in $files) {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    Write-Host "$($f.Name): $($img.Width)x$($img.Height)"
    $img.Dispose()
}
