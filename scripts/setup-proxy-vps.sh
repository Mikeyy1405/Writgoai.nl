#!/bin/bash
###############################################################################
# WordPress API Proxy Setup Script
#
# This script sets up a VPS as a WordPress API proxy for Writgo.nl
#
# Usage:
#   1. SSH to your VPS: ssh root@your-vps-ip
#   2. wget https://raw.githubusercontent.com/yourrepo/setup-proxy-vps.sh
#   3. chmod +x setup-proxy-vps.sh
#   4. ./setup-proxy-vps.sh
#
# Requirements:
#   - Ubuntu 22.04 LTS
#   - Root access
#   - Domain name pointing to this server (for SSL)
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root (sudo su)"
    exit 1
fi

log_info "Starting WordPress API Proxy setup..."

# Step 1: Get configuration
echo ""
echo "========================================="
echo "  WordPress Proxy Configuration"
echo "========================================="
echo ""

read -p "Enter your proxy domain (e.g., wp-proxy.jouwdomein.nl): " PROXY_DOMAIN
read -p "Enter your email for Let's Encrypt SSL: " SSL_EMAIL

if [ -z "$PROXY_DOMAIN" ] || [ -z "$SSL_EMAIL" ]; then
    log_error "Domain and email are required!"
    exit 1
fi

log_info "Configuration:"
log_info "  Proxy domain: $PROXY_DOMAIN"
log_info "  SSL email: $SSL_EMAIL"

# Step 2: Update system
log_info "Updating system packages..."
apt update && apt upgrade -y

# Step 3: Install dependencies
log_info "Installing Nginx, Certbot, Node.js..."
apt install -y nginx certbot python3-certbot-nginx curl git ufw

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

log_info "Installed versions:"
nginx -v
node -v
npm -v

# Step 4: Configure firewall
log_info "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw status

# Step 5: Create proxy application directory
log_info "Setting up proxy application..."
mkdir -p /opt/wp-proxy
cd /opt/wp-proxy

# Create package.json
cat > package.json <<'EOF'
{
  "name": "wp-proxy",
  "version": "1.0.0",
  "description": "WordPress API Proxy for Writgo.nl",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.2",
    "node-cache": "^5.1.2",
    "helmet": "^7.1.0",
    "compression": "^1.7.4"
  }
}
EOF

# Create server.js
cat > server.js <<'EOF'
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

// Security middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cache_stats: cache.getStats(),
  });
});

