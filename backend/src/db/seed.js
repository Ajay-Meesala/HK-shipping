import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './index.js';
import pool from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runSeed = async () => {
  try {
    console.log('Reading database migration script (schema.sql)...');
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing database migrations and sample seeds...');
    await query(sql);
    console.log('--------------------------------------------------');
    console.log('SUCCESS: Database schema created and seeded!');
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('CRITICAL: Database seeding failed!', err);
  } finally {
    // End the pool connection to exit the process
    await pool.end();
  }
};

runSeed();
