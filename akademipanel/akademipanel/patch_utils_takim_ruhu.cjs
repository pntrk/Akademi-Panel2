const fs = require('fs');
let code = fs.readFileSync('src/lib/utils.ts', 'utf8');

const targetStr = /  \/\/ Pass 2: Takım Ruhu[\s\S]*?return student;\n  \}\);\n\}/;

const replaceStr = `  return firstPass;
}`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/lib/utils.ts', code);
