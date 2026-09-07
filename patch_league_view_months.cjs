const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

const targetStr = `  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    state.exams.forEach(e => {
       if(e.date) {
         const dateObj = new Date(e.date);
         months.add(\`\${dateObj.getFullYear()}-\${String(dateObj.getMonth() + 1).padStart(2, '0')}\`);
       }
    });
    return Array.from(months).sort((a,b) => b.localeCompare(a));
  }, [state.exams]);`;

const replaceStr = `  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    state.exams.forEach(e => {
       if(e.date) {
         const dateObj = new Date(e.date);
         months.add(\`\${dateObj.getFullYear()}-\${String(dateObj.getMonth() + 1).padStart(2, '0')}\`);
       }
    });
    const d = new Date();
    months.add(\`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`);
    return Array.from(months).sort((a,b) => b.localeCompare(a));
  }, [state.exams]);`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/views/LeagueView.tsx', code);
