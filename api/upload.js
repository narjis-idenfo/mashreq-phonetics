import multer from 'multer';
import cloudinary from './_cloudinary.js';
import { setCors } from './_cors.js';

const UPLOAD_FOLDER = 'phonetics-uploads';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/\.(xlsx|xls|csv)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx, .xls, and .csv files are allowed'));
    }
  },
});

// Wrap multer in a promise for Vercel
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
};

export const config = {
  api: {
    bodyParser: false, // multer handles parsing
  },
};

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await runMiddleware(req, res, upload.single('file'));

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!cloudinary.config().cloud_name) {
      return res.status(503).json({ error: 'Cloudinary is not configured.' });
    }

    const timestamp = Date.now();
    const sanitized = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const publicId = `${UPLOAD_FOLDER}/${timestamp}-${sanitized}`;

    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: 'raw',
      public_id: publicId,
      tags: ['phonetics-upload'],
      context: `original_name=${req.file.originalname}|uploaded_at=${new Date().toISOString()}`,
    });

    res.json({
      message: 'File uploaded to Cloudinary',
      file: {
        originalName: req.file.originalname,
        publicId: result.public_id,
        size: result.bytes,
        url: result.secure_url,
        uploadedAt: result.created_at,
      },
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload file: ' + err.message });
  }
}
