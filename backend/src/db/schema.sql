-- Drop tables if they exist
DROP TABLE IF EXISTS trip_history CASCADE;
DROP TABLE IF EXISTS pod CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;

-- drivers
CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  license_no VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'available', -- available/on_trip/off_duty
  created_at TIMESTAMP DEFAULT NOW()
);

-- vehicles
CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  vehicle_number VARCHAR(20) UNIQUE NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  capacity VARCHAR(50) NOT NULL,
  insurance_expiry DATE NOT NULL,
  permit_expiry DATE NOT NULL,
  pollution_expiry DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'available' -- available/on_trip/maintenance
);

-- trips
CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  driver_id INT REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id INT REFERENCES vehicles(id) ON DELETE SET NULL,
  pickup_location VARCHAR(255) NOT NULL,
  drop_location VARCHAR(255) NOT NULL,
  goods_type VARCHAR(100) NOT NULL,
  weight VARCHAR(50) NOT NULL,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'assigned', -- assigned/in_progress/completed/cancelled
  delivery_status VARCHAR(20) DEFAULT 'pending', -- pending/delivered/failed
  created_at TIMESTAMP DEFAULT NOW()
);

-- pod (proof of delivery)
CREATE TABLE pod (
  id SERIAL PRIMARY KEY,
  trip_id INT REFERENCES trips(id) ON DELETE CASCADE UNIQUE,
  photo_url VARCHAR(255) NOT NULL,
  receiver_signature TEXT NOT NULL, -- Storing signature data (signature name/canvas base64 string)
  delivered_at TIMESTAMP DEFAULT NOW()
);

