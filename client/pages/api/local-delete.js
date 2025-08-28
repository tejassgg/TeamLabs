import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filePathParam = url.searchParams.get('path') || '';
    if (!filePathParam.startsWith('/uploads/')) {
      return res.status(400).json({ success: false, message: 'Invalid path' });
    }
    const absPath = path.join(process.cwd(), 'public', filePathParam);
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('local-delete error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to delete file' });
  }
}


