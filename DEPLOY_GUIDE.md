# Sendhiiv VPS Deployment Guide

**Server:** `207.180.217.178` (8 GB RAM / 4 vCPU / 200 GB SSD — Contabo)
**Existing app:** `/var/www/sendora` — already running, do not touch it
**New app:** `/var/www/Sendhiiv`

| Domain                 | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| `sendhiiv.com`         | Landing page                               |
| `app.sendhiiv.com`     | Dashboard (auto-redirects `/` to `/login`) |
| `app.sendhiiv.com/api` | Backend API                                |

Node.js, PM2, Nginx, Git, and Certbot are already installed on this server.

---

## Step 1 — DNS Records

Add these three A records at your domain registrar:

| Type | Host  | Value             | TTL  |
| ---- | ----- | ----------------- | ---- |
| A    | `@`   | `207.180.217.178` | Auto |
| A    | `www` | `207.180.217.178` | Auto |
| A    | `app` | `207.180.217.178` | Auto |

DNS can take up to 48 hours to propagate. Check progress at https://dnschecker.org.
You can complete all other steps while waiting.

---

## Step 2 — SSH Into the Server

```bash
ssh root@207.180.217.178
```

---

## Step 3 — Clone the Repo

If you already cloned into `/root/Sendhiiv` by mistake, move it first:

```bash
mv /root/Sendhiiv /var/www/Sendhiiv
```

Otherwise, clone fresh:

```bash
cd /var/www
git clone https://github.com/OgbuluSuccess/Sendoras.git Sendhiiv
```

Confirm it worked:

```bash
ls /var/www/
# Expected output: html  sendora  Sendhiiv
```

---

## Step 4 — Install MongoDB Locally

Your server has enough resources to run MongoDB locally — no Atlas account needed.

> If you already have Atlas and want to keep using it, skip to Step 5.

### 4a — Install MongoDB 7

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt update && apt install -y mongodb-org
```

### 4b — Start MongoDB and enable it on boot

```bash
systemctl start mongod
systemctl enable mongod
```

Verify it is running:

```bash
systemctl status mongod
# Look for: Active: active (running)
```

Test the connection:

```bash
mongosh
# Opens the MongoDB shell. Type 'exit' to quit.
```

### 4c — Set up daily automated backups

```bash
mkdir -p /root/backups
crontab -e
```

Add these two lines at the bottom of the crontab file:

```
# Back up the database every day at 2 AM
0 2 * * * mongodump --db sendhiiv --out /root/backups/$(date +%Y%m%d) --gzip

# Delete backups older than 7 days at 3 AM
0 3 * * * find /root/backups -maxdepth 1 -mtime +7 -type d -exec rm -rf {} +
```

To restore from a backup:

```bash
mongorestore --db sendhiiv --gzip /root/backups/YYYYMMDD/sendhiiv/
```

---

## Step 5 — Create the .env File

```bash
nano /var/www/Sendhiiv/server/.env
```

Paste the template below and fill in your real values:

```env
# Server
PORT=5000
NODE_ENV=production

# MongoDB — choose one option:
# Option A: Local MongoDB (if you completed Step 4)
MONGO_URI=mongodb://127.0.0.1:27017/sendhiiv
# Option B: MongoDB Atlas (if skipping Step 4)
# MONGO_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/sendhiiv

# JWT
JWT_SECRET=replace_with_a_long_random_string

# Email provider (resend | ses | ses,resend | resend,ses)
EMAIL_PROVIDER=resend

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx

# AWS SES (leave blank if not using SES)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
SES_FROM_EMAIL=hello@sendhiiv.com
SES_RETURN_PATH=bounces@sendhiiv.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx

# URLs
APP_BASE_URL=https://app.sendhiiv.com
CLIENT_URL=https://sendhiiv.com

