#!/bin/bash

# ============================================
# KloudNests Deployment Script - Step 2
# Run this AFTER cloning your repository
# ============================================

set -e

APP_DIR="/var/www/kloudnests"
DOMAIN="kloudnests.com"

echo "🚀 Starting Step 2: Application Setup..."

# ============================================
# STEP 9: Setup Backend
# ============================================
echo "⚙️ Step 9: Setting up Backend..."
cd $APP_DIR/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create backend .env file
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=kloudnests
JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_SECRET_KEY_USE_openssl_rand_hex_32
EOF

echo "⚠️  IMPORTANT: Edit /var/www/kloudnests/backend/.env and change JWT_SECRET!"
echo "   Generate a random key with: openssl rand -hex 32"

deactivate

# ============================================
# STEP 10: Setup Frontend
# ============================================
echo "🎨 Step 10: Setting up Frontend..."
cd $APP_DIR/frontend

# Create frontend .env file
cat > .env << EOF
REACT_APP_BACKEND_URL=https://$DOMAIN
EOF

# Install dependencies and build
yarn install
yarn build

echo "✅ Frontend built successfully!"

# ============================================
# STEP 11: Create Systemd Service
# ============================================
echo "🔧 Step 11: Creating systemd service..."

sudo tee /etc/systemd/system/kloudnests-backend.service > /dev/null << EOF
[Unit]
Description=KloudNests Backend API
After=network.target mongod.service

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
ExecStart=$APP_DIR/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable kloudnests-backend
sudo systemctl start kloudnests-backend

echo "Backend service status:"
sudo systemctl status kloudnests-backend --no-pager

# ============================================
# STEP 12: Configure Nginx
# ============================================
echo "🌐 Step 12: Configuring Nginx..."

sudo tee /etc/nginx/sites-available/kloudnests > /dev/null << 'EOF'
server {
    listen 80;
    server_name kloudnests.com www.kloudnests.com;

    # Frontend - serve static React build
    root /var/www/kloudnests/frontend/build;
    index index.html;

    # Handle React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
        client_max_body_size 50M;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site and remove default
sudo ln -sf /etc/nginx/sites-available/kloudnests /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Nginx configured!"

# ============================================
# STEP 13: Install SSL Certificate
# ============================================
echo "🔐 Step 13: Installing SSL Certificate..."
echo ""
echo "Running Certbot for SSL..."
sudo certbot --nginx -d kloudnests.com -d www.kloudnests.com --non-interactive --agree-tos --email admin@kloudnests.com --redirect

echo ""
echo "============================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "Your site should now be live at: https://kloudnests.com"
echo ""
echo "📋 IMPORTANT NEXT STEPS:"
echo ""
echo "1. Update JWT_SECRET in backend .env:"
echo "   nano /var/www/kloudnests/backend/.env"
echo "   (Replace JWT_SECRET with output of: openssl rand -hex 32)"
echo ""
echo "2. Restart backend after changing .env:"
echo "   sudo systemctl restart kloudnests-backend"
echo ""
echo "3. Register admin account at https://kloudnests.com/register"
echo "   Then make it admin in MongoDB:"
echo "   mongosh kloudnests"
echo "   db.users.updateOne({email: \"brijesh.kr.dube@gmail.com\"}, {\$set: {role: \"admin\"}})"
echo ""
echo "📊 USEFUL COMMANDS:"
echo "   View backend logs: sudo journalctl -u kloudnests-backend -f"
echo "   Restart backend:   sudo systemctl restart kloudnests-backend"
echo "   Restart nginx:     sudo systemctl restart nginx"
echo ""
