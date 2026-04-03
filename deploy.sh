#!/bin/bash

# Sendora Local Deployment Script
# Run this inside the VPS to automatically pull and deploy the latest changes

echo "🚀 Starting Sendora Deployment..."

# 1. Ensure we are in the correct directory
cd /var/www/sendora/Sendoras || { echo "❌ Could not find the Sendora directory"; exit 1; }

# 2. Pull the latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git fetch --all
git reset --hard origin/main
git pull origin main

# 3. Update Client (Frontend)
echo "📦 Building the React Frontend..."
cd client
npm install
npm run build
cd ..

# 4. Update Server (Backend)
echo "⚙️ Updating backend dependencies..."
cd server
npm install
cd ..

# 5. Restart PM2
echo "🔄 Restarting Sendora API..."
pm2 restart sendora-api --update-env

echo "✅ Deployment Complete! Your live app has been successfully updated."
