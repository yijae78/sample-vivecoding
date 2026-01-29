@echo off
REM Windows 배치 파일 개발 서버 시작 스크립트

echo 🔍 Checking Node.js version...
node --version
npm --version

echo 📦 Installing dependencies...
call npm install

echo 🔧 Checking for .env.local...
if not exist ".env.local" (
    echo ⚠️  Warning: .env.local file not found
    echo 📝 Please create .env.local file from .env.local.example
)

echo 🚀 Starting development server...
call npm run dev
