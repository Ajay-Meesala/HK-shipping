import express from 'express';
import { query } from '../db/index.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/drivers - List all drivers, optionally filter by status (e.g. ?status=available)
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM drivers';
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

// POST /api/drivers - Register a new driver (Admin only)
router.post('/', verifyToken, checkRole(['admin', 'guest']), async (req, res, next) => {
  try {
    const { name, phone, license_no, status } = req.body;

    // Simple input validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    if (!phone || phone.trim() === '') {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    if (!license_no || license_no.trim() === '') {
      return res.status(400).json({ success: false, error: 'License number is required' });
    }

    const driverStatus = status || 'available';
    if (!['available', 'on_trip', 'off_duty'].includes(driverStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid driver status value' });
    }

    // Check if license number already exists
    const checkLicense = await query('SELECT id FROM drivers WHERE license_no = $1', [license_no.trim()]);
    if (checkLicense.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'License number already exists' });
    }

    const sql = `
      INSERT INTO drivers (name, phone, license_no, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [name.trim(), phone.trim(), license_no.trim(), driverStatus];
    const result = await query(sql, values);

    res.status(201).json({
      success: true,
      message: 'Driver added successfully',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

export default router;
