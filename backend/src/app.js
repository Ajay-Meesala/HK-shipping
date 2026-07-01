import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Routers
import driversRouter from './routes/drivers.js';
import vehiclesRouter from './routes/vehicles.js';
import tripsRouter from './routes/trips.js';
import dashboardRouter from './routes/dashboard.js';
import bookingsRouter from './routes/bookings.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Write a sample POD image if it doesn't exist so dashboard can reference it
const samplePodPath = path.join(uploadDir, 'pod_sample.png');
if (!fs.existsSync(samplePodPath)) {
  // Create an empty file or dummy file for the seed pod image
  fs.writeFileSync(samplePodPath, 'dummy image data');
}

// Serve upload files statically
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/drivers', driversRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/bookings', bookingsRouter);

app.get('/api/config/maps', (req, res) => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    nextBillionApiKey: process.env.NEXTBILLION_API_KEY,
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Avoid listening if imported (for testing purposes with Supertest)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

export default app;
