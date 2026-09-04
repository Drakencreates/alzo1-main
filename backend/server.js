const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..')));

// Serverless & Hybrid MongoDB Connection Caching with Zero-Config Fallback
global.useLocalStore = false;
let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      const db = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 3000
      });
      isConnected = db.connections[0].readyState === 1;
      global.useLocalStore = false;
      console.log('MongoDB Atlas connected successfully');
      return;
    } catch (err) {
      console.warn('MongoDB Atlas connection failed:', err.message);
    }
  }

  // Fallback 1: Local MongoDB instance (127.0.0.1:27017)
  try {
    const db = await mongoose.connect('mongodb://127.0.0.1:27017/alzo', {
      serverSelectionTimeoutMS: 1500
    });
    isConnected = db.connections[0].readyState === 1;
    global.useLocalStore = false;
    console.log('Connected to local MongoDB instance');
    return;
  } catch (localErr) {
    // Fallback 2: Zero-Config Embedded Datastore (0 setup required)
    global.useLocalStore = true;
    isConnected = true;
    console.log('Zero-Config Embedded Datastore activated! (0 setup, 0 passwords required)');
  }
};

// Ensure DB connection before processing API requests
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && req.path !== '/api/config/pusher') {
    await connectDB();
  }
  next();
});

// Dynamic Public Configuration Endpoint for Pusher
app.get('/api/config/pusher', (req, res) => {
  res.json({
    key: process.env.PUSHER_KEY || '06feaf595c32d14f5ea2',
    cluster: process.env.PUSHER_CLUSTER || 'ap2'
  });
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Static HTML Fallback Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'land1.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'signup.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login.html'));
});
app.get('/role', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'role.html'));
});
app.get('/patient/pat.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'patient', 'pat.html'));
});
app.get('/patient/settings.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'patient', 'profile.html'));
});
app.get('/doctor/doc.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'doctor', 'doc.html'));
});
app.get('/caregiver/care.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'caregiver', 'care.html'));
});
app.get('/caregiver/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'caregiver', 'profile.html'));
});
app.get('/caregiver/patients.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'caregiver', 'patients.html'));
});
app.get('/caregiver/patient.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'caregiver', 'patient.html'));
});

// Standalone local execution support
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;