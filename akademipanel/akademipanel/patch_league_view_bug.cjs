const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

// Fix getGradeLevel regex
code = code.replace(/cls\?\.trim\(\)\.match\(\/\^\(d\+\)\/\)/g, 'cls?.trim().match(/^(\\d+)/)');

// Ensure hasExams works properly by checking if they actually have a valid result score
code = code.replace(/const hasExams = state\.results\.some\(r => r\.studentNo === s\.no && s\.no !== 0 && Object\.keys\(r\.scores \|\| \{\}\)\.length > 0\);/g, "const hasExams = state.results.some(r => r.studentNo === s.no && s.no !== 0 && Object.keys(r.scores || {}).length > 0 && Object.values(r.scores || {}).some(score => score !== undefined));");

fs.writeFileSync('src/views/LeagueView.tsx', code);
