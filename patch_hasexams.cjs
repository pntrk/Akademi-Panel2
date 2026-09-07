const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

code = code.replace(
  /const hasExams = state\.results\.some\(r => r\.studentNo === s\.no && s\.no !== 0 && Object\.keys\(r\.scores \|\| \{\}\)\.length > 0 && Object\.values\(r\.scores \|\| \{\}\)\.some\(score => score !== undefined\)\);/g,
  'const hasExams = state.results.some(r => r.studentNo === s.no && s.no !== 0 && Object.keys(r.scores || {}).length > 0 && Object.values(r.scores || {}).some(score => score > 0));'
);

fs.writeFileSync('src/views/LeagueView.tsx', code);
