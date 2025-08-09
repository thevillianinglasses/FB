# Unicare Polyclinic EHR System

A comprehensive Electronic Health Record (EHR) system for polyclinics with reception, laboratory, pharmacy, nursing, doctor, and admin modules.

## Architecture

- **Backend**: FastAPI with MongoDB
- **Frontend**: React with Vite and Tailwind CSS
- **Database**: MongoDB
- **Authentication**: JWT-based authentication

## Project Structure

```
/app/
├── backend/           # FastAPI backend server
│   ├── server.py     # Main FastAPI application
│   ├── requirements.txt
│   └── .env          # Backend environment variables
├── frontend/         # React frontend application
│   ├── src/          # React source code
│   ├── package.json  # Frontend dependencies
│   └── .env          # Frontend environment variables
├── supervisord.conf  # Service management
└── README.md         # This file
```

## Features

### Current Features (Reception Module)
- User authentication (admin/admin_007)
- Patient registration with auto-generated OPD and token numbers
- Patient management (view, edit, delete)
- Search functionality
- Responsive design with custom branding

### Planned Features
- **Laboratory**: Test management, sample tracking, results
- **Pharmacy**: Inventory, prescriptions, dispensing
- **Nursing**: Vitals, triage, procedures
- **Doctors**: EMR, diagnosis, prescriptions
- **Admin**: User management, reporting, master data
- **Finance**: Cost analysis, P&L reporting

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB
- Yarn package manager

### Installation

1. Install backend dependencies:
```bash
cd /app/backend
pip install -r requirements.txt
```

2. Install frontend dependencies:
```bash
cd /app/frontend
yarn install
```

### Running the Application

The application uses Supervisor to manage all services:

```bash
# Start all services
sudo supervisorctl restart all

# Check service status
sudo supervisorctl status

# View logs
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/frontend.out.log
tail -f /var/log/supervisor/mongodb.out.log
```

### Manual Startup (if needed)

Backend:
```bash
cd /app/backend
python server.py
```

Frontend:
```bash
cd /app/frontend
yarn dev --host 0.0.0.0 --port 3000
```

MongoDB:
```bash
mongod --dbpath /data/db --bind_ip_all
```

## URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs

## Default Credentials

- **Username**: admin
- **Password**: admin_007

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/{id}` - Get patient by ID
- `PUT /api/patients/{id}` - Update patient
- `DELETE /api/patients/{id}` - Delete patient

### Doctors
- `GET /api/doctors` - Get all doctors
- `POST /api/doctors` - Add new doctor

### Health
- `GET /api/health` - Health check endpoint

## Database Collections

- `patients` - Patient records
- `doctors` - Doctor information
- `sequences` - OPD and token number sequences

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017/unicare_ehr
JWT_SECRET_KEY=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Development

The application features:
- Hot reload for both frontend and backend
- Automatic patient numbering (OPD: NNN/YY format, Token: daily sequence)
- JWT-based authentication
- Responsive design with Tailwind CSS
- Comprehensive error handling
- Real-time data updates

## Next Steps

1. **Add Laboratory Module**: Test catalog, sample tracking, results management
2. **Add Pharmacy Module**: Inventory, prescriptions, dispensing workflow  
3. **Add Clinical Modules**: Nursing station, doctor consultations
4. **Add Admin Panel**: User management, reporting, configuration
5. **Add Finance Module**: Cost analysis, P&L reporting, billing

## Support

For any issues or questions, please check the logs in `/var/log/supervisor/` directory.
