import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../../../../server/models/User';

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

// Verify JWT token
const verifyToken = async (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user using JWT token
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    await connectDB();
    const { action, token } = req.body;

    // Debug log for user ID
    console.log('User ID:', user._id);

    switch (action) {
      case 'generate': {
        // Debug log for generate action
        console.log('Generating 2FA for user:', user._id);

        // Generate new secret
        const secret = speakeasy.generateSecret({
          name: `TeamLabs:${user.email}`,
          issuer: 'TeamLabs'
        });

        // Generate QR code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);

        // Store temporary secret in database
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          {
            tempTwoFactorSecret: secret.base32,
            tempTwoFactorSecretCreatedAt: new Date()
          },
          { new: true } // Return the updated document
        );

        if (!updatedUser) {
          console.log('User not found for ID:', user._id); // Debug log
          return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ 
          secret: secret.base32,
          qrCode,
          otpauth_url: secret.otpauth_url
        });
      }

      case 'verify': {
        const updatedUser = await User.findById(user._id).select('+tempTwoFactorSecret');
        if (!updatedUser || !updatedUser.tempTwoFactorSecret) {
          return res.status(400).json({ error: 'No temporary secret found. Please generate a new one.' });
        }

        // Verify the token
        const verified = speakeasy.totp.verify({
          secret: updatedUser.tempTwoFactorSecret,
          encoding: 'base32',
          token: token
        });

        if (!verified) {
          return res.status(400).json({ error: 'Invalid verification code' });
        }

        // Move temporary secret to permanent secret and enable 2FA
        await User.findByIdAndUpdate(user._id, {
          twoFactorSecret: updatedUser.tempTwoFactorSecret,
          twoFactorEnabled: true,
          $unset: { tempTwoFactorSecret: 1, tempTwoFactorSecretCreatedAt: 1 }
        });

        return res.json({ success: true });
      }

      case 'disable': {
        const updatedUser = await User.findById(user._id).select('+twoFactorSecret');
        if (!updatedUser || !updatedUser.twoFactorSecret) {
          return res.status(400).json({ error: '2FA is not enabled' });
        }

        // Verify the token before disabling
        const verified = speakeasy.totp.verify({
          secret: updatedUser.twoFactorSecret,
          encoding: 'base32',
          token: token
        });

        if (!verified) {
          return res.status(400).json({ error: 'Invalid verification code' });
        }

        // Disable 2FA
        await User.findByIdAndUpdate(user._id, {
          twoFactorEnabled: false,
          $unset: { twoFactorSecret: 1 }
        });

        return res.json({ success: true });
      }

      case 'verify-login': {
        const updatedUser = await User.findById(user._id).select('+twoFactorSecret');
        if (!updatedUser || !updatedUser.twoFactorSecret || !updatedUser.twoFactorEnabled) {
          return res.status(400).json({ error: '2FA is not enabled' });
        }

        // Verify the token
        const verified = speakeasy.totp.verify({
          secret: updatedUser.twoFactorSecret,
          encoding: 'base32',
          token: token
        });

        if (!verified) {
          return res.status(400).json({ error: 'Invalid verification code' });
        }

        return res.json({ success: true });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('2FA Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 