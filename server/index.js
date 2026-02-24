import express from 'express';
import multer from 'multer';
import cors from 'cors';
import cloudinary from './cloudinary.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Allow requests from GitHub Pages frontend
app.use(cors({
  origin: [
    'https://narjis-idenfo.github.io',
    'http://localhost:5173',
  ],
}));

const UPLOAD_FOLDER = 'phonetics-uploads'; // folder in Cloudinary

// Use memory storage — file stays in RAM, gets sent to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];
    if (allowedTypes.includes(file.mimetype) || /\.(xlsx|xls|csv)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx, .xls, and .csv files are allowed'));
    }
  },
});

// Middleware
app.use(express.json());

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
};

// Upload endpoint — saves file to Cloudinary
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!cloudinary.config().cloud_name) {
      return res.status(503).json({
        error: 'Cloudinary is not configured. Set up your .env file (see .env.example).',
      });
    }

    const timestamp = Date.now();
    const sanitized = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const publicId = `${UPLOAD_FOLDER}/${timestamp}-${sanitized}`;

    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: 'raw',        // 'raw' for non-image files like xlsx/csv
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
});

// List all uploaded files with download URLs
app.get('/api/uploads', async (_req, res) => {
  try {
    if (!cloudinary.config().cloud_name) {
      return res.status(503).json({ error: 'Cloudinary is not configured.' });
    }

    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'raw',
      prefix: UPLOAD_FOLDER,
      max_results: 100,
      context: true,
      tags: true,
    });

    const files = result.resources.map((r) => {
      const ctx = r.context?.custom || {};
      return {
        publicId: r.public_id,
        originalName: ctx.original_name || r.public_id.split('/').pop(),
        size: r.bytes,
        format: r.format,
        url: r.secure_url,
        uploadedAt: ctx.uploaded_at || r.created_at,
      };
    });

    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    res.json({ files });
  } catch (err) {
    console.error('List files error:', err);
    res.status(500).json({ error: 'Failed to list files: ' + err.message });
  }
});

// Delete a file by public ID (passed as query param since IDs contain slashes)
app.delete('/api/uploads', async (req, res) => {
  try {
    const { publicId } = req.query;
    if (!publicId) {
      return res.status(400).json({ error: 'publicId query param is required' });
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete file: ' + err.message });
  }
});

// Error handling for multer
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
