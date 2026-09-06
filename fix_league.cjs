const fs = require('fs');

let content = fs.readFileSync('src/views/LeagueView.tsx', 'utf-8');
content = content.replace(
  '<div className="p-6 overflow-y-auto print:p-0">',
  '<div className="p-4 sm:p-6 overflow-auto print:p-0">'
);
fs.writeFileSync('src/views/LeagueView.tsx', content);

