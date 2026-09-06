const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf-8');

// Find the index of "/*" and the following "];"
const startComment = code.indexOf('/*');
if (startComment !== -1) {
  const endBracket = code.indexOf('];', startComment);
  if (endBracket !== -1) {
    code = code.substring(0, startComment) + code.substring(endBracket + 2);
  }
}

fs.writeFileSync('src/components/Layout.tsx', code);
