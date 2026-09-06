const fs = require('fs');

let content = fs.readFileSync('src/index.css', 'utf-8');

if (!content.includes('@utility pb-safe')) {
  content += '\n\n@utility pb-safe {\n  padding-bottom: env(safe-area-inset-bottom);\n}\n';
  fs.writeFileSync('src/index.css', content);
}
