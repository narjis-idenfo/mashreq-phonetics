import cloudinary from './_cloudinary.js';
import { setCors } from './_cors.js';

const UPLOAD_FOLDER = 'phonetics-uploads';

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return listFiles(req, res);
  }

  if (req.method === 'DELETE') {
    return deleteFile(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function listFiles(_req, res) {
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
}

async function deleteFile(req, res) {
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
}