-- trip_history
CREATE TABLE trip_history (
  id SERIAL PRIMARY KEY,
  trip_id INT REFERENCES trips(id) ON DELETE CASCADE,
  status_change VARCHAR(50) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Seed Initial Data for Testing (Current Base Date: June 12, 2026)

-- 1. Seed Drivers
INSERT INTO drivers (name, phone, license_no, status) VALUES
('John Doe', '9876543210', 'DL-1234567890', 'available'),
('Jane Smith', '9876543211', 'DL-2345678901', 'on_trip'),
('Mike Johnson', '9876543212', 'DL-3456789012', 'available'),
('David Lee', '9876543213', 'DL-4567890123', 'off_duty');

-- 2. Seed Vehicles
INSERT INTO vehicles (vehicle_number, vehicle_type, capacity, insurance_expiry, permit_expiry, pollution_expiry, status) VALUES
('MH-12-AB-1234', '18-Wheeler Truck', '20 Tons', '2027-01-15', '2026-12-10', '2026-06-25', 'available'), -- Pollution expiring soon (within 13 days)
('DL-01-XY-5678', 'Container Truck', '15 Tons', '2026-06-30', '2026-11-20', '2026-09-14', 'on_trip'),    -- Insurance expiring soon (within 18 days)
('KA-03-CD-9012', 'Flatbed Trailer', '25 Tons', '2027-04-05', '2026-07-05', '2027-02-18', 'available'),  -- Permit expiring soon (within 23 days)
('HR-55-EF-3456', 'Mini Van', '2 Tons', '2026-05-10', '2026-05-20', '2026-05-15', 'maintenance');        -- Expired documents, in maintenance

-- 3. Seed Trips
-- A completed trip with a POD
INSERT INTO trips (id, driver_id, vehicle_id, pickup_location, drop_location, goods_type, weight, start_time, end_time, status, delivery_status, created_at) VALUES
(1, 1, 1, 'Mumbai Port', 'Delhi Warehouse', 'Electronics', '12 Tons', '2026-06-01 08:00:00', '2026-06-04 14:30:00', 'completed', 'delivered', '2026-05-31 10:00:00');

-- An active trip (Jane Smith driving DL-01-XY-5678)
INSERT INTO trips (id, driver_id, vehicle_id, pickup_location, drop_location, goods_type, weight, start_time, end_time, status, delivery_status, created_at) VALUES
(2, 2, 2, 'Chennai Factory', 'Bangalore Hub', 'Auto Parts', '8 Tons', '2026-06-11 06:00:00', NULL, 'in_progress', 'pending', '2026-06-10 15:00:00');

-- A newly assigned trip
INSERT INTO trips (id, driver_id, vehicle_id, pickup_location, drop_location, goods_type, weight, start_time, end_time, status, delivery_status, created_at) VALUES
(3, 3, 3, 'Kolkata Depot', 'Patna Warehouse', 'Grains', '18 Tons', NULL, NULL, 'assigned', 'pending', '2026-06-12 09:00:00');

-- Adjust serial sequence to prevent id conflicts later
SELECT setval('trips_id_seq', (SELECT MAX(id) FROM trips));

-- 4. Seed POD for Trip 1
INSERT INTO pod (trip_id, photo_url, receiver_signature, delivered_at) VALUES
(1, '/uploads/pod_sample.png', 'Received by Store Manager Bob', '2026-06-04 14:30:00');

-- 5. Seed Trip History
INSERT INTO trip_history (trip_id, status_change, changed_at) VALUES
(1, 'Trip Created & Assigned', '2026-05-31 10:00:00'),
(1, 'Status changed to IN_PROGRESS', '2026-06-01 08:00:00'),
(1, 'Status changed to COMPLETED (POD Uploaded)', '2026-06-04 14:30:00'),
(2, 'Trip Created & Assigned', '2026-06-10 15:00:00'),
(2, 'Status changed to IN_PROGRESS', '2026-06-11 06:00:00'),
(3, 'Trip Created & Assigned', '2026-06-12 09:00:00');

-- ─────────────────────────────────────────────────────────────────────────────
--  DUAL-ROLE ACCESS CONTROL — Additional tables (run once, idempotent)
-- ─────────────────────────────────────────────────────────────────────────────

-- user_profiles: stores role and profile info keyed by Firebase UID
CREATE TABLE IF NOT EXISTS user_profiles (
  uid         VARCHAR(128) PRIMARY KEY,      -- Firebase Auth UID
  email       VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  role        VARCHAR(20) NOT NULL DEFAULT 'customer', -- 'admin' | 'customer'
  company     VARCHAR(100),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- bookings: customer freight booking requests
DROP TABLE IF EXISTS bookings CASCADE;
CREATE TABLE bookings (
  id               SERIAL PRIMARY KEY,
  customer_name    VARCHAR(100) NOT NULL,
  customer_email   VARCHAR(255) NOT NULL,
  contact_phone    VARCHAR(20)  NOT NULL,
  origin           VARCHAR(255) NOT NULL,
  destination      VARCHAR(255) NOT NULL,
  goods_type       VARCHAR(100) NOT NULL,
  weight           VARCHAR(50)  NOT NULL,
  preferred_date   DATE,
  notes            TEXT,
  status           VARCHAR(30) DEFAULT 'pending', -- pending/confirmed/dispatched/in_transit/delivered/cancelled
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- Seed sample bookings for demo
INSERT INTO bookings (customer_name, customer_email, contact_phone, origin, destination, goods_type, weight, preferred_date, notes, status, created_at) VALUES
('Rahul Mehta',     'rahul@acmecorp.com',   '9876500001', 'Mumbai',    'Delhi',     'Electronic Components', '5 Tons',  '2026-07-05', 'Fragile items — handle with care', 'in_transit', '2026-06-20 09:00:00'),
('Priya Industries','priya@priyaind.com',   '9876500002', 'Pune',      'Bangalore', 'Auto Parts',           '12 Tons', '2026-07-10', NULL,                              'confirmed',  '2026-06-22 11:30:00'),
('Anil Traders',    'anil@aniltraders.com', '9876500003', 'Chennai',   'Hyderabad', 'Textiles',              '8 Tons',  '2026-07-15', 'Delivery before 10AM preferred', 'pending',    '2026-06-25 14:00:00'),
('Sharma Exports',  'sharma@sharmaexp.com', '9876500004', 'Kolkata',   'Mumbai',    'Raw Materials',         '20 Tons', '2026-07-20', NULL,                              'delivered',  '2026-06-18 08:00:00');

