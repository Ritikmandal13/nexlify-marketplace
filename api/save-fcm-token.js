import jwt from 'jsonwebtoken';
import { upsertFcmToken } from '../scripts/saveFcmToken.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check for authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No auth token provided' });
  }
  const token = authHeader.split(' ')[1];

  // Decode JWT to get user ID (sub)
  let userId;
  try {
    const { sub } = jwt.decode(token);
    userId = sub;
  } catch (err) {
    return res.status(401).json({ message: 'Invalid auth token' });
  }

  const { token: fcmToken, device_info } = req.body;
  if (!fcmToken) {
    return res.status(400).json({ message: 'No FCM token provided' });
  }

  const success = await upsertFcmToken(userId, fcmToken, device_info);
  if (!success) {
    return res.status(500).json({ message: 'Failed to save FCM token' });
  }

  res.status(200).json({ message: 'Token received' });
} 