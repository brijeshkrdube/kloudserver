# KloudNests Deployment Guide

## Deploy on Ubuntu VPS with Domain: kloudnests.com

This guide will help you deploy the KloudNests application on a fresh Ubuntu VPS.

---

## Prerequisites
- Fresh Ubuntu VPS (20.04 or 22.04 LTS recommended)
- Domain `kloudnests.com` pointed to your VPS IP address
- SSH access to your VPS (root or sudo user)

---

## Step 1: Point Your Domain to VPS

Before starting, make sure your domain DNS is configured:

1. Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
2. Add/Update DNS A records:
   ```
   Type: A    Host: @              Value: YOUR_VPS_IP
   Type: A    Host: www            Value: YOUR_VPS_IP
   ```
3. Wait 5-30 minutes for DNS propagation

---

## Step 2: Initial VPS Setup

SSH into your VPS and run these commands:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential software-properties-common

# Set up firewall
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## Step 3: Install Node.js (v18+)

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install Yarn globally
sudo npm install -g yarn
```

---

## Step 4: Install Python 3.11+

```bash
# Add Python repository
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Set Python 3.11 as default (optional)
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Verify installation
python3 --version
```

---

## Step 5: Install MongoDB

```bash
# Import MongoDB public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository (Ubuntu 22.04)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# For Ubuntu 20.04, use this instead:
# echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

---

## Step 6: Install Nginx

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Step 7: Install Certbot (SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## Step 8: Create Application User

```bash
# Create a dedicated user for the app
sudo useradd -m -s /bin/bash kloudnests

# Create app directory
sudo mkdir -p /var/www/kloudnests
sudo chown -R kloudnests:kloudnests /var/www/kloudnests
```

---

## Step 9: Upload Project Files

### Option A: Using Git (Recommended)
If your code is on GitHub:
```bash
sudo -u kloudnests git clone https://github.com/YOUR_USERNAME/kloudnests.git /var/www/kloudnests
```

### Option B: Using SCP (From your local machine)
From your local machine, run:
```bash
# First, download/export your project from Emergent platform
# Then upload to VPS:
scp -r /path/to/kloudnests/* root@YOUR_VPS_IP:/var/www/kloudnests/
sudo chown -R kloudnests:kloudnests /var/www/kloudnests
```

### Option C: Using SFTP
Use an SFTP client like FileZilla to upload files to `/var/www/kloudnests/`

---

## Step 10: Set Up Backend

```bash
# Switch to app user
sudo su - kloudnests
cd /var/www/kloudnests/backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=kloudnests
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
EOF

# Exit back to root/sudo user
exit
```

**Important:** Change `JWT_SECRET` to a random secure string. You can generate one with:
```bash
openssl rand -hex 32
```

---

## Step 11: Set Up Frontend

```bash
sudo su - kloudnests
cd /var/www/kloudnests/frontend

# Create .env file for production
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://kloudnests.com
EOF

# Install dependencies
yarn install

# Build for production
yarn build

exit
```

---

## Step 12: Create Systemd Service for Backend

```bash
sudo nano /etc/systemd/system/kloudnests-backend.service
```

Paste this content:

```ini
[Unit]
Description=KloudNests Backend API
After=network.target mongod.service

[Service]
Type=simple
User=kloudnests
Group=kloudnests
WorkingDirectory=/var/www/kloudnests/backend
Environment="PATH=/var/www/kloudnests/backend/venv/bin"
ExecStart=/var/www/kloudnests/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable kloudnests-backend
sudo systemctl start kloudnests-backend

# Check status
sudo systemctl status kloudnests-backend
```

---

## Step 13: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/kloudnests
```

Paste this configuration:

```nginx
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
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/kloudnests /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 14: Install SSL Certificate

```bash
sudo certbot --nginx -d kloudnests.com -d www.kloudnests.com
```

Follow the prompts:
- Enter your email address
- Agree to terms
- Choose to redirect HTTP to HTTPS (recommended)

Certbot will automatically update your Nginx config for HTTPS.

---

## Step 15: Set Up Auto-Renewal for SSL

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job, verify with:
sudo systemctl status certbot.timer
```

---

## Step 16: Initialize Admin User

The admin user will be created automatically when you first access the app, OR you can create it via MongoDB:

```bash
# Connect to MongoDB
mongosh kloudnests

# Create admin user (run in MongoDB shell)
db.users.insertOne({
  email: "brijesh.kr.dube@gmail.com",
  password: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYkjK0jK0jK0", 
  name: "Admin",
  role: "admin",
  is_verified: true,
  created_at: new Date()
})
```

**Note:** The password hash above is a placeholder. The app should handle password hashing on first login or you can register through the app and then update the role to "admin" in the database.

Better approach - just register normally and update role:
```bash
mongosh kloudnests
db.users.updateOne({email: "brijesh.kr.dube@gmail.com"}, {$set: {role: "admin"}})
```

---

## Useful Commands

### Check Service Status
```bash
sudo systemctl status kloudnests-backend
sudo systemctl status nginx
sudo systemctl status mongod
```

### View Backend Logs
```bash
sudo journalctl -u kloudnests-backend -f
```

### Restart Services
```bash
sudo systemctl restart kloudnests-backend
sudo systemctl restart nginx
```

### Update Application
```bash
cd /var/www/kloudnests

# Pull latest code (if using git)
sudo -u kloudnests git pull

# Update backend
cd backend
sudo -u kloudnests bash -c "source venv/bin/activate && pip install -r requirements.txt"
sudo systemctl restart kloudnests-backend

# Update frontend
cd ../frontend
sudo -u kloudnests yarn install
sudo -u kloudnests yarn build
sudo systemctl reload nginx
```

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
sudo journalctl -u kloudnests-backend -n 50

# Test manually
sudo su - kloudnests
cd /var/www/kloudnests/backend
source venv/bin/activate
python -c "import server"  # Check for import errors
```

### 502 Bad Gateway
- Backend might not be running: `sudo systemctl status kloudnests-backend`
- Check if port 8001 is in use: `sudo lsof -i :8001`

### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### SSL Certificate Issues
```bash
# Force renewal
sudo certbot renew --force-renewal

# Check certificate
sudo certbot certificates
```

---

## Security Recommendations

1. **Change default passwords** - Update JWT_SECRET and admin password
2. **Enable MongoDB authentication** (for production)
3. **Set up fail2ban** for SSH protection
4. **Regular backups** of MongoDB data
5. **Keep system updated** - `sudo apt update && sudo apt upgrade`

---

## Backup MongoDB

```bash
# Create backup
mongodump --db kloudnests --out /var/backups/mongodb/$(date +%Y%m%d)

# Restore backup
mongorestore --db kloudnests /var/backups/mongodb/20240115/kloudnests
```

---

## Summary Checklist

- [ ] Domain DNS pointed to VPS IP
- [ ] Ubuntu packages updated
- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed
- [ ] MongoDB installed and running
- [ ] Nginx installed and configured
- [ ] Project files uploaded
- [ ] Backend .env configured
- [ ] Frontend .env configured and built
- [ ] Backend systemd service running
- [ ] Nginx configured for domain
- [ ] SSL certificate installed
- [ ] Admin user created/configured
- [ ] Test the site at https://kloudnests.com

---

**Congratulations!** Your KloudNests application should now be live at https://kloudnests.com 🎉

For any issues, check the logs using the commands in the Troubleshooting section.
