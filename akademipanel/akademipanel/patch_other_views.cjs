const fs = require('fs');

function patchFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  if (!code.includes('parseDate')) {
    code = code.replace(
      /import \{ ([^}]+) \} from '\.\.\/lib\/utils';/,
      "import { $1, parseDate } from '../lib/utils';"
    );
  }
  
  code = code.replace(/new Date\\(a\\.date\\)\\.getTime\(\)/g, "parseDate(a.date).getTime()");
  code = code.replace(/new Date\\(b\\.date\\)\\.getTime\(\)/g, "parseDate(b.date).getTime()");
  code = code.replace(/new Date\\(e\\.date\\)/g, "parseDate(e.date)");
  code = code.replace(/new Date\\(th\\.date\\)/g, "parseDate(th.date)");
  code = code.replace(/new Date\\(h\\.date\\)/g, "parseDate(h.date)");
  
  fs.writeFileSync(filePath, code);
}

patchFile('src/views/ResultsView.tsx');
patchFile('src/views/LeagueView.tsx');

