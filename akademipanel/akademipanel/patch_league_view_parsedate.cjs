const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

code = code.replace(
  /import \{ determineLeagueTeam, calculateAtaLigPoints \} from '\.\.\/lib\/utils';/,
  "import { determineLeagueTeam, calculateAtaLigPoints, parseDate } from '../lib/utils';"
);

code = code.replace(/const dateObj = new Date\\(e\\.date\\);/g, "const dateObj = parseDate(e.date);");

fs.writeFileSync('src/views/LeagueView.tsx', code);
