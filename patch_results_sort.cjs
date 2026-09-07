const fs = require('fs');
let code = fs.readFileSync('src/views/ResultsView.tsx', 'utf8');

code = code.replace(
  /\.sort\(\(a, b\) => b\.average - a\.average\);/g,
  '.sort((a, b) => (b.average || 0) - (a.average || 0));'
);

fs.writeFileSync('src/views/ResultsView.tsx', code);
