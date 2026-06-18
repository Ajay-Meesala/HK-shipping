import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// GET /api/vehicles - List all vehicles
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM vehicles';
    const params = [];

    if (status) {
      sql += ' WHERE status = $1';
      params.push(status);
    }

    sql += ' ORDER BY id DESC';

    const result = await query(sql, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/vehicles - Register a new vehicle
router.post('/', async (req, res, next) => {
  try {
    const {
      vehicle_number,
      vehicle_type,
      capacity,
      insurance_expiry,
      permit_expiry,
      pollution_expiry,
      status
    } = req.body;

    // Validation
    if (!vehicle_number || vehicle_number.trim() === '') {
      return res.status(400).json({ success: false, error: 'Vehicle number is required' });
    }
    if (!vehicle_type || vehicle_type.trim() === '') {
      return res.status(400).json({ success: false, error: 'Vehicle type is required' });
    }
    if (!capacity || capacity.trim() === '') {
      return res.status(400).json({ success: false, error: 'Vehicle capacity is required' });
    }
    if (!insurance_expiry) {
      return res.status(400).json({ success: false, error: 'Insurance expiry date is required' });
    }
    if (!permit_expiry) {
      return res.status(400).json({ success: false, error: 'Permit expiry date is required' });
    }
    if (!pollution_expiry) {
      return res.status(400).json({ success: false, error: 'Pollution certificate expiry date is required' });
    }

    const vehicleStatus = status || 'available';
    if (!['available', 'on_trip', 'maintenance'].includes(vehicleStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid vehicle status value' });
    }

    // Check if vehicle number already exists
    const checkVehicle = await query('SELECT id FROM vehicles WHERE vehicle_number = $1', [vehicle_number.trim().toUpperCase()]);
    if (checkVehicle.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Vehicle number already registered' });
    }

    const sql = `
      INSERT INTO vehicles (vehicle_number, vehicle_type, capacity, insurance_expiry, permit_expiry, pollution_expiry, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      vehicle_number.trim().toUpperCase(),
      vehicle_type.trim(),
      capacity.trim(),
      insurance_expiry,
      permit_expiry,
      pollution_expiry,
      vehicleStatus
    ];

    const result = await query(sql, values);

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

export default router;
