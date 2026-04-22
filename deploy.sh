#!/bin/bash

# Sendhiiv Deployment Script
# Run this inside the VPS to automatically pull and deploy the latest changes

set -e  # Exit immediately on any error

echo "🚀 Starting Sendhiiv Deployment..."

# 1. Ensure we are in the correct directory
cd /var/www/Sendhiiv || { echo "❌ Could not find the Sendhiiv directory"; exit 1; }

# 2. Pull the latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git fetch --all
git reset --hard origin/main

# 3. Update Client (Frontend)
echo "📦 Building the React Frontend..."
cd client
npm install --legacy-peer-deps

# Inject production API URL so the client hits your live backend
VITE_API_URL=https://app.sendhiiv.com/api npm run build

cd ..

# 4. Update Server (Backend)
echo "⚙️ Updating backend dependencies..."
cd server
npm install --legacy-peer-deps
cd ..

# 5. Restart PM2
echo "🔄 Restarting Sendhiiv API..."
pm2 restart sendhiiv-api --update-env

echo "✅ Deployment Complete! Live at:"
echo "   🌐 https://sendhiiv.com       (landing page)"
echo "   🖥️  https://app.sendhiiv.com  (dashboard)"
