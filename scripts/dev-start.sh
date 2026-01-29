#!/bin/bash
# 로컬 개발 서버 시작 스크립트

set -e

echo "🔍 Checking Node.js version..."
node --version
npm --version

echo "📦 Installing dependencies..."
npm install

echo "🔧 Checking for .env.local..."
if [ ! -f .env.local ]; then
  echo "⚠️  Warning: .env.local file not found"
  echo "📝 Please create .env.local file from .env.local.example"
fi

echo "🚀 Starting development server..."
npm run dev
