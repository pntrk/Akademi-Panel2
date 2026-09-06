const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

// We want to add a state for selectedMonth
const importIdx = code.indexOf('export const LeagueView = () => {');

// Insert selectedMonth state
code = code.replace(
  /const \[selectedGrade, setSelectedGrade\] = useState<string>\('8'\);/g,
  `const [selectedGrade, setSelectedGrade] = useState<string>('8');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');`
);

// We need to compute available months from state.exams
code = code.replace(
  /const availableGradeLevels = useMemo\(\(\) => \{/g,
  `const availableMonths = useMemo(() => {
    const months = new Set<string>();
    state.exams.forEach(e => {
       if(e.date) {
         const dateObj = new Date(e.date);
         months.add(\`\${dateObj.getFullYear()}-\${String(dateObj.getMonth() + 1).padStart(2, '0')}\`);
       }
    });
    return Array.from(months).sort((a,b) => b.localeCompare(a));
  }, [state.exams]);

  const availableGradeLevels = useMemo(() => {`
);

fs.writeFileSync('src/views/LeagueView.tsx', code);
