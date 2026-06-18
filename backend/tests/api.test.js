import { jest } from '@jest/globals';
import request from 'supertest';

// Define the query mock function that will be shared
const mockDbQuery = jest.fn();
const mockClientQuery = jest.fn();
const mockClientRelease = jest.fn();

// Mock the pg module
jest.unstable_mockModule('pg', () => {
  return {
    default: {
      Pool: jest.fn().mockImplementation(() => ({
        query: mockDbQuery,
        connect: jest.fn().mockResolvedValue({
          query: mockClientQuery,
          release: mockClientRelease
        }),
        on: jest.fn()
      }))
    }
  };
});

// Import components AFTER mocking pg
const { default: app } = await import('../src/app.js');

describe('Driver Assignment & Trip Manager API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 OK and health statistics', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'UP');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/drivers', () => {
    it('should return a list of drivers', async () => {
      mockDbQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, name: 'John Doe', phone: '9876543210', license_no: 'DL123', status: 'available' }
        ]
      });

      const res = await request(app).get('/api/drivers');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('John Doe');
      expect(mockDbQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM drivers'), []);
    });
  });

  describe('POST /api/drivers', () => {
    it('should create a driver successfully when payload is valid', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] }) // For license duplicate check
        .mockResolvedValueOnce({
          rows: [
            { id: 2, name: 'Mike Johnson', phone: '9876543212', license_no: 'DL456', status: 'available' }
          ]
        }); // For insert query

      const payload = {
        name: 'Mike Johnson',
        phone: '9876543212',
        license_no: 'DL456',
        status: 'available'
      };

      const res = await request(app).post('/api/drivers').send(payload);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Mike Johnson');
    });

    it('should fail with 400 Bad Request if validation checks fail', async () => {
      const res = await request(app).post('/api/drivers').send({ name: 'Shorty' });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/vehicles', () => {
    it('should list all vehicles', async () => {
      mockDbQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, vehicle_number: 'MH-12-AB-1234', vehicle_type: 'Truck', status: 'available' }
        ]
      });

      const res = await request(app).get('/api/vehicles');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].vehicle_number).toBe('MH-12-AB-1234');
    });
  });
});
