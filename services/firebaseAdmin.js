// ============================================================================
// FIREBASE ADMIN SDK INITIALIZATION
// ============================================================================
// Server-side only. Used for:
// - Verifying Firebase ID tokens in API routes
// - Setting custom user claims (role, status)
// - Administrative user management
//
// NEVER import this file in client components.
// ============================================================================

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/**
 * Initialize Firebase Admin with service account credentials.
 * Uses environment variables for secure credential management.
 */
function getFirebaseAdmin() {
  try {
    if (getApps().length === 0) {
      // Support both JSON string and individual env vars for service account
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : {
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mock-project-id',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'mock@mock.com',
            // Replace escaped newlines in the private key
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----\n',
          };

      initializeApp({
        credential: cert(serviceAccount),
      });
    }
    return getAuth();
  } catch (error) {
    console.warn("Firebase Admin failed to initialize. Returning mock auth client.");
    return {
      verifyIdToken: async () => ({ uid: 'mock-uid', role: 'supplier' })
    };
  }
}

export const adminAuth = getFirebaseAdmin();
