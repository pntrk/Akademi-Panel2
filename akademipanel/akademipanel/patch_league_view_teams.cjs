const fs = require('fs');
let code = fs.readFileSync('src/views/LeagueView.tsx', 'utf8');

const targetStr = `  const eighthGradeStudents = useMemo(() => {`;

const replaceStr = `  const eighthGradeStudents = useMemo(() => {
    return state.students.filter(s => {
      const isEighthGrade = s.className?.startsWith('8');
      const hasExams = state.results.some(r => r.studentNo === s.no && s.no !== 0 && Object.keys(r.scores || {}).length > 0);
      return isEighthGrade && hasExams;
    }).sort((a, b) => (b.leaguePoints || 0) - (a.leaguePoints || 0));
  }, [state.students, state.results]);

  const kutup = eighthGradeStudents.filter(s => s.leagueTeam === 'Kutup Yıldızları');
  const sicrama = eighthGradeStudents.filter(s => s.leagueTeam === 'Sıçrama Ustaları');
  const taktik = eighthGradeStudents.filter(s => s.leagueTeam === 'Taktik Avcıları');

  const eighthGradeStudentsDummy = useMemo(() => {`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/views/LeagueView.tsx', code);
