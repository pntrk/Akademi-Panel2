const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

const targetState = `  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return \\\`\\\${d.getFullYear()}-\\\${String(d.getMonth() + 1).padStart(2, '0')}\\\`;
  });`;

const replaceState = `  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  // Set default to latest month available if not manually changed
  useEffect(() => {
    if (selectedMonth === 'all' && state.exams.length > 0) {
      const months = new Set<string>();
      state.exams.forEach(e => {
         if(e.date) {
           const dateObj = new Date(e.date);
           months.add(\`\${dateObj.getFullYear()}-\${String(dateObj.getMonth() + 1).padStart(2, '0')}\`);
         }
      });
      const sorted = Array.from(months).sort((a,b) => b.localeCompare(a));
      if (sorted.length > 0) {
        setSelectedMonth(sorted[0]);
      }
    }
  }, [state.exams]);`;

const targetMonths = `  const availableMonths = useMemo(() => {
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

const replaceMonths = `  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    state.exams.forEach(e => {
       if(e.date) {
         const dateObj = new Date(e.date);
         months.add(\`\${dateObj.getFullYear()}-\${String(dateObj.getMonth() + 1).padStart(2, '0')}\`);
       }
    });
    return Array.from(months).sort((a,b) => b.localeCompare(a));
  }, [state.exams]);`;

code = code.replace(targetState, replaceState);
code = code.replace(targetMonths, replaceMonths);

fs.writeFileSync('src/views/LeagueView.tsx', code);
