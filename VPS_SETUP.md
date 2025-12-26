# 🚀 VPS AI Agent Setup Guide

Deze guide legt uit hoe je de AI Agent verbindt met je Ubuntu VPS voor directe terminal access.

## Wat kan de AI Agent doen met VPS toegang?

Met VPS toegang kan de AI Agent **ALLES** uitvoeren op je server:

- ✅ Software installeren (Docker, Node.js, databases, etc.)
- ✅ Servers deployen en configureren
- ✅ Scripts uitvoeren en automatiseren
- ✅ System resources checken (disk space, memory, processes)
- ✅ Files beheren (create, edit, delete)
- ✅ Databases opzetten en beheren
- ✅ Webservers configureren (Nginx, Apache)
- ✅ Cronjobs instellen
- ✅ En nog veel meer...

**Voorbeeld commando's:**
- "Installeer Docker op de VPS"
- "Check hoeveel disk ruimte er nog is"
- "Deploy een Node.js app van GitHub"
- "Setup een PostgreSQL database"
- "Laat alle draaiende processen zien"

## 📋 Vereisten

1. Een Ubuntu VPS server (Ubuntu 20.04 of hoger)
2. SSH toegang tot de VPS
3. Root of sudo rechten

## 🔧 Setup Stappen

### Stap 1: VPS Voorbereiden

SSH naar je VPS:

```bash
ssh your-username@your-vps-ip
```

Maak een dedicated user aan voor de AI Agent (optioneel maar aanbevolen):

```bash
# Maak nieuwe user
sudo adduser aiagent

# Geef sudo rechten
sudo usermod -aG sudo aiagent

# (Optioneel) Zet passwordless sudo voor automation
echo "aiagent ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/aiagent
```

### Stap 2: SSH Authenticatie Instellen

**Optie A: Password authenticatie (simpel)**

Gebruik gewoon je VPS password. Voeg toe aan `.env`:

```env
VPS_HOST=your-vps-ip
VPS_PORT=22
VPS_USER=aiagent
VPS_PASSWORD=your-password
```

**Optie B: SSH Key authenticatie (veiliger)**

Genereer een SSH key op je local machine (waar WritGo.nl draait):

```bash
# Genereer SSH key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/aiagent_vps_key -N ""

# Kopieer public key naar VPS
ssh-copy-id -i ~/.ssh/aiagent_vps_key.pub aiagent@your-vps-ip

# Test de connectie
ssh -i ~/.ssh/aiagent_vps_key aiagent@your-vps-ip
```

Voeg toe aan `.env`:

```env
VPS_HOST=your-vps-ip
VPS_PORT=22
VPS_USER=aiagent
VPS_SSH_KEY_PATH=/home/your-user/.ssh/aiagent_vps_key
# Alleen als je key een passphrase heeft:
VPS_SSH_PASSPHRASE=your-passphrase
```

### Stap 3: Configureer WritGo.nl

Kopieer de VPS credentials naar je `.env` file:

```bash
# Kopieer van .env.example
cp .env.example .env

# Edit .env en voeg VPS credentials toe
nano .env
```

Voeg deze regels toe aan je `.env`:

```env
# VPS Terminal Access
VPS_HOST=123.45.67.89          # Je VPS IP of domain
VPS_PORT=22                     # SSH port (default 22)
VPS_USER=aiagent                # SSH username
VPS_PASSWORD=your-password      # SSH password (of gebruik SSH key)

# Of met SSH Key:
# VPS_SSH_KEY_PATH=/path/to/your/private/key
# VPS_SSH_PASSPHRASE=your-key-passphrase  # Optioneel
```

### Stap 4: Installeer Dependencies

Installeer de SSH2 package:

```bash
npm install
```

### Stap 5: Test de Connectie

Start WritGo.nl:

```bash
npm run dev
```

Ga naar `/dashboard/ai-agent/chat` en je zou een groene status moeten zien:

```
🖥️ VPS Connected: aiagent@123.45.67.89
```

Als het niet werkt, zie je:

```
⚠️ VPS niet geconfigureerd. Voeg VPS_HOST, VPS_USER en VPS_PASSWORD toe aan .env
```

## 🎯 Gebruik

### Simpele Commands

Chat met de AI Agent en vraag om VPS commands:

**Voorbeeld 1: System info**
```
User: "Check de system resources van de VPS"

AI: Ik voer dit command uit: df -h && free -h && uptime

✅ VPS Command Executed
Command: `df -h && free -h && uptime`

Output:
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1        50G   12G   36G  25% /
...
```

**Voorbeeld 2: Software installeren**
```
User: "Installeer Docker op de VPS"

AI: Ik ga Docker installeren via:
sudo apt-get update && sudo apt-get install -y docker.io

✅ VPS Command Executed
...
```

