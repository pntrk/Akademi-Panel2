const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

code = code.replace(
  /score => score > 0/g,
  'score => (score as number) > 0'
);

fs.writeFileSync('src/views/LeagueView.tsx', code);
