const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

const targetState = "const [selectedMonth, setSelectedMonth] = useState<string>('all');";
const replaceState = `const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`;
  });`;

code = code.replace(targetState, replaceState);

fs.writeFileSync('src/views/LeagueView.tsx', code);
