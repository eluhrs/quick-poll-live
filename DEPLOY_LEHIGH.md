# Server Configuration Guide: Quick Poll Live
**Target Hostname**: `livepoll.lehigh.edu`
**Target Server**: `vos.cc.lehigh.edu` (or similar Debian host)

## Phase 1: Preparation
We will use the following port assignment:
*   **Application**: `quick-poll-live` (Frontend Container)
*   **Internal Container Port**: `80` (Nginx)
*   **Chosen Host Port**: `10001` (Configured via `.env`)

## Phase 2: Docker Container Deployment

### 1. Setup Application
```bash
# Clone
# (Assuming you are already in the target directory, e.g. /var/www/livepoll)
git clone https://github.com/eluhrs/quick-poll-live.git .

# Configure Env
cp example.env .env
nano .env
```

**Configuration Steps (.env):**
1.  **Generate Secret Key**: Run `python3 -c "import secrets; print(secrets.token_hex(32))"` and paste the result into `SECRET_KEY`.
2.  **Set Origins**: update `ALLOWED_ORIGINS` to include your production URL.
3.  **Set Port**: Ensure `APP_PORT` matches your assigned port (10001).

*Example Final `.env`:*
```env
SECRET_KEY=a1b2c3d4e5...
ALLOWED_ORIGINS=https://livepoll.lehigh.edu,http://localhost:8081
APP_PORT=10001
```

### 2. Initialize Data Directory
The backend writes database files to `./data`. For security, we restrict access to the container user (UID 1000).

```bash
mkdir data
# Set ownership to standard user (5001:5001 matches the container user)
sudo chown -R 5001:5001 data
# Restrict permissions so only the owner can read/write (Mode 700)
sudo chmod 700 data
```

### 3. Build and Run
Build the containers (this bakes the API URL into the frontend).
**Use `--no-cache` if upgrading to clear out old layers:**
```bash
docker compose build --no-cache frontend
docker compose up -d
```
Verify it is running:
```bash
docker compose ps
```
You should see:
*   `poll_backend` (Port 8000 -> 127.0.0.1:8000)
*   `poll_frontend` (Port 80 -> 127.0.0.1:10001)

## Phase 3: Apache Reverse Proxy Configuration
Configure Apache to handle SSL and forward traffic. Since the Frontend Container now handles internal API routing, the Apache configuration is very simple.

### 1. Edit HTTPS Config
```bash
sudo nano /etc/apache2/sites-available/livepoll.lehigh.edu-ssl.conf
```
Insert the following `ProxyPass` rules.

```apache
<VirtualHost *:443>
    ServerName livepoll.lehigh.edu
    
    # SSL Configuration (Use your existing paths)
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem

    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"

    # WebSocket Proxy (Critical for Real-Time Updates)
    # Must be placed BEFORE the catch-all '/' proxy
    ProxyPass /ws/ ws://127.0.0.1:10001/ws/
    ProxyPassReverse /ws/ ws://127.0.0.1:10001/ws/

    # Frontend Proxy (Route EVERYTHING to Frontend Container: 10001)
    # The Frontend Nginx will internally proxy /api requests to the backend.
    ProxyPass / http://127.0.0.1:10001/
    ProxyPassReverse / http://127.0.0.1:10001/
</VirtualHost>
```

### 2. Enable & Restart
```bash
sudo a2ensite livepoll.lehigh.edu-ssl.conf
sudo systemctl restart apache2
```

## Phase 4: Firewall (UFW)
Ensure only the public web ports are open.

```bash
sudo ufw default deny incoming
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```
*Note: Ports 10001 and 8000 are explicitly bound to `127.0.0.1` in Docker, so they are not accessible externally regardless of firewall, but UFW adds a layer of safety.*

## Troubleshooting
*   **"Unable to open database"**: Run `sudo chown -R 5001:5001 data && sudo chmod 700 data` to fix permission issues.
*   **"API Error" in Browser**: Check F12 Console. If 404/502 on `/api/...`, check if `poll_backend` container is running (`docker compose ps`).
*   **Old Code Persists / "Zombie Files"**: If `git pull` days "Already up to date" but the site is still old, the local file system is desynchronized.
    *   **Fix**: `git fetch --all && git reset --hard origin/master`
    *   **Then Rebuild**: `docker compose build --no-cache frontend`
