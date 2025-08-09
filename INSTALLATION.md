# Unicare EHR - Desktop Installation Guide

## Quick Installation Commands

### Windows Installation
```powershell
# 1. Install prerequisites
# Download and install Python 3.11+ from python.org
# Download and install Node.js 18+ from nodejs.org  
# Download and install MongoDB Community from mongodb.com
# Download and install Git from git-scm.com

# 2. Clone repository
git clone <your-repo-url>
cd unicare-ehr

# 3. Setup Python environment
python -m venv venv
venv\Scripts\activate
cd backend
pip install -r requirements.txt
cd ..

# 4. Setup Node.js environment
cd frontend
npm install
cd ..

# 5. Start MongoDB service
# Go to Services → Start MongoDB Server

# 6. Start application
# Terminal 1:
cd backend
python server.py

# Terminal 2:
cd frontend
npm run dev

# 7. Access application
# Open browser: http://localhost:3000
# Login: admin / admin_007
```

### macOS Installation
```bash
# 1. Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install prerequisites
brew install python@3.11 node mongodb-community git
brew services start mongodb-community

# 3. Clone and setup
git clone <your-repo-url>
cd unicare-ehr

python3.11 -m venv venv
source venv/bin/activate

cd backend
pip install -r requirements.txt
cd ..

cd frontend
npm install
cd ..

# 4. Start application
# Terminal 1:
cd backend && python server.py

# Terminal 2:
cd frontend && npm run dev

# 5. Access: http://localhost:3000
# Login: admin / admin_007
```

### Ubuntu/Linux Installation
```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip

# 3. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org git

# 5. Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 6. Clone and setup
git clone <your-repo-url>
cd unicare-ehr

python3.11 -m venv venv
source venv/bin/activate

cd backend
pip install -r requirements.txt
cd ..

cd frontend
npm install
cd ..

# 7. Start application
# Terminal 1:
cd backend && python server.py

# Terminal 2:  
cd frontend && npm run dev

# 8. Access: http://localhost:3000
# Login: admin / admin_007
```

## Verification Steps

After installation, verify everything works:

1. **Backend Health Check**:
   ```bash
   curl http://localhost:8001/api/health
   # Expected: {"status":"healthy","timestamp":"..."}
   ```

2. **Login Test**:
   ```bash
   curl -X POST http://localhost:8001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "admin_007"}'
   # Expected: {"access_token":"...","token_type":"bearer","user_role":"admin","user_name":"System Administrator"}
   ```

3. **Web Interface**:
   - Open http://localhost:3000
   - See Unicare Polyclinic login page
   - Login with admin/admin_007
   - Should reach Admin Dashboard

## Troubleshooting Installation

### Common Issues

**MongoDB won't start**:
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Fix permissions (Linux)
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown mongodb:mongodb /tmp/mongodb-27017.sock
```

**Python module errors**:
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Upgrade pip
pip install --upgrade pip

# Install requirements again
pip install -r backend/requirements.txt
```

**Node.js dependency errors**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf frontend/node_modules
cd frontend
npm install
```

**Port conflicts**:
```bash
# Kill processes using ports
# Linux/macOS:
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:8001 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

For detailed troubleshooting, see main README.md file.