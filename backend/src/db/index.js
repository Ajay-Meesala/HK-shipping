import dotenv from 'dotenv';

dotenv.config();

// In-Memory Database Seed Data (Matching schema.sql)
const drivers = [
  { id: 1, name: 'John Doe', phone: '9876543210', license_no: 'DL-1234567890', status: 'available', created_at: new Date('2026-05-31T10:00:00') },
  { id: 2, name: 'Jane Smith', phone: '9876543211', license_no: 'DL-2345678901', status: 'on_trip', created_at: new Date('2026-06-10T15:00:00') },
  { id: 3, name: 'Mike Johnson', phone: '9876543212', license_no: 'DL-3456789012', status: 'available', created_at: new Date('2026-06-12T09:00:00') },
  { id: 4, name: 'David Lee', phone: '9876543213', license_no: 'DL-4567890123', status: 'off_duty', created_at: new Date('2026-06-12T09:00:00') }
];

const vehicles = [
  { id: 1, vehicle_number: 'MH-12-AB-1234', vehicle_type: '18-Wheeler Truck', capacity: '20 Tons', insurance_expiry: new Date('2027-01-15'), permit_expiry: new Date('2026-12-10'), pollution_expiry: new Date('2026-06-25'), status: 'available' },
  { id: 2, vehicle_number: 'DL-01-XY-5678', vehicle_type: 'Container Truck', capacity: '15 Tons', insurance_expiry: new Date('2026-06-30'), permit_expiry: new Date('2026-11-20'), pollution_expiry: new Date('2026-09-14'), status: 'on_trip' },
  { id: 3, vehicle_number: 'KA-03-CD-9012', vehicle_type: 'Flatbed Trailer', capacity: '25 Tons', insurance_expiry: new Date('2027-04-05'), permit_expiry: new Date('2026-07-05'), pollution_expiry: new Date('2027-02-18'), status: 'available' },
  { id: 4, vehicle_number: 'HR-55-EF-3456', vehicle_type: 'Mini Van', capacity: '2 Tons', insurance_expiry: new Date('2026-05-10'), permit_expiry: new Date('2026-05-20'), pollution_expiry: new Date('2026-05-15'), status: 'maintenance' }
];

const trips = [
  { id: 1, driver_id: 1, vehicle_id: 1, pickup_location: 'Mumbai Port', drop_location: 'Delhi Warehouse', goods_type: 'Electronics', weight: '12 Tons', start_time: new Date('2026-06-01T08:00:00'), end_time: new Date('2026-06-04T14:30:00'), status: 'completed', delivery_status: 'delivered', created_at: new Date('2026-05-31T10:00:00') },
  { id: 2, driver_id: 2, vehicle_id: 2, pickup_location: 'Chennai Factory', drop_location: 'Bangalore Hub', goods_type: 'Auto Parts', weight: '8 Tons', start_time: new Date('2026-06-11T06:00:00'), end_time: null, status: 'in_progress', delivery_status: 'pending', created_at: new Date('2026-06-10T15:00:00') },
  { id: 3, driver_id: 3, vehicle_id: 3, pickup_location: 'Kolkata Depot', drop_location: 'Patna Warehouse', goods_type: 'Grains', weight: '18 Tons', start_time: null, end_time: null, status: 'assigned', delivery_status: 'pending', created_at: new Date('2026-06-12T09:00:00') }
];

const pod = [
  { id: 1, trip_id: 1, photo_url: '/uploads/pod_sample.png', receiver_signature: 'Received by Store Manager Bob', delivered_at: new Date('2026-06-04T14:30:00') }
];

const trip_history = [
  { id: 1, trip_id: 1, status_change: 'Trip Created & Assigned', changed_at: new Date('2026-05-31T10:00:00') },
  { id: 2, trip_id: 1, status_change: 'Status changed to IN_PROGRESS', changed_at: new Date('2026-06-01T08:00:00') },
  { id: 3, trip_id: 1, status_change: 'Status changed to COMPLETED (POD Uploaded)', changed_at: new Date('2026-06-04T14:30:00') },
  { id: 4, trip_id: 2, status_change: 'Trip Created & Assigned', changed_at: new Date('2026-06-10T15:00:00') },
  { id: 5, trip_id: 2, status_change: 'Status changed to IN_PROGRESS', changed_at: new Date('2026-06-11T06:00:00') },
  { id: 6, trip_id: 3, status_change: 'Trip Created & Assigned', changed_at: new Date('2026-06-12T09:00:00') }
];

