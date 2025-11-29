# Script to cleanly restart the frontend dev server

Write-Host "Stopping all Node processes on port 5173..." -ForegroundColor Yellow

# Find processes using port 5173
$processes = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($pid in $processes) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped process $pid" -ForegroundColor Green
        } catch {
            Write-Host "Could not stop process $pid" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "No processes found on port 5173" -ForegroundColor Gray
}

# Wait a moment for ports to be released
Start-Sleep -Seconds 2

Write-Host "`n✅ Port 5173 is now free" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. In your browser, press Ctrl+Shift+R (hard refresh)" -ForegroundColor White
Write-Host "2. Or close and reopen the browser tab" -ForegroundColor White
Write-Host "3. Start the dev server: npm run dev" -ForegroundColor White

