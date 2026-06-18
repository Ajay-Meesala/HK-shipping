import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// GET /api/dashboard - Get summary counts and compliance alerts
router.get('/', async (req, res, next) => {
  try {
    // 1. Count of active trips (assigned or in_progress)
    const activeTripsResult = await query(
      "SELECT COUNT(*)::int as count FROM trips WHERE status IN ('assigned', 'in_progress')"
    );
    const activeTripsCount = activeTripsResult.rows[0].count;

    // 2. Count of available drivers
    const availableDriversResult = await query(
      "SELECT COUNT(*)::int as count FROM drivers WHERE status = 'available'"
    );
    const availableDriversCount = availableDriversResult.rows[0].count;

    // 3. Count of pending deliveries
    const pendingDeliveriesResult = await query(
      "SELECT COUNT(*)::int as count FROM trips WHERE delivery_status = 'pending'"
    );
    const pendingDeliveriesCount = pendingDeliveriesResult.rows[0].count;

    // 4. Vehicles with expiring documents within 30 days (or already expired)
    // Checking insurance_expiry, permit_expiry, pollution_expiry
    const expiringVehiclesQuery = `
      SELECT id, vehicle_number, vehicle_type, status,
             insurance_expiry, permit_expiry, pollution_expiry,
             (insurance_expiry <= CURRENT_DATE + INTERVAL '30 days') as insurance_warn,
             (permit_expiry <= CURRENT_DATE + INTERVAL '30 days') as permit_warn,
             (pollution_expiry <= CURRENT_DATE + INTERVAL '30 days') as pollution_warn
      FROM vehicles
      WHERE insurance_expiry <= CURRENT_DATE + INTERVAL '30 days'
         OR permit_expiry <= CURRENT_DATE + INTERVAL '30 days'
         OR pollution_expiry <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY vehicle_number ASC
    `;
    const expiringVehiclesResult = await query(expiringVehiclesQuery);
    const expiringVehicles = expiringVehiclesResult.rows;
    const expiringCount = expiringVehicles.length;

    res.json({
      success: true,
      data: {
        stats: {
          activeTrips: activeTripsCount,
          availableDrivers: availableDriversCount,
          pendingDeliveries: pendingDeliveriesCount,
          expiringDocuments: expiringCount
        },
        expiringVehicles: expiringVehicles
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
