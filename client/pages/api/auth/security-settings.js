import { getSession } from 'next-auth/react';
import mongoose from 'mongoose';

// Connect to MongoDB using the existing connection
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });
    }
    return mongoose.connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const session = await getSession({ req });
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { db } = await connectDB();
      const user = await db.collection('users').findOne(
        { _id: session.user.id },
        { projection: { twoFactorEnabled: 1, sessionTimeout: 1, loginNotifications: 1 } }
      );

      return res.json({
        twoFactorEnabled: user?.twoFactorEnabled || false,
        sessionTimeout: user?.sessionTimeout || 30,
        loginNotifications: user?.loginNotifications || true
      });
    } catch (error) {
      console.error('Security Settings Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const session = await getSession({ req });
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { sessionTimeout, loginNotifications } = req.body;
      
      const { db } = await connectToDatabase();
      await db.collection('users').updateOne(
        { _id: session.user.id },
        { 
          $set: { 
            sessionTimeout: Number(sessionTimeout),
            loginNotifications: Boolean(loginNotifications)
          }
        }
      );

      return res.json({ success: true });
    } catch (error) {
      console.error('Security Settings Update Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 