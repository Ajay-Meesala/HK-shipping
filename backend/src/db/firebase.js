import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  // If you have a service account JSON, use:
  // initializeApp({ credential: cert(serviceAccount), storageBucket: process.env.FIREBASE_STORAGE_BUCKET });
  //
  // For now we initialize with project config (works with Firebase emulators or when
  // GOOGLE_APPLICATION_CREDENTIALS env var points to a service account JSON):
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  console.log(`Firebase Admin initialized — project: ${process.env.FIREBASE_PROJECT_ID}`);
}

export const db = getFirestore();
export const bucket = getStorage().bucket();

// Firestore collection references — single source of truth for collection names
export const COLLECTIONS = {
  DRIVERS:      'drivers',
  VEHICLES:     'vehicles',
  TRIPS:        'trips',
  TRIP_HISTORY: 'trip_history',
  POD:          'pod',
};
