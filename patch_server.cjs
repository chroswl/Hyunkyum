const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "import { fileURLToPath } from 'url';\nimport { createServer as createViteServer } from 'vite';\n\nimport uploadMultipartHandler",
  "import { fileURLToPath } from 'url';\nimport { createServer as createViteServer } from 'vite';\n\nconst getDirname = () => {\n  if (typeof __dirname !== 'undefined') return __dirname;\n  try {\n    return path.dirname(fileURLToPath(import.meta.url));\n  } catch (e) {\n    return process.cwd();\n  }\n};\nconst _dirname = getDirname();\n\nimport uploadMultipartHandler"
);
code = code.replace(/__dirname/g, '_dirname');
fs.writeFileSync('server.ts', code);