# Google OAuth (leave blank if not using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://app.sendhiiv.com/api/auth/google/callback
```

Save and close: **Ctrl+O → Enter → Ctrl+X**

---

## Step 6 — Build the Frontend

```bash
cd /var/www/Sendhiiv/client
npm install --legacy-peer-deps
VITE_API_URL=https://app.sendhiiv.com/api npm run build
```

This creates the production files in `/var/www/Sendhiiv/client/dist`.

---

## Step 7 — Start the Backend with PM2

**First-time setup (not in PM2 yet):**

```bash
cd /var/www/Sendhiiv/server
npm install --legacy-peer-deps
pm2 start src/index.js --name sendhiiv-api
pm2 save
pm2 startup
# Copy and run the command that pm2 startup prints out
```

**Already in PM2:**

```bash
pm2 restart sendhiiv-api --update-env
```

Verify it started:

```bash
pm2 status
# sendhiiv-api should show "online"

curl http://127.0.0.1:5000/api/health
# Should return a JSON response
```

---

## Step 8 — Configure Nginx

Check existing configs first:

```bash
ls /etc/nginx/sites-available/
ls /etc/nginx/sites-enabled/
```

Create the config file:

```bash
nano /etc/nginx/sites-available/sendhiiv
```

Paste the entire block below:

```nginx
# sendhiiv.com — Landing Page
server {
    listen 80;
    server_name sendhiiv.com www.sendhiiv.com;

    root /var/www/Sendhiiv/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}

# app.sendhiiv.com — Dashboard
server {
    listen 80;
    server_name app.sendhiiv.com;

    root /var/www/Sendhiiv/client/dist;
    index index.html;

    # Redirect bare root to /login
    location = / {
        return 302 /login;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save and close: **Ctrl+O → Enter → Ctrl+X**

Enable the config and reload Nginx:

```bash
rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/sendhiiv /etc/nginx/sites-enabled/
nginx -t
# Must say "syntax is ok" before continuing
systemctl reload nginx
```

Test it (without SSL yet):

```bash
curl http://sendhiiv.com
# Should return your React app HTML
```

---

## Step 9 — Enable SSL with Certbot

> Only run this after DNS has fully propagated. Verify first:
>
> ```bash
> nslookup sendhiiv.com      # must return 207.180.217.178
> nslookup app.sendhiiv.com  # must return 207.180.217.178
> ```

```bash
certbot --nginx -d sendhiiv.com -d www.sendhiiv.com -d app.sendhiiv.com
```

Follow the prompts. Certbot automatically updates your Nginx config to handle HTTPS.

Confirm auto-renewal works:

```bash
certbot renew --dry-run
```

When done, your three URLs are live:

- `https://sendhiiv.com` — Landing page
- `https://app.sendhiiv.com` — Redirects to `/login`
- `https://app.sendhiiv.com/api/health` — Backend API

---

## Step 10 — Future Deploys

Every time you push code to GitHub, SSH in and run:

```bash
cd /var/www/Sendhiiv
bash deploy.sh
```

---

## Troubleshooting

### Blank page or stale content

```bash
cd /var/www/Sendhiiv/client
VITE_API_URL=https://app.sendhiiv.com/api npm run build
systemctl reload nginx
```

### API returns 502 Bad Gateway

```bash
pm2 status
pm2 logs sendhiiv-api --lines 50
pm2 restart sendhiiv-api
```

### MongoDB not connecting

```bash
systemctl status mongod
systemctl restart mongod
mongosh --eval "db.runCommand({ ping: 1 })"
```

### Nginx config error

```bash
nginx -t
tail -f /var/log/nginx/error.log
```

### SSL certificate failed

Certbot needs DNS to be live before it can issue a certificate.
Run `nslookup sendhiiv.com` — if it doesn't return `207.180.217.178`, wait longer and try again.

---

## Quick Reference

| Task                     | Command                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| Deploy latest code       | `cd /var/www/Sendhiiv && bash deploy.sh`                             |
| View backend logs        | `pm2 logs sendhiiv-api`                                              |
| Restart backend          | `pm2 restart sendhiiv-api`                                           |
| MongoDB status           | `systemctl status mongod`                                            |
| Reload Nginx             | `systemctl reload nginx`                                             |
| Renew SSL                | `certbot renew`                                                      |
| Monitor server resources | `pm2 monit`                                                          |
| Check disk usage         | `df -h`                                                              |
| Check RAM usage          | `free -m`                                                            |
| Restore a DB backup      | `mongorestore --db sendhiiv --gzip /root/backups/YYYYMMDD/sendhiiv/` |
