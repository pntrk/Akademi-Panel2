const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

code = code.replace(/\{state\.students\s*\.filter\(s => s\.leagueTeam === selectedTeam\)/g, '{filteredStudents\n                    .filter(s => s.leagueTeam === selectedTeam)');

// there's a length check too:
code = code.replace(/\{state\.students\.filter\(s => s\.leagueTeam === selectedTeam\)\.length/g, '{filteredStudents.filter(s => s.leagueTeam === selectedTeam).length');

fs.writeFileSync('src/views/LeagueView.tsx', code);
