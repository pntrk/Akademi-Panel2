const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

// Modify filteredStudents
const filterTarget = `  const filteredStudents = useMemo(() => {
    return state.students.filter(s => {
      const hasExams = state.results.some(r => r.studentNo === s.no && s.no !== 0 && Object.keys(r.scores || {}).length > 0 && Object.values(r.scores || {}).some(score => (score as number) > 0));
      let matchesGrade = true;
      if (selectedGrade !== 'all') {
        const lvl = getGradeLevel(s.className);
        if (selectedGrade === 'Diğer') {
          matchesGrade = !lvl;
        } else {
          matchesGrade = lvl === selectedGrade;
        }
      }
      return matchesGrade && hasExams;
    }).sort((a, b) => (b.leaguePoints || 0) - (a.leaguePoints || 0));
  }, [state.students, state.results, selectedGrade]);`;

const filterReplace = `  const filteredStudents = useMemo(() => {
    return state.students.filter(s => {
      const hasExams = state.results.some(r => r.studentNo === s.no && s.no !== 0 && Object.keys(r.scores || {}).length > 0 && Object.values(r.scores || {}).some(score => (score as number) > 0));
      let matchesGrade = true;
      if (selectedGrade !== 'all') {
        const lvl = getGradeLevel(s.className);
        if (selectedGrade === 'Diğer') {
          matchesGrade = !lvl;
        } else {
          matchesGrade = lvl === selectedGrade;
        }
      }
      return matchesGrade && hasExams;
    }).map(s => {
      let displayPoints = s.leaguePoints || 0;
      let displayBadges = s.badges || {};
      if (selectedMonth !== 'all' && s.monthlyLeagueData && s.monthlyLeagueData[selectedMonth]) {
         displayPoints = s.monthlyLeagueData[selectedMonth].points || 0;
         displayBadges = s.monthlyLeagueData[selectedMonth].badges || {};
      } else if (selectedMonth !== 'all') {
         displayPoints = 0;
         displayBadges = {};
      }
      return { ...s, displayPoints, displayBadges };
    }).sort((a, b) => (b.displayPoints || 0) - (a.displayPoints || 0));
  }, [state.students, state.results, selectedGrade, selectedMonth]);`;

code = code.replace(filterTarget, filterReplace);

// Now update the uses of leaguePoints and badges in LeagueView.tsx
code = code.replace(/s\.leaguePoints/g, '(s.displayPoints !== undefined ? s.displayPoints : s.leaguePoints)');
code = code.replace(/student\.leaguePoints/g, '(student.displayPoints !== undefined ? student.displayPoints : student.leaguePoints)');
code = code.replace(/s\.badges/g, '(s.displayBadges || s.badges)');
code = code.replace(/student\.badges/g, '(student.displayBadges || student.badges)');

fs.writeFileSync('src/views/LeagueView.tsx', code);
