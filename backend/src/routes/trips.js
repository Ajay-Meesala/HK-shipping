import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db/index.js';
import pool from '../db/index.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Multer Storage for POD uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pod-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Allow only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET /api/trips - List trips with optional filters (status, driver_id, date range)
router.get('/', async (req, res, next) => {
  try {
    const { status, driver_id, start_date, end_date } = req.query;
    let sql = `
      SELECT t.*, d.name as driver_name, d.phone as driver_phone, 
             v.vehicle_number, v.vehicle_type
      FROM trips t
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (driver_id) {
      sql += ` AND t.driver_id = $${paramIndex}`;
      params.push(driver_id);
      paramIndex++;
    }

    if (start_date) {
      sql += ` AND t.created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      sql += ` AND t.created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    sql += ' ORDER BY t.id DESC';

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

// GET /api/trips/:id - Get trip details, history logs, and POD
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch trip details
    const tripSql = `
      SELECT t.*, d.name as driver_name, d.phone as driver_phone, d.license_no as driver_license,
             v.vehicle_number, v.vehicle_type, v.capacity as vehicle_capacity
      FROM trips t
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.id = $1
    `;
    const tripResult = await query(tripSql, [id]);

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const trip = tripResult.rows[0];

    // Fetch trip history logs
    const historySql = 'SELECT * FROM trip_history WHERE trip_id = $1 ORDER BY changed_at ASC';
    const historyResult = await query(historySql, [id]);

    // Fetch POD details
    const podSql = 'SELECT * FROM pod WHERE trip_id = $1';
    const podResult = await query(podSql, [id]);

    res.json({
      success: true,
      data: {
        ...trip,
        history: historyResult.rows,
        pod: podResult.rows[0] || null
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/trips - Create new trip (Admin/Dispatcher only)
router.post('/', verifyToken, checkRole(['admin', 'dispatcher', 'guest']), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      driver_id,
      vehicle_id,
      pickup_location,
      drop_location,
      goods_type,
      weight
    } = req.body;

    // Validation
    if (!driver_id || !vehicle_id || !pickup_location || !drop_location || !goods_type || !weight) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    await client.query('BEGIN');

    // 1. Check if Driver is available
    const driverCheck = await client.query('SELECT status FROM drivers WHERE id = $1 FOR UPDATE', [driver_id]);
    if (driverCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    if (driverCheck.rows[0].status !== 'available') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Selected driver is currently unavailable (status: ' + driverCheck.rows[0].status + ')' });
    }

    // 2. Check if Vehicle is available
    const vehicleCheck = await client.query('SELECT status FROM vehicles WHERE id = $1 FOR UPDATE', [vehicle_id]);
    if (vehicleCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }
    if (vehicleCheck.rows[0].status !== 'available') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Selected vehicle is currently unavailable (status: ' + vehicleCheck.rows[0].status + ')' });
    }

    // 3. Create the Trip
    const insertTripSql = `
      INSERT INTO trips (driver_id, vehicle_id, pickup_location, drop_location, goods_type, weight, status, delivery_status)
      VALUES ($1, $2, $3, $4, $5, $6, 'assigned', 'pending')
      RETURNING *
    `;
    const tripResult = await client.query(insertTripSql, [
      driver_id,
      vehicle_id,
      pickup_location.trim(),
      drop_location.trim(),
      goods_type.trim(),
      weight.trim()
    ]);
    const trip = tripResult.rows[0];

    // 4. Create first log entry in trip history
    const insertHistorySql = `
      INSERT INTO trip_history (trip_id, status_change)
      VALUES ($1, $2)
    `;
    await client.query(insertHistorySql, [trip.id, 'Trip Created & Assigned']);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Trip created and assigned successfully',
      data: trip
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// PATCH /api/trips/:id/status - Update trip status (Admin/Dispatcher/Driver only)
router.patch('/:id/status', verifyToken, checkRole(['admin', 'dispatcher', 'driver', 'guest']), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status value is required' });
    }

    const validStatuses = ['assigned', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid trip status' });
    }

    await client.query('BEGIN');

    // Fetch existing trip details
    const tripSql = 'SELECT * FROM trips WHERE id = $1 FOR UPDATE';
    const tripResult = await client.query(tripSql, [id]);

    if (tripResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const currentTrip = tripResult.rows[0];
    const currentStatus = currentTrip.status;

    if (currentStatus === status) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: `Trip is already in ${status} status` });
    }

    let start_time = currentTrip.start_time;
    let end_time = currentTrip.end_time;
    let delivery_status = currentTrip.delivery_status;

    // Check transition rules
    if (status === 'in_progress') {
      if (currentStatus !== 'assigned') {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Only assigned trips can transition to in_progress' });
      }

      // Set start time
      start_time = new Date();

      // Update Driver status to 'on_trip'
      await client.query("UPDATE drivers SET status = 'on_trip' WHERE id = $1", [currentTrip.driver_id]);
      // Update Vehicle status to 'on_trip'
      await client.query("UPDATE vehicles SET status = 'on_trip' WHERE id = $1", [currentTrip.vehicle_id]);

    } else if (status === 'completed') {
      if (currentStatus !== 'in_progress') {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Only trips that are in_progress can transition to completed' });
      }

      // Set end time and delivery status
      end_time = new Date();
      delivery_status = 'delivered';

      // Update Driver status back to 'available'
      await client.query("UPDATE drivers SET status = 'available' WHERE id = $1", [currentTrip.driver_id]);
      // Update Vehicle status back to 'available'
      await client.query("UPDATE vehicles SET status = 'available' WHERE id = $1", [currentTrip.vehicle_id]);

    } else if (status === 'cancelled') {
      if (currentStatus === 'completed') {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Completed trips cannot be cancelled' });
      }

      // Reset driver and vehicle status to 'available'
      await client.query("UPDATE drivers SET status = 'available' WHERE id = $1", [currentTrip.driver_id]);
      await client.query("UPDATE vehicles SET status = 'available' WHERE id = $1", [currentTrip.vehicle_id]);
      
      delivery_status = 'failed';
    }

    // Update trip details
    const updateTripSql = `
      UPDATE trips
      SET status = $1, start_time = $2, end_time = $3, delivery_status = $4
      WHERE id = $5
      RETURNING *
    `;
    const updatedTripResult = await client.query(updateTripSql, [status, start_time, end_time, delivery_status, id]);
    const updatedTrip = updatedTripResult.rows[0];

    // Log trip history
    const historySql = `
      INSERT INTO trip_history (trip_id, status_change)
      VALUES ($1, $2)
    `;
    await client.query(historySql, [id, `Status changed to ${status.toUpperCase()}`]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Trip status updated to ${status} successfully`,
      data: updatedTrip
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// POST /api/trips/:id/pod - Upload Proof of Delivery (Admin/Dispatcher/Driver only)
router.post('/:id/pod', verifyToken, checkRole(['admin', 'dispatcher', 'driver', 'guest']), upload.single('pod_file'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { receiver_signature } = req.body;

    if (!receiver_signature || receiver_signature.trim() === '') {
      return res.status(400).json({ success: false, error: 'Receiver signature text is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'POD photo file is required' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    await client.query('BEGIN');

    // Fetch existing trip details
    const tripSql = 'SELECT * FROM trips WHERE id = $1 FOR UPDATE';
    const tripResult = await client.query(tripSql, [id]);

    if (tripResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const currentTrip = tripResult.rows[0];

    if (currentTrip.status !== 'in_progress') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'POD can only be uploaded for in_progress trips' });
    }

    // Insert POD details
    const insertPodSql = `
      INSERT INTO pod (trip_id, photo_url, receiver_signature, delivered_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (trip_id) DO UPDATE 
      SET photo_url = EXCLUDED.photo_url, 
          receiver_signature = EXCLUDED.receiver_signature, 
          delivered_at = NOW()
    `;
    await client.query(insertPodSql, [id, photoUrl, receiver_signature.trim()]);

    // Update trip details
    const updateTripSql = `
      UPDATE trips
      SET status = 'completed', end_time = NOW(), delivery_status = 'delivered'
      WHERE id = $1
      RETURNING *
    `;
    const updatedTripResult = await client.query(updateTripSql, [id]);
    const updatedTrip = updatedTripResult.rows[0];

    // Reset Driver and Vehicle status
    await client.query("UPDATE drivers SET status = 'available' WHERE id = $1", [currentTrip.driver_id]);
    await client.query("UPDATE vehicles SET status = 'available' WHERE id = $1", [currentTrip.vehicle_id]);

    // Log trip history
    const historySql = `
      INSERT INTO trip_history (trip_id, status_change)
      VALUES ($1, $2)
    `;
    await client.query(historySql, [id, 'Status changed to COMPLETED (POD Uploaded)']);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Proof of Delivery uploaded and trip marked as completed',
      data: {
        trip: updatedTrip,
        photo_url: photoUrl
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

export default router;
