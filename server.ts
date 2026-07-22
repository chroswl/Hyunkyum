import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const getDirname = () => {
  if (typeof __dirname !== 'undefined') return __dirname;
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch (e) {
    return process.cwd();
  }
};
const dirName = getDirname();

import uploadMultipartHandler from './api/upload-multipart';
import uploadHandler from './api/upload';
import deleteHandler from './api/delete';
import contactHandler from './api/contact';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // We only parse JSON bodies for /api/delete and /api/contact
  // /api/upload and /api/upload-multipart expect to read the raw stream.
  
  app.all('/api/upload-multipart', uploadMultipartHandler);
  app.all('/api/upload', uploadHandler);
  
  app.use('/api/delete', express.json(), deleteHandler);
  app.use('/api/contact', express.json(), contactHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
