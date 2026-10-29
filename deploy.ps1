# SPPS One-Click GitHub & Vercel Helper Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   SPPS — GitHub Repository & Vercel Deployment Helper   " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Check if authenticated with GitHub CLI
$ghStatus = gh auth status 2>&1
if ($ghStatus -match "Logged in to github.com") {
    Write-Host "[✓] GitHub CLI is authenticated!" -ForegroundColor Green
    $repoName = Read-Host "Enter repository name (default: spps)"
    if ([string]::IsNullOrWhiteSpace($repoName)) { $repoName = "spps" }
    
    Write-Host "Creating GitHub repository '$repoName' and pushing code..." -ForegroundColor Cyan
    gh repo create $repoName --public --source=. --remote=origin --push
    Write-Host "[✓] Successfully created and pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "[!] GitHub authentication required." -ForegroundColor Yellow
    Write-Host "To link and push your repository to GitHub, choose one:" -ForegroundColor White
    Write-Host "  Option 1: Run 'gh auth login' in this terminal to sign in via browser, then re-run .\deploy.ps1" -ForegroundColor Cyan
    Write-Host "  Option 2: Create a new repository at https://github.com/new and run:" -ForegroundColor Cyan
    Write-Host "            git remote add origin https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git" -ForegroundColor White
    Write-Host "            git push -u origin main" -ForegroundColor White
}

Write-Host "`n--- Deploying to Vercel ---" -ForegroundColor Cyan
Write-Host "1. Visit https://vercel.com/new" -ForegroundColor White
Write-Host "2. Click 'Import' next to your GitHub repository" -ForegroundColor White
Write-Host "3. Click 'Deploy' (vercel.json and serverless bridge are already configured!)" -ForegroundColor Green
Write-Host "Your live link (e.g. https://spps-xxx.vercel.app) will be active in seconds!`n" -ForegroundColor Yellow

