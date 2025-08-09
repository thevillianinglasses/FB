# Unicare Polyclinic - Electronic Health Record (EHR) System

<div align="center">

![Unicare Polyclinic](https://img.shields.io/badge/Unicare-Polyclinic-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-2.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**A comprehensive, role-based Electronic Health Record system for polyclinics and small hospitals**

*care crafted for you*

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Requirements](#system-requirements)
- [Desktop Installation Guide](#desktop-installation-guide)
- [Quick Start](#quick-start)
- [User Guide](#user-guide)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Support](#support)

---

## 🏥 Overview

Unicare Polyclinic EHR is a modern, web-based Electronic Health Record system designed specifically for small to medium-sized healthcare facilities. The system provides comprehensive patient management, clinical workflows, and administrative tools through a secure, role-based access control system.

### Architecture
- **Frontend**: React 19+ with Vite and Tailwind CSS
- **Backend**: FastAPI with Python 3.11+
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT-based with bcrypt password hashing
- **API**: RESTful with 41 comprehensive endpoints

---

## ✨ Features

### 🔐 **Role-Based Access Control**
- **Admin**: Complete system management, user creation, analytics
- **Reception**: Patient registration, appointments, billing
- **Laboratory**: Test management, sample tracking, results
- **Pharmacy**: Inventory, prescriptions, dispensing
- **Nursing**: Vitals, procedures, triage assessment
- **Doctor**: Consultations, EMR, prescriptions

### 🏥 **Core Modules**

#### Reception Management
- ✅ Patient registration with auto-generated OPD numbers
- ✅ Daily token system for queue management
- ✅ Appointment scheduling and management
- ✅ Patient search and comprehensive records
- ✅ Billing and payment processing
- ✅ Insurance and corporate billing support

#### Laboratory Management
- ✅ Comprehensive test catalog with pricing
- ✅ Sample collection and tracking workflow
- ✅ Results entry with validation and flags
- ✅ Report generation and sharing
- ✅ Quality control and audit trails
- ✅ Turnaround time (TAT) monitoring

#### Pharmacy Management
- ✅ Medication inventory with stock alerts
- ✅ Electronic prescription processing
- ✅ Dispensing workflow with substitution rules
- ✅ Expiry date tracking and batch management
- ✅ Purchase orders and supplier management
- ✅ Margin analysis and reports

#### Nursing Station
- ✅ Vital signs recording with automatic calculations
- ✅ Nursing procedure documentation
- ✅ Triage assessment with priority levels
- ✅ Medication administration records (MAR)
- ✅ Patient care plans and notes
- ✅ Shift handover documentation

#### Doctor/EMR Module
- ✅ Electronic Medical Records (EMR)
- ✅ SOAP notes and clinical documentation
- ✅ ICD-10 diagnosis coding
- ✅ Electronic prescribing with drug interactions
- ✅ Lab orders and result review
- ✅ Follow-up scheduling and reminders

#### Administration
- ✅ User management and role assignment
- ✅ System configuration and settings
- ✅ Comprehensive reporting and analytics
- ✅ Audit trails and security logs
- ✅ Database backup and maintenance
- ✅ Integration management

---

## 💻 System Requirements

### Minimum Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **RAM**: 4GB (8GB recommended)
- **Storage**: 2GB free space (10GB recommended for data)
- **CPU**: Dual-core 2.0GHz (Quad-core recommended)
- **Network**: Internet connection for initial setup

### Software Dependencies
- **Python**: 3.11 or higher
- **Node.js**: 18.0 or higher
- **MongoDB**: 6.0 or higher
- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge

---

## 🚀 Desktop Installation Guide

### Step 1: Install Prerequisites

#### Windows
1. **Install Python 3.11+**
   ```bash
   # Download from https://python.org/downloads/
   # During installation, check "Add Python to PATH"
   ```

2. **Install Node.js 18+**
   ```bash
   # Download from https://nodejs.org/
   # Choose LTS version
   ```

3. **Install MongoDB Community**
   ```bash
   # Download from https://mongodb.com/try/download/community
   # Follow Windows installation guide
   ```

4. **Install Git**
   ```bash
   # Download from https://git-scm.com/download/win
   ```

#### macOS
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install python@3.11 node mongodb-community git
brew services start mongodb-community
```

#### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Git
sudo apt install git
```

### Step 2: Clone and Setup Project

```bash
# Clone the repository
git clone <your-github-repo-url>
cd unicare-ehr

# Create Python virtual environment
python3.11 -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
cd backend
pip install -r requirements.txt
cd ..

# Install Node.js dependencies
cd frontend
npm install
cd ..
```

### Step 3: Database Setup

```bash
# Start MongoDB (if not already running)
# Windows: Start MongoDB service from Services
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Create database (MongoDB will create automatically on first connection)
# No additional setup required - the application will initialize collections
```

### Step 4: Configuration

#### Backend Configuration (`backend/.env`)
```env
# Database Configuration
MONGO_URL=mongodb://localhost:27017/unicare_ehr

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=480

# Environment
ENVIRONMENT=development
```

#### Frontend Configuration (`frontend/.env`)
```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:8001

# Environment
VITE_ENVIRONMENT=development
```

### Step 5: Start the Application

#### Option 1: Manual Start (Development)

**Terminal 1 - Start Backend:**
```bash
cd backend
python server.py
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

#### Option 2: Production Setup with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'unicare-backend',
      script: 'server.py',
      cwd: './backend',
      interpreter: 'python',
      env: {
        PYTHONPATH: './backend'
      }
    },
    {
      name: 'unicare-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend'
    }
  ]
};
EOF

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### Step 6: Access the Application

1. **Open your web browser**
2. **Navigate to**: `http://localhost:3000`
3. **Default Admin Login**:
   - Username: `admin`
   - Password: `admin_007`

---

## 🚀 Quick Start

### Initial Setup (First Time Only)

1. **Start the application** following Step 5 above
2. **Open browser** and go to `http://localhost:3000`
3. **Login as admin** with credentials: `admin` / `admin_007`
4. **Create department users** through Admin Dashboard → User Management

### Default System Users

The system initializes with one admin user. Create additional users for each department:

```
Admin (Pre-created):
Username: admin
Password: admin_007
```

### Creating Department Users

1. **Login as admin**
2. **Navigate to**: Admin Dashboard → User Management
3. **Click**: "+ Create New User"
4. **Fill in details**:
   - Username: (e.g., reception1)
   - Password: (secure password)
   - Full Name: (e.g., Reception Staff)
   - Role: (select appropriate role)
   - Department: (e.g., Reception)
   - Email & Phone: (contact information)

---

## 👥 User Guide

### 🔐 **Admin Dashboard**

**Access**: Admin role only
**URL**: Auto-redirected after login

#### User Management
- **Create Users**: Add staff for each department
- **Manage Permissions**: Activate/deactivate users
- **Role Assignment**: Assign appropriate roles
- **View Activity**: Monitor user login times

#### System Analytics
- **Daily Reports**: Patient registrations, revenue
- **Department Performance**: Module usage statistics
- **User Activity**: Login patterns and system usage
- **Financial Overview**: Revenue by department

#### System Settings
- **Clinic Information**: Update clinic details
- **Backup Configuration**: Database backup settings
- **Integration Settings**: SMS, email, payment gateways
- **Security Settings**: Password policies, session timeouts

### 🏥 **Reception Dashboard**

**Access**: Reception role
**Key Features**: Patient management, appointments, billing

#### Patient Registration
1. **Click**: "New OPD" tab
2. **Fill patient details**:
   - Patient Name (required)
   - Age or Date of Birth
   - Sex (required)
   - Phone Number (required)
   - Address
   - Emergency Contact
   - Allergies
3. **Submit**: Auto-generates OPD number (NNN/YY format) and token number
4. **Print**: OPD slip with patient details

#### Patient Management
- **Search Patients**: Use search bar in "All Patients" tab
- **Edit Records**: Click "Edit" button on patient row
- **View History**: Complete patient visit history
- **Update Information**: Modify patient details as needed

#### Appointment Scheduling
- **Book Appointments**: Schedule with available doctors
- **Manage Calendar**: View daily/weekly schedules
- **Handle Cancellations**: Cancel and reschedule appointments
- **Queue Management**: Monitor waiting lists and tokens

### 🧪 **Laboratory Dashboard**

**Access**: Laboratory role
**Key Features**: Test management, sample tracking, results

#### Test Catalog Management
1. **Navigate**: Lab Dashboard → Test Catalog
2. **Add New Test**:
   - Test Name (e.g., Complete Blood Count)
   - Test Code (e.g., CBC)
   - Category (e.g., Hematology)
   - Sample Type (e.g., Blood)
   - Price and TAT (Turnaround Time)
3. **Manage Existing**: Edit pricing, update procedures

#### Order Processing
1. **Receive Orders**: From doctors or reception
2. **Generate Labels**: Print sample collection labels
3. **Update Status**: 
   - Pending → Collected → In Progress → Completed → Reported
4. **Enter Results**: Input test values and interpretations
5. **Generate Reports**: Create branded PDF reports

#### Quality Control
- **Daily Controls**: Run quality control samples
- **Equipment Maintenance**: Log maintenance activities
- **Result Validation**: Second-person verification for critical values
- **Audit Trails**: Complete tracking of all activities

### 💊 **Pharmacy Dashboard**

**Access**: Pharmacy role
**Key Features**: Inventory management, prescription dispensing

#### Medication Inventory
1. **Add Medications**:
   - Medication Name and Generic Name
   - Strength and Form (tablet, syrup, etc.)
   - Batch Number and Expiry Date
   - MRP and Selling Price
   - Stock Quantity and Minimum Level
2. **Stock Management**:
   - Update quantities after purchase
   - Monitor expiry dates
   - Set reorder alerts
   - Track batch-wise inventory

#### Prescription Processing
1. **Receive Prescriptions**: From doctors electronically
2. **Verify Availability**: Check stock levels
3. **Prepare Medications**: Select appropriate quantities
4. **Counseling**: Provide patient education
5. **Dispensing**: Update inventory and create invoice
6. **Documentation**: Record dispensed quantities

#### Reports and Analytics
- **Stock Levels**: Current inventory status
- **Expiry Alerts**: Medications nearing expiry
- **Sales Reports**: Daily/monthly sales analysis
- **Margin Analysis**: Profitability by medication

### 🩺 **Nursing Dashboard**

**Access**: Nursing role
**Key Features**: Vital signs, procedures, patient care

#### Vital Signs Recording
1. **Select Patient**: From patient list
2. **Record Vitals**:
   - Temperature (°F)
   - Blood Pressure (systolic/diastolic)
   - Pulse Rate (bpm)
   - Respiratory Rate
   - Oxygen Saturation (SpO2)
   - Weight and Height (auto-calculates BMI)
   - Pain Scale (0-10)
3. **Add Notes**: Additional observations
4. **Save Record**: Timestamp and user tracking

#### Nursing Procedures
- **Injections**: Document medication given
- **Wound Dressing**: Record dressing changes
- **Nebulization**: Track respiratory treatments
- **IV Therapy**: Monitor IV fluid administration
- **Specimen Collection**: Document sample collection

#### Triage Assessment
- **Priority Levels**: Emergency, Urgent, Non-urgent
- **Vital Signs Review**: Quick assessment
- **Chief Complaint**: Primary concern documentation
- **Disposition**: Routing to appropriate care

### 👨‍⚕️ **Doctor Dashboard**

**Access**: Doctor role
**Key Features**: Consultations, prescriptions, EMR

#### Patient Consultations
1. **Create Consultation**:
   - Select Patient
   - Chief Complaint
   - History of Present Illness
   - Physical Examination
   - Assessment/Diagnosis
   - Treatment Plan
   - Follow-up Instructions
2. **Set Consultation Fee**
3. **Schedule Follow-up**

#### Electronic Prescribing
1. **Select Patient**
2. **Add Medications**:
   - Choose from medication list
   - Specify dosage and frequency
   - Set duration of treatment
   - Add special instructions
3. **Review for Interactions**: System alerts for drug conflicts
4. **Send to Pharmacy**: Electronic transmission

#### EMR Access
- **Patient History**: Complete medical records
- **Previous Consultations**: Historical notes
- **Lab Results**: Review test results
- **Vital Signs Trends**: Graphical representation
- **Medication History**: Previous prescriptions

---

## 🔧 API Documentation

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin_007"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user_role": "admin",
  "user_name": "System Administrator"
}
```

### Patient Management Endpoints

#### Get All Patients
```http
GET /api/patients
Authorization: Bearer <token>
```

#### Create Patient
```http
POST /api/patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_name": "John Doe",
  "age": "30",
  "sex": "Male",
  "phone_number": "9876543210",
  "address": "123 Main Street"
}
```

#### Update Patient
```http
PUT /api/patients/{patient_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_name": "John Doe Updated",
  "age": "31",
  ...
}
```

### Complete API Reference

For complete API documentation with all 41 endpoints, visit:
`http://localhost:8001/docs` (when server is running)

---

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start

**MongoDB Connection Error**
```
Error: MongoServerError: Server selection timed out
```
**Solution:**
```bash
# Check if MongoDB is running
# Windows: Check Services for MongoDB
# macOS: brew services list | grep mongodb
# Linux: sudo systemctl status mongod

# Start MongoDB if not running
# Windows: Start MongoDB service
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

**Port Already in Use**
```
Error: EADDRINUSE: address already in use :::3000
```
**Solution:**
```bash
# Find and kill process using port
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

#### 2. Login Issues

**Invalid Credentials**
- Verify username/password combination
- Check caps lock and typing
- Reset admin password if needed

**JWT Token Errors**
- Check JWT_SECRET_KEY in backend/.env
- Ensure consistent secret across restarts
- Clear browser local storage

#### 3. Database Issues

**Collections Not Created**
- Start application as admin user
- System auto-creates collections on first use
- Check MongoDB logs for errors

**Data Not Persisting**
- Verify MongoDB is running and accessible
- Check file permissions on database directory
- Review backend logs for connection errors

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Unicare Polyclinic EHR System**

*care crafted for you*

Made with ❤️ for healthcare professionals worldwide

![Footer](https://img.shields.io/badge/Unicare-EHR%20System-blue?style=for-the-badge)

</div>
