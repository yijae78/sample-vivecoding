# PowerShell 개발 서버 시작 스크립트

Write-Host "🔍 Checking Node.js version..." -ForegroundColor Cyan
node --version
npm --version

Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host "🔧 Checking for .env.local..." -ForegroundColor Cyan
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Warning: .env.local file not found" -ForegroundColor Yellow
    Write-Host "📝 Please create .env.local file from .env.local.example" -ForegroundColor Yellow
}

Write-Host "🚀 Starting development server..." -ForegroundColor Green
npm run dev
