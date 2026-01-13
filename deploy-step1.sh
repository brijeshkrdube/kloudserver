#!/bin/bash

# ============================================
# KloudNests Deployment Script for Ubuntu 24.04
# Domain: kloudnests.com
# ============================================

# Exit on error
set -e

echo "🚀 Starting KloudNests Deployment..."

# ============================================
# STEP 1: System Update & Essential Tools
# ============================================
echo "📦 Step 1: Updating system..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential software-properties-common ufw

# ============================================
# STEP 2: Configure Firewall
# ============================================
echo "🔒 Step 2: Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# ============================================
# STEP 3: Install Node.js 18
# ============================================
echo "📗 Step 3: Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g yarn

echo "Node version: $(node --version)"
echo "Yarn version: $(yarn --version)"

# ============================================
# STEP 4: Install Python dependencies
# ============================================
echo "🐍 Step 4: Setting up Python..."
sudo apt install -y python3-pip python3-venv python3-dev

echo "Python version: $(python3 --version)"

# ============================================
# STEP 5: Install MongoDB 7.0
# ============================================
echo "🍃 Step 5: Installing MongoDB..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Ubuntu 24.04 (noble) - use jammy repo as noble might not be available yet
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org

sudo systemctl start mongod
sudo systemctl enable mongod

echo "MongoDB status:"
sudo systemctl status mongod --no-pager

# ============================================
# STEP 6: Install Nginx
# ============================================
echo "🌐 Step 6: Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# ============================================
# STEP 7: Install Certbot
# ============================================
echo "🔐 Step 7: Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# ============================================
# STEP 8: Create app directory
# ============================================
echo "📁 Step 8: Creating app directory..."
sudo mkdir -p /var/www/kloudnests
sudo chown -R $USER:$USER /var/www/kloudnests

echo ""
echo "✅ Base installation complete!"
echo ""
echo "============================================"
echo "📋 NEXT STEPS (Run manually):"
echo "============================================"
echo ""
echo "1. Clone your GitHub repository:"
echo "   cd /var/www/kloudnests"
echo "   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git ."
echo ""
echo "2. Then run the second script: ./deploy-step2.sh"
echo ""
