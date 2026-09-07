const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

code = code.replace(
  'const setStudents = (...args: any[]) => { if (userRole !== \'admin\') return; _setStudents(...args); };',
  'const setStudents = (students: Student[]) => { if (userRole !== \'admin\') return; _setStudents(students); };'
);

code = code.replace(
  'const setExams = (...args: any[]) => { if (userRole !== \'admin\') return; _setExams(...args); };',
  'const setExams = (exams: Exam[]) => { if (userRole !== \'admin\') return; _setExams(exams); };'
);

code = code.replace(
  'const setResults = (...args: any[]) => { if (userRole !== \'admin\') return; _setResults(...args); };',
  'const setResults = (results: ExamResult[]) => { if (userRole !== \'admin\') return; _setResults(results); };'
);

code = code.replace(
  'const setBudget = (...args: any[]) => { if (userRole !== \'admin\') return; _setBudget(...args); };',
  'const setBudget = (budget: BudgetData) => { if (userRole !== \'admin\') return; _setBudget(budget); };'
);

code = code.replace(
  'const setExamHalls = (...args: any[]) => { if (userRole !== \'admin\') return; _setExamHalls(...args); };',
  'const setExamHalls = (examHalls: ExamHall[]) => { if (userRole !== \'admin\') return; _setExamHalls(examHalls); };'
);

code = code.replace(
  'const updateBudget = (...args: any[]) => { if (userRole !== \'admin\') return; _updateBudget(...args); };',
  'const updateBudget = (type: \'incomes\' | \'expenses\' | \'debts\', data: any[]) => { if (userRole !== \'admin\') return; _updateBudget(type, data); };'
);

code = code.replace(
  'const updateLeagueSettings = (...args: any[]) => { if (userRole !== \'admin\') return; _updateLeagueSettings(...args); };',
  'const updateLeagueSettings = (mentors: Record<string, string>, teamPoints: Record<string, number>) => { if (userRole !== \'admin\') return; _updateLeagueSettings(mentors, teamPoints); };'
);

code = code.replace(
  'const approveTransfer = (...args: any[]) => { if (userRole !== \'admin\') return; _approveTransfer(...args); };',
  'const approveTransfer = (studentNo: number, examName: string, toTeam: string) => { if (userRole !== \'admin\') return; _approveTransfer(studentNo, examName, toTeam); };'
);

fs.writeFileSync('src/context/AppContext.tsx', code);
