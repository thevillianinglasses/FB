# Unicare EHR - Complete Desktop Setup Guide

## Prerequisites Check
Before starting, ensure you have:
- Internet connection
- Administrator/sudo privileges on your computer
- At least 2GB free disk space

## Step 1: Install Prerequisites

### For Windows Users:

1. **Install Python 3.11+**
   - Go to https://www.python.org/downloads/
   - Download Python 3.11+ (click "Download Python")
   - Run installer and **CHECK "Add Python to PATH"**
   - Verify: Open Command Prompt and run `python --version`

2. **Install Node.js 18+**
   - Go to https://nodejs.org/
   - Download LTS version (18.x+)
   - Run installer with default settings
   - Verify: `node --version` and `npm --version`

3. **Install MongoDB Community**
   - Go to https://www.mongodb.com/try/download/community
   - Select Windows, Version 7.0+, MSI package
   - Run installer with default settings
   - MongoDB will auto-start as a Windows service

4. **Install Git (if not installed)**
   - Go to https://git-scm.com/download/win
   - Download and install with default settings

### For macOS Users:

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install all prerequisites
brew install python@3.11 node@18 mongodb-community git

# Start MongoDB service
brew services start mongodb-community
```

### For Linux (Ubuntu/Debian) Users:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11+
sudo apt install python3.11 python3.11-venv python3-pip git curl

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB 7.0
sudo apt-get install gnupg curl
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Step 2: Download and Setup Unicare EHR

### Option A: If you have the project files locally
```bash
# Navigate to your project directory
cd path/to/your/unicare-ehr-project

# Continue to Step 3
```

### Option B: If you need to clone from repository
```bash
# Clone the repository (replace with your actual repo URL)
git clone <your-repository-url>
cd unicare-ehr

# Continue to Step 3
```

## Step 3: Setup Python Backend

### All Operating Systems:
```bash
# Navigate to project root
cd unicare-ehr  # or your project folder name

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# Navigate to backend and install dependencies
cd backend
pip install --upgrade pip
pip install -r requirements.txt
cd ..
```

## Step 4: Setup React Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (this may take a few minutes)
npm install

# Go back to project root
cd ..
```

## Step 5: Verify MongoDB is Running

### Windows:
- Open Task Manager → Services tab
- Look for "MongoDB Server" - should show "Running"
- OR open Command Prompt: `sc query MongoDB`

### macOS:
```bash
brew services list | grep mongodb
# Should show "started"
```

### Linux:
```bash
sudo systemctl status mongod
# Should show "active (running)"
```

## Step 6: Start the Application

### Open TWO terminals/command prompts:

**Terminal 1 - Backend:**
```bash
# Navigate to your project directory
cd path/to/unicare-ehr

# Activate Python environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Start backend
cd backend
python server.py
```

You should see:
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
Connected to MongoDB successfully
Default admin user created
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

**Terminal 2 - Frontend:**
```bash
# Navigate to project directory (keep Terminal 1 running)
cd path/to/unicare-ehr

# Start frontend
cd frontend
npm run dev
```

You should see:
```
  Local:   http://localhost:3000/
  Network: http://192.168.x.x:3000/
```

## Step 7: Access Your Application

1. **Open your web browser**
2. **Go to:** `http://localhost:3000`
3. **Login with:**
   - **Username:** `admin`
   - **Password:** `admin_007`

## Troubleshooting

### Backend Won't Start:
- Check if port 8001 is free: `netstat -an | findstr :8001` (Windows) or `lsof -i :8001` (macOS/Linux)
- Ensure MongoDB is running
- Check Python virtual environment is activated

### Frontend Won't Start:
- If port 3000 is busy, Vite will automatically use 3001
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### MongoDB Issues:
**Windows:**
- Open Services → Start MongoDB Server
- Check Windows Event Logs for MongoDB errors

**macOS:**
```bash
brew services restart mongodb-community
tail -f /opt/homebrew/var/log/mongodb/mongo.log
```

**Linux:**
```bash
sudo systemctl restart mongod
sudo tail -f /var/log/mongodb/mongod.log
```

### Can't Login:
- Make sure you're using `admin` / `admin_007` exactly
- Check browser's Network tab for error messages
- Verify backend is accessible: visit `http://localhost:8001/api/health`

## Success Verification

Once everything is working, you should be able to:
1. Access `http://localhost:3000` 
2. See "Unicare Polyclinic" login page
3. Login successfully with admin/admin_007
4. Reach the Admin Dashboard
5. Access other modules (Reception, Laboratory, Pharmacy, etc.)

## Next Steps After Successful Setup

The system includes these modules:
- **Reception**: Patient registration, appointments, billing
- **Laboratory**: Test management, sample tracking, results
- **Pharmacy**: Medication inventory, prescriptions
- **Nursing**: Vital signs, procedures, patient care
- **Doctors**: EMR, consultations, prescriptions
- **Admin**: User management, system configuration

Each module has role-based access - create different user accounts for different roles through the Admin dashboard.