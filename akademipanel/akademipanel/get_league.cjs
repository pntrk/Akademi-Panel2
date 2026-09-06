const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(70, 150).join('\n'));