**Voorbeeld 3: Node.js app deployen**
```
User: "Deploy deze Node.js app: https://github.com/user/my-app"

AI: Ik voer deze stappen uit:
1. git clone https://github.com/user/my-app
2. cd my-app && npm install
3. pm2 start index.js
```

### Auto-Execute vs Confirmation

De AI detecteert automatisch of een command **safe** is:

**Auto-execute** (geen bevestiging nodig):
- Read-only commands (ls, df, ps, cat, etc.)
- Installation commands (apt install, npm install)
- Status checks (systemctl status, docker ps)

**Requires confirmation** (veiligheid):
- Destructive commands (rm, delete, drop database)
- System changes (reboot, shutdown)
- File modifications

## 🔒 Beveiliging

### Belangrijke Security Tips:

1. **Gebruik een dedicated user**: Maak een aparte `aiagent` user, niet root
2. **SSH Key > Password**: Gebruik SSH keys in plaats van passwords
3. **Firewall**: Zorg dat alleen jouw IP toegang heeft tot SSH:
   ```bash
   sudo ufw allow from YOUR_IP to any port 22
   sudo ufw enable
   ```
4. **Fail2ban**: Installeer fail2ban tegen brute force attacks:
   ```bash
   sudo apt-get install -y fail2ban
   ```
5. **Audit logs**: Check regelmatig `/var/log/auth.log` voor suspicious activity

### VPS Isolatie (Aanbevolen)

Voor productie gebruik, run alles in Docker containers:

```bash
# Installeer Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# AI Agent kan dan veilig containers beheren
docker run --rm ubuntu:22.04 ls -la
```

## 🐛 Troubleshooting

### "Connection refused" error

Check of SSH draait op de VPS:
```bash
sudo systemctl status ssh
sudo systemctl start ssh
```

### "Permission denied" error

Check SSH key permissions:
```bash
chmod 600 ~/.ssh/aiagent_vps_key
```

Of test handmatig:
```bash
ssh -i ~/.ssh/aiagent_vps_key aiagent@your-vps-ip
```

### "Timeout" errors

Check firewall rules:
```bash
sudo ufw status
sudo ufw allow 22/tcp
```

### Commands niet auto-executing

Check of `VPS_HOST` en `VPS_USER` correct zijn ingesteld in `.env`.

## 📚 Voorbeelden

### Voorbeeld 1: Setup Complete LAMP Stack

```
User: "Setup een complete LAMP stack op de VPS"

AI: Ik ga een LAMP stack installeren (Linux, Apache, MySQL, PHP)

Commands:
1. sudo apt-get update
2. sudo apt-get install -y apache2 mysql-server php php-mysql
3. sudo systemctl start apache2
4. sudo systemctl start mysql
```

### Voorbeeld 2: Deploy WordPress Site

```
User: "Deploy een WordPress site op de VPS"

AI: Ik ga WordPress installeren met Docker

Commands:
1. docker run -d --name wordpress -p 80:80 -e WORDPRESS_DB_HOST=mysql wordpress
2. docker run -d --name mysql -e MYSQL_ROOT_PASSWORD=secret mysql:5.7
```

### Voorbeeld 3: Monitor Server

```
User: "Geef me een overzicht van de server status"

AI:
✅ VPS Command Executed
Command: `top -bn1 | head -20 && df -h && free -h`

Output:
CPU: 2.3% user, 1.2% system
Memory: 1.2G used / 4G total
Disk: 12G used / 50G total (24%)
```

## 🚀 Geavanceerde Features

### Custom Scripts

Upload een script naar de VPS en laat de AI het uitvoeren:

```bash
# Op VPS: maak script
cat > /home/aiagent/deploy.sh << 'EOF'
#!/bin/bash
git pull origin main
npm install
pm2 restart all
EOF

chmod +x /home/aiagent/deploy.sh
```

```
User: "Run het deploy script"
AI: bash /home/aiagent/deploy.sh
```

### Scheduled Tasks

```
User: "Setup een cronjob die elke nacht om 3am backups maakt"

AI: (echo "0 3 * * * /home/aiagent/backup.sh") | crontab -
```

## 🎉 Klaar!

Je AI Agent heeft nu volledige VPS toegang en kan vrijwel alles voor je automatiseren!

**Test het:**
1. Ga naar `/dashboard/ai-agent/chat`
2. Type: "Check de VPS system status"
3. Zie de AI live commands uitvoeren!

Voor vragen of problemen, check de logs:
```bash
# WritGo.nl logs
npm run dev

# VPS logs
sudo tail -f /var/log/auth.log
```

---

**WAARSCHUWING**: Geef alleen VPS toegang aan de AI Agent als je de security implications begrijpt. De AI kan ALLES uitvoeren op je server.
