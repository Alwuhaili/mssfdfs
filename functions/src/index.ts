import { onRequest } from 'firebase-functions/v2/https';
import { handleProvisionHttp } from '../../server/provisionHttp.js';

const jsonPayload = (body: unknown): unknown => {
  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString('utf8'));
    } catch {
      return null;
    }
  }
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body;
};

/**
 * New-account provisioning on Cloud Functions Gen 2.
 * The function is reachable so a Firebase ID token can be presented.
 * Admin authorization stays inside handleProvisionHttp via verifyIdToken and the admin claim.
 * CORS is left closed; the browser keeps calling the Netlify origin.
 */
export const provisionAccount = onRequest({ invoker: 'public' }, async (req, res) => {
  const result = await handleProvisionHttp({
    method: req.method,
    authorization: req.header('authorization') || undefined,
    payload: jsonPayload(req.body),
    ip: req.ip || 'unknown',
  });
  res.set('Cache-Control', 'no-store');
  res.status(result.status).json(result.body);
});
