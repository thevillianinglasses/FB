# Unicare EHR - Login Troubleshooting Guide

## ✅ **CONFIRMED WORKING CREDENTIALS**

The backend has been tested and **ALL these credentials are working**:

| Username | Password | Role | Full Name |
|----------|----------|------|-----------|
| `admin` | `admin_007` | Admin | System Administrator |
| `reception1` | `reception123` | Reception | Reception Staff |
| `doctor1` | `doctor123` | Doctor | Dr. Smith |
| `lab1` | `lab123` | Laboratory | Lab Technician |
| `pharmacy1` | `pharmacy123` | Pharmacy | Pharmacist |
| `nurse1` | `nurse123` | Nursing | Staff Nurse |

## 🔧 **TROUBLESHOOTING STEPS**

### Step 1: Clear Browser Data
Your browser might have cached old authentication data:

1. **Open Developer Tools**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. **Clear Storage**:
   - Go to `Application` tab (Chrome) or `Storage` tab (Firefox)
   - Click `Clear Storage` and select all options
   - Click `Clear site data`
3. **Clear Cache**: `Ctrl+Shift+Delete` (Windows) / `Cmd+Shift+Delete` (Mac)
4. **Refresh**: `Ctrl+F5` or `Cmd+Shift+R`

### Step 2: Check Network Connection
Verify your backend is accessible:

**Open browser and go to:** `http://localhost:8001/api/health`

**Expected response:**
```json
{"status":"healthy","timestamp":"2025-01-10T..."}
```

If this doesn't work, your backend isn't running.

### Step 3: Manual Testing
**Test login API directly** using browser developer console:

1. Press `F12` to open Developer Tools
2. Go to `Console` tab
3. Paste this code:

```javascript
fetch('http://localhost:8001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin_007'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
  if (data.access_token) {
    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('userRole', data.user_role);
    localStorage.setItem('userName', data.user_name);
    window.location.reload();
  }
})
.catch(error => {
  console.error('Error:', error);
});
```

4. Press `Enter` - this should log you in automatically if backend is working.

### Step 4: Common Issues & Solutions

#### Issue 1: "Invalid username or password"
- **Cause**: Wrong credentials or backend not running
- **Solution**: Double-check you're typing exactly:
  - Username: `admin` (lowercase)
  - Password: `admin_007` (underscore, not dash)

#### Issue 2: "Login failed. Please try again"
- **Cause**: Backend connection failed
- **Solution**: 
  1. Check if backend is running: `http://localhost:8001/api/health`
  2. If not running, restart: `sudo supervisorctl restart backend`

#### Issue 3: Blank page or loading forever
- **Cause**: JavaScript errors or infinite loops
- **Solution**:
  1. Check browser console for errors (`F12` → `Console`)
  2. Clear browser data (Step 1)
  3. Hard refresh: `Ctrl+Shift+F5`

#### Issue 4: "Access Denied" or "Forbidden"
- **Cause**: CORS or authentication issues
- **Solution**: 
  1. Clear browser data completely
  2. Ensure you're accessing `http://localhost:3000` (not HTTPS)

### Step 5: Verify Your Setup

**Required services must be running:**
```bash
# Check status
sudo supervisorctl status

# Should show:
# backend    RUNNING
# frontend   RUNNING  
# mongodb    RUNNING
```

**If any service is stopped:**
```bash
sudo supervisorctl start backend
sudo supervisorctl start frontend
sudo supervisorctl start mongodb
```

### Step 6: Desktop-Specific Issues

#### Windows Users:
- Check Windows Firewall isn't blocking ports 3000/8001
- Run browser as Administrator if needed
- Disable antivirus temporarily to test

#### macOS Users:
- Check if Gatekeeper is blocking the application
- Verify ports aren't blocked by macOS firewall

#### Linux Users:
- Check iptables/ufw firewall rules
- Verify user permissions for MongoDB data directory

### Step 7: Reset Everything (Nuclear Option)

If nothing else works:

```bash
# Stop all services
sudo supervisorctl stop all

# Clear browser data completely
# Clear localStorage: F12 → Application → Local Storage → Clear

# Start services fresh
sudo supervisorctl start all

# Wait 30 seconds, then try logging in
```

## 🔍 **DEBUGGING INFORMATION**

### Check Backend Logs:
```bash
sudo tail -f /var/log/supervisor/backend.out.log
```

### Check Frontend Logs:
```bash
sudo tail -f /var/log/supervisor/frontend.out.log
```

### Test All Credentials (Copy-Paste Safe):
Try copying these exact credentials one by one:

**Admin:**
```
Username: admin
Password: admin_007
```

**Reception:**
```
Username: reception1
Password: reception123
```

**Doctor:**
```
Username: doctor1
Password: doctor123
```

**Laboratory:**
```
Username: lab1
Password: lab123
```

**Pharmacy:**
```
Username: pharmacy1
Password: pharmacy123
```

**Nursing:**
```
Username: nurse1
Password: nurse123
```

## ✅ **SUCCESS INDICATORS**

After successful login, you should see:
- **Admin**: Admin Dashboard with user management
- **Reception**: Reception Dashboard with patient management
- **Doctor**: Doctor Dashboard with consultations
- **Laboratory**: Laboratory Dashboard with test management
- **Pharmacy**: Pharmacy Dashboard with medication management  
- **Nursing**: Nursing Dashboard with patient care

## 📞 **Still Having Issues?**

If none of these steps work:
1. Take a screenshot of the error message
2. Check browser console for errors (F12 → Console)
3. Copy any error messages exactly
4. Verify your MongoDB is installed and running properly

The system has been thoroughly tested - all credentials work correctly on our end.