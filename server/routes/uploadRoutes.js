const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../client/public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// File filter for attachments - allow common file types
const attachmentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/json',
    'application/xml',
    'text/html',
    'text/css',
    'application/javascript',
    'text/javascript'
  ];
  
  const isAllowed = allowedMimeTypes.some(type => 
    file.mimetype.startsWith(type) || file.mimetype === type
  );
  
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed!'), false);
  }
};

const imageUpload = multer({ 
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const attachmentUpload = multer({ 
  storage,
  fileFilter: attachmentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST /api/upload
router.post('/', imageUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Return the URL relative to the public folder
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: error.message || 'Error uploading file',
      details: error.stack
    });
  }
});

// POST /api/attachments/upload - Upload task attachment
router.post('/attachments/upload', attachmentUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { taskId, userId, filename } = req.body;
    
    if (!taskId || !userId) {
      return res.status(400).json({ message: 'Task ID and User ID are required' });
    }

    // Create attachment record in database
    const Attachment = require('../models/Attachment');
    const attachment = new Attachment({
      TaskID: taskId,
      Filename: filename || req.file.originalname,
      FileURL: `/uploads/${req.file.filename}`,
      FileSize: req.file.size,
      UploadedBy: userId,
      UploadedAt: new Date()
    });

    await attachment.save();

    res.json({ 
      success: true,
      message: 'File uploaded successfully',
      attachment: {
        AttachmentID: attachment.AttachmentID,
        Filename: attachment.Filename,
        FileURL: attachment.FileURL,
        FileSize: attachment.FileSize,
        UploadedAt: attachment.UploadedAt
      }
    });
  } catch (error) {
    console.error('Attachment upload error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error uploading attachment',
      details: error.stack
    });
  }
});

module.exports = router; 