function executeMockQuery(text, params = []) {
  const normalized = text.trim().replace(/\s+/g, ' ');

  // 1. Dashboard counts
  if (normalized.includes("FROM trips WHERE status IN ('assigned', 'in_progress')")) {
    const count = trips.filter(t => ['assigned', 'in_progress'].includes(t.status)).length;
    return { rows: [{ count }] };
  }
  if (normalized.includes("FROM drivers WHERE status = 'available'")) {
    const count = drivers.filter(d => d.status === 'available').length;
    return { rows: [{ count }] };
  }
  if (normalized.includes("FROM trips WHERE delivery_status = 'pending'")) {
    const count = trips.filter(t => t.delivery_status === 'pending').length;
    return { rows: [{ count }] };
  }

  // 2. Expiring vehicles
  if (normalized.includes("FROM vehicles WHERE insurance_expiry") || normalized.includes("insurance_expiry <= CURRENT_DATE")) {
    const now = new Date('2026-06-18');
    const limit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiring = vehicles.filter(v => {
      const ins = new Date(v.insurance_expiry);
      const perm = new Date(v.permit_expiry);
      const pol = new Date(v.pollution_expiry);
      return ins <= limit || perm <= limit || pol <= limit;
    }).map(v => {
      const ins = new Date(v.insurance_expiry);
      const perm = new Date(v.permit_expiry);
      const pol = new Date(v.pollution_expiry);
      return {
        ...v,
        insurance_warn: ins <= limit,
        permit_warn: perm <= limit,
        pollution_warn: pol <= limit
      };
    });
    expiring.sort((a, b) => a.vehicle_number.localeCompare(b.vehicle_number));
    return { rows: expiring };
  }

  // 3. Drivers
  if (normalized.startsWith("SELECT * FROM drivers")) {
    let list = [...drivers];
    if (normalized.includes("WHERE status = $1")) {
      const statusVal = params[0];
      list = list.filter(d => d.status === statusVal);
    }
    list.sort((a, b) => b.id - a.id);
    return { rows: list };
  }
  if (normalized.startsWith("SELECT id FROM drivers WHERE license_no = $1")) {
    const lic = params[0];
    const match = drivers.filter(d => d.license_no === lic);
    return { rows: match };
  }
  if (normalized.startsWith("SELECT status FROM drivers WHERE id = $1")) {
    const idVal = parseInt(params[0]);
    const match = drivers.filter(d => d.id === idVal);
    return { rows: match };
  }
  if (normalized.startsWith("INSERT INTO drivers")) {
    const [name, phone, license_no, status] = params;
    const newId = drivers.length > 0 ? Math.max(...drivers.map(d => d.id)) + 1 : 1;
    const newDriver = {
      id: newId,
      name,
      phone,
      license_no,
      status: status || 'available',
      created_at: new Date()
    };
    drivers.push(newDriver);
    return { rows: [newDriver] };
  }
  if (normalized.startsWith("UPDATE drivers SET status =")) {
    const match = normalized.match(/status = '([^']+)'/);
    const newStatus = match ? match[1] : 'available';
    const idVal = parseInt(params[0]);
    const d = drivers.find(drv => drv.id === idVal);
    if (d) d.status = newStatus;
    return { rows: d ? [d] : [] };
  }

  // 4. Vehicles
  if (normalized.startsWith("SELECT * FROM vehicles")) {
    let list = [...vehicles];
    if (normalized.includes("WHERE status = $1")) {
      const statusVal = params[0];
      list = list.filter(v => v.status === statusVal);
    }
    list.sort((a, b) => b.id - a.id);
    return { rows: list };
  }
  if (normalized.startsWith("SELECT id FROM vehicles WHERE vehicle_number = $1")) {
    const num = params[0];
    const match = vehicles.filter(v => v.vehicle_number === num);
    return { rows: match };
  }
  if (normalized.startsWith("SELECT status FROM vehicles WHERE id = $1")) {
    const idVal = parseInt(params[0]);
    const match = vehicles.filter(v => v.id === idVal);
    return { rows: match };
  }
  if (normalized.startsWith("INSERT INTO vehicles")) {
    const [vehicle_number, vehicle_type, capacity, insurance_expiry, permit_expiry, pollution_expiry, status] = params;
    const newId = vehicles.length > 0 ? Math.max(...vehicles.map(v => v.id)) + 1 : 1;
    const newVehicle = {
      id: newId,
      vehicle_number,
      vehicle_type,
      capacity,
      insurance_expiry: new Date(insurance_expiry),
      permit_expiry: new Date(permit_expiry),
      pollution_expiry: new Date(pollution_expiry),
      status: status || 'available'
    };
    vehicles.push(newVehicle);
    return { rows: [newVehicle] };
  }
  if (normalized.startsWith("UPDATE vehicles SET status =")) {
    const match = normalized.match(/status = '([^']+)'/);
    const newStatus = match ? match[1] : 'available';
    const idVal = parseInt(params[0]);
    const v = vehicles.find(veh => veh.id === idVal);
    if (v) v.status = newStatus;
    return { rows: v ? [v] : [] };
  }

  // 5. Trips
  if (normalized.startsWith("SELECT t.*") && normalized.includes("LEFT JOIN drivers")) {
    if (normalized.includes("WHERE t.id = $1")) {
      const idVal = parseInt(params[0]);
      const t = trips.find(trip => trip.id === idVal);
      if (!t) return { rows: [] };
      const d = drivers.find(drv => drv.id === t.driver_id) || {};
      const v = vehicles.find(veh => veh.id === t.vehicle_id) || {};
      return {
        rows: [{
          ...t,
          driver_name: d.name,
          driver_phone: d.phone,
          driver_license: d.license_no,
          vehicle_number: v.vehicle_number,
          vehicle_type: v.vehicle_type,
          vehicle_capacity: v.capacity
        }]
      };
    } else {
      let list = [...trips];
      const statusIndexMatch = text.match(/t\.status\s*=\s*\$(\d+)/);
      if (statusIndexMatch) {
        const idx = parseInt(statusIndexMatch[1]) - 1;
        const statusVal = params[idx];
        list = list.filter(t => t.status === statusVal);
      }
      const driverIndexMatch = text.match(/t\.driver_id\s*=\s*\$(\d+)/);
      if (driverIndexMatch) {
        const idx = parseInt(driverIndexMatch[1]) - 1;
        const driverVal = parseInt(params[idx]);
        list = list.filter(t => t.driver_id === driverVal);
      }
      const startDateIndexMatch = text.match(/t\.created_at\s*>=\s*\$(\d+)/);
      if (startDateIndexMatch) {
        const idx = parseInt(startDateIndexMatch[1]) - 1;
        const dateVal = new Date(params[idx]);
        list = list.filter(t => new Date(t.created_at) >= dateVal);
      }
      const endDateIndexMatch = text.match(/t\.created_at\s*<=\s*\$(\d+)/);
      if (endDateIndexMatch) {
        const idx = parseInt(endDateIndexMatch[1]) - 1;
        const dateVal = new Date(params[idx]);
        list = list.filter(t => new Date(t.created_at) <= dateVal);
      }

      const resultRows = list.map(t => {
        const d = drivers.find(drv => drv.id === t.driver_id) || {};
        const v = vehicles.find(veh => veh.id === t.vehicle_id) || {};
        return {
          ...t,
          driver_name: d.name,
          driver_phone: d.phone,
          vehicle_number: v.vehicle_number,
          vehicle_type: v.vehicle_type
        };
      });
      resultRows.sort((a, b) => b.id - a.id);
      return { rows: resultRows };
    }
  }

  if (normalized.startsWith("SELECT * FROM trips WHERE id = $1")) {
    const idVal = parseInt(params[0]);
    const match = trips.filter(t => t.id === idVal);
    return { rows: match };
  }

  if (normalized.startsWith("INSERT INTO trips")) {
    const [driver_id, vehicle_id, pickup_location, drop_location, goods_type, weight] = params;
    const newId = trips.length > 0 ? Math.max(...trips.map(t => t.id)) + 1 : 1;
    const newTrip = {
      id: newId,
      driver_id: parseInt(driver_id),
      vehicle_id: parseInt(vehicle_id),
      pickup_location,
      drop_location,
      goods_type,
      weight,
      start_time: null,
      end_time: null,
      status: 'assigned',
      delivery_status: 'pending',
      created_at: new Date()
    };
    trips.push(newTrip);
    return { rows: [newTrip] };
  }

  if (normalized.startsWith("UPDATE trips SET status = $1, start_time = $2, end_time = $3, delivery_status = $4 WHERE id = $5")) {
    const [status, start_time, end_time, delivery_status, id] = params;
    const idVal = parseInt(id);
    const t = trips.find(trip => trip.id === idVal);
    if (t) {
      t.status = status;
      t.start_time = start_time;
      t.end_time = end_time;
      t.delivery_status = delivery_status;
    }
    return { rows: t ? [t] : [] };
  }

  if (normalized.startsWith("UPDATE trips SET status = 'completed', end_time = NOW(), delivery_status = 'delivered' WHERE id = $1")) {
    const idVal = parseInt(params[0]);
    const t = trips.find(trip => trip.id === idVal);
    if (t) {
      t.status = 'completed';
      t.end_time = new Date();
      t.delivery_status = 'delivered';
    }
    return { rows: t ? [t] : [] };
  }

  // 6. Trip History
  if (normalized.startsWith("SELECT * FROM trip_history WHERE trip_id = $1")) {
    const tripIdVal = parseInt(params[0]);
    const match = trip_history.filter(h => h.trip_id === tripIdVal);
    match.sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
    return { rows: match };
  }
  if (normalized.startsWith("INSERT INTO trip_history")) {
    const [trip_id, status_change] = params;
    const newId = trip_history.length > 0 ? Math.max(...trip_history.map(h => h.id)) + 1 : 1;
    const newHistory = {
      id: newId,
      trip_id: parseInt(trip_id),
      status_change,
      changed_at: new Date()
    };
    trip_history.push(newHistory);
    return { rows: [newHistory] };
  }

  // 7. POD
  if (normalized.startsWith("SELECT * FROM pod WHERE trip_id = $1")) {
    const tripIdVal = parseInt(params[0]);
    const match = pod.filter(p => p.trip_id === tripIdVal);
    return { rows: match };
  }
  if (normalized.startsWith("INSERT INTO pod")) {
    const [trip_id, photo_url, receiver_signature] = params;
    const tId = parseInt(trip_id);
    let p = pod.find(item => item.trip_id === tId);
    if (p) {
      p.photo_url = photo_url;
      p.receiver_signature = receiver_signature;
      p.delivered_at = new Date();
    } else {
      const newId = pod.length > 0 ? Math.max(...pod.map(item => item.id)) + 1 : 1;
      p = {
        id: newId,
        trip_id: tId,
        photo_url,
        receiver_signature,
        delivered_at: new Date()
      };
      pod.push(p);
    }
    return { rows: [p] };
  }

  return { rows: [] };
}

// Mock Client and Pool Implementation
class MockClient {
  async query(text, params = []) {
    return executeMockQuery(text, params);
  }
  release() {
    // No-op
  }
}

class MockPool {
  on(event, handler) {
    if (event === 'connect') {
      setTimeout(() => handler(), 10);
    }
  }
  async query(text, params = []) {
    return executeMockQuery(text, params);
  }
  async connect() {
    return new MockClient();
  }
}

const pool = new MockPool();

console.log('Database (In-Memory Mock) initialized successfully');

export const query = (text, params) => pool.query(text, params);
export default pool;

