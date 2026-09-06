const fs = require('fs');
let code = fs.readFileSync('src/lib/utils.ts', 'utf8');

code = code.replace(
  /const participated = result\.scores\[exam\.name\] !== undefined;/g,
  'const participated = result.scores[exam.name] !== undefined && result.scores[exam.name] > 0;'
);

fs.writeFileSync('src/lib/utils.ts', code);
