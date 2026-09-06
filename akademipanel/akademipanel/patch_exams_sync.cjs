const fs = require('fs');

let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

code = code.replace(
  'const newBudget = syncFinancials(s.students, exams, s.budget);\n    const updatedStudents = recalculateLeagueForStudents(s.students, s.results, exams, s.approvedTransfers || []);',
  'const newBudget = syncFinancials(s.students, exams, s.budget);\n    \n    // Clean up student registrations for exams that no longer exist\n    const newExamIds = exams.map(e => e.id);\n    const studentsWithCleanRegs = s.students.map(st => {\n      const regs = st.examRegistrations || [];\n      const filtered = regs.filter(r => newExamIds.includes(r.examId));\n      if (filtered.length !== regs.length) { return { ...st, examRegistrations: filtered }; }\n      return st;\n    });\n    const updatedStudents = recalculateLeagueForStudents(studentsWithCleanRegs, s.results, exams, s.approvedTransfers || []);'
);

fs.writeFileSync('src/context/AppContext.tsx', code);
