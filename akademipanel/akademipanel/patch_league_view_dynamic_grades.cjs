const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

const targetStr1 = `  const filteredStudents = useMemo(() => {`;

const replaceStr1 = `  const uniqueClasses = useMemo(() => {
    const classes = new Set<string>();
    state.results.forEach(r => {
      const matchedStudent = state.students.find(s => s.no === r.studentNo);
      const displayClass = matchedStudent ? matchedStudent.className : r.studentClass;
      if (displayClass) classes.add(displayClass.trim());
    });
    return Array.from(classes).sort();
  }, [state.results, state.students]);

  const availableGradeLevels = useMemo(() => {
    const levels = new Set<string>();
    uniqueClasses.forEach(cls => {
      const lvl = getGradeLevel(cls);
      if (lvl) {
        levels.add(lvl);
      } else if (cls) {
        levels.add('Diğer');
      }
    });
    return Array.from(levels).sort((a, b) => {
      if (a === 'Diğer') return 1;
      if (b === 'Diğer') return -1;
      return parseInt(a) - parseInt(b);
    });
  }, [uniqueClasses]);

  const filteredStudents = useMemo(() => {`;

code = code.replace(targetStr1, replaceStr1);

const targetStr2 = `          {['5', '6', '7', '8'].map(lvl => {
            return (
              <button
                key={lvl}
                onClick={() => setSelectedGrade(lvl)}
                className={\`px-4 py-1.5 rounded-full text-xs font-bold border transition-all \${
                  selectedGrade === lvl
                    ? 'bg-[#5a5a40] text-white border-transparent shadow-sm'
                    : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-gray-50'
                }\`}
              >
                {lvl}. Sınıflar
              </button>
            );
          })}`;

const replaceStr2 = `          {availableGradeLevels.map(lvl => {
            return (
              <button
                key={lvl}
                onClick={() => setSelectedGrade(lvl)}
                className={\`px-4 py-1.5 rounded-full text-xs font-bold border transition-all \${
                  selectedGrade === lvl
                    ? 'bg-[#5a5a40] text-white border-transparent shadow-sm'
                    : 'bg-white text-[#5a5a40] border-[#e6e2d3] hover:bg-gray-50'
                }\`}
              >
                {lvl === 'Diğer' ? 'Diğer Sınıflar' : \`\${lvl}. Sınıflar\`}
              </button>
            );
          })}`;

code = code.replace(targetStr2, replaceStr2);

fs.writeFileSync('src/views/LeagueView.tsx', code);
