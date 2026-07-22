const fs = require('fs');
for (const file of ['api/upload.ts', 'api/upload-multipart.ts']) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('export const config')) {
    content = 'export const config = { api: { bodyParser: false } };\n' + content;
  }
  
  // also update getRequestBody to check req.body in case Express already parsed it
  content = content.replace(
    'const getRequestBody = (req: any): Promise<Buffer> => {',
    `const getRequestBody = (req: any): Promise<Buffer> => {
  if (req.body) {
    if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
    if (typeof req.body === 'string') return Promise.resolve(Buffer.from(req.body));
    if (typeof req.body === 'object') return Promise.resolve(Buffer.from(JSON.stringify(req.body)));
  }`
  );
  fs.writeFileSync(file, content);
}
