import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

function ensureUploadsDir() {
  const dir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const uploadsDir = ensureUploadsDir();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filenameParam = url.searchParams.get('filename') || `upload-${Date.now()}`;
    // Files are saved as-is; no transcoding is performed

    // Sanitize filename (basic)
    const safeName = filenameParam.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random()*1e9)}`;

    // Collect request body into a Buffer
    const chunks = [];
    await new Promise((resolve, reject) => {
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', resolve);
      req.on('error', reject);
    });
    const inputBuffer = Buffer.concat(chunks);

    // Save file as-is
    const uniqueName = `${uniquePrefix}-${safeName}`;
    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, inputBuffer);
    const publicUrl = `/uploads/${uniqueName}`;
    return res.status(200).json({ success: true, url: publicUrl, path: publicUrl });
  } catch (err) {
    console.error('local-upload error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to save file' });
  }
}


