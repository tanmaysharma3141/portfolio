# Native PowerShell Static Web Server using .NET HttpListener
$port = 8000
$workspace = "c:\Users\tanma\OneDrive\Documents\code\portfolio"

# Start Listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
    Write-Host "Local web server running at http://localhost:$port/" -ForegroundColor Green
    Write-Host "Press Ctrl+C in terminal (or terminate the task) to stop the server." -ForegroundColor Yellow
} catch {
    Write-Warning "Could not start server on port $port. Check if port is already in use: $_"
    exit
}

# Request Loop
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") {
            $urlPath = "/index.html"
        }
        
        # Resolve full path and prevent directory traversal
        $normalizedPath = $urlPath.Replace("/", "\").TrimStart("\")
        $filePath = Join-Path $workspace $normalizedPath
        
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            
            # Content Types
            $contentType = switch ($ext) {
                ".html"   { "text/html; charset=utf-8" }
                ".css"    { "text/css" }
                ".js"     { "application/javascript" }
                ".png"    { "image/png" }
                ".jpg"    { "image/jpeg" }
                ".jpeg"   { "image/jpeg" }
                ".webp"   { "image/webp" }
                ".mp4"    { "video/mp4" }
                ".woff2"  { "font/woff2" }
                ".json"   { "application/json" }
                default   { "application/octet-stream" }
            }
            
            try {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $response.StatusCode = 500
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes("500 Internal Server Error")
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
