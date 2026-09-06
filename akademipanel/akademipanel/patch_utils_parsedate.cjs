const fs = require('fs');
let code = fs.readFileSync('src/lib/utils.ts', 'utf8');

const parseDateFn = `
export function parseDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date();
  
  if (dateStr.includes('.')) {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2) { // DD-MM-YYYY
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }
  
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}
`;

// Insert the function at the end or before recalculateLeagueForStudents
const insertPos = code.indexOf('export function recalculateLeagueForStudents');
code = code.substring(0, insertPos) + parseDateFn + '\\n' + code.substring(insertPos);

// Replace new Date(a.date)
code = code.replace(/new Date\\(a\\.date\\)/g, 'parseDate(a.date)');
code = code.replace(/new Date\\(b\\.date\\)/g, 'parseDate(b.date)');
code = code.replace(/new Date\\(exam\\.date\\)/g, 'parseDate(exam.date)');

fs.writeFileSync('src/lib/utils.ts', code);
