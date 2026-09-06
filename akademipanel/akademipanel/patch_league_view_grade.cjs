const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

const targetStr1 = `  const [mentors, setMentors] = useState<Record<string, string>>(state.leagueMentors || {});`;
const replaceStr1 = `  const [selectedGrade, setSelectedGrade] = useState<string>('8');
  const [mentors, setMentors] = useState<Record<string, string>>(state.leagueMentors || {});`;

code = code.replace(targetStr1, replaceStr1);

const targetStr2 = `  const eighthGradeStudents = useMemo(() => {
    return state.students.filter(s => {
      const isEighthGrade = s.className?.startsWith('8');
      const hasExams = state.results.some(r => r.studentNo === s.no && s.no !== 0 && Object.keys(r.scores || {}).length > 0);
      return isEighthGrade && hasExams;
    }).sort((a, b) => (b.leaguePoints || 0) - (a.leaguePoints || 0));
  }, [state.students, state.results]);`;

const replaceStr2 = `  const getGradeLevel = (cls: string) => {
    const match = cls?.trim().match(/^(\d+)/);
    return match ? match[1] : null;
  };

  const filteredStudents = useMemo(() => {
    return state.students.filter(s => {
      const hasExams = state.results.some(r => r.studentNo === s.no && s.no !== 0 && Object.keys(r.scores || {}).length > 0);
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

code = code.replace(targetStr2, replaceStr2);

code = code.replace(/eighthGradeStudents\.filter/g, 'filteredStudents.filter');
code = code.replace(/eighthGradeStudents\.length/g, 'filteredStudents.length');
code = code.replace(/eighthGradeStudents\.map/g, 'filteredStudents.map');
// Just in case
code = code.replace(/eighthGradeStudents/g, 'filteredStudents');

fs.writeFileSync('src/views/LeagueView.tsx', code);