// Main proxy endpoint
app.all('*', async (req, res) => {
  try {
    // Target WordPress URL from header
    const targetUrl = req.headers['x-wp-target'];

    if (!targetUrl) {
      return res.status(400).json({
        error: 'X-WP-Target header is required',
        example: 'X-WP-Target: https://example.com',
      });
    }

    // Build full URL
    const fullUrl = `${targetUrl}${req.url}`;
    const cacheKey = `${req.method}:${fullUrl}`;

    // Check cache (only for GET requests)
    if (req.method === 'GET') {
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log(`[CACHE HIT] ${fullUrl}`);
        return res
          .set('X-Cache', 'HIT')
          .status(cached.status)
          .json(cached.data);
      }
    }

    // Browser-like headers to avoid blocking
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': req.headers['accept'] || 'application/json',
      'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'DNT': '1',
    };

    // Copy important headers from original request
    const headersToForward = [
      'authorization',
      'content-type',
      'x-wp-nonce',
    ];

    headersToForward.forEach(header => {
      if (req.headers[header]) {
        headers[header] = req.headers[header];
      }
    });

    console.log(`[PROXY] ${req.method} ${fullUrl}`);

    // Make request to WordPress site
    const startTime = Date.now();
    const response = await axios({
      method: req.method,
      url: fullUrl,
      headers,
      data: req.body,
      timeout: 120000, // 2 minutes
      validateStatus: () => true, // Don't throw on any status
    });

    const responseTime = Date.now() - startTime;
    console.log(`[RESPONSE] ${response.status} in ${responseTime}ms`);

    // Cache successful GET responses
    if (req.method === 'GET' && response.status === 200) {
      cache.set(cacheKey, {
        status: response.status,
        data: response.data,
      });
    }

    // Forward response
    res
      .set('X-Cache', 'MISS')
      .set('X-Response-Time', `${responseTime}ms`)
      .status(response.status)
      .json(response.data);

  } catch (error) {
    console.error(`[ERROR] ${error.message}`);

    const statusCode = error.response?.status || 500;
    const errorData = {
      error: error.message,
      code: error.code,
      details: error.response?.data,
    };

    res.status(statusCode).json(errorData);
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`WordPress Proxy running on port ${PORT}`);
  console.log(`Cache TTL: 5 minutes`);
  console.log(`Timeout: 120 seconds`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
EOF

# Install dependencies
log_info "Installing Node.js dependencies..."
npm install

# Step 6: Create systemd service
log_info "Creating systemd service..."
cat > /etc/systemd/system/wp-proxy.service <<EOF
[Unit]
Description=WordPress API Proxy
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/wp-proxy
ExecStart=/usr/bin/node /opt/wp-proxy/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=wp-proxy

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/wp-proxy

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
chown -R www-data:www-data /opt/wp-proxy

# Enable and start service
systemctl daemon-reload
systemctl enable wp-proxy
systemctl start wp-proxy

# Check if service is running
if systemctl is-active --quiet wp-proxy; then
    log_info "Proxy service started successfully!"
else
    log_error "Failed to start proxy service"
    systemctl status wp-proxy
    exit 1
fi

# Step 7: Configure Nginx
log_info "Configuring Nginx..."

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create proxy config
cat > /etc/nginx/sites-available/wp-proxy <<EOF
# WordPress API Proxy - HTTP (will redirect to HTTPS after SSL setup)
server {
    listen 80;
    listen [::]:80;
    server_name $PROXY_DOMAIN;

    # For Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS (will be enabled after SSL)
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Timeouts
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/wp-proxy /etc/nginx/sites-enabled/

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx

log_info "Nginx configured successfully!"

# Step 8: Setup SSL with Let's Encrypt
log_info "Setting up SSL certificate..."
certbot --nginx -d $PROXY_DOMAIN --non-interactive --agree-tos -m $SSL_EMAIL --redirect

# Verify SSL certificate
if certbot certificates | grep -q "$PROXY_DOMAIN"; then
    log_info "SSL certificate installed successfully!"
else
    log_warn "SSL certificate installation may have failed"
fi

# Step 9: Setup auto-renewal
log_info "Setting up SSL auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Step 10: Create monitoring script
log_info "Creating monitoring script..."
cat > /opt/wp-proxy/monitor.sh <<'EOF'
#!/bin/bash
# Monitor proxy health

PROXY_URL="http://127.0.0.1:3001/health"

# Check if service is running
if ! systemctl is-active --quiet wp-proxy; then
    echo "ERROR: wp-proxy service is not running!"
    systemctl restart wp-proxy
    exit 1
fi

# Check if nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "ERROR: nginx is not running!"
    systemctl restart nginx
    exit 1
fi

# Check health endpoint
if ! curl -f -s "$PROXY_URL" > /dev/null; then
    echo "ERROR: Health check failed!"
    exit 1
fi

echo "OK: All checks passed"
exit 0
EOF

chmod +x /opt/wp-proxy/monitor.sh

# Add to crontab (check every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/wp-proxy/monitor.sh > /dev/null 2>&1") | crontab -

# Step 11: Display results
echo ""
echo "========================================="
echo "  ✅ Setup Complete!"
echo "========================================="
echo ""
log_info "Your WordPress API Proxy is now running at:"
echo ""
echo "  🌐 URL: https://$PROXY_DOMAIN"
echo "  ✅ Health check: https://$PROXY_DOMAIN/health"
echo ""
log_info "Service status:"
systemctl status wp-proxy --no-pager -l
echo ""
log_info "Test your proxy:"
echo ""
echo "  curl -H 'X-WP-Target: https://example.com' \\"
echo "       https://$PROXY_DOMAIN/wp-json/"
echo ""
log_info "View logs:"
echo "  journalctl -u wp-proxy -f"
echo ""
log_info "Server IP address:"
ip addr show | grep 'inet ' | grep -v '127.0.0.1' | awk '{print "  " $2}' | cut -d/ -f1
echo ""
log_warn "Next steps:"
echo "  1. Update Writgo environment variables:"
echo "     WP_PROXY_ENABLED=true"
echo "     WP_PROXY_URL=https://$PROXY_DOMAIN"
echo ""
echo "  2. Send whitelist instructions to clients with server IP above"
echo ""
echo "  3. Monitor logs: journalctl -u wp-proxy -f"
echo ""
echo "========================================="
