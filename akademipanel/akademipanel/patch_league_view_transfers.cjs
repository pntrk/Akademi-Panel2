const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

code = code.replace(/const recentTransfers = useMemo\(\(\) => \{\n    return state\.students\.filter/g, 'const recentTransfers = useMemo(() => {\\n    return filteredStudents.filter');
code = code.replace(/\}, \[state\.students\]\);/g, '}, [filteredStudents]);');

code = code.replace(/const pendingTransfers = useMemo\(\(\) => \{\n    return state\.students\.filter/g, 'const pendingTransfers = useMemo(() => {\\n    return filteredStudents.filter');

fs.writeFileSync('src/views/LeagueView.tsx', code);
