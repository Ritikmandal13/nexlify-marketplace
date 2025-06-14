import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { upsertFcmToken } from './saveFcmToken.js';
import { sendNotificationToUser } from './sendNotificationToUser.js';

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint to save FCM token for authenticated Supabase users
app.post('/api/save-fcm-token', async (req, res) => {
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
});

// New endpoint to send message notification
app.post('/api/send-message-notification', async (req, res) => {
  console.log('Received body:', req.body); // Log the incoming request body
  const { recipientUserId, messageText, senderName, chatId } = req.body;
  if (!recipientUserId || !messageText || !senderName || !chatId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  await sendNotificationToUser(recipientUserId, {
    title: `New message from ${senderName}`,
    body: messageText,
    data: { url: `https://yourapp.com/chat/${chatId}` }
  });
  res.status(200).json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 