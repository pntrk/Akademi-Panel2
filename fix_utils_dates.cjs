const fs = require('fs');
let code = fs.readFileSync('src/lib/utils.ts', 'utf8');

code = code.replace(/new Date\\(a\\.date\\)\\.getTime\(\)/g, "parseDate(a.date).getTime()");
code = code.replace(/new Date\\(b\\.date\\)\\.getTime\(\)/g, "parseDate(b.date).getTime()");
code = code.replace(/new Date\\(exam\\.date\\)/g, "parseDate(exam.date)");

fs.writeFileSync('src/lib/utils.ts', code);
