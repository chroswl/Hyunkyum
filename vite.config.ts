import 'dotenv/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const getRequestBody = (req: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', (err: any) => {
      reject(err);
    });
  });
};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          console.log(`[Middleware] Incoming request: ${req.url}`);
          if (req.url?.startsWith('/api/upload')) {
            try {
              const bodyStr = await getRequestBody(req);
              const mockReq = {
                method: req.method,
                headers: req.headers,
                body: bodyStr ? JSON.parse(bodyStr) : {},
              };
              const mockRes = {
                statusCode: 200,
                headers: {} as any,
                setHeader(name: string, value: string) {
                  this.headers[name] = value;
                  res.setHeader(name, value);
                },
                status(code: number) {
                  this.statusCode = code;
                  res.statusCode = code;
                  return this;
                },
                json(data: any) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                end(data?: any) {
                  res.end(data);
                }
              };
              const { default: handler } = await import('./api/upload');
              await handler(mockReq, mockRes);
            } catch (e: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Dev server upload handler error', message: e.message }));
            }
            return;
          }
          
          if (req.url?.startsWith('/api/delete')) {
            try {
              const bodyStr = await getRequestBody(req);
              const mockReq = {
                method: req.method,
                headers: req.headers,
                body: bodyStr ? JSON.parse(bodyStr) : {},
              };
              const mockRes = {
                statusCode: 200,
                headers: {} as any,
                setHeader(name: string, value: string) {
                  this.headers[name] = value;
                  res.setHeader(name, value);
                },
                status(code: number) {
                  this.statusCode = code;
                  res.statusCode = code;
                  return this;
                },
                json(data: any) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                end(data?: any) {
                  res.end(data);
                }
              };
              const { default: handler } = await import('./api/delete');
              await handler(mockReq, mockRes);
            } catch (e: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Dev server delete handler error', message: e.message }));
            }
            return;
          }
          
          if (req.url?.startsWith('/api/contact')) {
            try {
              const bodyStr = await getRequestBody(req);
              const mockReq = {
                method: req.method,
                headers: req.headers,
                body: bodyStr ? JSON.parse(bodyStr) : {},
              };
              const mockRes = {
                statusCode: 200,
                headers: {} as any,
                setHeader(name: string, value: string) {
                  this.headers[name] = value;
                  res.setHeader(name, value);
                },
                status(code: number) {
                  this.statusCode = code;
                  res.statusCode = code;
                  return this;
                },
                json(data: any) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                end(data?: any) {
                  res.end(data);
                }
              };
              const { default: handler } = await import('./api/contact');
              await handler(mockReq, mockRes);
            } catch (e: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Dev server contact handler error', message: e.message }));
            }
            return;
          }
          
          next();
        });
      },
    },
  };
});
