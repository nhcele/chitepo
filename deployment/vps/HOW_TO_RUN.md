# How to Execute install-vps.sh on Your VPS

This guide shows you how to transfer and run the `install-vps.sh` script on your Linux VPS.

## Method 1: Transfer File and Run (Recommended)

### Step 1: Transfer the Script to Your VPS

From your **local Windows machine**, open PowerShell or Command Prompt and run:

```powershell
# Navigate to your project directory
cd C:\chitepo

# Transfer the script to your VPS (replace with your VPS details)
scp deployment/vps/install-vps.sh user@your-vps-ip:/chitepo/
```

**Replace:**
- `user` - Your VPS username (e.g., `root`, `ubuntu`, `debian`)
- `your-vps-ip` - Your VPS IP address or domain name

**Example:**
```powershell
scp deployment/vps/install-vps.sh root@192.168.1.100:/chitepo/
```

### Step 2: Connect to Your VPS

```powershell
# SSH into your VPS
ssh user@your-vps-ip
```

**Example:**
```powershell
ssh root@192.168.1.100
```

### Step 3: Make Script Executable and Run

Once connected to your VPS:

```bash
# Navigate to the project directory
cd /chitepo

# Make the script executable
chmod +x install-vps.sh

# Run the script
./install-vps.sh
```

## Method 2: Copy-Paste Script Content

If you can't use SCP, you can copy the script content and create it on the VPS:

### Step 1: View Script Content

On your local machine, open the file:
```
C:\chitepo\deployment\vps\install-vps.sh
```

### Step 2: Create File on VPS

SSH into your VPS and create the file:

```bash
# Connect to VPS
ssh user@your-vps-ip

# Navigate to project directory
cd /chitepo

# Create the script file
nano install-vps.sh
```

### Step 3: Paste Content

1. Copy the entire content from `install-vps.sh` on your local machine
2. Paste it into the nano editor on your VPS
3. Press `Ctrl + O` to save
4. Press `Enter` to confirm
5. Press `Ctrl + X` to exit

### Step 4: Make Executable and Run

```bash
# Make executable
chmod +x install-vps.sh

# Run the script
./install-vps.sh
```

## Method 3: Using Git (If Project is in Repository)

If your project is in a Git repository:

```bash
# On your VPS
cd /chitepo

# Pull latest changes (if needed)
git pull

# Make script executable
chmod +x deployment/vps/install-vps.sh

# Run the script
./deployment/vps/install-vps.sh
```

## Method 4: Direct Download (If Script is Online)

If you host the script online or in a repository:

```bash
# On your VPS
cd /chitepo

# Download the script
wget https://your-repo-url/deployment/vps/install-vps.sh

# Or using curl
curl -O https://your-repo-url/deployment/vps/install-vps.sh

# Make executable
chmod +x install-vps.sh

# Run
./install-vps.sh
```

## What the Script Does

The `install-vps.sh` script will:

1. ✅ Update system packages
2. ✅ Install Node.js 18.x
3. ✅ Install MySQL 8.0
4. ✅ Install Redis
5. ✅ Install Git and build tools
6. ✅ Install Docker (optional)
7. ✅ Create `/chitepo` directory
8. ✅ Setup MySQL database
9. ✅ Install PM2
10. ✅ Install/configure web server (Apache2 or Nginx)
11. ✅ Configure firewall

## Expected Output

You should see output like:

```
==========================================
Chitepo Project VPS Installation Script
==========================================

[1/12] Updating system packages...
[2/12] Installing Node.js 18.x...
[3/12] Installing MySQL 8.0...
...
==========================================
Installation Complete!
==========================================
```

## Troubleshooting

### Permission Denied Error

```bash
# Make sure script is executable
chmod +x install-vps.sh

# If still having issues, run with bash explicitly
bash install-vps.sh
```

### SCP Not Working

**On Windows, you might need to:**
1. Install OpenSSH client (usually pre-installed on Windows 10+)
2. Use WinSCP (GUI tool) instead
3. Use Git Bash instead of PowerShell

**Using WinSCP:**
1. Download WinSCP from https://winscp.net
2. Connect to your VPS
3. Navigate to `/chitepo` on VPS
4. Drag and drop `install-vps.sh` from local to VPS

### Script Fails During Installation

```bash
# Check what went wrong
./install-vps.sh 2>&1 | tee install.log

# View the log
cat install.log
```

### Need to Run as Root

The script will prompt for sudo password when needed. If you're already root:

```bash
# Run directly (no sudo needed)
./install-vps.sh
```

## Next Steps After Installation

After the script completes:

1. **Transfer your project files** to `/chitepo` on the VPS
2. **Install project dependencies:**
   ```bash
   cd /chitepo
   npm install
   npm run install:all
   ```
3. **Build the project:**
   ```bash
   npm run build
   ```
4. **Configure environment variables** (`.env` files)
5. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```
6. **Setup PM2 and start services**

See `VPS_DEPLOYMENT.md` for complete setup instructions.

## Quick Command Reference

```bash
# Transfer file to VPS (from Windows)
scp deployment/vps/install-vps.sh user@vps-ip:/chitepo/

# Connect to VPS
ssh user@vps-ip

# On VPS: Make executable
chmod +x install-vps.sh

# On VPS: Run script
./install-vps.sh

# On VPS: Check if it worked
node --version
mysql --version
redis-cli --version
pm2 --version
```

