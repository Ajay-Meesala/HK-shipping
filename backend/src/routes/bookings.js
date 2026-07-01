import express from 'express';
import { query } from '../db/index.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/bookings — List bookings
// Customers see only their own; admins see all
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { role, email } = req.user;
    let sql, params;

    if (role === 'customer') {
      sql = `
        SELECT * FROM bookings
        WHERE customer_email = $1
        ORDER BY created_at DESC
      `;
      params = [email];
    } else {
      // admin / dispatcher / guest — see all
      sql = 'SELECT * FROM bookings ORDER BY created_at DESC';
      params = [];
    }

    const result = await query(sql, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings — Create a new freight booking request (Customer or admin)
router.post('/', verifyToken, checkRole(['customer', 'admin', 'dispatcher', 'guest']), async (req, res, next) => {
  try {
    const {
      customer_name,
      customer_email,
      contact_phone,
      origin,
      destination,
      goods_type,
      weight,
      preferred_date,
      notes,
    } = req.body;

    // Basic validation
    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }
    if (!origin || !origin.trim()) {
      return res.status(400).json({ success: false, error: 'Origin location is required' });
    }
    if (!destination || !destination.trim()) {
      return res.status(400).json({ success: false, error: 'Destination is required' });
    }
    if (!goods_type || !goods_type.trim()) {
      return res.status(400).json({ success: false, error: 'Goods type is required' });
    }
    if (!weight || !weight.toString().trim()) {
      return res.status(400).json({ success: false, error: 'Weight is required' });
    }
    if (!contact_phone || !contact_phone.trim()) {
      return res.status(400).json({ success: false, error: 'Contact phone is required' });
    }

    // Use the authenticated email if available, or the one submitted
    const emailToStore = req.user?.email || customer_email || '';

    const sql = `
      INSERT INTO bookings (
        customer_name, customer_email, contact_phone,
        origin, destination, goods_type, weight,
        preferred_date, notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *
    `;
    const values = [
      customer_name.trim(),
      emailToStore,
      contact_phone.trim(),
      origin.trim(),
      destination.trim(),
      goods_type.trim(),
      weight.toString().trim(),
      preferred_date || null,
      notes?.trim() || null,
    ];

    const result = await query(sql, values);

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bookings/:id/status — Admin updates booking status
router.patch('/:id/status', verifyToken, checkRole(['admin', 'dispatcher', 'guest']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'dispatched', 'in_transit', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid booking status' });
    }

    const sql = `
      UPDATE bookings SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await query(sql, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

export default router;
