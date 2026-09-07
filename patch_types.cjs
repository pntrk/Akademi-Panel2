const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const targetStr = `  leaguePoints?: number;
  leagueTeam?: string;`;

const replaceStr = `  leaguePoints?: number;
  leagueTeam?: string;
  monthlyLeagueData?: Record<string, { points: number, badges: Record<string, number> }>;`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/types.ts', code);
