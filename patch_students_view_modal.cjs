const fs = require('fs');
let code = fs.readFileSync('src/views/StudentsView.tsx', 'utf8');

code = code.replace(
  /\{student\.leagueTeam && student\.leagueTeam !== 'Atanmadı' && \([\s\S]*?<\/p>\s*\)\s*\}/g,
  ''
);

fs.writeFileSync('src/views/StudentsView.tsx', code);
