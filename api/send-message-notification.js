import { sendNotificationToUser } from '../scripts/sendNotificationToUser.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('Received body:', req.body); // Log the incoming request body
  const { recipientUserId, messageText, senderName, chatId } = req.body;
  
  if (!recipientUserId || !messageText || !senderName || !chatId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await sendNotificationToUser(recipientUserId, {
      title: `New message from ${senderName}`,
      body: messageText,
      data: { url: `https://yourapp.com/chat/${chatId}` }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
} 